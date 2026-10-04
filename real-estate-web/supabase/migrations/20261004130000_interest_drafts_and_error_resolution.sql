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
    if jsonb_typeof(a) <> 'array' or jsonb_array_length(a) > 100 then return false; end if;
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

-- Existing alternatives become ordinary selected communes. No criteria are indispensable.
update public.property_interests i set filters = filters || jsonb_build_object(
  'communes', (select coalesce(jsonb_agg(c.value order by c.position),'[]') from
    (select value,min(ordinality) position from jsonb_array_elements((i.filters->'communes') || (i.filters->'alternativeCommunes')) with ordinality group by value) c),
  'alternativeCommunes','[]'::jsonb,'required','[]'::jsonb)
where jsonb_array_length(filters->'alternativeCommunes')>0 or jsonb_array_length(filters->'required')>0;

create or replace function public.save_property_interest(interest_id uuid,interest_filters jsonb,expected_user_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare result public.property_interests;
begin
  if auth.uid() is null or expected_user_id is distinct from auth.uid() or interest_id is null then raise exception 'Authentication required'; end if;
  if not public.valid_interest_filters(interest_filters) then raise exception 'Invalid interest'; end if;
  -- A client-generated ID makes retries safe after a lost response.
  insert into public.property_interests(id,user_id,filters) values(interest_id,auth.uid(),interest_filters)
  on conflict(id) do update set filters=excluded.filters where property_interests.user_id=auth.uid()
  returning * into result;
  if result.id is null then raise exception 'Interest unavailable'; end if;
  return jsonb_build_object('id',result.id,'filters',result.filters,'is_active',result.is_active);
end $$;
revoke all on function public.save_property_interest(uuid,jsonb,uuid) from public,anon;
grant execute on function public.save_property_interest(uuid,jsonb,uuid) to authenticated;

alter table public.error_logs add column if not exists resolved boolean not null default false;
alter table public.error_logs add column if not exists resolved_at timestamptz;
alter table public.error_logs add column if not exists resolved_by uuid references public.profiles(id) on delete set null;
-- Client inserts must go through the actor-verifying RPC.
revoke all on public.error_logs from anon,authenticated;
grant select on public.error_logs to authenticated;

create or replace function public.set_error_log_resolved(log_id uuid,is_resolved boolean)
returns void language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null or not public.is_superadmin() then raise exception 'Administrator required'; end if;
  if is_resolved is null then raise exception 'Invalid resolution'; end if;
  update public.error_logs set resolved=is_resolved,resolved_at=case when is_resolved then now() end,resolved_by=case when is_resolved then auth.uid() end where id=log_id;
  if not found then raise exception 'Log unavailable'; end if;
end $$;
revoke all on function public.set_error_log_resolved(uuid,boolean) from public,anon;
grant execute on function public.set_error_log_resolved(uuid,boolean) to authenticated;

create or replace function public.capture_error_log(log_message text,log_stack text,log_route text,log_context jsonb,expected_actor uuid default null)
returns void language plpgsql security definer set search_path=public as $$
declare actor public.profiles;
begin
  if expected_actor is distinct from auth.uid() then raise exception 'Actor changed'; end if;
  if log_context is null or jsonb_typeof(log_context)<>'object' or octet_length(log_context::text)>32000 then raise exception 'Invalid log context'; end if;
  -- Bounded diagnostics; logging must never become a public bulk-insert endpoint.
  if (select count(*) from public.error_logs where user_id is not distinct from auth.uid() and created_at>now()-interval '1 minute')>=100 then return; end if;
  select * into actor from public.profiles where id=auth.uid();
  insert into public.error_logs(user_id,email,name,message,stack,route,context)
  values(actor.id,actor.email,actor.name,left(log_message,5000),left(log_stack,20000),left(log_route,2000),log_context);
end $$;
revoke all on function public.capture_error_log(text,text,text,jsonb,uuid) from public;
grant execute on function public.capture_error_log(text,text,text,jsonb,uuid) to anon,authenticated;
commit;
