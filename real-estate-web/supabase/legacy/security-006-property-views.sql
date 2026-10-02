-- ============================================================
-- S6 — property_views: RLS + policy de insert
--
-- Problema: sin `enable row level security` ni policy de insert, el fallback
-- de registerView (propertyService.registerView) inserta en silencio y, si la
-- tabla quedó abierta, cualquiera infla contadores.
--
-- Solución: habilitar RLS, permitir insert a autenticados (y a anónimos para
-- no perder el contador de visitas públicas), y mantener los selects por rol
-- ya definidos en metrics-org.sql.
--
-- Requiere: is_superadmin, is_org_member (metrics-org.sql). Idempotente.
-- Ejecutar en: Dashboard → SQL Editor → Run.
-- ============================================================

alter table public.property_views enable row level security;

-- Cualquiera puede registrar una vista (página pública). Sin update/delete.
drop policy if exists "property_views insert public" on public.property_views;
create policy "property_views insert public"
  on public.property_views for insert to public
  with check (true);
