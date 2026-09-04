-- Hardening de publicación: idempotencia + límites de storage bucket.
-- R-02: idempotencia de POST /api/publish (doble clic/retry no duplica).
-- R-06: tamaño/MIME de fotos a nivel de bucket (ya no solo validación client-side).

-- 1) Columna de idempotencia. Nullable: filas legacy sin key no participan.
alter table public.properties
  add column if not exists client_request_id uuid;

-- Un único index (parcial): solo filas con client_request_id compiten por unicidad.
create unique index if not exists properties_client_request_id_key
  on public.properties (client_request_id)
  where client_request_id is not null;

-- 2) Límites del bucket property-images: 8 MB y solo imágenes permitidas por la web.
update storage.buckets
   set file_size_limit = 8388608,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif']::text[]
 where id = 'property-images';
