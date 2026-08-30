# Plan Beta — MapU Real Estate

> Plan de trabajo para llevar el sistema a beta. Basado en auditoría de código
> (2026-08-30). **No toca pagos** (integración Mercado Pago queda fuera de esta fase).
>
> Cada tarea: objetivo, archivos, verificación. Scripts SQL nuevos viven en
> `supabase/` numerados (idempotentes, para correr N veces en SQL Editor).

---

## Estado del proyecto (contexto)

- Next.js 15 App Router + Supabase (Postgres + Auth + Storage).
- **Todo client-side con key `anon`/publishable**; RLS es el único guardrail.
  Sin `app/api` (cero server routes), sin Edge Functions.
- Imágenes: Supabase Storage bucket **público** `property-images`, ruta
  `{userId}/{uuid}.{ext}`, sin compresión, servidas sin optimizar
  (`next.config.ts` → `images.unoptimized: true`).
- Pagos simulados (`paymentService`), UI `/mejorar` gated a superadmin.

---

## Fase 1 — Seguridad (bloqueante, primero)

Objetivo: cerrar fugas de datos y abusos. Todo depende de RLS, así que se
refuerza RLS. La seguridad debe seguir siendo la única frontera (por ahora no
se agregan server routes, ver Fase 7).

### 1.1 — Cerrar fuga de PII en `profiles`
**Problema:** `security-002.sql:26` — `profiles readable by authenticated using (true)`.
Cualquier usuario autenticado lee TODO perfil (email, teléfono, whatsapp,
licencia, suscripción).

**Fix:** `supabase/security-004-profiles-minimal.sql`
- Nueva policy de lectura para autenticados: solo columnas públicas
  (`id, name, avatar_url, rating, review_count, is_verified`).
- Exigir ser superadmin para leer columnas sensibles.
- PostgREST limita columnas por policy: exponer vista/helper o policy de
  `select` restringida. Validar que métricas/contactos/org no se rompan.

**Verificación:** test de RLS en `security.test.ts` (usuario A no puede leer
email de usuario B).

### 1.2 — RLS en `favorites` (CRÍTICO)
**Problema:** sin policies ni `enable row level security` (grep = 0). Con key
anon, cualquiera lee/escribe los favoritos de todos.

**Fix:** `supabase/security-005-favorites.sql`
- `enable row level security`.
- `select/insert/delete` solo del propio `user_id = auth.uid()`.
- Agregar **constraint único `(user_id, property_id)`** (mata duplicados por
  race de `favoritesService.ts:71`).
- Ajustar `favoritesService.mergeLocalToAccount` (hoy itera y tolera
  duplicados; con unique puede usar `upsert`).

**Verificación:** login como 2 usuarios, confirmar aislamiento; doble-click
favorito no duplica.

### 1.3 — RLS en `property_views`
**Problema:** sin `enable row level security` ni policy de insert en repo. El
fallback de `registerView` (`propertyService.ts:185`) inserta en silencio; si
RLS quedó deshabilitado, es expuesto y se puede inflar contadores.

**Fix:** `supabase/security-006-property-views.sql`
- `enable row level security` + policy de `insert` para autenticados.
- Mantener selects existentes (metrics-org).
- Decidir si anónimos pueden registrar vistas (recomendado: permitir insert
  anónimo sin RLS pesado, o dejarlo autenticado y eliminar el fallback).

**Verificación:** contar vistas reales; el RPC `increment_property_views` no se
rompe.

### 1.4 — Reforzar `reviews`
**Problema:**
- update policy sin `with check` → el autor puede re-asignar `author_id`
  (impersonar) o `subject_id` (manipular rating) (`reviews.sql:34`).
- unique `(author_id, subject_id, property_id)` con `property_id` nullable →
  nulls distintos → bypass, reseñas infinitas.

**Fix:** `supabase/security-007-reviews.sql`
- Añadir `with check (auth.uid() = author_id and status = 'published')` a la
  policy de update del autor (bloquear cambiar `author_id`/`subject_id`).
- Para moderación superadmin: policy aparte sin esos checks.
- `unique` → o `coalesce(property_id, id)` o `exclude`, o validar en el RPC.

**Verificación:** autor no puede reasignar su reseña a otro usuario.

### 1.5 — Limitar `error_logs`
**Problema:** `error-logs.sql:30` — insert `to public with check (true)`.
Cualquiera llena la tabla de basura.

**Fix:** reescribir policy de insert (idempotente):
- Solo autenticados, o
- mantener anónimo pero con columna `user_id` requerida y un límite de filas
  por hora (trigger o RPC).

**Verificación:** intentar insertar sin sesión → denegado (si se elige
autenticados).

### 1.6 — Blindar `find_user_for_org`
**Problema:** `metrics-org.sql:91` — RPC SECURITY DEFINER con `ilike %term%`
permite a un org_admin barrer emails.

**Fix:** exigir match exacto del dominio o mínimo de caracteres; devolver
`null` si el email completo no coincide; añadir límite estricto. Evaluar
quitar el wildcard.

### 1.7 — Hardcode superadmin idempotente
**Problema:** `security-001.sql:52` — `update ... where email='...'` no es
idempotente ni protegido; corre como quien ejecuta el SQL.

**Fix:** convertir a función/uso de `auth.uid()` o documentar como paso manual
único. No crítico, pero evita sorpresas al re-correr.

### 1.8 — Rate limiting
**Problema:** sin rate limiting propio (depende de defaults de Supabase Auth).

**Fix (provisional para beta):**
- Confirmar límites de Auth (brute force en login) del plan actual.
- Para publicar/cambiar rol: si se adoptan Edge Functions (Fase 7), aplicar
  rate ahí. Si no, mitigar por RLS + limits de query (ya hay `limit` en admin).

---

## Fase 2 — Errores en español (visible, rápido)

### 2.1 — Traducir errores crudos de services
**Problema:** `propertyService`, `searchService`, `adminService`,
`organizationService`, `reviewService`, `metricsService` lanzan
`new Error(error.message)` (mensaje PostgREST en inglés) que se muestra tal
cual en dashboard/publicar/admin.

**Fix:** crear `src/lib/userMessages.ts`:
- `translateError(message)` reutilizable (extender el de `authService.ts:41`).
- Mapeo de errores comunes PostgREST (RLS denied, not found, invalid uuid,
  unique violation, rate limit) → mensajes ES.
- Envolver los `catch`/lanzamientos de los services para emitir mensajes
  traducidos.

**Verificación:** `npm test`; forzar un error de RLS y ver mensaje en ES.

### 2.2 — Revisar formularios restantes
`RegisterForm` ya traduce vía AuthContext. Auditar errores de `perfil`,
`equipo`, admin pages (usan `e.message` crudo).

---

## Fase 3 — Imágenes: compresión antes de subir

### 3.1 — Helper de compresión client-side
**Por qué:** `next.config.ts` usa `images.unoptimized: true` (Workers no corre
Sharp). Compresión en el navegador reduce ancho de banda y costo de storage.

**Fix:** crear `src/lib/imageCompression.ts`:
- `compressImage(file): Promise<File>` usando canvas:
  - cargar a `<img>`, redimensionar a max ~1600px lado mayor (mantener ratio).
  - re-encode a WebP (fallback JPEG si no hay soporte) con calidad ~0.8.
  - devolver `File` nuevo (mismo nombre base, ext nuevo).
- Exif/orientación: usar `createImageBitmap` con `imageOrientation: 'from-image'`
  o `canvas` con redraw para respetar rotación (los celulares rotan fotos).
- No tocar imágenes < umbral (no re-encodear si ya pesan poco).

### 3.2 — Integrar en `publicar/page.tsx`
- En `addFiles()` (`publicar/page.tsx:275`): tras `validateImageFile`, pasar
  cada archivo por `compressImage` **antes** de armar preview/upload.
- Mantener límite de 10 fotos y tipo/tamaño.
- El upload (`storageService.uploadPropertyImages`) queda igual, recibe archivo
  ya comprimido.
- Considerar subir miniaturas (opcional): generar un thumb ~400px aparte.

**Verificación:** subir foto 8MB → ver tamaño final en storage y en red
(DevTools). Test unitario del helper (si ambiente jsdom permite canvas).

### 3.3 — RLS de storage (depende de 1.1-1.2)
**Problema:** bucket público sin scripts RLS en repo. Aunque es público para
lectura, el **upload/delete** debe restringirse al propio usuario.

**Fix:** `supabase/security-008-storage.sql`
- Bucket `property-images`:
  - read: público (anon).
  - insert/update: `auth.uid() = (storage.foldername(name))[1]` (path = uid).
  - delete: mismo check.
- Idempotente; validar que las rutas ya existentes (`{uid}/...`) sigan OK.

**Verificación:** usuario A no puede borrar/sobrescribir fotos de usuario B.

---

## Fase 4 — Escala / concurrencia

### 4.1 — Paginación en listados
**Problema:** `propertyService.getAll()` trae todas las activas sin paginación
(`propertyService.ts:18`). `/buscar` y mapa cargan todo; escala mal.

**Fix:**
- `searchProperties` ya soporta `limit/offset` (`:101-102`).
- Añadir scroll infinito o paginación en `/buscar`.
- `getAll()` → paginar o reemplazar por `searchProperties` con límite.

**Verificación:** con seed grande, el mapa/búsqueda no se cuelga; requests
limitados.

### 4.2 — Favorites unique
Depende de 1.2 (constraint ya incluido). Eliminar race.

### 4.3 — Geocoding con proveedor estable
**Problema:** Nominatim público (sin key, política de uso leve) → riesgo de
banned IP con muchos usuarios (`geocodingService.ts`).

**Fix (recomendado para beta):**
- Migrar a proveedor con key (Mapbox / Google / HERE) detrás de una variable
  de entorno.
- Como la app es client-side, la key debe ser restringida por dominio o mover
  la llamada a Edge Function.
- Alternativa mínima: mantener Nominatim con fallback + cola/limit client-side.

**Verificación:** autocompletar dirección en `/publicar` sin 429.

---

## Fase 5 — Registro (beta-blocker)

### 5.1 — Ejecutar `fix-auth-trigger.sql`
**Problema:** el trigger de `auth.users` que crea el perfil está roto → TODO
registro falla (`Database error saving new user`). Sin registro no hay beta.
(TODO.md lo marca pendiente.)

**Fix:**
- Correr `supabase/fix-auth-trigger.sql` en SQL Editor.
- Probar flujo registro → perfil creado → login end-to-end.
- Decidir confirmación de email (recomendado: mantenerla + SMTP, ver 5.2).

**Verificación:** crear cuenta nueva, ver fila en `profiles`.

### 5.2 — SMTP propio
**Problema:** SMTP integrado de Supabase tiene límite ~2-4 correos/hora
(error `over_email_send_rate_limit`) — insuficiente para beta con registros.

**Fix:** configurar Resend/SES en Auth → Emails en el dashboard.

---

## Fase 6 — Calidad / release

### 6.1 — CI/CD
**Fix:** GitHub Actions en cada PR: `lint` + `typecheck` + `build` + `test`.

### 6.2 — Tests
- Ampliar Vitest a services (auth/property/storage con mocks de supabase).
- Tests RLS (SQL) en `security.test.ts` para cada policy nueva.
- (E2E Playwright opcional, post-beta).

### 6.3 — Accesibilidad + Lighthouse
- aria-labels faltantes, audit con Lighthouse (TODO.md pendiente).

### 6.4 — Documentación de despliegue
- Definir `NEXT_PUBLIC_SITE_URL` en hosting (sitemap/robots).
- Vars `.env.example` en el hosting.

---

## Fase 7 — Defensa en profundidad (post-beta sugerido)

No bloquea beta (RLS ya protege), pero recomendado.

### 7.1 — Server-side validation (Edge Functions)
- Mover acciones sensibles (publicar, cambiar rol, favoritos) a Edge
  Functions o API routes con key `service_role` (server-side).
- Deja de depender solo del RLS del cliente.
- Enable rate limiting ahí.

### 7.2 — Limpieza de datos demo
- Revisar `seed.sql`, `public/*.jpg`, placeholders picsum/unsplash antes de
  producción.

---

## Checker de beta (resumen)

| Bloqueante | Tarea |
|---|---|
| ✅ necesario | 1.1 PII, 1.2 favorites, 1.4 reviews, 5.1 trigger registro |
| ✅ alto | 1.5 error_logs, 1.6 find_user, 2.1 errores ES, 3.1-3.3 imágenes, 4.1 paginación |
| 🟡 medio | 1.3 property_views, 1.8 rate, 3.2, 4.3 geocoding, 6.1 CI |
| 🟢 post | Fase 7, 6.3 accesibilidad |

## Orden de ejecución recomendado

1. Fase 1 (1.1 → 1.2 → 1.4 → 1.5 → 1.6 → 1.3 → 1.7 → 1.8)
2. Fase 5 (5.1, 5.2) — desbloquea registro para probar el resto
3. Fase 2 (errores ES)
4. Fase 3 (imágenes)
5. Fase 4 (escala)
6. Fase 6 (calidad)
7. Fase 7 (post-beta)
