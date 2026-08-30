# Checklist DB — Orden de ejecución y verificación

> Correr en Supabase → SQL Editor, en este orden. Cada script es **idempotente**
> (re-ejecutable). Rutas locales relativas a la carpeta `supabase/` del repo.

**Proyecto:** `zzzuiworclyxjhealjdz` · Dashboard: https://supabase.com/dashboard

---

## A. Base multi-tenant

| Orden | Archivo | Nota |
|---|---|---|
| Q1 | `security-001-superadmin-idempotente.sql` | Marca al dueño como superadmin (ajustar email). **Correr antes que Q8.** |
| Q2 | `security-002-rls-profiles-properties.sql` | RLS base |
| Q3 | `organizations.sql` | Si da "type org_type already exists" → **ya aplicado, omitir** (no idempotente) |
| Q4 | `organizations-alter.sql` | Idem Q3 |
| Q5 | `fix-rls-recursion.sql` | Si da "policy already exists" → **ya aplicado, omitir** |
| Q6 | `security-003-org-hierarchy-visibility.sql` | Idem |
| Q7 | `seed.sql` | *(opcional, datos demo)* |

> Q3–Q6 pueden no ser idempotentes (scripts legacy). El error "already exists"
> es inofensivo: el objeto ya está con la definición correcta. Saltear.

## B. Seguridad web — PR 56 (`security-004` a `security-011`)

| Orden | Archivo |
|---|---|
| Q8 | `security-004-profiles-minimal.sql` |
| Q9 | `security-005-favorites.sql` |
| Q10 | `security-006-property-views.sql` |
| Q11 | `security-007-reviews.sql` |
| Q12 | `security-008-error-logs-policy.sql` |
| Q13 | `security-009-find-user-hardening.sql` |
| Q14 | `security-010-storage.sql` (bucket `property-images`) |

## C. Limpieza legacy (app móvil en reinicio) — PR 56

| Orden | Archivo |
|---|---|
| Q15 | `security-011-drop-legacy-public-policies.sql` (dropea policies públicas + tablas móviles sin uso) |

## D. Registro (beta-blocker) — PR 60

| Orden | Archivo |
|---|---|
| Q16 | `fix-auth-trigger.sql` |

---

## Verificación

Después de correr todo, estos deben devolver los valores esperados:

```sql
-- Dependencias críticas presentes
select
  (select count(*) from pg_proc where proname='is_superadmin') as sup,
  (select count(*) from pg_proc where proname='get_own_profile') as own_profile,
  (select count(*) from pg_proc where proname='admin_list_users') as admin_list,
  (select count(*) from pg_indexes where indexname='favorites_user_property_unique_idx') as fav_unique
```
Esperado: `1 | 1 | 1 | 1`.

```sql
-- No deben quedar policies ALL abiertas a public salvo las superadmin gated
select tablename, policyname, cmd
from pg_policies
where roles::text like '%public%'
  and cmd != 'SELECT'
  and tablename != 'property_views'
order by tablename
```
Esperado: solo `superadmin full access organizations/profiles/properties` (gated por `is_superadmin()`).

```sql
-- Policies de favorites aisladas
select policyname, cmd from pg_policies where tablename='favorites';
```
Esperado: `favorites own select/insert/delete` (3), sin `favorites_own`.

---

## Después de la DB — para abrir beta

1. **Mergear PRs a `main`** (56 → 62). Los SQL ya están aplicados; el merge no re-ejecuta DB.
2. **Hosting Cloudflare — variables:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_KEY`
   - `NEXT_PUBLIC_SITE_URL` (sitemap/robots)
   - `SUPABASE_SERVICE_ROLE_KEY` (**secret server-only**, para `/api/publish`)
3. **Supabase → Auth → Emails:** SMTP propio (Resend/SES). El integrado limita ~2-4 correos/h (`over_email_send_rate_limit`).
4. **OAuth** (Auth → Providers): Google/Facebook (opcional).

## Test end-to-end

1. Registrar cuenta nueva → perfil creado (verifica trigger Q16).
2. Confirmar email → login.
3. Publicar propiedad con 2 fotos → compresión + `/api/publish` (owner lo impone el servidor).
4. Verla en `/buscar` y el mapa.
5. Favorito 2 veces → no duplica (unique `favorites_user_property_unique_idx`).
6. `/admin/errores` → forzar error y verlo (solo superadmin lee).
7. Admin usuarios → lista via RPC `admin_list_users`.

## Riesgos / pendientes post-beta

- Rate limiting real (hoy depende de defaults de Supabase). Ver Fase 7 plan.
- Geocoder: migrar a proveedor con key o self-hosted si crece el tráfico.
