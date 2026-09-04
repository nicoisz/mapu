# Migraciones — flujo de despliegue a Supabase

> Resuelve R-17. Antes de este setup, los scripts `supabase/*.sql` se aplicaban
> a mano en el SQL Editor y nada se ejecutaba automáticamente.

## Cómo funciona

- Las migraciones viven en `real-estate-web/supabase/migrations/` (nombradas
  `NNNNNNNNNNNN_descripcion.sql`). El repo es un monorepo, así que el path real
  incluye el prefijo `real-estate-web/`.
- `.github/workflows/deploy-migrations.yml` (RAÍZ del monorepo, no en
  `real-estate-web/`) ejecuta `supabase db push --linked` con
  `working-directory: real-estate-web`, al hacer push a `main` cuando cambian
  archivos en `real-estate-web/supabase/migrations/**`.
- `supabase db push` aplica **solo** las migraciones nuevas (no registradas en
  `supabase_migrations.schema_migrations`) y las registra. Idempotente.

> GitHub Actions solo descubre workflows en `.github/workflows/` de la RAÍZ del
> repo. Un workflow en `real-estate-web/.github/workflows/` NO se ejecuta.

## Setup único (una sola vez, requiere acceso a la DB)

### 1. Baseline (¡obligatorio antes de la primera push!)

La DB ya tiene objetos creados manualmente. Hay que "baselinar" su estado actual
para que `db push` no intente recrear lo que ya existe:

```bash
# local, con la URL de conexión del proyecto (Dashboard → Database → Connection string)
npx supabase db pull --db-url "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"
```

Esto genera `supabase/migrations/<timestamp>_remote_schema.sql` con TODO el
esquema actual. Sin este paso, la primera `db push` fallará por conflictos
(objetos ya existentes).

> **Advertencia:** NO hacer `db push` antes de baselinar. Riesgo de romper
> producción (regla 17: nada destructivo en prod).

### 2. Secrets de GitHub (Settings → Secrets → Actions)

| Secret | Valor |
|--------|-------|
| `SUPABASE_ACCESS_TOKEN` | Personal access token (Dashboard → Account → Access tokens) |
| `SUPABASE_DB_PASSWORD` | Contraseña de la DB (Dashboard → Database) |
| `SUPABASE_PROJECT_ID` | Project ref (el `zzzuiworclyxjhealjdz` del proyecto) |

### 3. Opcional: probar local

```bash
npx supabase init            # genera supabase/config.toml (una vez)
npx supabase start           # Postgres local + Studio
npx supabase db reset        # aplica las migraciones sobre una DB vacía
```

## Flujo diario (posterior al baseline)

1. Crear `real-estate-web/supabase/migrations/<timestamp>_descripcion.sql`.
2. Commit + PR.
3. Al mergear a `main`, `deploy-migrations.yml` aplica la migración a la DB.

## Transición de scripts sueltos

Los scripts en `real-estate-web/supabase/*.sql` (aplicados a mano) quedan como
**referencia histórica**. Tras el baseline, todo cambio nuevo va como migración
en `real-estate-web/supabase/migrations/`, no como script suelto. Los scripts
legacy pueden eliminarse en una tarea de limpieza posterior.

## Validación recomendada por PR

Antes de mergear, verificar localmente o con dry-run:

```bash
npx supabase db push --linked --dry-run
```
