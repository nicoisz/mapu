-- ============================================================
-- S14 — Hardening de RPCs y política de vistas (web)
--
-- Problemas que resuelve (de la auditoría TASK-00):
--   R-14: `property_views` permitía INSERT a `public` (anon) → cualquiera
--         podía insertar filas arbitrarias e inflar las métricas de vistas.
--         Además el RPC `increment_property_views` (usado por propertyService)
--         NO existía en la DB → la web caía siempre al fallback de insert
--         directo y las vistas nunca se contaban de forma controlada.
--   R-21: `find_user_for_org` tenía EXECUTE a `anon`. El cuerpo ya valida
--         superadmin/org_admin, pero el grant a anon es innecesario.
--   R-15: `get_property_views` y `get_owner_views` no existían en la DB
--         (solo en el repo) → `getViewsSeries` devolvía [].
--
-- Solución:
--   · Crear `increment_property_views` (SECURITY DEFINER, search_path fijo)
--     que incrementa `properties.views` y registra la fila en property_views.
--     El FK de property_views impide registrar vistas de propiedades inexistentes.
--   · Restringir el INSERT directo de property_views a authenticated (anon
--     sigue contando vistas vía RPC, sin poder insertar filas arbitrarias).
--   · Aplicar las funciones de métricas faltantes (metrics.sql).
--   · Revocar EXECUTE de find_user_for_org a anon/public.
--
-- Idempotente. Ejecutar en: Dashboard → SQL Editor → Run.
-- Precondición: columna `public.properties.views` existe (ver supabase/schema.sql).
-- ============================================================

-- ---------- 1) RPC de vistas (faltaba en la DB) ----------
create or replace function public.increment_property_views(property_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.properties
     set views = coalesce(views, 0) + 1
   where id = increment_property_views.property_id;

  insert into public.property_views (property_id)
  values (increment_property_views.property_id);
end;
$$;

revoke execute on function public.increment_property_views(uuid) from public, anon;
grant execute on function public.increment_property_views(uuid) to anon, authenticated;

-- ---------- 2) Restringir INSERT de property_views a authenticated ----------
drop policy if exists "property_views insert public" on public.property_views;
create policy "property_views insert authenticated"
  on public.property_views for insert
  to authenticated
  with check (true);

-- ---------- 3) RPCs de métricas faltantes (equivalente a metrics.sql) ----------
create or replace function public.get_property_views(property_id uuid, days int default 30)
returns table (day date, count bigint)
language sql
stable
set search_path = public
as $$
  select
    created_at::date as day,
    count(*) as count
  from public.property_views
  where property_id = get_property_views.property_id
    and created_at >= now() - make_interval(days => days)
  group by created_at::date
  order by day;
$$;

create or replace function public.get_owner_views(owner_id uuid, days int default 30)
returns table (day date, count bigint)
language sql
stable
set search_path = public
as $$
  select
    pv.created_at::date as day,
    count(*) as count
  from public.property_views pv
  join public.properties p on p.id = pv.property_id
  where p.owner_id = get_owner_views.owner_id
    and pv.created_at >= now() - make_interval(days => days)
  group by pv.created_at::date
  order by day;
$$;

-- ---------- 4) R-21: revocar EXECUTE de find_user_for_org a anon ----------
revoke execute on function public.find_user_for_org(text) from public, anon;

-- ---------- Verificación (read-only) ----------
-- select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--  where n.nspname = 'public'
--    and p.proname in ('increment_property_views','get_property_views','get_owner_views');
-- select policyname, roles, cmd from pg_policies
--  where schemaname = 'public' and tablename = 'property_views';
-- select a.rolname, p.proname from pg_proc p
--  join pg_namespace n on n.oid = p.pronamespace
--  cross join lateral aclexplode(p.proacl) acl join pg_roles a on a.oid = acl.grantee
--  where n.nspname = 'public' and p.proname = 'find_user_for_org' and acl.privilege_type = 'EXECUTE';
