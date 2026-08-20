-- ============================================================
-- F6 — Log de errores (client-side) para el panel admin
--
-- Captura en la web (window.onerror + unhandledrejection + error.tsx)
-- e inserta filas aquí. Solo superadmin puede leerlas.
--
-- Requiere: is_superadmin() (ver superadmin-rls.sql)
-- Ejecutar en: Dashboard → SQL Editor → Run
-- ============================================================

create table if not exists public.error_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id),
  email      text,
  name       text,
  route      text,
  message    text,
  stack      text,
  context    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.error_logs enable row level security;

-- Cualquiera (autenticado o anónimo) puede registrar errores; nadie puede
-- editar/borrar. Solo superadmin lee.
create policy "anyone can insert error logs"
on public.error_logs for insert
to public
with check (true);

create policy "superadmin can read error logs"
on public.error_logs for select
using (public.is_superadmin());

create index if not exists error_logs_created_at_idx on public.error_logs (created_at desc);
create index if not exists error_logs_user_id_idx on public.error_logs (user_id);
