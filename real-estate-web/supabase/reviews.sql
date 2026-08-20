-- ============================================================
-- F2 — Reseñas (reputación)
--
-- Ejecutar en: Dashboard → SQL Editor → Run
-- ============================================================

create type public.review_status as enum ('published', 'flagged', 'removed');

create table public.reviews (
  id              uuid primary key default gen_random_uuid(),
  author_id       uuid not null references public.profiles(id),
  subject_id      uuid not null references public.profiles(id),   -- a quién evalúa
  organization_id uuid references public.organizations(id),       -- org del evaluado al momento
  property_id     uuid references public.properties(id),
  rating          int not null check (rating between 1 and 5),
  comment         text not null check (char_length(comment) >= 10),
  status          review_status not null default 'published',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (author_id, subject_id, property_id),
  check (author_id <> subject_id)
);

alter table public.reviews enable row level security;

create policy "reviews readable by all"
on public.reviews for select
using (status = 'published' or public.is_superadmin());

create policy "users can insert reviews"
on public.reviews for insert to authenticated
with check (auth.uid() = author_id and status = 'published');

create policy "author can edit own review"
on public.reviews for update to authenticated
using (auth.uid() = author_id);

-- Superadmin modera (flag/remove).
create policy "superadmin moderates reviews"
on public.reviews for update to authenticated
using (public.is_superadmin());

-- Agregado: rating promedio en profiles (promedio simple por ahora).
create or replace function public.refresh_profile_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles p
  set rating = (
    select round(avg(r.rating)::numeric, 1)
    from public.reviews r
    where r.subject_id = p.id and r.status = 'published'
  ),
  review_count = (
    select count(*) from public.reviews r
    where r.subject_id = p.id and r.status = 'published'
  )
  where p.id = coalesce(new.subject_id, old.subject_id);
  return null;
end;
$$;

create trigger reviews_update_profile_rating
after insert or update or delete on public.reviews
for each row execute function public.refresh_profile_rating();
