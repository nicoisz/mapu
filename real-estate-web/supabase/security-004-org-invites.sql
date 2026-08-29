-- ============================================================
-- S4 — Invitaciones a corredora (invite-link con Resend)
--
-- 1) org_invites: token + email + rol + expiración.
-- 2) create_org_invite (RPC SECURITY DEFINER): valida jerarquía
--    (owner invita admin/agent, admin solo agentes) y genera token.
-- 3) accept_pending_invites (RPC SECURITY DEFINER): al hacer login,
--    une al usuario a todas las invitaciones pendientes de su email.
--
-- El envío del correo lo hace la ruta server /api/invite/send (Resend).
-- Requiere: security-003 (jerarquía) + organizations.
-- Entorno: DEV. Ejecutar en: Dashboard → SQL Editor → Run (idempotente)
-- ============================================================

create table if not exists public.org_invites (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  email       text not null,
  role        public.org_role not null default 'agent',
  token       text not null unique,
  status      text not null default 'pending',
  created_by  uuid not null references public.profiles(id),
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

alter table public.org_invites enable row level security;

drop policy if exists "invites readable by superadmin or org admin" on public.org_invites;
create policy "invites readable by superadmin or org admin"
  on public.org_invites for select to authenticated
  using (public.is_superadmin() or public.is_org_admin(org_id));

-- ---------- RPC: crear invitación ----------
create or replace function public.create_org_invite(inv_org_id uuid, inv_email text, inv_role text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
  gen_token text := encode(gen_random_bytes(24), 'hex');
begin
  select m.role::text into actor_role
  from public.organization_members m
  where m.org_id = inv_org_id
    and m.user_id = auth.uid()
    and m.status = 'active';

  if actor_role is null or actor_role not in ('owner','admin') then
    raise exception 'No autorizado para invitar';
  end if;
  if inv_role not in ('admin','agent') then
    raise exception 'Rol inválido';
  end if;
  if actor_role = 'admin' and inv_role = 'admin' then
    raise exception 'Un admin solo puede invitar agentes';
  end if;

  insert into public.org_invites (org_id, email, role, token, created_by, expires_at)
  values (inv_org_id, lower(inv_email), inv_role::public.org_role, gen_token, auth.uid(), now() + interval '7 days');

  return gen_token;
end $$;

-- ---------- RPC: aceptar invitaciones pendientes del usuario ----------
create or replace function public.accept_pending_invites()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_user_id uuid := auth.uid();
begin
  select email into v_email from public.profiles where id = v_user_id;
  if v_email is null then
    return;
  end if;

  insert into public.organization_members (org_id, user_id, role, status)
  select i.org_id, v_user_id, i.role, 'active'
  from public.org_invites i
  where lower(i.email) = lower(v_email)
    and i.status = 'pending'
    and i.expires_at > now()
  on conflict (org_id, user_id)
  do update set role = excluded.role, status = 'active';

  update public.org_invites set status = 'accepted'
  where lower(email) = lower(v_email) and status = 'pending';
end $$;

-- Solo el RPC crea/acepta; el cliente no escribe en la tabla.
revoke execute on function public.create_org_invite(uuid, text, text) from public;
revoke execute on function public.accept_pending_invites() from public;
grant execute on function public.create_org_invite(uuid, text, text) to authenticated;
grant execute on function public.accept_pending_invites() to authenticated;
