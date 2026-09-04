-- ============================================================
-- S7 — Reseñas: cerrar manipulación + duplicados
--
-- Problemas que resuelve:
--   · La policy de update del autor no tenía `with check` → el autor podía
--     reasignar author_id (impersonar) o subject_id (manipular el rating de
--     otro) en su reseña.
--   · El unique (author_id, subject_id, property_id) con property_id NULL
--     se saltea (NULL != NULL en Postgres) → reseñas infinitas sobre el mismo
--     par sin propiedad.
--
-- Solución:
--   · Grants por columna: el autor solo edita comment/rating.
--   · Modación de status → RPC admin_set_review_status (solo superadmin).
--   · Índice único parcial para los casos sin propiedad.
--
-- Requiere: security-001 (is_superadmin). Idempotente.
-- Ejecutar en: Dashboard → SQL Editor → Run.
-- ============================================================

-- ---------- 1) Columna de grants: el autor solo edita comment/rating ----------
revoke all on table public.reviews from anon, authenticated;
grant select on table public.reviews to anon, authenticated;
grant insert (author_id, subject_id, organization_id, property_id, rating, comment, status)
  on table public.reviews to authenticated;
grant update (comment, rating) on table public.reviews to authenticated;

-- ---------- 2) Duplicados sin propiedad ----------
-- Un usuario no puede reseñar dos veces al mismo target sin propiedad.
drop index if exists reviews_one_per_target_idx;
create unique index reviews_one_per_target_idx
  on public.reviews (author_id, subject_id)
  where property_id is null;

-- ---------- 3) RPC: moderación de status (superadmin) ----------
create or replace function public.admin_set_review_status(review_id uuid, new_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'No autorizado';
  end if;
  if new_status not in ('published', 'flagged', 'removed') then
    raise exception 'Estado inválido';
  end if;
  update public.reviews set status = new_status, updated_at = now() where id = review_id;
end;
$$;

revoke execute on function public.admin_set_review_status(uuid, text) from public, anon;
grant execute on function public.admin_set_review_status(uuid, text) to authenticated;
