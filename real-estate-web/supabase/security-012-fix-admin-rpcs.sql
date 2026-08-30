-- ============================================================
-- S12 — Fix RPCs de admin: drop-first + casts explícitos
--
-- Síntoma: "structure of query does not match function result type"
-- en /admin/usuarios.
--
-- Causa: quedaba una versión vieja/sobrecargada del RPC (del "intento" de la
-- app móvil o de una firma distinta) con shape de retorno distinto, y/o tipos
-- de columna que no casan con el RETURNS TABLE declarado (p.ej. total_listings
-- numeric vs bigint).
--
-- Solución: `drop function if exists` ANTES de `create or replace` (elimina
-- sobrecargas/versiones viejas) + casts explícitos (::bigint, ::text, ...)
-- para que el SELECT siempre coincida con el tipo declarado.
--
-- Requiere: security-001 (is_superadmin), security-004 (base). Idempotente.
-- Ejecutar en: Dashboard → SQL Editor → Run (tras security-004).
-- ============================================================

-- ---------- 1) admin_list_users ----------
drop function if exists public.admin_list_users(text);

create or replace function public.admin_list_users(search_term text default '')
returns table (
  id uuid, email text, name text, user_type text, platform_role text,
  company_name text, license_number text,
  is_email_verified boolean, is_phone_verified boolean,
  created_at timestamptz, total_listings bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'No autorizado';
  end if;
  return query
    select p.id,
           p.email::text,
           p.name::text,
           p.user_type::text,
           p.platform_role::text,
           p.company_name::text,
           p.license_number::text,
           p.is_email_verified::boolean,
           p.is_phone_verified::boolean,
           p.created_at,
           p.total_listings::bigint
    from public.profiles p
    where search_term = ''
       or p.email ilike '%' || search_term || '%'
       or p.name  ilike '%' || search_term || '%'
    order by p.created_at desc
    limit 200;
end;
$$;

revoke execute on function public.admin_list_users(text) from public, anon;
grant execute on function public.admin_list_users(text) to authenticated;

-- ---------- 2) get_org_members ----------
drop function if exists public.get_org_members(uuid);

create or replace function public.get_org_members(org_id uuid)
returns table (user_id uuid, name text, email text, role text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not (public.is_superadmin() or public.is_org_admin(org_id)) then
    raise exception 'No autorizado';
  end if;
  return query
    select m.user_id, p.name::text, p.email::text, m.role::text
    from public.organization_members m
    join public.profiles p on p.id = m.user_id
    where m.org_id = get_org_members.org_id
      and m.status = 'active'
    order by p.name;
end;
$$;

revoke execute on function public.get_org_members(uuid) from public, anon;
grant execute on function public.get_org_members(uuid) to authenticated;

-- ---------- 3) admin_set_platform_role ----------
drop function if exists public.admin_set_platform_role(uuid, text);

create or replace function public.admin_set_platform_role(target_user_id uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'No autorizado';
  end if;
  if new_role not in ('user', 'superadmin') then
    raise exception 'Rol inválido';
  end if;
  update public.profiles
     set platform_role = new_role, updated_at = now()
   where id = target_user_id;
end;
$$;

revoke execute on function public.admin_set_platform_role(uuid, text) from public, anon;
grant execute on function public.admin_set_platform_role(uuid, text) to authenticated;

-- ---------- 4) admin_toggle_verified ----------
drop function if exists public.admin_toggle_verified(uuid, text, boolean);

create or replace function public.admin_toggle_verified(target_user_id uuid, field text, value boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'No autorizado';
  end if;
  if field = 'is_email_verified' then
    update public.profiles set is_email_verified = value, updated_at = now()
     where id = target_user_id;
  elsif field = 'is_phone_verified' then
    update public.profiles set is_phone_verified = value, updated_at = now()
     where id = target_user_id;
  else
    raise exception 'Campo inválido';
  end if;
end;
$$;

revoke execute on function public.admin_toggle_verified(uuid, text, boolean) from public, anon;
grant execute on function public.admin_toggle_verified(uuid, text, boolean) to authenticated;

-- ---------- 5) admin_set_review_status ----------
drop function if exists public.admin_set_review_status(uuid, text);

create or replace function public.admin_set_review_status(review_id uuid, new_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'No autorizado';
  end if;
  if new_status not in ('published', 'flagged', 'removed') then
    raise exception 'Estado inválido';
  end if;
  update public.reviews set status = new_status, updated_at = now() where id = review_id;
end;
$$;

revoke execute on function public.admin_set_review_status(uuid, text) from public, anon;
grant execute on function public.admin_set_review_status(uuid, text) to authenticated;
