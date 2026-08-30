# Setup Beta — MapU Real Estate

Runbook de puesta en marcha para la versión beta. Paso a paso, en orden.
Cada script SQL es **idempotente** (se puede correr N veces).

---

## 1. Variables de entorno

Copia `.env.example` a `.env.local` y completa:

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_KEY` | key publishable (`sb_publishable_...`) |
| `NEXT_PUBLIC_GEOCODING_URL` | (opcional) Nominatim self-hosted/proxy; default público |
| `NEXT_PUBLIC_SITE_URL` | URL del hosting (sitemap/robots) |

En el hosting (Cloudflare) define las mismas `NEXT_PUBLIC_*`.

---

## 2. Ejecutar SQL en el dashboard (orden)

En Supabase → SQL Editor, en este orden:

1. `security-001-superadmin-idempotente.sql` — columna `platform_role` + `is_superadmin()`. **Ajusta el email** del dueño en la sección 4.
2. `security-002-rls-profiles-properties.sql` — RLS base en profiles/properties.
3. `organizations.sql` + `organizations-alter.sql` — multi-tenant (correlo aparte, ver nota del archivo).
4. `fix-rls-recursion.sql` — helpers `is_org_member`/`is_org_admin` sin recursión.
5. `security-003-org-hierarchy-visibility.sql` — jerarquía + visibilidad por rol.
6. `security-004-profiles-minimal.sql` — **crítico**: grants por columna (cierra fuga PII y escalada de rol) + RPCs.
7. `security-005-favorites.sql` — RLS + unique en favoritos.
8. `security-006-property-views.sql` — RLS + insert en vistas.
9. `security-007-reviews.sql` — grants + moderación vía RPC.
10. `security-008-error-logs-policy.sql` — log de errores solo autenticados.
11. `security-009-find-user-hardening.sql` — anti-enumeración de emails.
12. `security-010-storage.sql` — RLS del bucket `property-images`.

### Registro (beta-blocker)
13. `fix-auth-trigger.sql` — **imprescindible**: repara el trigger de creación de perfiles.
    Sin esto TODO registro falla (`Database error saving new user`).

### Datos y esquema de referencia
- `schema.sql` — **NO ejecutar**: es solo documentación del esquema compartido.
- `seed.sql` — datos demo (requiere ≥1 perfil como dueño).
- `error-logs.sql` / `metrics.sql` / `metrics-org.sql` / `payments.sql` / `reviews.sql` /
  `superadmin-rls.sql` / `add-superadmin.sql` — ya consolidados en los `security-0xx`; corre solo si no existen.

---

## 3. Auth y email

- **Confirmación de email**: mantener activada. Para login inmediato en dev se puede desactivar.
- **SMTP propio** (Auth → Emails): el SMTP integrado tiene límite ~2-4 correos/hora
  (`over_email_send_rate_limit`). Configura Resend o SES antes de abrir a usuarios.
- **OAuth** (Auth → Providers): Google/Facebook para login social.

---

## 4. Verificación end-to-end

1. Registrar cuenta nueva → ver fila creada en `profiles` (viaja el trigger reparado).
2. Confirmar email → login.
3. Publicar propiedad con 2 fotos (verificar compresión: tamaño menor en storage).
4. Ver propiedad en `/buscar` y en el mapa.
5. Favorito → confirmar que no duplica (unique).
6. Log de errores → forzar un error y verlo en `/admin/errores` (superadmin).
7. Panel admin: usuarios, propiedades, empresas, ingresos.

### Riesgos / pendientes antes de abrir a muchos usuarios
- Rate limiting real (hoy depende de defaults de Supabase). Ver Fase 7 del plan.
- Validación server-side de acciones críticas (publicar, roles). Ver Fase 7.
- Migrar geocoder a proveedor con key o self-hosted si el tráfico crece.
