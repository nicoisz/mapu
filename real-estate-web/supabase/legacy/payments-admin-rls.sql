-- ============================================================
-- F6 — RLS: superadmin lee payments (ingresos/ventas)
--
-- Requiere: is_superadmin() (ver superadmin-rls.sql)
-- Ejecutar en: Dashboard → SQL Editor → Run
-- ============================================================

do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'payments') then
    execute 'create policy "superadmin read payments"
      on public.payments for select
      using (public.is_superadmin())';
  end if;
end $$;
