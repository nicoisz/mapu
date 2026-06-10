-- ============================================================
-- FIX: "Database error saving new user" al registrarse
--
-- Diagnóstico: el trigger de auth.users que crea el perfil falla para
-- CUALQUIER registro (incluso sin metadata). Este script lo reemplaza
-- por una versión correcta:
--   · SECURITY DEFINER + search_path fijo (RLS no lo bloquea)
--   · tolera metadata con 'name' o 'full_name' (web y móvil)
--   · user_type con fallback a 'individual'
--   · idempotente (on conflict do nothing)
--
-- Ejecutar en: Dashboard → SQL Editor → Run
-- ============================================================

-- 1. Quitar todos los triggers de aplicación actuales sobre auth.users
--    (el roto incluido, sea cual sea su nombre).
do $$
declare r record;
begin
  for r in
    select t.tgname
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where not t.tgisinternal
      and n.nspname = 'auth' and c.relname = 'users'
  loop
    execute format('drop trigger if exists %I on auth.users', r.tgname);
  end loop;
end $$;

-- 2. Función correcta de creación de perfil.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, user_type)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Usuario'
    ),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'user_type', ''),
      'individual'
    )::user_type
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 3. Reinstalar el trigger.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
