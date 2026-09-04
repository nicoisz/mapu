-- ============================================================
-- F6 — Métricas por rol + gestión de miembros de empresa
--
-- 1) get_org_views / get_global_views: serie temporal de visitas para
--    dueño/admin de empresa (scope org) y superadmin (scope global).
--    Son SECURITY INVOKER: la RLS de property_views/properties limita
--    qué filas ve cada rol.
-- 2) Policies RLS en property_views: superadmin y miembros de la org
--    pueden leer las visitas de las propiedades de su empresa.
-- 3) find_user_for_org: RPC SECURITY DEFINER para que un admin de empresa
--    busque un usuario por email y lo agregue a su org, sin exponer el
--    listado de perfiles.
--
-- Requiere: is_superadmin() (superadmin-rls.sql), is_org_member() y
--           is_org_admin() (organizations.sql / fix-rls-recursion.sql)
-- Ejecutar en: Dashboard → SQL Editor → Run
-- ============================================================

-- Vistas de TODAS las propiedades de una org agrupadas por día.
create or replace function public.get_org_views(org_id uuid, days int default 30)
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
  where p.organization_id = get_org_views.org_id
    and pv.created_at >= now() - make_interval(days => days)
  group by pv.created_at::date
  order by day;
$$;

-- Vistas de la plataforma completa agrupadas por día (solo superadmin
-- puede leer todo property_views por RLS).
create or replace function public.get_global_views(days int default 30)
returns table (day date, count bigint)
language sql
stable
set search_path = public
as $$
  select
    created_at::date as day,
    count(*) as count
  from public.property_views
  where created_at >= now() - make_interval(days => days)
  group by created_at::date
  order by day;
$$;

-- RLS: superadmin lee las visitas de todas las propiedades.
drop policy if exists "superadmin read property_views" on public.property_views;
create policy "superadmin read property_views"
on public.property_views for select to authenticated
using (public.is_superadmin());

-- RLS: miembros de una org leen las visitas de sus propiedades.
drop policy if exists "org members read property_views of their org" on public.property_views;
create policy "org members read property_views of their org"
on public.property_views for select to authenticated
using (
  exists (
    select 1 from public.properties p
    where p.id = property_views.property_id
      and p.organization_id is not null
      and public.is_org_member(p.organization_id)
  )
);

-- ¿El usuario es owner/admin de ALGUNA empresa?
create or replace function public.is_org_admin_any()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where user_id = auth.uid()
      and status = 'active'
      and role in ('owner', 'admin')
  );
$$;

-- Busca un usuario por email para invitarlo a una empresa.
-- Solo superadmin o admin/owner de org (evita enumerar perfiles).
create or replace function public.find_user_for_org(search_email text)
returns table (id uuid, name text, email text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not (public.is_superadmin() or public.is_org_admin_any()) then
    raise exception 'No autorizado';
  end if;

  return query
    select p.id, p.name, p.email
    from public.profiles p
    where p.email ilike find_user_for_org.search_email
    limit 10;
end;
$$;
