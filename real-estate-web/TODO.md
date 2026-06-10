# TODO — Análisis del proyecto MapU Real Estate

> Análisis consolidado del estado del proyecto: qué falta y qué mejorar.
> Fecha análisis: 2026-06-09 · Última actualización: 2026-06-10 (migración a Supabase)

## Veredicto general

~~MapU es un MVP frontend muy pulido, pero es un prototipo: no tiene backend.~~
**Actualización 2026-06-10:** el proyecto ahora usa **Supabase** como backend real (Postgres + Auth + Storage). Ver `supabase/schema.sql` y la sección "Setup Supabase" abajo.

---

## ⚙️ Setup Supabase

> **Nota 2026-06-10:** el proyecto (`zzzuiworclyxjhealjdz`) ya tenía el esquema de la app móvil
> (properties con columnas planas, profiles con trial/suscripción, payments con Mercado Pago,
> conversations/messages, price_alerts, property_views). La web se adaptó a ESE esquema.
> `supabase/schema.sql` quedó como documentación de referencia — **no ejecutar**.

- [x] Schema: ya existe (compartido con la app móvil) — no hay nada que crear.
- [ ] **Ejecutar `supabase/fix-auth-trigger.sql`** — el trigger de creación de perfiles está roto y bloquea TODO registro ("Database error saving new user").
- [ ] **Crear una cuenta** (web o app móvil) — el seed necesita ≥1 perfil como dueño de las propiedades demo.
- [ ] **Ejecutar `supabase/seed.sql`** en SQL Editor (15 propiedades demo, tag `demo-seed`; re-ejecutable).
- [ ] Opcional: en Auth → Sign In / Up, desactivar "Confirm email" si quieres login inmediato tras el registro.
- [ ] Opcional: configurar proveedores OAuth (Google/Facebook) en Auth → Providers.
- [ ] Al desplegar: definir `NEXT_PUBLIC_SITE_URL` (sitemap/robots) y las dos vars de `.env.example` en el hosting.
- [ ] Al desplegar: configurar SMTP propio (Resend/SES) en Auth → Emails — el SMTP integrado tiene límite de ~2-4 correos/hora (error `over_email_send_rate_limit`).

Diseño en profundidad de tipos de cuenta (organizaciones, reputación, métricas): ver **`docs/TIPOS-DE-CUENTA.md`**.

Oportunidades que abre el esquema móvil (tablas ya existentes, falta UI web):
- [ ] Mensajería real → `conversations` + `messages`
- [ ] Alertas de precio → `price_alerts`
- [ ] Premium/pagos → `payments` ya integra **Mercado Pago** (mp_preference_id)
- [ ] Notificaciones → `notifications`

---

## 🔴 Crítico (bloquea producción)

- [x] ~~No hay backend ni base de datos~~ → **Supabase**: `properties`, `profiles`, `favorites` con RLS; services reescritos (`propertyService`, `authService`, `favoritesService`) — 2026-06-10
- [x] ~~Autenticación simulada con credenciales en texto plano~~ → **Supabase Auth** (email/password + OAuth); `mockUsers.ts` eliminado — 2026-06-10
- [x] ~~No se pueden subir fotos~~ → **Uploader real** en `/publicar` con preview, foto principal, validación de tipo/tamaño y subida a Supabase Storage (`storageService.ts`) — 2026-06-10
- [x] ~~24 vulnerabilidades en dependencias~~ → Next.js 15.5.19 + override postcss → **0 vulnerabilidades** (`npm audit`) — 2026-06-10
- [ ] **Cero tests** y **cero CI/CD**. Pendiente: Vitest + Testing Library para services, Playwright E2E, GitHub Actions (lint + typecheck + build + test).

---

## 🟡 Funcionalidad incompleta (stubs)

- [x] ~~Dashboard: "Renovar" y "Eliminar" con alert()~~ → reales contra Supabase (renovar +30 días, eliminar con confirmación) — 2026-06-10
- [ ] **Perfil**: "Mejorar a Premium", Notificaciones, Idioma/moneda, Privacidad → siguen sin acción (requiere definir pasarela de pago).
- [ ] **Compartir**: `shareService` sin implementación real.

Features esperables que faltan:

- [ ] Agendar visita
- [ ] Comparador de propiedades
- [x] ~~Ordenar resultados~~ → selector en `/buscar` (recientes / precio ↑↓ / superficie) — 2026-06-10
- [ ] Paginación (la query ya soporta `limit/offset`; falta UI infinita o por páginas)
- [ ] Búsquedas guardadas / alertas
- [ ] Calculadora hipotecaria
- [ ] Mensajería real con el agente (hoy solo abre WhatsApp/teléfono)
- [ ] Tours 3D que promete el hero
- [ ] **Geocodificación** en /publicar: la dirección no se convierte a lat/lng (usa el centro de Santiago por defecto). Integrar Nominatim o similar.
- [ ] Editar una propiedad publicada (el service `updateProperty` ya existe; falta la página).

---

## 🟢 Hecho / sano

- TypeScript `strict`, arquitectura `services/` desacoplada.
- Responsive mobile-first + dark mode.
- Clustering de pines en el mapa (supercluster) + animaciones GSAP.
- [x] Zod validando el formulario de publicación — 2026-06-10
- [x] `error.tsx`, `not-found.tsx`, `loading.tsx` globales — 2026-06-10
- [x] `sitemap.ts` + `robots.ts` + Open Graph en detalle de propiedad — 2026-06-10
- [x] Favoritos: tabla en Supabase para usuarios + localStorage para anónimos (límite 3) con merge automático al iniciar sesión — 2026-06-10
- [x] Contador de vistas real (`increment_property_views` RPC) — 2026-06-10

---

## Roadmap restante (en orden sugerido)

1. Ejecutar schema.sql + seed.sql en Supabase (ver Setup arriba) y probar el flujo completo.
2. Tests (Vitest para mappers/services con mocks, Playwright E2E del flujo publicar→buscar→favorito) + CI en GitHub Actions.
3. Geocodificación de direcciones en /publicar.
4. Página de edición de propiedades.
5. Paginación/scroll infinito en /buscar.
6. Accesibilidad: aria-labels faltantes, audit con Lighthouse.
7. Prettier + Husky pre-commit.
8. Premium/pagos (definir pasarela: Mercado Pago / Stripe).
 