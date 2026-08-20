-- ============================================================
-- F0.3 — ALTER de properties (correr SEPARADO, después de organizations.sql)
--
-- El ALTER necesita AccessExclusiveLock; con la app viva consultando
-- properties puede deadlockear. Este script: lock_timeout corto + reintentos
-- limitados. Si agota los reintentos, correr en horario de bajo tráfico.
-- Ejecutar en: Dashboard → SQL Editor → Run
-- ============================================================

set lock_timeout = '3s';

do $$
declare
  tries int := 0;
  done  boolean := false;
begin
  while not done and tries < 10 loop
    begin
      alter table public.properties
        add column if not exists organization_id uuid references public.organizations(id);
      done := true;
    exception when lock_not_available then
      tries := tries + 1;
      perform pg_sleep(1);
    end;
  end loop;
  if not done then
    raise notice 'No se pudo obtener el lock tras 10 intentos. Reintenta en horario de bajo tráfico.';
  end if;
end $$;
