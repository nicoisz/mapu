-- ============================================================
-- S11 — Limpieza: policies legacy abiertas a public + tablas móviles sin uso
--
-- Contexto: la DB compartía esquema con la app móvil MapU, que tenía policies
-- `to public` (anti-patrón: anon + authenticated, abiertas). La web convivía
-- con ellas y, en RLS, las policies se combinan con OR → dejaban abiertos los
-- agujeros que security-004..010 cerraban para la web.
--
-- La app móvil está en reinicio (se rehace), así que:
--   1) se dropean las policies públicas peligrosas,
--   2) se eliminan las tablas móviles que la web NO usa.
--
-- Se MANTIENEN: properties, profiles, favorites, reviews, organizations,
-- property_views, error_logs y payments (payments la usa el admin web).
--
-- Requiere: nada. Idempotente. Ejecutar en: Dashboard → SQL Editor → Run.
-- ============================================================

-- ---------- 1) Policies legacy abiertas a public ----------
drop policy if exists "conversations_participants" on public.conversations;
drop policy if exists "messages_participants" on public.messages;
drop policy if exists "notifications_own" on public.notifications;
drop policy if exists "payments_own" on public.payments;
drop policy if exists "price_alerts_own" on public.price_alerts;
drop policy if exists "profiles_own_write" on public.profiles;
drop policy if exists "properties_own_insert" on public.properties;
drop policy if exists "properties_own_update" on public.properties;
drop policy if exists "properties_own_delete" on public.properties;

-- ---------- 2) Tablas de la app móvil sin uso en la web ----------
drop table if exists public.messages cascade;
drop table if exists public.conversations cascade;
drop table if exists public.notifications cascade;
drop table if exists public.price_alerts cascade;
