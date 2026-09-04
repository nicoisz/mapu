-- ============================================================
-- S9 — find_user_for_org: anti-enumeración
--
-- Problema: el RPC usaba `email ilike '%termino%'` → un admin de org podía
-- barrer emails de toda la DB con prefijos/parciales.
--
-- Solución: match exacto (el service ya manda el email completo), límite 1 y
-- sigue exigiendo superadmin o admin/owner de alguna org.
--
-- Requiere: security-001 (is_superadmin), is_org_admin_any (metrics-org.sql).
-- Idempotente. Ejecutar en: Dashboard → SQL Editor → Run.
-- ============================================================

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
    where lower(p.email) = lower(search_email)
    limit 1;
end;
$$;
