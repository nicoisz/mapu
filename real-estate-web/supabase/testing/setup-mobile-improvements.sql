-- Mobile improvements: run in Supabase SQL Editor as postgres, before deploying this branch.
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

begin;
alter table public.messages add column if not exists recipient_id uuid references public.profiles(id) on delete cascade;
update public.messages m set recipient_id=p.owner_id from public.properties p where p.id=m.property_id and m.recipient_id is null;
alter table public.messages alter column recipient_id set not null;
create index if not exists messages_recipient_idx on public.messages(recipient_id,created_at desc);

drop policy if exists "messages read owner or sender" on public.messages;
drop policy if exists "messages read participants" on public.messages;
create policy "messages read participants" on public.messages for select to authenticated using(sender_id=auth.uid() or recipient_id=auth.uid());
revoke all on public.messages from anon,authenticated;
grant select on public.messages to authenticated;

create table if not exists public.message_reads (
  user_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  counterparty_id uuid not null references public.profiles(id) on delete cascade,
  seen_at timestamptz not null,
  primary key(user_id,property_id,counterparty_id)
);
alter table public.message_reads enable row level security;
drop policy if exists message_reads_own on public.message_reads;
create policy message_reads_own on public.message_reads for select to authenticated using(user_id=auth.uid());
revoke all on public.message_reads from anon,authenticated;
grant select on public.message_reads to authenticated;
grant all on public.message_reads to service_role;

create or replace function public.validate_message_participants() returns trigger
language plpgsql set search_path=public as $$
declare owner uuid;
begin
  select owner_id into owner from public.properties where id=new.property_id;
  if owner is null or new.recipient_id is null or new.sender_id=new.recipient_id then raise exception 'Invalid conversation'; end if;
  if not exists(select 1 from public.messages m where m.property_id=new.property_id and
    ((m.sender_id=new.sender_id and m.recipient_id=new.recipient_id) or (m.sender_id=new.recipient_id and m.recipient_id=new.sender_id)))
    and (new.recipient_id<>owner or new.sender_id=owner or not exists(
      select 1 from public.properties p where p.id=new.property_id and p.status='active' and p.published_at is not null and (p.expires_at is null or p.expires_at>now())
    )) then raise exception 'Conversation unavailable'; end if;
  new.body:=btrim(new.body);
  new.created_at:=clock_timestamp();
  return new;
end $$;
drop trigger if exists messages_validate_participants on public.messages;
create trigger messages_validate_participants before insert on public.messages for each row execute function public.validate_message_participants();

create or replace function public.send_conversation_message(property uuid,counterparty uuid,message_body text,request_id uuid,expected_sender uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare target uuid; existing public.messages;
begin
  if auth.uid() is null or expected_sender is distinct from auth.uid() then raise exception 'Authentication required'; end if;
  if request_id is null or message_body is null or length(btrim(message_body)) not between 1 and 2000 then raise exception 'Invalid message'; end if;
  select coalesce(counterparty,p.owner_id) into target from public.properties p where p.id=property;
  if target is null or target=auth.uid() then raise exception 'Invalid recipient'; end if;
  select * into existing from public.messages where id=request_id;
  if existing.id is not null then
    if existing.sender_id=auth.uid() and existing.recipient_id=target and existing.property_id=property and existing.body=btrim(message_body) then return existing.id; end if;
    raise exception 'Message request conflict';
  end if;
  insert into public.messages(id,property_id,sender_id,recipient_id,body) values(request_id,property,auth.uid(),target,btrim(message_body)) on conflict(id) do nothing;
  select * into existing from public.messages where id=request_id;
  if existing.sender_id<>auth.uid() or existing.recipient_id<>target or existing.property_id<>property or existing.body<>btrim(message_body) then raise exception 'Message request conflict'; end if;
  return request_id;
end $$;

create or replace function public.list_conversations(page_offset integer default 0) returns jsonb
language plpgsql stable security definer set search_path=public as $$
declare result jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if page_offset is null or page_offset not between 0 and 100000 then raise exception 'Invalid pagination'; end if;
  with mine as (
    select m.*,case when m.sender_id=auth.uid() then m.recipient_id else m.sender_id end other_id
    from public.messages m where m.sender_id=auth.uid() or m.recipient_id=auth.uid()
  ), latest as (
    select distinct on(property_id,other_id) * from mine order by property_id,other_id,created_at desc,id desc
  ) select coalesce(jsonb_agg(to_jsonb(t)),'[]') into result from (
    select l.property_id,p.title,l.other_id counterparty_id,coalesce(pr.name,'Usuario') counterparty_name,l.body last_body,l.created_at last_at,
      (select count(*)::int from mine m where m.property_id=l.property_id and m.other_id=l.other_id and m.recipient_id=auth.uid() and m.created_at>coalesce(r.seen_at,'-infinity')) unread
    from latest l join public.properties p on p.id=l.property_id join public.profiles pr on pr.id=l.other_id
    left join public.message_reads r on r.user_id=auth.uid() and r.property_id=l.property_id and r.counterparty_id=l.other_id
    order by l.created_at desc,l.id desc limit 20 offset page_offset
  ) t;
  return result;
end $$;

create or replace function public.conversation_messages(property uuid,counterparty uuid,before_message uuid default null) returns jsonb
language plpgsql volatile security definer set search_path=public as $$
declare boundary timestamptz:=clock_timestamp(); before_time timestamptz; result jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists(select 1 from public.messages m where m.property_id=property and
    ((m.sender_id=auth.uid() and m.recipient_id=counterparty) or (m.sender_id=counterparty and m.recipient_id=auth.uid()))) then raise exception 'Conversation unavailable'; end if;
  if before_message is not null then
    select m.created_at into before_time from public.messages m where m.id=before_message and m.property_id=property and
      ((m.sender_id=auth.uid() and m.recipient_id=counterparty) or (m.sender_id=counterparty and m.recipient_id=auth.uid()));
    if before_time is null then raise exception 'Invalid message cursor'; end if;
  end if;
  select coalesce(jsonb_agg(to_jsonb(t)),'[]') into result from (
    select m.id,m.body,m.created_at,m.sender_id=auth.uid() is_mine,coalesce(pr.name,'Usuario') sender_name
    from public.messages m join public.profiles pr on pr.id=m.sender_id where m.property_id=property and
      ((m.sender_id=auth.uid() and m.recipient_id=counterparty) or (m.sender_id=counterparty and m.recipient_id=auth.uid()))
      and (before_message is null or (m.created_at,m.id)<(before_time,before_message))
    order by m.created_at desc,m.id desc limit 50
  ) t;
  return jsonb_build_object('items',result,'seen_before',boundary);
end $$;

create or replace function public.mark_conversation_seen(property uuid,counterparty uuid,seen_before timestamptz) returns void
language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null or seen_before is null or not exists(select 1 from public.messages m where m.property_id=property and
    ((m.sender_id=auth.uid() and m.recipient_id=counterparty) or (m.sender_id=counterparty and m.recipient_id=auth.uid()))) then raise exception 'Conversation unavailable'; end if;
  insert into public.message_reads(user_id,property_id,counterparty_id,seen_at) values(auth.uid(),property,counterparty,least(seen_before,clock_timestamp()))
  on conflict(user_id,property_id,counterparty_id) do update set seen_at=greatest(message_reads.seen_at,excluded.seen_at);
end $$;

create or replace function public.inbox_unread_count() returns integer
language sql stable security definer set search_path=public as $$
  select count(*)::int from public.messages m left join public.message_reads r on r.user_id=auth.uid() and r.property_id=m.property_id and r.counterparty_id=m.sender_id
  where m.recipient_id=auth.uid() and m.created_at>coalesce(r.seen_at,'-infinity');
$$;

-- Responses do not inflate the contact metric: count distinct people contacting the current publisher.
create or replace function public.sync_contacts_count() returns trigger
language plpgsql security definer set search_path=public as $$
declare prop uuid;
begin
  prop:=case when tg_op='DELETE' then old.property_id else new.property_id end;
  update public.properties p set contacts_count=(select count(distinct m.sender_id) from public.messages m where m.property_id=p.id and m.recipient_id=p.owner_id and m.sender_id<>p.owner_id) where p.id=prop;
  return null;
end $$;
update public.properties p set contacts_count=(select count(distinct m.sender_id) from public.messages m where m.property_id=p.id and m.recipient_id=p.owner_id and m.sender_id<>p.owner_id);

-- Keep the existing owner notification feed, excluding the owner's own responses.
create or replace function public.owner_activity()
returns table(kind text,property_id uuid,title text,actor_name text,body text,created_at timestamptz,is_new boolean)
language sql stable security definer set search_path=public as $$
  with seen as (select coalesce(notifications_seen_at,'-infinity') at from public.profiles where id=auth.uid())
  select * from (
    select 'like'::text,p.id,p.title,null::text,null::text,f.created_at,f.created_at>(select at from seen)
    from public.favorites f join public.properties p on p.id=f.property_id where p.owner_id=auth.uid()
    union all
    select 'message'::text,p.id,p.title,coalesce(pr.name,'Usuario'),m.body,m.created_at,m.created_at>(select at from seen)
    from public.messages m join public.properties p on p.id=m.property_id left join public.profiles pr on pr.id=m.sender_id
    where m.recipient_id=auth.uid() and p.owner_id=auth.uid() and m.sender_id<>auth.uid()
  ) activity order by created_at desc limit 100;
$$;

revoke all on function public.validate_message_participants(),public.send_conversation_message(uuid,uuid,text,uuid,uuid),public.list_conversations(integer),public.conversation_messages(uuid,uuid,uuid),public.mark_conversation_seen(uuid,uuid,timestamptz),public.inbox_unread_count() from public,anon;
grant execute on function public.send_conversation_message(uuid,uuid,text,uuid,uuid),public.list_conversations(integer),public.conversation_messages(uuid,uuid,uuid),public.mark_conversation_seen(uuid,uuid,timestamptz),public.inbox_unread_count() to authenticated;
commit;
