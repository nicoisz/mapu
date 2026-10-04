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
