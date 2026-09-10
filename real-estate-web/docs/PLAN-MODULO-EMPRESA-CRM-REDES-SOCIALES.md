# Módulo Empresa, CRM y Redes Sociales Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir MapU en una plataforma operativa para corredoras que centralice equipo, cartera, clientes, oportunidades, seguimiento, publicación social y captura de leads.

**Architecture:** Mantener Next.js como aplicación y API, Supabase/Postgres como fuente única de datos y RLS como frontera de aislamiento multiempresa. Las integraciones externas entran por adaptadores y webhooks idempotentes; las acciones lentas o reintentables se procesan mediante una outbox y una función programada, sin guardar tokens en el navegador.

**Tech Stack:** Next.js 15, React 19, TypeScript, Supabase/Postgres/RLS, Vitest, Zod, OpenNext sobre Cloudflare, Meta Graph API, Instagram API y un proveedor de IA accedido únicamente desde servidor.

**Spec:** `docs/PLAN-MODULO-EMPRESA-CRM-REDES-SOCIALES.md#product-specification`

## Global Constraints

- Cada dato empresarial nuevo debe incluir `organization_id` y quedar protegido por RLS; una organización nunca puede leer ni mutar datos de otra.
- `owner` y `admin` gestionan toda la organización; `agent` solo opera registros asignados o creados por él, salvo permisos explícitos posteriores.
- `properties.owner_id` conserva su significado actual; la asignación comercial se agrega mediante `assigned_agent_id` y no sobrescribe autoría histórica.
- Los tokens de Meta y otros proveedores se cifran en servidor, nunca se exponen al cliente y se revocan al desconectar una integración.
- Todo webhook y trabajo asíncrono usa identificadores idempotentes y deja trazabilidad de recepción, procesamiento, error y reintento.
- La IA solo redacta, resume, clasifica y propone; precio, ubicación, superficie, disponibilidad y características provienen de datos estructurados de MapU.
- La primera versión requiere aprobación humana antes de publicar o enviar mensajes. El piloto automático se habilita posteriormente mediante reglas configurables.
- Facebook Marketplace queda fuera del alcance hasta contar con una API o convenio comercial documentado y aprobado.
- Ninguna migración destructiva, seed ni envío a cuentas reales se ejecuta contra producción durante el desarrollo.
- Cada tarea termina con pruebas pertinentes y un commit independiente; antes de integrar una fase deben pasar `npm run test`, `npm run lint`, `npm run typecheck` y `npm run build`.

---

## Product Specification

### Promesa comercial

> Carga una propiedad una vez, distribúyela, capta automáticamente a los interesados desde tus redes, asígnalos a tu equipo y acompáñalos hasta el cierre sin perder conversaciones.

### Menú Empresa

| Entrada | Objetivo |
|---|---|
| Resumen | Propiedades activas, leads nuevos, visitas, tareas vencidas y rendimiento |
| Equipo | Empleados, invitaciones, roles, permisos y carga de trabajo |
| Clientes | Ficha única, necesidades, documentos, consentimientos e historial |
| Oportunidades | Pipeline nuevo → contactado → calificado → visita → negociación → ganado/perdido |
| Propiedades | Inventario empresarial, responsable, disponibilidad y calidad del aviso |
| Agenda | Visitas, tareas, llamadas y recordatorios |
| Bandeja | Formularios, mensajes, comentarios y consultas de todos los canales |
| Marketing | Borradores IA, calendario, publicación y estado por canal |
| Reportes | Conversión, fuentes, tiempos de respuesta y reportes para propietarios |
| Configuración | Marca, integraciones, reglas de asignación, plan y auditoría |

Las notificaciones se muestran como campana global y como elementos accionables dentro de Bandeja y Agenda; no son un módulo aislado sin contexto.

### Canales de captación

1. **Formulario MapU con enlace rastreable:** cada publicación social usa una URL con `source`, `campaign`, `social_publication_id` y `property_id` firmados por servidor.
2. **Meta Lead Ads:** el webhook `leadgen` registra el evento y recupera los datos autorizados mediante `leads_retrieval`.
3. **Messenger e Instagram Messaging:** un mensaje iniciado por la persona crea o actualiza el contacto, la conversación y la oportunidad.
4. **Comentarios:** se registran como interacción potencial; solo se convierten en lead cuando existe intención suficiente o una identificación/contacto autorizado.
5. **WhatsApp Business:** queda como fase posterior usando el mismo contrato de conversación y webhook.

### Qué hará la IA

- Generar textos distintos para Facebook e Instagram desde una propiedad versionada.
- Resumir conversaciones y extraer intención: comprar, arrendar, vender, agendar o consultar.
- Extraer criterios declarados como presupuesto, comuna, dormitorios y fecha estimada.
- Sugerir una respuesta y propiedades compatibles para revisión del corredor.
- Detectar propiedades con información incompleta y publicaciones sociales duplicadas.
- Priorizar seguimiento usando señales explicables; nunca descartar automáticamente a una persona por atributos sensibles.

### Entidades y relaciones

```text
organization
 ├─ organization_members
 ├─ properties ── assigned_agent_id
 ├─ contacts
│   ├─ contact_identities
│   └─ opportunities ── property_id? ── assigned_agent_id
│       ├─ activities
│       └─ conversations ── messages
 ├─ notification_events
 ├─ audit_events
 ├─ social_connections ── social_accounts
 │   └─ social_publications ── property_id
 └─ webhook_events / integration_jobs
```

### Matriz de permisos inicial

| Acción | Owner | Admin | Agent |
|---|---:|---:|---:|
| Ver resumen empresarial | Sí | Sí | Solo métricas propias |
| Invitar o retirar agentes | Sí | Sí | No |
| Gestionar administradores | Sí | No | No |
| Ver todos los clientes | Sí | Sí | Solo asignados/creados |
| Reasignar clientes y oportunidades | Sí | Sí | No |
| Ver todas las propiedades | Sí | Sí | Solo propias/asignadas |
| Crear borrador social | Sí | Sí | Propiedades propias/asignadas |
| Publicar o programar en redes | Sí | Sí | Solo si la organización lo habilita |
| Conectar o revocar Meta | Sí | Sí | No |
| Ver auditoría | Sí | Sí | Solo actividad propia |

### Estrategia de entrega

| Fase | Resultado vendible | Dependencia externa |
|---|---|---|
| 1. Base empresarial | Menú, equipo, permisos y asignación de cartera | Ninguna |
| 2. CRM operativo | Clientes, oportunidades, agenda, bandeja y formulario MapU | Ninguna |
| 3. Marketing asistido | Borradores IA, enlaces rastreables y publicación manual asistida | Proveedor IA |
| 4. Publicación Meta | OAuth, Facebook Page, Instagram profesional, programación y estados | App Review de Meta |
| 5. Captura Meta | Lead Ads, mensajes, comentarios y enrutamiento | Advanced Access de Meta |
| 6. Optimización | Reportes, SLA, automatizaciones y retroalimentación de conversiones | Volumen real para validar |

La fase 2 puede comercializarse aunque Meta todavía esté revisando permisos. La integración Meta debe lanzarse como beta hasta completar revisión, manejo de expiración de tokens y pruebas con cuentas autorizadas.

---

## File Map

### Existing files to modify

- `src/components/layout/AppSidebar.tsx`: navegación agrupada y badges de pendientes.
- `src/app/(app)/equipo/page.tsx`: reducir a gestión de equipo y mover cartera/resumen a rutas propias.
- `src/services/organizationService.ts`: contratos de configuración, invitaciones y asignaciones.
- `src/services/propertyService.ts`: lectura/escritura de `assigned_agent_id` sin cambiar `owner_id`.
- `src/lib/roles.ts`: capacidades empresariales reutilizables por UI y API.
- `src/types/user.ts`: preferencias y permisos empresariales persistidos.
- `src/app/api/publish/route.ts`: emitir evento transaccional después de crear una propiedad.
- `.env.example`: nombres de secretos sin valores reales.

### New application files

- `src/types/company.ts`: contratos de CRM, actividades, integraciones y publicaciones.
- `src/lib/companyPermissions.ts`: decisiones puras de autorización para UI y tests.
- `src/lib/leadAttribution.ts`: normalización, deduplicación y atribución.
- `src/lib/server/integrationCrypto.ts`: cifrado/autenticación de tokens.
- `src/lib/server/metaClient.ts`: adaptador único de Meta Graph API.
- `src/lib/server/socialCopyGenerator.ts`: generación estructurada y validada de textos.
- `src/services/companyCrmService.ts`: clientes, oportunidades y actividades.
- `src/services/inboxService.ts`: conversaciones, mensajes y notificaciones.
- `src/services/socialPublishingService.ts`: borradores, programación y estados.
- `src/app/(app)/empresa/layout.tsx`: shell y autorización de rutas empresariales.
- `src/app/(app)/empresa/page.tsx`: resumen empresarial.
- `src/app/(app)/empresa/equipo/page.tsx`: equipo e invitaciones.
- `src/app/(app)/empresa/clientes/page.tsx`: listado y filtros.
- `src/app/(app)/empresa/clientes/[id]/page.tsx`: ficha e historial.
- `src/app/(app)/empresa/oportunidades/page.tsx`: pipeline.
- `src/app/(app)/empresa/propiedades/page.tsx`: cartera y asignaciones.
- `src/app/(app)/empresa/agenda/page.tsx`: actividades y visitas.
- `src/app/(app)/empresa/bandeja/page.tsx`: conversaciones e interacciones.
- `src/app/(app)/empresa/marketing/page.tsx`: calendario y publicaciones.
- `src/app/(app)/empresa/reportes/page.tsx`: métricas empresariales.
- `src/app/(app)/empresa/configuracion/page.tsx`: marca e integraciones.
- `src/app/api/leads/capture/route.ts`: formulario público rastreable.
- `src/app/api/integrations/meta/connect/route.ts`: inicio de OAuth.
- `src/app/api/integrations/meta/callback/route.ts`: callback y selección de activos.
- `src/app/api/integrations/meta/webhook/route.ts`: verificación y recepción de webhooks.
- `src/app/api/social/drafts/route.ts`: generación de borradores.
- `src/app/api/social/publications/route.ts`: aprobación y encolado.

### New database and test files

- `supabase/migrations/20260910120000_company_crm.sql`: CRM, actividades, auditoría y asignaciones.
- `supabase/migrations/20260910130000_company_notifications.sql`: notificaciones, conversaciones y outbox.
- `supabase/migrations/20260910140000_social_integrations.sql`: conexiones, cuentas, publicaciones y webhooks.
- `supabase/functions/process-integration-jobs/index.ts`: consumidor programado de la outbox.
- `src/lib/__tests__/companyPermissions.test.ts`: matriz de permisos.
- `src/lib/__tests__/leadAttribution.test.ts`: atribución y deduplicación.
- `src/lib/__tests__/socialCopyGenerator.test.ts`: límites y hechos permitidos.
- `src/lib/__tests__/metaWebhook.test.ts`: firma, idempotencia y mapeo.
- `supabase/tests/company_rls.sql`: aislamiento empresarial y alcance por rol.

---

### Task 1: Freeze company contracts and permission rules

**Files:**
- Create: `src/types/company.ts`
- Create: `src/lib/companyPermissions.ts`
- Create: `src/lib/__tests__/companyPermissions.test.ts`
- Modify: `src/lib/roles.ts`

**Interfaces:**
- Produces: `CompanyCapability`, `OpportunityStage`, `LeadSource`, `canCompany(...)`.
- Consumes: `AppRole`, `OrgRole` and authenticated `User` from existing code.

- [ ] **Step 1: Write the failing permission matrix test**

```ts
expect(canCompany(owner, 'manage_integrations')).toBe(true)
expect(canCompany(admin, 'reassign_opportunity')).toBe(true)
expect(canCompany(agent, 'manage_integrations')).toBe(false)
expect(canCompany(agent, 'read_opportunity', { assignedTo: agent.id })).toBe(true)
expect(canCompany(agent, 'read_opportunity', { assignedTo: other.id })).toBe(false)
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npm run test -- src/lib/__tests__/companyPermissions.test.ts`

Expected: FAIL because `canCompany` and company contracts do not exist.

- [ ] **Step 3: Implement the minimum stable contracts**

```ts
export type OpportunityStage =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'visit'
  | 'negotiation'
  | 'won'
  | 'lost'

export type LeadSource =
  | 'mapu_form'
  | 'facebook_lead_ad'
  | 'facebook_message'
  | 'instagram_message'
  | 'instagram_comment'
  | 'manual'

export type CompanyCapability =
  | 'read_opportunity'
  | 'reassign_opportunity'
  | 'manage_team'
  | 'manage_integrations'
  | 'draft_social'
  | 'publish_social'
```

- [ ] **Step 4: Run the focused test**

Run: `npm run test -- src/lib/__tests__/companyPermissions.test.ts`

Expected: PASS with owner/admin/agent cases matching the approved matrix.

- [ ] **Step 5: Commit the contracts**

```bash
git add src/types/company.ts src/lib/companyPermissions.ts src/lib/__tests__/companyPermissions.test.ts src/lib/roles.ts
git commit -m "feat: define company crm permissions"
```

### Task 2: Add CRM and assignment schema with RLS

**Files:**
- Create: `supabase/migrations/20260910120000_company_crm.sql`
- Create: `supabase/tests/company_rls.sql`
- Modify: `src/services/propertyService.ts`
- Modify: `src/lib/propertyMapper.ts`
- Modify: `src/types/property.ts`

**Interfaces:**
- Produces: `contacts`, `contact_identities`, `opportunities`, `activities`, `audit_events`, `properties.assigned_agent_id`.
- Consumes: existing `organizations`, `organization_members`, `properties`, `is_org_member` and `is_org_admin`.

- [ ] **Step 1: Write SQL acceptance tests for tenant isolation**

Cover these identities: owner A, admin A, agent A1, agent A2 and owner B. Assert that owner/admin A see all A records, agent A1 sees only assigned/created records, and no A identity can access B.

Run: `supabase test db supabase/tests/company_rls.sql`

Expected: FAIL because CRM tables and policies do not exist.

- [ ] **Step 2: Create normalized CRM tables**

The migration creates UUID primary keys, timestamps, indexes and foreign keys with these required columns:

```sql
contacts(organization_id, created_by, assigned_agent_id, name, email, phone, consent_status)
contact_identities(organization_id, contact_id, provider, provider_subject)
opportunities(organization_id, contact_id, property_id, assigned_agent_id, source, stage, lost_reason)
activities(organization_id, opportunity_id, actor_id, kind, due_at, completed_at, notes)
audit_events(organization_id, actor_id, action, entity_type, entity_id, result, metadata)
```

Add unique indexes on `(organization_id, lower(email))` when email is present and `(organization_id, provider, provider_subject)` for social identities. Add indexes for assigned agent, stage, due date and property.

- [ ] **Step 3: Add RLS and server RPCs**

Create `create_or_merge_lead(...)`, `reassign_opportunity(...)`, `complete_activity(...)` and `remove_org_member(...)` as narrow RPCs. Each derives the actor from `auth.uid()`, validates organization membership and refuses cross-tenant identifiers. `remove_org_member(...)` revokes access atomically, preserves authorship, removes the former member as public contact and reassigns open properties/opportunities to an active member selected by owner/admin.

- [ ] **Step 4: Add property assignment mapping**

Expose `assignedAgentId?: string` while keeping existing `ownerId` behavior unchanged. Validate that the assigned user is an active member of the same organization.

- [ ] **Step 5: Run database and unit verification**

Run: `supabase test db supabase/tests/company_rls.sql`

Run: `npm run test -- src/lib/__tests__/propertyMapper.test.ts src/lib/__tests__/companyPermissions.test.ts`

Expected: all tests PASS, including cross-company denial.

- [ ] **Step 6: Commit CRM persistence**

```bash
git add supabase/migrations/20260910120000_company_crm.sql supabase/tests/company_rls.sql src/services/propertyService.ts src/lib/propertyMapper.ts src/types/property.ts
git commit -m "feat: add tenant-safe company crm schema"
```

### Task 3: Build the grouped Empresa navigation and route shell

**Files:**
- Modify: `src/components/layout/AppSidebar.tsx`
- Create: `src/app/(app)/empresa/layout.tsx`
- Create: `src/app/(app)/empresa/page.tsx`
- Create: `src/app/(app)/empresa/equipo/page.tsx`
- Create: `src/app/(auth)/invite/[token]/page.tsx`
- Create: `src/lib/__tests__/navigation.test.ts`
- Modify: `src/app/(app)/equipo/page.tsx`
- Modify: `src/services/organizationService.ts`

**Interfaces:**
- Produces: `/empresa/*` route hierarchy and reusable company route guard.
- Consumes: `getAppRole`, `canManageOrg`, current `organizationService` and company capabilities.

- [ ] **Step 1: Add navigation tests for each role**

Extract pure `getNavigationForRole(role)` and assert that ordinary users do not see Empresa, agents see operational entries, and owner/admin see configuration and integrations.

- [ ] **Step 2: Run the test and confirm failure**

Run: `npm run test -- src/lib/__tests__/navigation.test.ts`

Expected: FAIL because grouped navigation is not implemented.

- [ ] **Step 3: Implement the route shell and redirects**

Move the current team experience to `/empresa/equipo`; keep `/equipo` as a temporary redirect to preserve existing links. The shell blocks users without an active organization and displays a clear empty state.

- [ ] **Step 4: Implement the initial summary**

Reuse existing organization metrics: active properties, views, favorites, contacts and member breakdown. Keep future entries hidden until their implementation task is merged; never show functional-looking empty buttons.

- [ ] **Step 5: Complete the invitation and offboarding lifecycle**

Replace direct membership by email with the existing invitation-token flow. Owner/admin generates a seven-day link for an existing or future MapU user; `/invite/[token]` requires authentication, validates the invited email and accepts once. Removing a member calls `remove_org_member(...)` and requires the administrator to select the new responsible agent when open work exists.

- [ ] **Step 6: Verify routes and responsive sidebar**

Run: `npm run test -- src/lib/__tests__/navigation.test.ts`

Run: `npm run lint && npm run typecheck`

Expected: PASS with no inaccessible route exposed to an unauthorized role.

- [ ] **Step 7: Commit navigation**

```bash
git add src/components/layout/AppSidebar.tsx src/app/\(app\)/empresa src/app/\(app\)/equipo/page.tsx src/app/\(auth\)/invite src/services/organizationService.ts src/lib/__tests__/navigation.test.ts
git commit -m "feat: add company workspace navigation"
```

### Task 4: Deliver clients, opportunities and agenda

**Files:**
- Create: `src/services/companyCrmService.ts`
- Create: `src/app/(app)/empresa/clientes/page.tsx`
- Create: `src/app/(app)/empresa/clientes/[id]/page.tsx`
- Create: `src/app/(app)/empresa/oportunidades/page.tsx`
- Create: `src/app/(app)/empresa/agenda/page.tsx`
- Create: `src/app/(app)/empresa/propiedades/page.tsx`
- Create: `src/lib/opportunityTransitions.ts`
- Create: `src/lib/__tests__/opportunityTransitions.test.ts`

**Interfaces:**
- Produces: paginated CRM queries, stage transitions, assignment changes and activity completion.
- Consumes: Task 1 types and Task 2 RPCs.

- [ ] **Step 1: Write failing stage transition tests**

```ts
expect(canMoveOpportunity('new', 'contacted')).toBe(true)
expect(canMoveOpportunity('won', 'contacted')).toBe(false)
expect(canMoveOpportunity('lost', 'qualified')).toBe(false)
```

- [ ] **Step 2: Implement explicit transitions and service pagination**

Implement `canMoveOpportunity(from, to)` in `src/lib/opportunityTransitions.ts`. Use server-enforced page sizes, stable ordering by `updated_at DESC, id DESC`, search by normalized name/email/phone and filters for assignee, source, stage and overdue activity.

- [ ] **Step 3: Build the minimum usable screens**

Clients show identity and current opportunities; opportunity cards show property, source, stage, agent and next task; agenda shows overdue, today and upcoming. All mutations expose loading, success and user-readable error states.

- [ ] **Step 4: Test role visibility and transitions**

Run: `npm run test -- src/lib/__tests__/opportunityTransitions.test.ts src/lib/__tests__/companyPermissions.test.ts`

Run: `npm run lint && npm run typecheck`

Expected: PASS and agents cannot invoke reassignment through UI or direct RPC.

- [ ] **Step 5: Commit the CRM UI**

```bash
git add src/services/companyCrmService.ts src/app/\(app\)/empresa src/lib/opportunityTransitions.ts src/lib/__tests__/opportunityTransitions.test.ts
git commit -m "feat: add company clients pipeline and agenda"
```

### Task 5: Add notifications, inbox and transactional outbox

**Files:**
- Create: `supabase/migrations/20260910130000_company_notifications.sql`
- Create: `src/services/inboxService.ts`
- Create: `src/app/(app)/empresa/bandeja/page.tsx`
- Modify: `src/components/layout/AppSidebar.tsx`
- Create: `src/lib/__tests__/notificationRouting.test.ts`

**Interfaces:**
- Produces: `conversations`, `messages`, `notification_events`, `integration_jobs`, unread counts.
- Consumes: contacts and opportunities from Task 2.

- [ ] **Step 1: Write failing notification routing tests**

Assert that `lead_created` notifies the assignee, `lead_unanswered` also notifies owner/admin after the SLA, and retries with the same event key do not duplicate notifications.

- [ ] **Step 2: Create hardened tables and policies**

Use `provider_event_id` and `dedupe_key` unique constraints. Messages store direction, provider timestamp and delivery status. Notification reads are limited to `recipient_id = auth.uid()`; integration jobs are service-role only.

- [ ] **Step 3: Implement Bandeja and global unread badge**

Group by conversation, display channel and property, and provide filters for new, unassigned, unanswered and assigned to me. Marking read must be scoped to the authenticated recipient.

- [ ] **Step 4: Verify idempotency and isolation**

Run: `npm run test -- src/lib/__tests__/notificationRouting.test.ts`

Run: `supabase test db supabase/tests/company_rls.sql`

Expected: PASS with duplicate events producing one notification and one job.

- [ ] **Step 5: Commit communication persistence**

```bash
git add supabase/migrations/20260910130000_company_notifications.sql src/services/inboxService.ts src/app/\(app\)/empresa/bandeja/page.tsx src/components/layout/AppSidebar.tsx src/lib/__tests__/notificationRouting.test.ts
git commit -m "feat: add company inbox notifications and outbox"
```

### Task 6: Capture first-party leads through tracked MapU links

**Files:**
- Create: `src/lib/leadAttribution.ts`
- Create: `src/lib/__tests__/leadAttribution.test.ts`
- Create: `src/app/api/leads/capture/route.ts`
- Modify: `src/components/property/PropertyDetail.tsx`
- Modify: `src/services/shareService.ts`

**Interfaces:**
- Produces: signed attribution token and `POST /api/leads/capture`.
- Consumes: `create_or_merge_lead(...)` from Task 2.

- [ ] **Step 1: Write failing attribution tests**

Cover valid signature, expired signature, changed property ID, unknown source, repeated email with normalized casing and repeated phone with Chilean formatting.

- [ ] **Step 2: Implement signed links**

The server signs `{ organizationId, propertyId, socialPublicationId, source, campaign, expiresAt }`. The browser receives no organization authority from query parameters; the capture endpoint derives and verifies it from the signature.

- [ ] **Step 3: Implement lead capture with consent**

Validate with Zod, rate-limit by IP and property, persist consent text/version, merge duplicates inside the organization and create the first follow-up activity.

- [ ] **Step 4: Update property contact UX**

Offer a short form before external contact, preserve direct phone/WhatsApp when permitted, and record a lead only when the person submits or explicitly requests contact.

- [ ] **Step 5: Verify capture behavior**

Run: `npm run test -- src/lib/__tests__/leadAttribution.test.ts`

Run: `npm run lint && npm run typecheck`

Expected: PASS with tampered and expired links rejected and valid repeats merged.

- [ ] **Step 6: Commit first-party capture**

```bash
git add src/lib/leadAttribution.ts src/lib/__tests__/leadAttribution.test.ts src/app/api/leads/capture/route.ts src/components/property/PropertyDetail.tsx src/services/shareService.ts
git commit -m "feat: capture attributed property leads"
```

### Task 7: Connect Meta accounts securely

**Files:**
- Create: `supabase/migrations/20260910140000_social_integrations.sql`
- Create: `src/lib/server/integrationCrypto.ts`
- Create: `src/lib/server/metaClient.ts`
- Create: `src/app/api/integrations/meta/connect/route.ts`
- Create: `src/app/api/integrations/meta/callback/route.ts`
- Create: `src/app/(app)/empresa/configuracion/page.tsx`
- Modify: `.env.example`
- Create: `src/lib/__tests__/integrationCrypto.test.ts`

**Interfaces:**
- Produces: encrypted `social_connections`, selected `social_accounts`, Meta OAuth state verification.
- Consumes: `manage_integrations` capability from Task 1.

- [ ] **Step 1: Write crypto and OAuth state tests**

Assert authenticated encryption round-trip, rejection with the wrong key, one-time state use, expiry and organization mismatch.

- [ ] **Step 2: Add encrypted integration schema**

Connections contain provider, encrypted access token, token expiry, status and last error. Accounts contain external ID, type (`facebook_page` or `instagram_professional`), name and capabilities. Only service-role code can read encrypted token fields.

- [ ] **Step 3: Implement OAuth and asset selection**

Request only scopes used by enabled features. After callback, list manageable Pages and Instagram professional accounts, let owner/admin select assets and store the granted capability set.

- [ ] **Step 4: Add configuration UX**

Show connected account, permissions, expiration, last successful check and explicit disconnect. Disconnect revokes remote access when supported and deletes local credentials after auditing the action.

- [ ] **Step 5: Verify security boundaries**

Run: `npm run test -- src/lib/__tests__/integrationCrypto.test.ts src/lib/__tests__/companyPermissions.test.ts`

Run: `npm run lint && npm run typecheck`

Expected: PASS and no token appears in client props, logs or browser storage.

- [ ] **Step 6: Commit Meta connection**

```bash
git add supabase/migrations/20260910140000_social_integrations.sql src/lib/server/integrationCrypto.ts src/lib/server/metaClient.ts src/app/api/integrations/meta src/app/\(app\)/empresa/configuracion/page.tsx .env.example src/lib/__tests__/integrationCrypto.test.ts
git commit -m "feat: connect encrypted meta business accounts"
```

### Task 8: Generate, approve and publish social content

**Files:**
- Create: `src/lib/server/socialCopyGenerator.ts`
- Create: `src/services/socialPublishingService.ts`
- Create: `src/app/api/social/drafts/route.ts`
- Create: `src/app/api/social/publications/route.ts`
- Create: `src/app/(app)/empresa/marketing/page.tsx`
- Create: `supabase/functions/process-integration-jobs/index.ts`
- Modify: `src/app/api/publish/route.ts`
- Create: `src/lib/__tests__/socialCopyGenerator.test.ts`
- Create: `src/lib/__tests__/socialPublishing.test.ts`

**Interfaces:**
- Produces: draft → approved → queued → publishing → published/failed state machine.
- Consumes: selected social account, property snapshot, integration outbox and Meta adapter.

- [ ] **Step 1: Write failing content-boundary tests**

Given a property without parking or furnished status, assert that generated structured output cannot claim either. Assert per-channel text limits, at least one image, stable property revision and explicit CTA URL.

- [ ] **Step 2: Implement structured draft generation**

Send only the property fields required for copy. Validate model output with Zod and reject facts outside the supplied snapshot. Store prompt version, model identifier, generated copy, selected image IDs and property revision.

- [ ] **Step 3: Build approval and scheduling UI**

Allow channel-specific preview, photo order, regenerate, edit, approve, publish now or schedule. A property change after approval marks the draft stale and requires reconfirmation.

- [ ] **Step 4: Implement idempotent publisher**

The worker claims jobs with a lease, checks connection and property state, publishes through `metaClient`, records external IDs, retries transient errors with bounded backoff and moves permanent failures to `failed` with an actionable message.

- [ ] **Step 5: Emit property-created draft event**

After `/api/publish` commits a property, insert one deduplicated `social_draft_requested` event. Do not call Meta or the AI inside the property transaction.

- [ ] **Step 6: Verify the state machine**

Run: `npm run test -- src/lib/__tests__/socialCopyGenerator.test.ts src/lib/__tests__/socialPublishing.test.ts`

Run: `npm run lint && npm run typecheck`

Expected: PASS for success, retry, permanent failure, stale property and duplicate job cases.

- [ ] **Step 7: Commit social publishing**

```bash
git add src/lib/server/socialCopyGenerator.ts src/services/socialPublishingService.ts src/app/api/social src/app/\(app\)/empresa/marketing/page.tsx supabase/functions/process-integration-jobs src/app/api/publish/route.ts src/lib/__tests__/socialCopyGenerator.test.ts src/lib/__tests__/socialPublishing.test.ts
git commit -m "feat: add ai-assisted social publishing"
```

### Task 9: Ingest Meta Lead Ads safely

**Files:**
- Create: `src/app/api/integrations/meta/webhook/route.ts`
- Create: `src/lib/server/metaWebhook.ts`
- Create: `src/lib/__tests__/metaWebhook.test.ts`
- Modify: `supabase/functions/process-integration-jobs/index.ts`
- Modify: `src/services/inboxService.ts`

**Interfaces:**
- Produces: verified `leadgen` events and mapped CRM opportunities.
- Consumes: Meta adapter, webhook event table, integration outbox and `create_or_merge_lead(...)`.

- [ ] **Step 1: Write webhook verification tests**

Cover GET verification challenge, valid POST signature, invalid signature, duplicate provider event, unknown Page, disconnected organization and payload containing only `leadgen_id`.

- [ ] **Step 2: Implement fast webhook acknowledgement**

Verify signature against raw body, store the immutable event and return within the provider timeout. Do not fetch lead PII before acknowledging.

- [ ] **Step 3: Process lead details asynchronously**

Use the stored `leadgen_id` with `leads_retrieval`, map configured form fields, merge the contact, create an opportunity tied to campaign/ad/form/property mapping and add the response-SLA activity.

- [ ] **Step 4: Add field mapping and dead-letter UX**

Configuration shows unmapped fields and failed events without displaying tokens. Retrying reuses the same provider event ID and cannot create a duplicate opportunity.

- [ ] **Step 5: Verify with Meta test leads**

Run unit tests first, then use Meta's Lead Ads Testing Tool against a non-production Page and confirm webhook receipt, lead retrieval, CRM creation and deduplication.

Expected: one test submission creates one contact identity, one opportunity and one notification.

- [ ] **Step 6: Commit Lead Ads ingestion**

```bash
git add src/app/api/integrations/meta/webhook/route.ts src/lib/server/metaWebhook.ts src/lib/__tests__/metaWebhook.test.ts supabase/functions/process-integration-jobs/index.ts src/services/inboxService.ts
git commit -m "feat: ingest meta lead ads into company crm"
```

### Task 10: Ingest messages and comments into the unified inbox

**Files:**
- Modify: `src/lib/server/metaWebhook.ts`
- Modify: `src/lib/__tests__/metaWebhook.test.ts`
- Modify: `supabase/functions/process-integration-jobs/index.ts`
- Modify: `src/app/(app)/empresa/bandeja/page.tsx`
- Create: `src/lib/__tests__/socialIntent.test.ts`

**Interfaces:**
- Produces: social conversations, messages, potential interactions and suggested replies.
- Consumes: Tasks 5, 7 and 9 contracts.

- [ ] **Step 1: Add failing message/comment fixture tests**

Test Instagram message, Facebook Page message, Instagram comment, duplicate delivery, deleted comment, missing text, media-only message and unknown social account.

- [ ] **Step 2: Persist inbound conversations**

Upsert by `(organization_id, provider, provider_conversation_id)` and message ID. Link a property using the originating social publication or explicit tracked URL; leave the relation empty when evidence is insufficient.

- [ ] **Step 3: Classify intent without overclaiming**

Return `{ intent, confidence, extractedCriteria, suggestedReply }`. Low-confidence comments remain interactions and do not become clients. Messages with explicit property interest create or merge an opportunity.

- [ ] **Step 4: Add reply approval respecting provider windows**

Display remaining response eligibility, prevent replies outside the allowed window and require human approval. Record provider response ID and delivery status.

- [ ] **Step 5: Verify conversations and permissions**

Run: `npm run test -- src/lib/__tests__/metaWebhook.test.ts src/lib/__tests__/socialIntent.test.ts`

Run: `npm run lint && npm run typecheck`

Expected: PASS with duplicates ignored, uncertain comments not promoted and cross-company conversation reads denied.

- [ ] **Step 6: Commit unified social inbox**

```bash
git add src/lib/server/metaWebhook.ts src/lib/__tests__/metaWebhook.test.ts supabase/functions/process-integration-jobs/index.ts src/app/\(app\)/empresa/bandeja/page.tsx src/lib/__tests__/socialIntent.test.ts
git commit -m "feat: capture social conversations and comments"
```

### Task 11: Add routing, SLA and commercial reports

**Files:**
- Create: `src/lib/leadRouting.ts`
- Create: `src/lib/__tests__/leadRouting.test.ts`
- Create: `src/app/(app)/empresa/reportes/page.tsx`
- Modify: `src/app/(app)/empresa/page.tsx`
- Modify: `supabase/functions/process-integration-jobs/index.ts`

**Interfaces:**
- Produces: deterministic assignment, escalation events and aggregated business metrics.
- Consumes: contacts, opportunities, activities, social publications and notifications.

- [ ] **Step 1: Write deterministic routing tests**

Test property assignee first, then organization round-robin among active agents, exclusion of removed members, stable retry assignment and fallback to admin when no agent is active.

- [ ] **Step 2: Implement configurable routing**

Persist `property_owner`, `round_robin` or `manual` in organization settings. Assignment and cursor update occur in one database transaction.

- [ ] **Step 3: Implement SLA escalation**

Create `lead_unanswered` only when no outbound message or completed contact activity exists before the threshold. Escalation is idempotent and stops when an opportunity is won, lost or archived.

- [ ] **Step 4: Add decision-oriented reports**

Show lead count and conversion by source/agent/property, median first-response time, overdue follow-ups, publication success rate and properties with interest but no progress. Aggregates must respect organization and role scope.

- [ ] **Step 5: Verify metrics and race cases**

Run: `npm run test -- src/lib/__tests__/leadRouting.test.ts src/lib/__tests__/notificationRouting.test.ts`

Run: `supabase test db supabase/tests/company_rls.sql`

Expected: PASS with concurrent leads assigned once and reports excluding other tenants.

- [ ] **Step 6: Commit automation and reports**

```bash
git add src/lib/leadRouting.ts src/lib/__tests__/leadRouting.test.ts src/app/\(app\)/empresa/reportes/page.tsx src/app/\(app\)/empresa/page.tsx supabase/functions/process-integration-jobs/index.ts
git commit -m "feat: add lead routing sla and company reports"
```

### Task 12: Production readiness and phased release

**Files:**
- Modify: `docs/BETA-SETUP.md`
- Create: `docs/META-INTEGRATION-RUNBOOK.md`
- Create: `docs/release/evidencias/modulo-empresa-crm.md`
- Modify: `.env.example`

**Interfaces:**
- Produces: operational checklist, rollback steps, evidence and support procedure.
- Consumes: all prior tasks.

- [ ] **Step 1: Document exact configuration**

List callback URLs, webhook verification, required Meta scopes, secret ownership, token rotation, Edge Function schedule, rate limits, dead-letter recovery and disconnect procedure. Use example names only, never secret values.

- [ ] **Step 2: Execute complete automated verification**

Run: `npm run test`

Run: `npm run lint`

Run: `npm run typecheck`

Run: `npm run build`

Expected: all commands exit `0`.

- [ ] **Step 3: Execute tenant and integration acceptance**

Verify with synthetic organizations A/B: invitation, role changes, property assignment, lead form, deduplication, pipeline, SLA, Meta OAuth, draft, approval, publication, test Lead Ad, inbound message, comment and token revocation.

- [ ] **Step 4: Exercise failure and rollback**

Simulate expired token, Meta 429/5xx, invalid webhook signature, duplicated webhook, AI invalid output, stale property, worker restart and revoked member. Confirm no lost lead, duplicate post, leaked token or cross-tenant row.

- [ ] **Step 5: Roll out behind capabilities**

Enable in order: internal organization, selected pilot corredora, CRM general availability, social publishing beta, Lead Ads beta, messaging/comments beta. Each gate requires zero open P0/P1 defects, 100% pass of the synthetic acceptance flow, publication/job error rate below 2% over at least 100 operations, oldest ready job below 5 minutes and a named support owner recorded in the evidence document.

- [ ] **Step 6: Commit runbook and evidence**

```bash
git add docs/BETA-SETUP.md docs/META-INTEGRATION-RUNBOOK.md docs/release/evidencias/modulo-empresa-crm.md .env.example
git commit -m "docs: add company crm release runbook"
```

---

## Commercial Packaging Recommendation

| Plan | Included value |
|---|---|
| Empresa | Equipo, propiedades, clientes, pipeline, agenda e informes básicos |
| Growth | Empresa + textos con IA, enlaces rastreables, calendario y publicación en Facebook/Instagram |
| Pro | Growth + Lead Ads, bandeja unificada, SLA, informes para propietarios y futuros conectores a portales |

Cobrar una base por organización más usuarios activos, con una asignación mensual de IA incluida. Mantener transparentes los límites de propiedades y leads; no cobrar por lead capturado porque penaliza el éxito del cliente y vuelve impredecible el costo.

## Success Metrics

- Mediana de tiempo desde lead entrante hasta primera respuesta humana.
- Porcentaje de leads con una próxima actividad agendada.
- Tasa de contactos duplicados después de normalización.
- Conversión por fuente, propiedad y agente.
- Porcentaje de propiedades publicadas socialmente sin reingresar datos.
- Éxito y reintentos de publicaciones sociales.
- Leads perdidos por falta de asignación o incumplimiento de SLA.
- Agentes y organizaciones activos semanalmente que completan el ciclo lead-seguimiento.

## External Gates and References

- Meta App Review y Business Verification pueden retrasar las fases 4 y 5 independientemente de la preparación del código.
- Instagram permite publicar en cuentas profesionales, no en cuentas personales: <https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api>
- El acceso a conversaciones de Messenger/Instagram requiere permisos de Página/cuenta y Advanced Access para empresas de terceros: <https://www.postman.com/meta/messenger-platform-api/folder/22794852-255610cd-47f5-4f4d-b3fa-71aec360be9a>
- La recuperación de Lead Ads usa `leads_retrieval` y un flujo de webhooks: <https://developers.facebook.com/docs/marketing-api/guides/lead-ads/retrieving>
- Las versiones de API y nombres de permisos son entradas de liberación; confirmarlos nuevamente justo antes de App Review.
