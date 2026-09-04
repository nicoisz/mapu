# Registro de riesgos — MapU / real-estate-web (TASK-00)

> Matriz inicial de P0/P1 conocidos. Estado `open`, owner vacío, columna de PR
> para trazabilidad. No corrige nada aún; las tasks posteriores cierran un
> riesgo a la vez.

| ID | Sev | Categoría | Descripción | Ubicación | Estado | Owner | PR de cierre |
|----|-----|-----------|-------------|-----------|--------|-------|--------------|
| R-01 | P0 | Quotas | `/api/publish` no valida el límite del plan free (`FREE_PLAN_LISTINGS_LIMIT=3`). Cualquier usuario autenticado puede publicar ilimitadas propiedades. | `src/app/api/publish/route.ts` | open | — | — |
| R-02 | P0 | Idempotencia | `POST /api/publish` no es idempotente: doble clic/retry crea propiedades duplicadas. Sin idempotency key ni dedup. | `src/app/api/publish/route.ts` | open | — | — |
| R-03 | P0 | Manejo de errores | `countActiveListings` retorna `0` ante error de DB → la cuota se percibe como "sin publicaciones" y podría eludirse. Regla 8 (aparentar éxito). | `src/services/propertyService.ts:230` | open | — | — |
| R-04 | P0 | Tipos / cast | Cast inseguro `d as never` en `propertyToRow`. Violación regla 6; oculta error de diseño entre el esquema zod y el DTO de fila. | `src/app/api/publish/route.ts:85` | open | — | — |
| R-05 | P0 | Observabilidad | `registerView` y `flush()` de errorLogging tragan errores en silencio (`.then(()=>{}, ()=>{})`). Pérdida de métricas/logs sin señal. | `src/services/propertyService.ts:208`, `src/lib/errorLogging.ts:33` | open | — | — |
| R-06 | P0 | Storage | Límites de archivo (8MB, MIME) solo se validan en cliente (`validateImageFile`); **confirmado** por auditoría: `property-images` tiene `file_size_limit = NULL` y `allowed_mime_types = NULL`. Cualquier usuario autenticado puede subir tamaño/tipo arbitrario vía API directa. Riesgo de abuso/coste. | `src/services/storageService.ts`, bucket `property-images` | open | — | — |
| R-19 | P1 | Storage | Bucket `avatars` público, `file_size_limit = NULL`, `allowed_mime_types = NULL`, y no referenciado por la web (proviene de la app móvil). Sin tope de tamaño/tipo. | bucket `avatars` (Supabase) | open | — | — |
| R-07 | P1 | RLS / constraints | `favorites` sin UNIQUE en `(user_id, property_id)`. `check-then-insert` del service sufre condición de carrera → favoritos duplicados bajo concurrencia. | `supabase/schema.sql` (favoritos), `src/services/favoritesService.ts` | open | — | — |
| R-08 | P1 | Pagos | `payments` simulado / Mercado Pago sin integrar. Regla 12: no tratar pagos simulados como reales. Sin idempotencia ni webhook verificado. | `supabase/payments.sql`, `src/services/paymentService.ts` | open | — | — |
| R-09 | P1 | Datos sensibles | Email personal hardcodeado `nicolasignacio.sz@gmail.com` para asignar superadmin. Debe ser parámetro/env, no SQL versionado. | `supabase/add-superadmin.sql:15` | open | — | — |
| R-10 | P1 | Datos sensibles | Email personal `mapu.app.admin@gmail.com` en el User-Agent del geocoder (expone contacto en requests a Nominatim). | `src/services/geocodingService.ts:17` | open | — | — |
| R-11 | P1 | Datos sensibles | ID de proyecto `zzzuiworclyxjhealjdz` hardcodeado en docs/comentarios; debería provenir de env/config. | `supabase/schema.sql`, `TODO.md` | open | — | — |
| R-12 | P1 | CI / toolchain | CI usa Node 20, local Node 22 → resultados de build/lint potencialmente divergentes. | `.github/workflows/ci.yml` | open | — | — |
| R-13 | P1 | select('*') | `select('*')` en servicios admin (listProperties, listOrganizations, listErrorLogs, payments). No es superficie pública pero viola regla 7 para servicios revisados. | `src/services/adminService.ts` | open | — | — |
| R-14 | P1 | Quotas / abuso | `increment_property_views` sin rate-limiting ni protección contra inflado de vistas. | `src/services/propertyService.ts:208` | open | — | — |
| R-15 | P1 | Errores silenciados | `getViewsSeries` retorna `[]` ante error; métricas se muestran vacías como si fueran cero. | `src/services/propertyService.ts:237` | open | — | — |
| R-16 | P1 | Dependencias | 9 vulnerabilidades `npm audit` (7 high) pese a TODO que declara "0". | `package-lock.json` | open | — | — |
| R-17 | P1 | Migraciones | Sin migraciones versionadas (`supabase/migrations/`); scripts sueltos aplicados a mano, sin trazabilidad ni idempotencia garantizada. | `supabase/*.sql` | open | — | — |
| R-18 | P1 | Geocoder | Nominatim público sin protección server-side; throttle solo client-side. IP compartida puede ser baneada; coste/abuso sin control. | `src/services/geocodingService.ts` | open | — | — |

## Convenciones

- **Sev**: P0 (bloquea lanzamiento / pérdida o bypass de seguridad), P1 (alto,
  priorizar antes del lanzamiento público).
- **Estado**: `open` hasta que una task lo cierre con PR.
- **Owner**: se asigna al planificar la task de cierre.
- Cada cierre debe referenciar el ID (p.ej. "closes R-01") y actualizar la
  columna PR.
