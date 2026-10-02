-- ============================================================
-- S2 — RLS en profiles y properties (idempotente, re-ejecutable)
--
-- Objetivo: cerrar el acceso abierto. Sin RLS, cualquier usuario
-- con la key publishable lee/escribe TODO (hasta escalar a
-- superadmin). Esto habilita RLS + policies base sin romper
-- login/perfil/listados.
--
-- Requiere: security-001 (columna platform_role + is_superadmin()).
-- Entorno: DEV. Validar flujo de la app móvil MapU tras correr.
-- Ejecutar en: Dashboard → SQL Editor → Run (idempotente)
-- ============================================================

-- ---------- PROFILES ----------
alter table public.profiles enable row level security;

drop policy if exists "profiles own row select" on public.profiles;
create policy "profiles own row select"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

-- Lectura de perfiles ajenos: necesaria para métricas/contactos.
-- Mismo comportamiento que hoy (RLS apagada = lectura abierta).
drop policy if exists "profiles readable by authenticated" on public.profiles;
create policy "profiles readable by authenticated"
  on public.profiles for select
  to authenticated
  using (true);

-- Alta de perfil al registrarse (id del perfil = auth.uid()).
drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- El dueño edita SOLO su fila: bloquea escalar platform_role ajeno.
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Superadmin accede a todo (es la policy de security-001; se re-declara
-- aquí por claridad, drop+create es idempotente).
drop policy if exists "superadmin full access profiles" on public.profiles;
create policy "superadmin full access profiles"
  on public.profiles for all
  using (public.is_superadmin());

-- ---------- PROPERTIES ----------
alter table public.properties enable row level security;

-- Dueño ve sus propiedades (todas, incluido borrador/despublicadas).
drop policy if exists "properties own select" on public.properties;
create policy "properties own select"
  on public.properties for select
  to authenticated
  using (owner_id = auth.uid());

-- Visibilidad pública: solo activas (browsing/landing).
drop policy if exists "properties public select active" on public.properties;
create policy "properties public select active"
  on public.properties for select
  to anon, authenticated
  using (status = 'active');

drop policy if exists "properties insert own" on public.properties;
create policy "properties insert own"
  on public.properties for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "properties update own" on public.properties;
create policy "properties update own"
  on public.properties for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "properties delete own" on public.properties;
create policy "properties delete own"
  on public.properties for delete
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists "superadmin full access properties" on public.properties;
create policy "superadmin full access properties"
  on public.properties for all
  using (public.is_superadmin());
