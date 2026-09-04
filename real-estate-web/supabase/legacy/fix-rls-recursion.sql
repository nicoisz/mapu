-- ============================================================
-- FIX: infinite recursion en policies de organization_members
--
-- Las policies consultaban organization_members dentro de la misma
-- tabla → recursión. Fix: función SECURITY DEFINER (corre con
-- privilegios del creador, sin RLS) + policies que la usan.
--
-- Ejecutar en: Dashboard → SQL Editor → Run
-- ============================================================

-- 1. Helper de membresía (sin RLS: security definer).
create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where org_id = is_org_member.org_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function public.is_org_admin(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where org_id = is_org_admin.org_id
      and user_id = auth.uid()
      and status = 'active'
      and role in ('owner', 'admin')
  );
$$;

-- 2. Drop policies recursivas (organizations + members).
drop policy if exists "orgs writable by superadmin or owner" on public.organizations;
drop policy if exists "members readable by superadmin or org members" on public.organization_members;
drop policy if exists "members managed by superadmin or org owner/admin" on public.organization_members;
drop policy if exists "members updated by superadmin or org owner/admin" on public.organization_members;

-- 3. Reescribir usando los helpers (sin auto-referencia).
create policy "orgs writable by superadmin or org admin"
on public.organizations for all to authenticated
using (public.is_superadmin() or public.is_org_admin(id));

create policy "members readable by superadmin or org members"
on public.organization_members for select to authenticated
using (public.is_superadmin() or public.is_org_member(org_id));

create policy "members managed by superadmin or org admin"
on public.organization_members for insert to authenticated
with check (public.is_superadmin() or public.is_org_admin(org_id));

create policy "members updated by superadmin or org admin"
on public.organization_members for update to authenticated
using (public.is_superadmin() or public.is_org_admin(org_id));
