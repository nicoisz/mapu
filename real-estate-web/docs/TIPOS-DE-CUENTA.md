# Tipos de cuenta en MapU — Diseño en profundidad

> Documento de diseño: Particular · Corredor · Empresa, con equipos, branding,
> sistema de reputación y dashboard de métricas.
> Estado: propuesta post-MVP · Fecha: 2026-06-10
> Esquema de referencia: el compartido con la app móvil (`supabase/schema.sql`).

---

## 1. Situación actual

Hoy `user_type` (individual | agent | company) **solo es cosmético**: se elige al
registrarse y se muestra en el perfil, pero no cambia límites, campos ni UI.
La base de datos ya tiene cimientos sin usar: `profiles.company_name`,
`company_logo`, `license_number`, `rating`, `review_count`, además de
`conversations/messages`, `property_views` y `payments` (Mercado Pago).

**Insight clave del usuario:** un corredor con empleados y una empresa se parecen
más de lo que sugiere el formulario de registro. La diferencia real no es
"corredor vs empresa", sino **persona que publica a su nombre** vs
**organización con equipo, marca y reputación compartida**.

---

## 2. Los tres tipos, redefinidos

### 2.1 Particular (`individual`)
- **Quién es:** dueño directo que vende/arrienda su propiedad. 1–2 operaciones en su vida.
- **Qué necesita:** publicar fácil, recibir contactos, sentirse seguro.
- **Qué NO necesita:** equipo, branding, pipeline.
- **Señal de confianza:** badge **"Dueño directo"** + verificaciones (email/teléfono/identidad).
- **Límites:** plan gratuito acotado (hoy 3 publicaciones + trial 10 días).

### 2.2 Corredor (`agent`)
- **Quién es:** profesional independiente o con un equipo pequeño (1–10 personas).
  Su activo principal es **su reputación personal**.
- **Qué necesita:**
  - Acreditación visible (`license_number` → badge "Corredor verificado").
  - Página pública con su cartera, rating y reseñas.
  - Si tiene empleados: que publiquen **bajo su marca** (nombre + logo de la
    corredora visible en cada ficha), manteniendo el contacto del agente que atiende.
  - Métricas de gestión: tasa de respuesta, contactos por propiedad, tiempos.
- **Modelo:** un corredor *puede* crear una **organización** (ver §3). Corredor
  solo = organización de 1. Esto evita bifurcar la lógica.

### 2.3 Empresa (`company`)
- **Quién es:** inmobiliaria, constructora o corredora grande. Decenas de
  propiedades, varios agentes, marca consolidada.
- **Qué necesita:** todo lo del corredor, más:
  - Verificación formal (RUT empresa).
  - Administración de equipo con **roles** (dueño/admin/agente).
  - Vista consolidada: rendimiento por agente, cartera completa, embudos.
  - Branding fuerte: logo en tarjetas, página de empresa con catálogo.
- **Diferencia con corredor:** solo el tipo de verificación, el plan/precio y el
  volumen. La mecánica interna (organización + miembros) es **la misma**.

> **Decisión de diseño:** corredor y empresa convergen en una sola entidad
> `organization` con `type: brokerage | company`. La UI los presenta distinto,
> el modelo de datos no se duplica.

---

## 3. Organizaciones y empleados

### 3.1 Conceptos
- Una **organización** tiene nombre, logo, tipo, verificación y reputación propia.
- Un **miembro** es un perfil vinculado con un rol:

| Rol | Publicar | Editar propias | Editar de otros | Invitar/quitar miembros | Ver métricas del equipo | Editar marca/datos org |
|---|---|---|---|---|---|---|
| `owner` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `admin` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `agent` | ✅ | ✅ | ❌ | ❌ | solo las suyas | ❌ |

- Un perfil puede pertenecer a **una organización a la vez** (simplificación MVP;
  el modelo N:M queda soportado por la tabla puente si después se necesita).

### 3.2 Branding visible para los miembros (lo que pediste)
- Al iniciar sesión, un empleado ve **el logo y nombre de su organización** en el
  dashboard y navbar ("Trabajas en *Inmobiliaria Premium*").
- Cada propiedad publicada por un miembro muestra en la ficha:
  - **Marca de la organización** (logo + nombre + rating de la org) → confianza.
  - **Agente que atiende** (nombre, foto, contacto, su rating personal) → cercanía.
- En `PropertyCard`: badge pequeño con logo de la org en la esquina (como los
  portales grandes: la marca vende, el agente atiende).

### 3.3 Flujo de invitación
1. Owner/admin invita por email desde el dashboard de la org.
2. Se crea fila en `organization_members` con `status: invited`.
3. El invitado (con o sin cuenta previa) acepta → `status: active`.
4. Sus nuevas publicaciones quedan ligadas a la org (`properties.organization_id`).
5. Si se va de la org: sus propiedades históricas conservan la org con la que se
   publicaron (integridad histórica), las nuevas ya no.

### 3.4 Modelo de datos

```sql
create type org_type as enum ('brokerage', 'company');
create type org_role as enum ('owner', 'admin', 'agent');
create type member_status as enum ('invited', 'active', 'removed');

create table public.organizations (
  id              uuid primary key default gen_random_uuid(),
  type            org_type not null,
  name            text not null,
  logo_url        text,
  description     text,
  website         text,
  phone           text,
  license_number  text,          -- corredora: registro de corredor
  rut             text,          -- empresa: RUT verificable
  is_verified     boolean not null default false,
  rating          numeric,       -- agregado (ver §4)
  review_count    int not null default 0,
  created_by      uuid not null references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.organization_members (
  org_id      uuid not null references public.organizations(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        org_role not null default 'agent',
  status      member_status not null default 'invited',
  invited_by  uuid references public.profiles(id),
  invited_email text,            -- para invitar a quien aún no tiene cuenta
  joined_at   timestamptz,
  created_at  timestamptz not null default now(),
  primary key (org_id, user_id)
);

-- Las propiedades quedan ligadas a la org con la que se publicaron.
alter table public.properties
  add column organization_id uuid references public.organizations(id);
```

RLS (esencia):
- `organizations`: select público; update solo `owner` (y `admin` campos no-marca).
- `organization_members`: select para miembros de la misma org; insert/delete
  para owner/admin; cada quien puede salirse (`delete` su propia fila).
- `properties`: además del dueño, owner/admin de la org pueden update/delete
  las propiedades con su `organization_id`.

---

## 4. Sistema de reputación (rating + comentarios) — para todos

### 4.1 Principios
- **Todos son evaluables**: particulares, corredores, empresas y organizaciones.
  La gente quiere saber con quién trata, sea quien sea.
- **Solo evalúa quien tuvo contacto real**: una reseña requiere una
  `conversation` previa con el evaluado (o un evento de contacto registrado).
  Esto corta el spam y las reseñas falsas de raíz.
- **Doble nivel para organizaciones**: la reseña apunta al **agente** que atendió
  y suma también al agregado de su **organización** en ese momento.
- **Derecho a réplica**: el evaluado puede responder una vez, visible bajo la reseña.

### 4.2 Reglas
- Escala 1–5 estrellas + comentario (mín. 30 caracteres para que aporte).
- 1 reseña por (autor → evaluado → propiedad). Editable 30 días.
- Se publica de inmediato; botón "reportar" → cola de moderación (`flagged`).
- El rating mostrado usa **promedio bayesiano** (suaviza perfiles con 1-2 reseñas):
  `rating_mostrado = (C·m + Σratings) / (C + n)` con `m` = promedio global, `C` ≈ 5.
- Los agregados se cachean en `profiles.rating/review_count` (columnas que **ya
  existen**) y `organizations.rating/review_count`, actualizados por trigger.

### 4.3 Modelo de datos

```sql
create type review_status as enum ('published', 'flagged', 'removed');

create table public.reviews (
  id              uuid primary key default gen_random_uuid(),
  author_id       uuid not null references public.profiles(id),
  subject_id      uuid not null references public.profiles(id),     -- a quién evalúa
  organization_id uuid references public.organizations(id),         -- org del evaluado al momento
  property_id     uuid references public.properties(id),            -- contexto
  conversation_id uuid references public.conversations(id),         -- prueba de contacto
  rating          int not null check (rating between 1 and 5),
  comment         text not null check (char_length(comment) >= 30),
  reply           text,                                              -- respuesta del evaluado
  replied_at      timestamptz,
  status          review_status not null default 'published',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (author_id, subject_id, property_id),
  check (author_id <> subject_id)
);

-- Trigger: tras insert/update/delete recalcula profiles.rating/review_count
-- y organizations.rating/review_count (promedio bayesiano en una función SQL).
```

RLS: select público (status = published); insert solo si existe conversación
entre autor y evaluado; update del comment solo el autor (< 30 días); update de
`reply` solo el evaluado; nadie borra (solo moderación → `removed`).

### 4.4 Dónde se muestra
- **Ficha de propiedad**: estrellas junto al contacto (agente) y junto a la marca (org).
- **Página pública de perfil/organización**: listado completo de reseñas con
  respuesta, distribución por estrellas, propiedades activas.
- **Tarjeta `PropertyCard`**: estrellas compactas junto al badge de tipo de vendedor.
- **Resultados de búsqueda**: futuro filtro "solo vendedores 4★+".

---

## 5. Dashboard de métricas — para todos, escalado por tipo

### 5.1 Fuentes que ya existen en el esquema
| Métrica | Fuente |
|---|---|
| Vistas (serie temporal) | `property_views` (created_at por propiedad) |
| Favoritos | `favorites` / `properties.favorites_count` |
| Contactos | `properties.contacts_count`, `conversations` |
| Tiempo de respuesta | `messages` (gap primer mensaje → primera respuesta) |
| Reputación | `reviews` (§4) |

### 5.2 Qué ve cada uno
**Particular** (simple, por propiedad):
- Vistas últimos 7/30 días (mini-gráfico), favoritos, contactos.
- Comparativa: "tu propiedad recibe X% más/menos vistas que similares en tu comuna".
- Salud del aviso: días hasta expirar, completitud de la ficha, sugerencias.

**Corredor** (gestión personal):
- Todo lo anterior agregado por cartera.
- Embudo: vistas → favoritos → conversaciones → cierre (marcar vendida/arrendada).
- Tasa y tiempo de respuesta (impacta su rating visible).
- Evolución de su rating y últimas reseñas.

**Empresa / organización** (consolidado + por agente):
- KPIs de cartera completa y por agente (tabla comparativa: publicaciones,
  vistas, contactos, tasa de respuesta, rating).
- Distribución por comuna/tipo de propiedad.
- Rendimiento de la marca: rating org, share de vistas vs. periodo anterior.

### 5.3 Implementación
- **Fase 1 (barata):** queries directas + RPC `get_dashboard_metrics(p_user, p_org, p_days)`
  que devuelve JSON con los KPIs; gráficos con un sparkline simple (SVG propio o
  `recharts`). `property_views` ya da la serie temporal.
- **Fase 2 (si crece el volumen):** tabla `daily_property_stats` agregada por
  cron de Supabase (`pg_cron`), para no escanear `property_views` en cada carga.

---

## 6. Verificación y badges (transversal)

| Badge | Quién | Requisito |
|---|---|---|
| "Dueño directo" | Particular | automático |
| "Email verificado" | todos | `is_email_verified` (ya existe) |
| "Teléfono verificado" | todos | `is_phone_verified` (ya existe) |
| "Corredor verificado" | Corredor/org brokerage | `license_number` validado (manual al inicio) |
| "Empresa verificada" | Empresa/org company | RUT validado (manual al inicio) |
| ★ rating | todos | ≥ 3 reseñas |

La validación de licencias/RUT parte **manual** (cola en un admin interno o
incluso revisando en el dashboard de Supabase) — automatizar después.

---

## 7. Monetización por tipo (aprovecha `payments` + Mercado Pago ya existente)

| | Particular | Corredor | Empresa |
|---|---|---|---|
| Gratis | 3 avisos + trial 10 días | 5 avisos, 1 usuario | — (solo trial) |
| Plan pagado | "Destacar aviso" (puntual) | Pro: avisos ilimitados, página pública, métricas completas | Por **asientos** (seats): N agentes + todo lo Pro |
| Extras | — | destacados con descuento | destacados incluidos/mes |

El esquema `payments` (con `mp_preference_id`) ya soporta esto; faltaría solo el
flujo de checkout y un webhook.

---

## 8. Fases de implementación propuestas

| Fase | Alcance | Esfuerzo | Valor |
|---|---|---|---|
| **F1 — Identidad visible** | Campos condicionales en registro (license/empresa), badges en PropertyCard/Detail, página pública de perfil básica | S | Alto: confianza inmediata, 0 cambios de esquema (columnas ya existen) |
| **F2 — Reputación** | Tabla `reviews` + RLS + UI de reseñas y réplica + agregados en perfil | M | Alto: diferenciador clave vs. portales chilenos |
| **F3 — Organizaciones** | `organizations` + `organization_members` + invitaciones + branding en fichas y dashboard de miembros | M-L | Medio-alto: habilita corredoras/empresas reales |
| **F4 — Dashboard métricas** | RPC de KPIs + gráficos por tipo (particular → org) | M | Medio: retención de publicadores |
| **F5 — Planes y seats** | Checkout MP + límites por plan/tipo + webhook | M | Ingresos |

Orden recomendado: **F1 → F2 → F4-lite (vistas/contactos básicos) → F3 → F5**.
F2 antes que F3 porque el rating individual ya genera valor sin equipos, y el
modelo de reviews (§4) nace preparado para organizaciones.

### Fuera del MVP, explícitamente
Como bien intuyes, todo esto **escapa del MVP actual**. El MVP debe validar:
¿la gente publica y contacta? Nada de este documento bloquea eso. La única
decisión que conviene tomar *ahora* (porque es barata hoy y cara después) es
**F1**: capturar `license_number`/`company_name` en el registro según tipo,
para que cuando actives F2/F3 ya exista la data histórica.

---

## 9. Riesgos y decisiones abiertas

1. **Reseñas negativas tempranas**: con pocos usuarios, una reseña 1★ destruye un
   promedio. Mitigado con promedio bayesiano (§4.2) y mínimo de 3 reseñas para
   mostrar estrellas.
2. **Membresía única vs. múltiple**: un agente freelance podría trabajar para 2
   corredoras. El modelo lo soporta (tabla puente), la UI del MVP no debería.
3. **Migración de datos**: perfiles `agent`/`company` existentes con
   `company_name` poblado → script que les ofrezca crear su organización.
4. **Quién verifica licencias/RUT**: proceso manual al inicio; definir SLA.
5. **Reseñas a particulares**: ¿tiene sentido evaluar a alguien que vende una vez?
   Propuesta: sí, pero el badge "Dueño directo" + verificaciones pesa más que las
   estrellas en ese segmento.
