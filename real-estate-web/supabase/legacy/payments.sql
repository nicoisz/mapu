-- ============================================================
-- F5 — Pagos (UI/UX Mercado Pago, sin integración real aún)
--
-- La app móvil ya tiene la tabla payments (mp_preference_id,
-- mp_payment_id). Este script solo garantiza que exista para la web.
--
-- Ejecutar en: Dashboard → SQL Editor → Run
-- ============================================================

create table if not exists public.payments (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id),
  plan             text not null default 'premium',
  amount           bigint not null,
  currency         text not null default 'CLP',
  status           text not null default 'pending',
  mp_preference_id text,
  mp_payment_id    text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
