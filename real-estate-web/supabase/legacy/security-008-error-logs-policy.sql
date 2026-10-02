-- ============================================================
-- S8 — error_logs: frenar spam
--
-- Problema: la policy de insert era `to public with check (true)` → cualquiera
-- llena la tabla de basura y se puede llenar el storage.
--
-- Trade-off: restringir a autenticados pierde los errores de visitantes
-- anónimos, pero mata el vector de abuso. Para beta es aceptable; si luego se
-- quieren logs anónimos se migra a un RPC con rate-limit por IP.
--
-- Requiere: security-001 (is_superadmin). Idempotente.
-- Ejecutar en: Dashboard → SQL Editor → Run.
-- ============================================================

drop policy if exists "anyone can insert error logs" on public.error_logs;
drop policy if exists "authenticated insert error logs" on public.error_logs;
create policy "authenticated insert error logs"
  on public.error_logs for insert to authenticated
  with check (true);
