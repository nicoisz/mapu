-- Serie histórica de precio por sector.
--
-- La plusvalía necesita dos momentos en el tiempo; hoy la app solo tiene una
-- foto del presente. Esta tabla empieza a acumular esos momentos desde el
-- inventario propio, que es la única fuente que nadie puede copiar.
--
-- Migración puramente aditiva: crea una tabla nueva, no altera ninguna
-- existente. Ver docs/PLAN-MAPA.md (PR 4 y PR 22).

create table if not exists public.price_cell_snapshots (
  id                  uuid primary key default gen_random_uuid(),

  -- Mes del snapshot, siempre normalizado al día 1.
  period              date not null,

  -- Celda hexagonal "q:r", con el mismo bucketing axial que priceZones.ts,
  -- para que lo guardado y lo dibujado coincidan sin recalcular nada.
  cell_id             text not null,
  center_lat          double precision not null,
  center_lng          double precision not null,

  -- Nunca se mezclan operaciones ni monedas en una misma fila: un promedio
  -- que junta ventas con arriendos, o CLP con USD, no significa nada.
  operation           text not null check (operation in ('sale', 'rent')),
  currency            text not null,

  -- Precio por m², no precio absoluto: el absoluto mide sobre todo el tamaño
  -- de la propiedad, el de por m² mide la ubicación, que es lo que queremos
  -- seguir en el tiempo.
  price_per_m2_mean   numeric not null,
  -- Con n bajo, una propiedad atípica arruina el promedio. La mediana es la
  -- que se muestra; el promedio queda para diagnóstico.
  price_per_m2_median numeric not null,

  -- Cuántos avisos respaldan la celda. Sin esto el dato no se puede mostrar
  -- honestamente. Se guardan también las celdas con n bajo: filtrar al leer
  -- es reversible, no haber guardado no lo es.
  n                   integer not null check (n > 0),

  created_at          timestamptz not null default now(),

  -- Hace el insert idempotente: re-correr el job dentro del mismo mes
  -- actualiza la fila en vez de duplicarla.
  unique (period, cell_id, operation, currency)
);

create index if not exists price_cell_snapshots_period_idx
  on public.price_cell_snapshots (period desc);

create index if not exists price_cell_snapshots_cell_idx
  on public.price_cell_snapshots (cell_id, operation, period desc);

alter table public.price_cell_snapshots enable row level security;

-- Dato agregado por sector: no expone ningún aviso individual, así que se
-- puede leer sin sesión. Escribe solo el job, con service_role (que omite RLS).
drop policy if exists "price cell snapshots readable by anyone"
  on public.price_cell_snapshots;
create policy "price cell snapshots readable by anyone"
  on public.price_cell_snapshots
  for select
  to anon, authenticated
  using (true);
