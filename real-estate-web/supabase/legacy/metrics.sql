-- ============================================================
-- F4 — Métricas: vistas por día (serie temporal)
--
-- Ejecutar en: Dashboard → SQL Editor → Run
-- ============================================================

-- Vistas de una propiedad agrupadas por día (últimos N días).
create or replace function public.get_property_views(property_id uuid, days int default 30)
returns table (day date, count bigint)
language sql
stable
set search_path = public
as $$
  select
    created_at::date as day,
    count(*) as count
  from public.property_views
  where property_views.property_id = get_property_views.property_id
    and created_at >= now() - make_interval(days => days)
  group by created_at::date
  order by day;
$$;

-- Vistas de TODAS las propiedades de un owner agrupadas por día.
create or replace function public.get_owner_views(owner_id uuid, days int default 30)
returns table (day date, count bigint)
language sql
stable
set search_path = public
as $$
  select
    pv.created_at::date as day,
    count(*) as count
  from public.property_views pv
  join public.properties p on p.id = pv.property_id
  where p.owner_id = get_owner_views.owner_id
    and pv.created_at >= now() - make_interval(days => days)
  group by pv.created_at::date
  order by day;
$$;
