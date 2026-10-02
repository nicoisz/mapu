-- ============================================================
-- S3 — Jerarquía de corredora + visibilidad + membresía al publicar
--
-- 1) set_member_role (RPC SECURITY DEFINER): gestionar miembros con
--    jerarquía estricta. owner > admin > agent. Nadie puede tocar al
--    owner salvo superadmin; admin gestiona solo agentes.
-- 2) Visibilidad de properties por rol: agent ve solo las suyas,
--    admin/owner ven toda la org (is_org_admin).
-- 3) Publicar: validar que el usuario es miembro activo de la org.
--
-- Requiere: security-001 (is_superadmin), organizations (is_org_member,
--           is_org_admin), security-002 (RLS en properties).
-- Entorno: DEV. Ejecutar en: Dashboard → SQL Editor → Run (idempotente)
-- ============================================================

-- ---------- 1) RPC de gestión de miembros con jerarquía ----------
create or replace function public.set_member_role(org_id uuid, target_user_id uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role  text;
  target_role text;
  actor_is_super boolean := public.is_superadmin();
begin
  -- Rol del actor en la org
  select m.role::text into actor_role
  from public.organization_members m
  where m.org_id = set_member_role.org_id
    and m.user_id = auth.uid()
    and m.status = 'active';

  if not actor_is_super and (actor_role is null or actor_role not in ('owner','admin')) then
    raise exception 'No autorizado para gestionar miembros';
  end if;

  if new_role is not null and new_role not in ('owner','admin','agent') then
    raise exception 'Rol inválido';
  end if;

  select m.role::text into target_role
  from public.organization_members m
  where m.org_id = set_member_role.org_id
    and m.user_id = target_user_id;

  -- Superadmin: control total
  if actor_is_super then
    if new_role is null then
      delete from public.organization_members
      where org_id = set_member_role.org_id and user_id = target_user_id;
    else
      insert into public.organization_members (org_id, user_id, role, status)
      values (set_member_role.org_id, target_user_id, new_role::public.org_role, 'active')
      on conflict (org_id, user_id)
      do update set role = excluded.role, status = 'active';
    end if;
    return;
  end if;

  -- Jerarquía para no-superadmin
  if target_role = 'owner' then
    raise exception 'El dueño de la corredora no puede ser modificado';
  end if;

  if new_role = 'owner' then
    raise exception 'Solo un superadministrador puede designar al dueño';
  end if;

  if actor_role = 'admin' then
    -- admin no toca a otros admins ni promueve a admin
    if target_role = 'admin' then
      raise exception 'Un admin no puede gestionar a otro admin';
    end if;
    if new_role = 'admin' then
      raise exception 'Un admin solo puede agregar o gestionar agentes';
    end if;
  end if;

  if new_role is null then
    delete from public.organization_members
    where org_id = set_member_role.org_id and user_id = target_user_id;
  else
    insert into public.organization_members (org_id, user_id, role, status)
    values (set_member_role.org_id, target_user_id, new_role::public.org_role, 'active')
    on conflict (org_id, user_id)
    do update set role = excluded.role, status = 'active';
  end if;
end;
$$;

-- La jerarquía se impone vía el RPC set_member_role (SECURITY DEFINER: omite
-- RLS y corre como dueño, por eso puede gestionar sin policy de delete). El
-- panel admin (superadmin) y la página de equipo usan ese RPC. No hay policy
-- de delete directo: un miembro no puede borrar filas por su cuenta.
revoke execute on function public.set_member_role(org_id uuid, target_user_id uuid, new_role text) from public;
grant execute on function public.set_member_role(org_id uuid, target_user_id uuid, new_role text) to authenticated;

-- ---------- 2) Visibilidad de properties por rol ----------
drop policy if exists "org admin read org properties" on public.properties;
create policy "org admin read org properties"
  on public.properties for select to authenticated
  using (public.is_org_admin(organization_id));

-- ---------- 3) Publicar solo bajo la propia org ----------
drop policy if exists "properties insert own" on public.properties;
create policy "properties insert own"
  on public.properties for insert to authenticated
  with check (
    owner_id = auth.uid()
    and (organization_id is null or public.is_org_member(organization_id))
  );
