-- ============================================================
-- F0 — Rol de superadmin de plataforma
--
-- 1) Columna platform_role en profiles (user | superadmin)
-- 2) Marca la cuenta del dueño como superadmin
--
-- Ejecutar en: Dashboard → SQL Editor → Run
-- ============================================================

alter table public.profiles
  add column if not exists platform_role text not null default 'user';

update public.profiles
set platform_role = 'superadmin'
where email = 'nicolasignacio.sz@gmail.com';
