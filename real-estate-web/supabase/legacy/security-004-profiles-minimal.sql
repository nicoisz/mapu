-- ============================================================
-- S4 — Perfiles: mínima exposición + bloqueo de escalada de rol
--
-- Problemas que resuelve:
--   1) PII: la policy "profiles readable by authenticated using (true)"
--      exponía TODO perfil (email, teléfono, whatsapp, licencia, suscripción)
--      a cualquier usuario autenticado.
--   2) ESCALADA CRÍTICA: la policy "profiles update own" solo validaba
--      `id = auth.uid()`. Un usuario podía hacer
--        update profiles set platform_role='superadmin' where id = propio
--      y volverse superadmin.
--
-- Solución:
--   · Grants POR COLUMNA (la única vía en Postgres sin RPCs): revocar
--     select/insert/update globales de anon/authenticated y conceder solo
--     columnas públicas / editables por el propio usuario.
--   · Lecturas sensibles del perfil propio → RPC get_own_profile (SECURITY
--     DEFINER, id = auth.uid()).
--   · Operaciones de superadmin sobre profiles → RPCs (admin_*).
--   · La policy de update exige platform_role = 'user' en el nuevo row
--     (bloquea escalada incluso sin tocar grants).
--
-- Requiere: security-001 (is_superadmin), organizations (is_org_admin).
-- Idempotente. Ejecutar en: Dashboard → SQL Editor → Run.
-- ============================================================

-- ---------- 1) Columna de grants sobre profiles ----------
-- Quita select/insert/update/delete globales de las roles de cliente.
revoke all on table public.profiles from anon, authenticated;

-- Lectura pública: solo columnas no sensibles.
grant select (id, name, avatar_url, rating, review_count) on table public.profiles to anon, authenticated;

-- Alta de perfil propio (fallback del login; el trigger la hace de costumbre).
grant insert (id, email, name, user_type, updated_at) on table public.profiles to authenticated;

-- Edición propia: campos que el usuario puede cambiar. NUNCA platform_role,
-- email ni los verified (solo vía RPC de superadmin).
grant update (name, avatar_url, phone, whatsapp, updated_at) on table public.profiles to authenticated;

-- ---------- 2) Policy de update que bloquea la escalada ----------
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and platform_role = 'user');

-- ---------- 3) Lectura pública de columnas básicas (anon) ----------
-- Permite ver nombre/avatar en reseñas y badges de org sin exponer datos.
drop policy if exists "profiles public select" on public.profiles;
create policy "profiles public select"
  on public.profiles for select to anon
  using (true);

-- ---------- 4) RPC: perfil propio completo ----------
create or replace function public.get_own_profile()
returns public.profiles
language sql
stable
security definer
set search_path = public
as $$
  select * from public.profiles where id = auth.uid();
$$;

revoke execute on function public.get_own_profile() from public, anon;
grant execute on function public.get_own_profile() to authenticated;

-- ---------- 5) RPC: miembros de una org con email (owner/admin) ----------
-- El email ya no se lee directo por grants; se entrega vía RPC solo a
-- quienes gestionan la org (o superadmin).
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
    select m.user_id, p.name, p.email, m.role::text
    from public.organization_members m
    join public.profiles p on p.id = m.user_id
    where m.org_id = get_org_members.org_id
      and m.status = 'active'
    order by p.name;
end;
$$;

revoke execute on function public.get_org_members(uuid) from public, anon;
grant execute on function public.get_org_members(uuid) to authenticated;

-- ---------- 6) RPC: listar usuarios (superadmin) ----------
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
    select p.id, p.email, p.name, p.user_type, p.platform_role,
           p.company_name, p.license_number,
           p.is_email_verified, p.is_phone_verified,
           p.created_at, p.total_listings
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

-- ---------- 7) RPC: cambiar rol de plataforma (superadmin) ----------
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

-- ---------- 8) RPC: verificar email/teléfono (superadmin) ----------
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
