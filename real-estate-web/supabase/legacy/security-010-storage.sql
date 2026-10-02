-- ============================================================
-- S10 — Storage: RLS sobre el bucket 'property-images'
--
-- Problema: el bucket es público para lectura (se usan URLs públicas), pero
-- upload/update/delete no tenían políticas verificables en el repo → riesgo
-- de que cualquier usuario sobrescriba o borre fotos de otros.
--
-- Path usado por storageService: `{auth.uid()}/{uuid}.{ext}`.
-- Solución: solo el dueño (primer componente del path = su uid) puede
-- insertar/actualizar/borrar; la lectura es pública.
--
-- Requiere: bucket 'property-images' ya existente. Idempotente.
-- Ejecutar en: Dashboard → SQL Editor → Run.
-- ============================================================

-- Lectura pública (para servir URLs públicas de las propiedades).
drop policy if exists "property-images public read" on storage.objects;
create policy "property-images public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'property-images');

-- Insert: solo el dueño, dentro de su carpeta.
drop policy if exists "property-images auth upload own" on storage.objects;
create policy "property-images auth upload own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Update: solo el dueño, dentro de su carpeta (path nuevo y viejo).
drop policy if exists "property-images auth update own" on storage.objects;
create policy "property-images auth update own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Delete: solo el dueño, dentro de su carpeta.
drop policy if exists "property-images auth delete own" on storage.objects;
create policy "property-images auth delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'property-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
