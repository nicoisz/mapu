-- ============================================================
-- S13 — Reseñas: 1 por propiedad + bloqueo de roles invertidos + rating fijo
--
-- Reglas:
--   · 1 reseña por (author, subject, property). Se puede reseñar al mismo
--     sujeto en OTRA propiedad, pero no dos veces en la misma.
--   · (#5) El sujeto de la reseña debe ser el dueño de la propiedad referida:
--     evita reseñar a alguien (p.ej. el comprador) bajo una propiedad que no
--     le pertenece (roles invertidos).
--   · (#6) El rating es inmutable tras crear: el autor solo puede editar el
--     comentario, no la puntuación (evita cambiar el promedio a posteriori).
--
-- Reemplaza el "una por sujeto" anterior. Requiere: reviews.sql + security-007.
-- Idempotente. Ejecutar en: Dashboard → SQL Editor → Run.
-- ============================================================

-- ---------- 1) Unique: 1 por (author, subject, property) ----------
-- Elimina el índice "una por sujeto" introducido antes.
drop index if exists public.reviews_one_per_subject_idx;

-- Único por (author, subject, property) para los casos con propiedad.
create unique index if not exists reviews_one_per_property_idx
  on public.reviews (author_id, subject_id, property_id);

-- Caso sin propiedad: único parcial (security-007) — un usuario no puede
-- reseñar dos veces al mismo sujeto sin contexto de propiedad.
create unique index if not exists reviews_one_per_target_idx
  on public.reviews (author_id, subject_id)
  where property_id is null;

-- ---------- 2) (#5) El sujeto debe ser dueño de la propiedad ----------
create or replace function public.enforce_review_subject_is_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_of uuid;
begin
  if new.property_id is not null then
    select p.owner_id into owner_of
      from public.properties p
     where p.id = new.property_id;
    if owner_of is null then
      raise exception 'Propiedad no encontrada';
    end if;
    if new.subject_id <> owner_of then
      raise exception 'Solo se puede reseñar al dueño de la propiedad';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists reviews_subject_must_be_owner on public.reviews;
create trigger reviews_subject_must_be_owner
  before insert or update on public.reviews
  for each row execute function public.enforce_review_subject_is_owner();

-- ---------- 3) (#6) Rating inmutable: el autor solo edita el comentario ----------
-- security-007 concedía update de (comment, rating). Se restringe a comment.
revoke update on table public.reviews from anon, authenticated;
grant update (comment) on table public.reviews to authenticated;
