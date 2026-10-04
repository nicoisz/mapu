-- Private interest matrices; one database scoring function for cards, badges and demand.
begin;

create or replace function public.valid_interest_filters(f jsonb) returns boolean
language plpgsql immutable set search_path = public as $$
declare k text; a jsonb; n numeric;
begin
  if f is null or jsonb_typeof(f) <> 'object' or f->'version' is distinct from '1'::jsonb
     or not coalesce(f->>'operation' in ('sale','rent'),false) or not coalesce(f->>'currency' in ('CLP','USD'),false)
     or not (f ?& array['version','operation','types','communes','alternativeCommunes','currency','budgetFlexibility','features','required']) then return false; end if;
  if exists(select 1 from jsonb_object_keys(f) key where key not in
    ('version','operation','types','communes','alternativeCommunes','currency','budgetFlexibility','maxPrice','minArea','minBedrooms','minBathrooms','features','required')) then return false; end if;
  if jsonb_typeof(f->'budgetFlexibility') <> 'number' or (f->>'budgetFlexibility')::numeric not in (0,10,20,30) then return false; end if;
  foreach k in array array['types','communes','alternativeCommunes','features','required'] loop
    a := f->k;
    if jsonb_typeof(a) <> 'array' or jsonb_array_length(a) > 50 then return false; end if;
    if exists(select 1 from jsonb_array_elements(a) v where jsonb_typeof(v)<>'string' or length(btrim(v#>>'{}')) not between 1 and 80) then return false; end if;
    if (select count(*) from jsonb_array_elements(a)) <> (select count(distinct v) from jsonb_array_elements(a) v) then return false; end if;
  end loop;
  if jsonb_array_length(f->'types') not between 1 and 6 or exists(select 1 from jsonb_array_elements_text(f->'types') v where v not in ('house','apartment','land','office','commercial','warehouse')) then return false; end if;
  if exists(select 1 from jsonb_array_elements_text(f->'alternativeCommunes') v where f->'communes' ? v) or
     (jsonb_array_length(f->'alternativeCommunes') > 0 and jsonb_array_length(f->'communes')=0) then return false; end if;
  if exists(select 1 from jsonb_array_elements_text(f->'features') v where v not in
    ('has_garden','has_pool','has_gym','has_security','has_elevator','has_balcony','has_terrace','has_air_conditioning','has_heating','pet_friendly','furnished','new_construction','parking')) then return false; end if;
  foreach k in array array['maxPrice','minArea','minBedrooms','minBathrooms'] loop
    if f ? k then
      if jsonb_typeof(f->k) <> 'number' then return false; end if;
      n := (f->>k)::numeric;
      if n <= 0 or n > (case when k='maxPrice' then 1000000000000 when k='minArea' then 1000000 else 100 end) then return false; end if;
      if k in ('minBedrooms','minBathrooms') and n<>trunc(n) then return false; end if;
    end if;
  end loop;
  if (f ? 'minBedrooms' or f ? 'minBathrooms') and not (f->'types' ?| array['house','apartment']) then return false; end if;
  for k in select jsonb_array_elements_text(f->'required') loop
    if k='types' then continue;
    elsif k='communes' and jsonb_array_length(f->'communes')>0 then continue;
    elsif k in ('maxPrice','minArea','minBedrooms','minBathrooms') and f ? k then continue;
    elsif f->'features' ? k then continue;
    else return false; end if;
  end loop;
  return true;
exception when others then return false;
end $$;

create table public.property_interests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  filters jsonb not null check (public.valid_interest_filters(filters)),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  effective_at timestamptz not null default now()
);
create index property_interests_user_active_idx on public.property_interests(user_id) where is_active;
alter table public.property_interests enable row level security;
create policy interests_own on public.property_interests for all to authenticated
  using(user_id=auth.uid()) with check(user_id=auth.uid());
revoke all on public.property_interests from anon, authenticated;
grant select, delete on public.property_interests to authenticated;
grant insert(user_id,filters,is_active), update(filters,is_active) on public.property_interests to authenticated;
grant all on public.property_interests to service_role;

create or replace function public.touch_property_interest() returns trigger
language plpgsql set search_path=public as $$
begin
  new.updated_at := clock_timestamp();
  if new.filters is distinct from old.filters or (new.is_active and not old.is_active) then
    new.effective_at := clock_timestamp();
  end if;
  return new;
end $$;
create trigger property_interest_updated before update on public.property_interests
for each row execute function public.touch_property_interest();
alter table public.profiles add column interest_matches_seen_at timestamptz;

-- Internal-only: no client can supply somebody else's interest to extract it.
create or replace function public.score_property_interest(p public.properties, f jsonb)
returns table(score integer, reasons jsonb)
language plpgsql stable set search_path=public as $$
declare
  points numeric := 0; weights numeric := 0; partial boolean := false;
  fraction numeric; value numeric; minimum numeric; price_value numeric; maximum numeric; flexible numeric;
  key text; column_name text; count_group integer; sum_group numeric; actual jsonb;
  criteria jsonb := '[]'; required jsonb := f->'required'; row_data jsonb := to_jsonb(p);
begin
  if p.status::text <> 'active' or p.published_at is null or p.published_at > now()
     or (p.expires_at is not null and p.expires_at < now()) or p.operation::text <> f->>'operation' then return; end if;
  fraction := case when f->'types' ? p.type::text then 1 else 0 end;
  if fraction=0 and required ? 'types' then return; end if;
  points := fraction*25; weights := 25; partial := fraction<1;
  criteria := criteria || jsonb_build_array(jsonb_build_object('key','types','status',case when fraction=1 then 'meets' else 'differs' end));

  if jsonb_array_length(f->'communes')>0 then
    if f->'communes' ? p.address_commune then fraction:=1;
    elsif f->'alternativeCommunes' ? p.address_commune and not (required ? 'communes') then fraction:=0.6;
    else return; end if;
    points:=points+25*fraction; weights:=weights+25; partial:=partial or fraction<1;
    criteria:=criteria || jsonb_build_array(jsonb_build_object('key','communes','status',case when fraction=1 then 'meets' else 'differs' end));
  end if;
  if f ? 'maxPrice' then
    if p.currency::text <> f->>'currency' then return; end if;
    price_value:=case when p.operation::text='rent' then p.monthly_rent else p.price end;
    maximum:=(f->>'maxPrice')::numeric;
    flexible:=maximum*(1+case when required ? 'maxPrice' then 0 else (f->>'budgetFlexibility')::numeric/100 end);
    if price_value is null or price_value<=0 or price_value>flexible then return; end if;
    fraction:=case when price_value<=maximum then 1 else 1-0.5*(price_value-maximum)/(flexible-maximum) end;
    points:=points+25*fraction; weights:=weights+25; partial:=partial or fraction<1;
    criteria:=criteria || jsonb_build_array(jsonb_build_object('key','maxPrice','status',case when fraction=1 then 'meets' else 'differs' end));
  end if;
  count_group:=0; sum_group:=0;
  foreach key in array array['minArea','minBedrooms','minBathrooms'] loop
    if not (f ? key) or (key<>'minArea' and p.type::text not in ('house','apartment')) then continue; end if;
    column_name:=case key when 'minArea' then 'area' when 'minBedrooms' then 'bedrooms' else 'bathrooms' end;
    value:=(row_data->>column_name)::numeric; minimum:=(f->>key)::numeric;
    fraction:=least(1,coalesce(value,0)/minimum);
    if fraction<1 and required ? key then return; end if;
    count_group:=count_group+1; sum_group:=sum_group+fraction; partial:=partial or fraction<1;
    criteria:=criteria || jsonb_build_array(jsonb_build_object('key',key,'status',case when value is null then 'unknown' when fraction=1 then 'meets' else 'differs' end));
  end loop;
  if count_group>0 then points:=points+15*sum_group/count_group; weights:=weights+15; end if;
  count_group:=0; sum_group:=0;
  for key in select jsonb_array_elements_text(f->'features') loop
    actual:=case when key='parking' then to_jsonb(p.parking_spots>0) else row_data->key end;
    fraction:=case when actual='true'::jsonb then 1 else 0 end;
    if fraction=0 and required ? key then return; end if;
    count_group:=count_group+1; sum_group:=sum_group+fraction; partial:=partial or fraction<1;
    criteria:=criteria || jsonb_build_array(jsonb_build_object('key',key,'status',case when actual is null or actual='null'::jsonb then 'unknown' when fraction=1 then 'meets' else 'differs' end));
  end loop;
  if count_group>0 then points:=points+10*sum_group/count_group; weights:=weights+10; end if;
  score:=least(case when partial then 99 else 100 end,round(points*100/weights)::integer);
  reasons:=criteria; return next;
end $$;

create or replace function public.interest_matches_for(viewer uuid)
returns table(property_id uuid, interest_id uuid, filters jsonb, score integer, reasons jsonb, is_new boolean, published_at timestamptz)
language sql stable security definer set search_path=public as $$
  with candidates as (
    select p.id property_id, i.id interest_id, i.filters, s.score, s.reasons, p.published_at,
      p.published_at > greatest(i.effective_at,coalesce(pr.interest_matches_seen_at,'-infinity'::timestamptz)) is_new
    from public.property_interests i
    join public.profiles pr on pr.id=i.user_id
    join public.properties p on p.owner_id<>viewer and p.operation::text=i.filters->>'operation'
      and p.status::text='active' and p.published_at is not null
      and (p.expires_at is null or p.expires_at>=now())
    cross join lateral public.score_property_interest(p,i.filters) s
    where i.user_id=viewer and i.is_active and s.score>30
  )
  select distinct on(property_id) property_id,interest_id,filters,score,reasons,
    bool_or(is_new) over(partition by property_id),published_at
  from candidates order by property_id,score desc,interest_id;
$$;

create or replace function public.get_interest_matches(page_size integer default 20,page_offset integer default 0)
returns jsonb language plpgsql volatile security definer set search_path=public as $$
declare boundary timestamptz:=clock_timestamp(); result jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if page_size is null or page_size not between 1 and 20 or page_offset is null or page_offset<0 or page_offset>100000 then raise exception 'Invalid pagination'; end if;
  select coalesce(jsonb_agg(to_jsonb(t)),'[]') into result from (
    select * from public.interest_matches_for(auth.uid()) order by score desc,published_at desc,property_id
    limit page_size offset page_offset
  ) t;
  return jsonb_build_object('items',result,'seen_before',boundary);
end $$;

create or replace function public.get_interest_match_count() returns integer
language sql stable security definer set search_path=public as $$
  select count(*)::integer from public.interest_matches_for(auth.uid()) where is_new;
$$;
create or replace function public.mark_interest_matches_seen(seen_before timestamptz) returns void
language sql volatile security definer set search_path=public as $$
  update public.profiles set interest_matches_seen_at=greatest(coalesce(interest_matches_seen_at,'-infinity'),least(seen_before,clock_timestamp()))
  where id=auth.uid() and seen_before is not null;
$$;
create or replace function public.get_owned_property_demand(property_ids uuid[])
returns table(property_id uuid, users integer, exact_users integer, partial_users integer)
language plpgsql stable security definer set search_path=public as $$
begin
  if auth.uid() is null or property_ids is null or cardinality(property_ids)>100 or
    exists(select 1 from unnest(property_ids) id where not exists(select 1 from public.properties p where p.id=id and p.owner_id=auth.uid())) then
    raise exception 'Invalid owned properties';
  end if;
  return query
    select p.id, count(d.user_id)::integer,count(d.user_id) filter(where d.score=100)::integer,
      count(d.user_id) filter(where d.score<100)::integer
    from public.properties p left join lateral (
      select i.user_id,max(s.score) score from public.property_interests i
      cross join lateral public.score_property_interest(p,i.filters) s
      where i.is_active and i.user_id<>p.owner_id and s.score>30 group by i.user_id
    ) d on true where p.id=any(property_ids) and p.owner_id=auth.uid() group by p.id;
end $$;

revoke all on function public.valid_interest_filters(jsonb),public.touch_property_interest(),public.score_property_interest(public.properties,jsonb),public.interest_matches_for(uuid) from public, anon, authenticated;
-- Needed by the CHECK constraint; contains no private data or database reads.
grant execute on function public.valid_interest_filters(jsonb) to authenticated;
revoke all on function public.get_interest_matches(integer,integer),public.get_interest_match_count(),public.mark_interest_matches_seen(timestamptz),public.get_owned_property_demand(uuid[]) from public,anon;
grant execute on function public.get_interest_matches(integer,integer),public.get_interest_match_count(),public.mark_interest_matches_seen(timestamptz),public.get_owned_property_demand(uuid[]) to authenticated;
commit;
