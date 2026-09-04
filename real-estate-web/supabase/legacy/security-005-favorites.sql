-- ============================================================
-- S5 — Favoritos: RLS + constraint único
--
-- Problemas que resuelve:
--   · FAVORITOS SIN RLS: sin `enable row level security` ni policies, cualquier
--     usuario con la key anon lee/escribe los favoritos de TODOS.
--   · Duplicados: sin constraint único (user_id, property_id), un doble-click
--     o race inserta filas repetidas (favoritesService lo manejaba a mano).
--
-- Requiere: nada nuevo (solo RLS base). Idempotente.
-- Ejecutar en: Dashboard → SQL Editor → Run.
-- ============================================================

alter table public.favorites enable row level security;

-- Cada usuario ve y gestiona solo sus favoritos.
drop policy if exists "favorites own select" on public.favorites;
create policy "favorites own select"
  on public.favorites for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "favorites own insert" on public.favorites;
create policy "favorites own insert"
  on public.favorites for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "favorites own delete" on public.favorites;
create policy "favorites own delete"
  on public.favorites for delete to authenticated
  using (user_id = auth.uid());

-- Unique (user_id, property_id): mata duplicados por race. Con on conflict
-- el service puede usar upsert en vez de check-then-insert.
drop index if exists favorites_user_property_unique_idx;
create unique index favorites_user_property_unique_idx
  on public.favorites (user_id, property_id);
