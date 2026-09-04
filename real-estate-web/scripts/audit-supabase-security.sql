-- ============================================================================
-- audit-supabase-security.sql — inventario READ-ONLY de seguridad Supabase
-- ============================================================================
-- OBJETIVO: producir evidencia del estado real de la base para el hardening
--           de MapU (TASK-00). NO crea, NO altera y NO borra ningún objeto.
--
-- SEGURIDAD: solo ejecuta SELECT / consultas de catálogo. No incluye DDL ni
--            DML. Puede ejecutarse con un rol de solo lectura.
--
-- CÓMO EJECUTAR (local / staging):
--   Local:
--     1. npx supabase start  (levanta Postgres local)
--     2. npx supabase db reset (aplica migraciones; opcional si ya está listo)
--     3. psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
--            -f scripts/audit-supabase-security.sql
--   Staging / Producción (solo lectura):
--     Supabase Dashboard → SQL Editor → pegar y Run.
--
-- ADVERTENCIA: la salida contiene grants, roles y configuraciones. Si incluye
--              identificadores sensibles, NO versionar el resultado. Guardar el
--              output fuera del repositorio (p.ej. /tmp o un vault).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Contexto: versión, conexión y fecha del inventario
-- ----------------------------------------------------------------------------
select
  current_database()                          as database_name,
  current_user                                 as executing_role,
  version()                                    as postgres_version,
  now()                                        as audit_at;

-- ----------------------------------------------------------------------------
-- 1. Tablas del esquema public y estado de RLS (habilitada / forzada)
-- ----------------------------------------------------------------------------
select
  n.nspname                                        as schema,
  c.relname                                        as table_name,
  c.relrowsecurity                                 as rls_enabled,
  c.relforcerowsecurity                            as rls_forced,
  c.relkind::text                                  as relkind
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')                      -- tablas y tablas particionadas
order by c.relname;

-- Tablas del esquema public SIN RLS habilitada (riesgo si contienen datos de usuario)
select
  n.nspname                                        as schema,
  c.relname                                        as table_name,
  c.relrowsecurity                                 as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
  and c.relrowsecurity = false
order by c.relname;

-- ----------------------------------------------------------------------------
-- 2. Policies activas sobre tablas de public
-- ----------------------------------------------------------------------------
select
  schemaname                                       as schema,
  tablename                                        as table_name,
  policyname                                       as policy_name,
  permissive                                       as permissive,
  roles                                            as roles,
  cmd                                              as command,
  qual                                             as using_expression,
  with_check                                       as with_check_expression
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- Policies sobre storage.objects (buckets)
select
  schemaname                                       as schema,
  tablename                                        as table_name,
  policyname                                       as policy_name,
  roles                                            as roles,
  cmd                                              as command,
  qual                                             as using_expression,
  with_check                                       as with_check_expression
from pg_policies
where schemaname = 'storage'
order by tablename, policyname;

-- ----------------------------------------------------------------------------
-- 3. Grants a anon / authenticated / service_role (tablas, columnas, secuencias)
-- ----------------------------------------------------------------------------
select
  grantee,
  table_schema                                     as schema,
  table_name,
  privilege_type,
  is_grantable
from information_schema.role_table_grants
where grantee in ('anon', 'authenticated', 'service_role')
order by grantee, table_name, privilege_type;

select
  grantee,
  table_schema                                     as schema,
  table_name,
  column_name,
  privilege_type
from information_schema.role_column_grants
where grantee in ('anon', 'authenticated', 'service_role')
order by grantee, table_name, column_name, privilege_type;

select
  grantee,
  sequence_schema                                  as schema,
  sequence_name,
  privilege_type
from information_schema.role_usage_grants
where grantee in ('anon', 'authenticated', 'service_role')
  and object_type = 'SEQUENCE'
order by grantee, sequence_name;

-- Grants EXPLICITOS de EXECUTE sobre funciones (via aclexplode)
-- Nota: proacl NULL = privilegios por defecto (PUBLIC EXECUTE). Se lista aparte.
select
  n.nspname                                        as schema,
  p.proname                                        as function_name,
  pg_get_function_identity_arguments(p.oid)        as args,
  a.rolname                                        as grantee,
  acl.privilege_type                               as privilege_type,
  acl.is_grantable                                 as is_grantable
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
cross join lateral aclexplode(p.proacl) acl
join pg_roles a on a.oid = acl.grantee
where n.nspname = 'public'
  and acl.privilege_type = 'EXECUTE'
  and a.rolname in ('anon', 'authenticated', 'service_role', 'public')
order by p.proname, a.rolname;

-- Funciones con proacl NULL (privilegios por defecto = PUBLIC EXECUTE)
select
  n.nspname                                        as schema,
  p.proname                                        as function_name,
  pg_get_function_identity_arguments(p.oid)        as args,
  p.prosecdef                                      as is_security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prokind = 'f'
  and p.proacl is null
order by p.proname;

-- ----------------------------------------------------------------------------
-- 4. Funciones: SECURITY DEFINER vs INVOKER + search_path
-- ----------------------------------------------------------------------------
select
  n.nspname                                        as schema,
  p.proname                                        as function_name,
  pg_get_function_identity_arguments(p.oid)        as args,
  p.prosecdef                                      as is_security_definer,
  case when p.prosecdef then 'DEFINER' else 'INVOKER' end as security_mode,
  p.provolatile::text                              as volatility,
  coalesce(
    (select string_agg(s.setconfig, E'\n')
     from unnest(p.proconfig) s(setconfig)
     where s.setconfig like 'search_path=%'),
    'default'
  )                                                as search_path,
  p.proowner::regrole::text                        as owner
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prokind = 'f'
order by p.prosecdef desc, p.proname;

-- Funciones SECURITY DEFINER sin search_path fijo (riesgo de hijacking)
select
  p.proname                                        as function_name,
  pg_get_function_identity_arguments(p.oid)        as args,
  coalesce(
    (select string_agg(s.setconfig, E'\n')
     from unnest(p.proconfig) s(setconfig)
     where s.setconfig like 'search_path=%'),
    'NO DEFINIDO'
  )                                                as search_path
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef = true
  and not exists (
    select 1
    from unnest(p.proconfig) s(setconfig)
    where s.setconfig like 'search_path=%'
  )
order by p.proname;

-- ----------------------------------------------------------------------------
-- 5. Triggers no internos (propios de la app)
-- ----------------------------------------------------------------------------
select
  n.nspname                                        as schema,
  c.relname                                        as table_name,
  t.tgname                                         as trigger_name,
  case t.tgenabled
    when 'O' then 'origin' when 'D' then 'disabled'
    when 'R' then 'replica' when 'A' then 'always'
    else t.tgenabled::text end                     as enabled_status,
  pg_get_triggerdef(t.oid)                         as trigger_definition
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where not t.tgisinternal
  and n.nspname = 'public'
order by c.relname, t.tgname;

-- ----------------------------------------------------------------------------
-- 6. Índices relevantes
-- ----------------------------------------------------------------------------
select
  n.nspname                                        as schema,
  t.relname                                        as table_name,
  i.relname                                        as index_name,
  ix.indisunique                                   as is_unique,
  ix.indisprimary                                  as is_primary,
  pg_get_indexdef(i.oid)                           as index_definition
from pg_index ix
join pg_class i on i.oid = ix.indexrelid
join pg_class t on t.oid = ix.indrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
order by t.relname, i.relname;

-- ----------------------------------------------------------------------------
-- 7. Constraints relevantes (PK, FK, UNIQUE, CHECK)
-- ----------------------------------------------------------------------------
select
  tc.table_schema                                  as schema,
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  string_agg(kcu.column_name, ', ' order by kcu.ordinal_position) as columns,
  ccu.table_name                                   as referenced_table,
  string_agg(ccu.column_name, ', ' order by kcu.ordinal_position) as referenced_columns
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on kcu.constraint_name = tc.constraint_name
 and kcu.constraint_schema = tc.constraint_schema
 and kcu.table_name = tc.table_name
left join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
 and ccu.constraint_schema = tc.constraint_schema
 and ccu.table_name = tc.table_name
where tc.table_schema = 'public'
  and tc.constraint_type in ('PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE', 'CHECK')
group by tc.table_schema, tc.table_name, tc.constraint_name, tc.constraint_type, ccu.table_name
order by tc.table_name, tc.constraint_type, tc.constraint_name;

-- ----------------------------------------------------------------------------
-- 8. Buckets de Storage: visibilidad, tamaño máximo y MIME permitidos
-- ----------------------------------------------------------------------------
select
  id                                               as bucket_id,
  name                                             as bucket_name,
  public                                           as is_public,
  file_size_limit                                  as file_size_limit_bytes,
  allowed_mime_types                               as allowed_mime_types,
  created_at
from storage.buckets
order by name;

-- ----------------------------------------------------------------------------
-- 9. Migraciones registradas (solo si se usa supabase CLI)
-- ----------------------------------------------------------------------------
do $$
begin
  if to_regclass('supabase_migrations.schema_migrations') is not null then
    raise notice '=== MIGRACIONES REGISTRADAS (supabase_migrations.schema_migrations) ===';
    raise notice '%',
      (select string_agg(version || ' [' || to_char(inserted_at, 'YYYY-MM-DD HH24:MI') || ']', E'\n' order by version)
       from supabase_migrations.schema_migrations);
  else
    raise notice '=== MIGRACIONES REGISTRADAS: no existe supabase_migrations.schema_migrations ===';
    raise notice 'Este proyecto no usa migraciones CLI; los scripts SQL sueltos en /supabase se aplican manualmente.';
  end if;
end $$;
