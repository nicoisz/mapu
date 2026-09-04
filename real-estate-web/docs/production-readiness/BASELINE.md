# Línea base verificable — MapU / real-estate-web (TASK-00)

> Evidencia de partida para el hardening de producción. No modifica lógica de
> negocio; solo registra el estado real del repositorio y de la base de datos.

## 1. Commit analizado

| Campo | Valor |
|-------|-------|
| Commit auditado | `de10e246658eff0d713c8c73bf10a4564675b16d` |
| Commit actual (HEAD) | `de10e246658eff0d713c8c73bf10a4564675b16d` |
| Rama de trabajo | `hardening/task-00-baseline` (creada desde `stingy-pug`) |
| Mensaje | Merge pull request #64 from nicoisz/fix/resenas-edge-cases |

**Diferencia vs auditoría:** NINGUNA. El commit auditado coincide exactamente
con HEAD (`git diff` entre ambos está vacío). La auditoría de referencia
apunta al estado vigente del repositorio.

## 2. Versión de toolchain

| Herramienta | Versión |
|-------------|---------|
| Node.js | v22.22.2 |
| npm | 10.9.7 |
| Next.js | 15.5.19 (declarado) |
| TypeScript | 5.x (declarado) |
| Vitest | 4.1.11 |

> Nota: el workflow de CI usa `node-version: 20`; el entorno local de línea
> base usó Node 22. Divergencia a revisar en el CI (ver riesgo R-12).

## 3. Comandos ejecutados y resultado real

Ejecutados desde `real-estate-web/` (con `npm ci` previo).

| Comando | Resultado | Detalle |
|---------|-----------|---------|
| `npm ci` | ✅ OK | 774 paquetes instalados. **9 vulnerabilidades** (1 low, 1 moderate, 7 high) reportadas por `npm audit`. |
| `npm run lint` | ✅ OK (exit 0) | Solo warnings. 4 directivas `eslint-disable` sin uso + deps de hooks + `<img>` sin `next/image` + fuentes. |
| `npm run typecheck` | ✅ OK | `tsc --noEmit` sin errores. |
| `npm test` | ✅ OK | 6 archivos / **54 tests** pasan (561ms). Warning de config loader nativo de Vite. |
| `npm run build` | ✅ OK | Build de producción correcto. 25 páginas estáticas + 2 dinámicas (`/api/publish`, `/propiedad/[id]`). |

**Fallos preexistentes:** ninguno que bloquee las validaciones. Se registran
como hallazgos (no atribuibles a esta task):
- `npm audit`: 9 vulnerabilidades (7 high) — el TODO.md declara "0
  vulnerabilidades" pero hoy ya no es cierto.
- Warnings de lint acumulados (ver apartado de riesgos).

## 4. Tests existentes y áreas sin cobertura

**Tests existentes (54):**

| Archivo | Cobertura |
|---------|-----------|
| `src/lib/__tests__/logic.test.ts` | `computePriceZones` (terciles, rent, GeoJSON), `easeOutElastic`, `scaleZoneGeometry`, `parseSearchText` |
| `src/lib/__tests__/propertyMapper.test.ts` | `parseImages` (string/objeto), `rowToProperty`, `propertyToRow` |
| `src/lib/__tests__/roles.test.ts` | `canManageRole` (jerarquía org) |
| `src/lib/__tests__/rut.test.ts` | `formatRut`, `validateRut` |
| `src/lib/__tests__/security.test.ts` | `safeRedirectPath` (open-redirect), `adminAccessStatus`, `canAccessAdmin` |
| `src/lib/__tests__/userMessages.test.ts` | `translateError`, `toUserMessage`, `rethrowUserError` |

**Áreas SIN cobertura (gaps):**
- `src/services/*` — toda la capa de servicios (auth, property, admin,
  favorites, metrics, organization, review, storage, payment) sin tests.
- `src/app/api/publish/route.ts` — el único API route, sin tests.
- `src/lib/server/supabaseAdmin.ts` — sin tests.
- `src/lib/errorLogging.ts`, `imageCompression.ts`, `priceZones.ts` — sin tests.
- Flujos de UI (publish→buscar→favorito) — sin E2E (Playwright pendiente en TODO).

## 5. APIs, RPCs, tablas y servicios relevantes

### APIs (Route Handlers de Next.js)

| Ruta | Método | Seguridad | Notas |
|------|--------|-----------|-------|
| `/api/publish` | POST | `service_role` + JWT re-validado | Único API route. Inserta en `properties`. |

### RPCs consumidas por la web

| RPC | Consumido en | Propósito |
|-----|--------------|-----------|
| `admin_list_users` | `adminService` | Lista usuarios (superadmin) |
| `admin_set_platform_role` | `adminService` | Cambia rol de plataforma |
| `admin_toggle_verified` | `adminService` | Marca email/licencia verificado |
| `set_member_role` | `adminService`, `organizationService` | Gestión jerárquica de miembros org |
| `get_own_profile` | `authService` | Perfil propio (SECURITY DEFINER) |
| `get_org_members` | `organizationService` | Miembros de una org |
| `find_user_for_org` | `organizationService` | Busca usuario por email |
| `increment_property_views` | `propertyService` | Incrementa vistas (fire-and-forget) |
| `get_owner_views` | `propertyService` | Serie de vistas del owner |
| `get_global_views` / `get_org_views` | `metricsService` | Métricas globales / por org |
| `admin_set_review_status` | `reviewService` | Modera reseñas |

### Tablas relevantes (esquema compartido con app móvil)

`profiles`, `properties`, `favorites`, `property_views`, `payments`,
`organizations`, `organization_members`, `reviews`, `error_logs`, más las no
usadas por la web (`notifications`, `conversations`, `messages`,
`price_alerts`).

### Servicios (`src/services/`)

`adminService`, `authService`, `contactService`, `favoritesService`,
`geocodingService`, `metricsService`, `organizationService`, `paymentService`,
`propertyService`, `reviewService`, `searchService`, `shareService`,
`storageService`.

### Seguridad (definiciones SQL en `supabase/`)

Los scripts `security-001` … `security-013` definen funciones
`SECURITY DEFINER` (`is_superadmin`, `get_own_profile`, `admin_*`,
`set_member_role`, `find_user_for_org`, `is_org_member`, `is_org_admin`,
`refresh_profile_rating`, `enforce_review_subject_is_owner`, `get_*_views`) y
policies RLS por tabla. El inventario ejecutable y read-only está en
`scripts/audit-supabase-security.sql`.

## 6. Diferencias encontradas respecto de la auditoría

| Ítem | Auditoría (referencia) | Estado real | Diferencia |
|------|------------------------|-------------|------------|
| Commit | `de10e246…` | `de10e246…` (HEAD) | Ninguna |
| Vulnerabilidades | "0 vulnerabilidades" (TODO.md 2026-06-10) | 9 (7 high) | Regresión vs doc |
| Migraciones | Supabase CLI | No hay `supabase/migrations/`, solo scripts sueltos | Sin migraciones versionadas |
| CI | "pendiente" (TODO.md) | `.github/workflows/ci.yml` existe y ejecuta install/typecheck/lint/test/build | Avance no reflejado en TODO.md |

## 7. Workflows de GitHub Actions

- Ubicación real: `.github/workflows/ci.yml` (única ruta descubrible por GitHub).
- Nombre: `CI`. Dispara en `pull_request` y `push` a `main`.
- Job `quality`: `npm ci` → typecheck → lint → test → build (Node 20).
- No hay workflows en rutas heredadas (`/.github` vs `/.github/workflows` es
  correcto; GitHub solo descubre `/.github/workflows/*.yml`).

## 8. Bloqueos / limitaciones

- **Sin acceso a Supabase** en este entorno: no se pudo ejecutar el inventario
  SQL contra una base real. El script `scripts/audit-supabase-security.sql`
  queda listo para ejecutar en local (`supabase start`) o staging, con
  instrucciones en su cabecera.
- No se levantó Supabase local: no existe `supabase/config.toml` ni carpeta de
  migraciones en el repo.
