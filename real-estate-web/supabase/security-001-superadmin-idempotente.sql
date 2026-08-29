-- ============================================================
-- S1 — Superadmin: columna + helper RLS + policies (idempotente)
--
-- Consolidación de add-superadmin.sql + superadmin-rls.sql en
-- un solo script que se puede correr N veces sin romper nada.
--
-- Ejecutar en: Dashboard → SQL Editor → Run (idempotente)
-- ============================================================

-- 1) Columna platform_role en profiles (user | superadmin)
alter table public.profiles
  add column if not exists platform_role text not null default 'user';

-- 2) Helper: ¿es el usuario actual superadmin?
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

-- 3) Policies de acceso total para superadmin (drop + create = idempotente)
drop policy if exists "superadmin full access profiles" on public.profiles;
create policy "superadmin full access profiles"
  on public.profiles for all
  using (public.is_superadmin());

drop policy if exists "superadmin full access properties" on public.properties;
create policy "superadmin full access properties"
  on public.properties for all
  using (public.is_superadmin());

do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'organizations') then
    execute 'drop policy if exists "superadmin full access organizations" on public.organizations';
    execute 'create policy "superadmin full access organizations"
      on public.organizations for all
      using (public.is_superadmin())';
  end if;
end $$;

-- 4) Marca al dueño como superadmin. AJUSTA el email a tu cuenta.
update public.profiles
set platform_role = 'superadmin'
where email = 'nicolasignacio.sz@gmail.com';
