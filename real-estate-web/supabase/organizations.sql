-- ============================================================
-- F0.3 — Organizaciones (empresas) + miembros — multi-tenant
--
-- Ejecutar en: Dashboard → SQL Editor → Run
-- ============================================================

create type public.org_type as enum ('brokerage', 'company');
create type public.org_role as enum ('owner', 'admin', 'agent');
create type public.member_status as enum ('invited', 'active', 'removed');

create table public.organizations (
  id              uuid primary key default gen_random_uuid(),
  type            public.org_type not null,
  name            text not null,
  logo_url        text,
  description     text,
  website         text,
  phone           text,
  license_number  text,
  rut             text,
  is_verified     boolean not null default false,
  rating          numeric,
  review_count    int not null default 0,
  created_by      uuid not null references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.organization_members (
  org_id         uuid not null references public.organizations(id) on delete cascade,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  role           public.org_role not null default 'agent',
  status         public.member_status not null default 'active',
  invited_by     uuid references public.profiles(id),
  joined_at      timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  primary key (org_id, user_id)
);

-- Las propiedades pueden quedar ligadas a una organización.
alter table public.properties
  add column if not exists organization_id uuid references public.organizations(id);

-- RLS: organizaciones leíbles por autenticados, editables por dueño.
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

create policy "orgs readable by authenticated"
on public.organizations for select to authenticated
using (true);

create policy "orgs writable by superadmin or owner"
on public.organizations for all to authenticated
using (public.is_superadmin() or exists (
  select 1 from public.organization_members m
  where m.org_id = id and m.user_id = auth.uid() and m.role in ('owner', 'admin')
));

create policy "members readable by superadmin or org members"
on public.organization_members for select to authenticated
using (public.is_superadmin() or exists (
  select 1 from public.organization_members m2
  where m2.org_id = org_id and m2.user_id = auth.uid()
));

create policy "members managed by superadmin or org owner/admin"
on public.organization_members for insert to authenticated
with check (public.is_superadmin() or exists (
  select 1 from public.organization_members m
  where m.org_id = org_id and m.user_id = auth.uid() and m.role in ('owner', 'admin')
));

create policy "members updated by superadmin or org owner/admin"
on public.organization_members for update to authenticated
using (public.is_superadmin() or exists (
  select 1 from public.organization_members m
  where m.org_id = org_id and m.user_id = auth.uid() and m.role in ('owner', 'admin')
));
