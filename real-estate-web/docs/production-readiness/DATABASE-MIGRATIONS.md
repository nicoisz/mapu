# Database migrations — MapU (real-estate-web)

> Resuelve TASK-02. Consolida la base en migraciones reproducibles (Supabase CLI).
> Antes, el esquema vivía en scripts SQL sueltos que se corregían entre sí.

## Modelo: forward-only

- **Fuente de verdad**: `real-estate-web/supabase/migrations/` (archivos
  `NNNNNNNNNNNN_nombre.sql`, en orden lexicográfico).
- La migración base `20260904162725_remote_schema.sql` es un **dump del esquema
  real** (`supabase db pull`) — consolida los scripts históricos.
- **Forward-only**: nunca se edita una migración ya aplicada. Un error se
  corrige con una migración nueva, no con un `down`. No hay rollback
  automático; ver "Recuperación".
- Los scripts históricos viven en `supabase/legacy/` y **no** se ejecutan.

## Setup local

```bash
cd real-estate-web
npm ci
npm run db:start    # levanta Postgres local (Docker)
npm run db:reset    # aplica migraciones + seed sobre una base vacía
npm run db:types    # regenera src/types/database.generated.ts
npm run db:stop
```

> Puertos locales en `supabase/config.toml`: `55421` (api), `55422` (db),
> `55423` (studio). Desviados del default (`543xx`) para no chocar con otro
> proyecto Supabase local en la misma máquina.

## Migraciones en el día a día

1. `supabase migration new nombre_descripcion` → crea
   `supabase/migrations/<timestamp>_nombre.sql`.
2. Escribir el SQL. Idempotente no es obligatorio (se aplica una vez), pero
   `IF NOT EXISTS` / `IF EXISTS` evita problemas de re-runs.
3. Local: `npm run db:reset` (verifica que aplica desde vacío) +
   `npm run test:db`? (pgTAP: `supabase test db`).
4. `npm run db:types` y commitear los tipos regenerados si cambiaron.
5. Commit + PR. El workflow `DB` corre migraciones + smoke + diff de tipos.

## Despliegue (staging / producción)

- Al mergear a `main`, `deploy-migrations.yml` ejecuta `supabase db push --linked`
  (aplica solo las migraciones pendientes, registradas en
  `supabase_migrations.schema_migrations`).
- Requiere los secrets en el environment `env` (`SUPABASE_ACCESS_TOKEN`,
  `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_ID`).

## Backup antes de tocar un entorno remoto

```bash
# backup lógico del esquema + datos
supabase db dump --linked -f backup_$(date +%Y%m%d_%H%M%S).sql
```

El archivo de backup **no** se versiona (puede contener datos/PII). Guardarlo
fuera del repo.

## Recuperación / rollback operacional

- No hay `down` automático. Si una migración sale mal en staging/prod:
  1. **No** editar la migración ya aplicada.
  2. Crear una migración nueva que revierta el cambio puntual (forward-only).
  3. Si es crítico y no hay tiempo: restaurar desde el backup (`psql < backup`),
     y luego re-aplicar las migraciones pendientes.
- Preferir migraciones **aditivas y no destructivas** (evitar `DROP`, `CASCADE`,
  `TRUNCATE`). Los cambios destructivos deben ser explícitos y revisados.

## Migraciones con lock

- `ALTER TABLE ... ADD COLUMN` (sin `DEFAULT`) y `CREATE INDEX` (sin
  `CONCURRENTLY`) toman lock. Para tablas grandes usar:
  - `CREATE INDEX CONCURRENTLY` (no soportado dentro de una transacción, va en
    una migración sin `begin;`).
  - `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` sin default, luego
    `UPDATE` en pasos.
- Las migraciones de este proyecto son de esquema pequeño; no requieren
  estrategia de lock especial por ahora.

## Bootstrap de superadmin (seguro, sin PII versionada)

Nunca se promueve superadmin por correo hardcodeado en un archivo versionado.
Procedimiento manual (operador con acceso a SQL Editor):

```sql
-- Reemplaza <USER_ID> por el UUID del usuario a promover.
update public.profiles
   set platform_role = 'superadmin', updated_at = now()
 where id = '<USER_ID>';
```

- Es manual y auditado (queda en los logs de Supabase).
- Alternativa para automatizar sin PII: un secret de configuración protegido
  (p.ej. variable de entorno con el UUID del superadmin) leído por una
  edge function, no un archivo SQL versionado.
- El correo personal del dueño ya no debe aparecer en ningún script versionado
  (el viejo `add-superadmin.sql` está en `supabase/legacy/`).

## Tipos TypeScript

- `src/types/database.generated.ts` se genera desde el esquema local con
  `npm run db:types`.
- Está commitado. El workflow `DB` falla si el commit no coincide con lo que
  genera el esquema (migraciones desactualizadas).

## Tests de migración

- pgTAP en `supabase/tests/smoke.sql` (tablas, RPCs y datos del seed).
- Se ejecutan con `supabase test db` (requiere `supabase db start`).
- El workflow `DB` corre: `db start` → `db reset` → `test db` → diff de tipos.
  Una migración rota rompe el CI.

## Reglas heredadas de TASK-00/02

- No usar `select('*')` en servicios nuevos; columnas explícitas.
- No silenciar errores con `return []`/`return 0`/`catch {}`.
- `service_role` solo server-side (`src/lib/server/supabaseAdmin.ts`).
- Nada destructivo en producción sin revisión explícita.
