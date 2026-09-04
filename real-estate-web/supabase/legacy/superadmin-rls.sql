-- ============================================================
-- F0 — RLS: acceso total del superadmin
--
-- Requiere: platform_role en profiles (ver add-superadmin.sql)
-- Ejecutar en: Dashboard → SQL Editor → Run
-- ============================================================

-- Helper: ¿es el usuario actual superadmin?
create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and platform_role = 'superadmin'
  );
$$;

-- Superadmin puede leer/editar cualquier perfil
create policy "superadmin full access profiles"
on public.profiles for all
using (public.is_superadmin());

-- Superadmin puede leer/editar cualquier propiedad
create policy "superadmin full access properties"
on public.properties for all
using (public.is_superadmin());

-- Superadmin puede leer/editar cualquier organización (si existe la tabla)
do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'organizations') then
    execute 'create policy "superadmin full access organizations"
      on public.organizations for all
      using (public.is_superadmin())';
  end if;
end $$;
