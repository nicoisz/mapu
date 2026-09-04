# CI/CD — MapU (real-estate-web)

> Resuelve TASK-01 (CI). Antes, el CI vivía en `real-estate-web/.github/workflows/`
> y GitHub no lo descubría (solo lee `.github/workflows/` de la RAÍZ del monorepo).

## Workflows (raíz `.github/workflows/`)

| Workflow | Trigger | Qué hace |
|----------|---------|----------|
| `ci.yml` | `pull_request` + `workflow_call` | Gates: `npm ci` → format check → lint → typecheck → test:unit → build |
| `deploy.yml` | `push` a `main` (paths `real-estate-web/**`, `.github/workflows/**`) | Corre CI (reusable) y, si pasa, despliega a Cloudflare |
| `deploy-migrations.yml` | `push` a `main` (paths `real-estate-web/supabase/migrations/**`) | `supabase db push --linked` |

## Node y cache

- Node **22** en CI, deploy y local (unificado).
- `cache: npm` con `cache-dependency-path: real-estate-web/package-lock.json`.

## Separación validación / despliegue

- `deploy.yml` NO despliega por su cuenta: el job `deploy` depende de
  `needs: ci`, y `ci` es el workflow reusable `ci.yml`.
- `deploy.yml` usa `environment: env` (protegido) y nunca imprime secretos
  (solo se pasan como variables de entorno al comando de deploy).

## Comandos locales equivalentes

```bash
cd real-estate-web
npm ci
npm run format:check   # prettier --check
npm run lint           # eslint .
npm run typecheck      # tsc --noEmit
npm run test:unit      # vitest run
npm run build          # next build
```

## Branch protection (configurar en GitHub, Settings → Branches → Add rule)

Para la rama `main`:

1. **Require status checks to pass before merging** — marcar como *required*:
   - `CI / quality` (el check del workflow `ci.yml`; corre en cada PR).
2. **Require branches to be up to date before merging** (recomendado).
3. **Require a pull request before merging** (nunca push directo a `main`).

> No se configuró nada desde acá (sin permisos de admin del repo); hay que
> hacerlo manualmente. El nombre del check es `CI / quality` (workflow `CI`,
> job `quality`).

## Environments y secrets

- Environment `env` (para `deploy.yml`). Si se activa *required reviewers*,
  cada deploy a producción pide aprobación manual.
- Secrets de Actions: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_KEY`,
  `NEXT_PUBLIC_SITE_URL`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
  (deploy) y `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`,
  `SUPABASE_PROJECT_ID` (migraciones).

## Puntos de extensión (tasks futuras)

- `test:unit` → Vitest (hoy). Para **DB** (`test:db`) y **E2E** (`test:e2e`):
  agregar el script en `package.json` y un step en `ci.yml`. No se crearon
  jobs falsos que "siempre pasan".
