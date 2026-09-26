-- Notificaciones para el dueño de una propiedad: likes recibidos y mensajes.
--
-- No hay tabla de notificaciones ni triggers de fanout: un like ya es una fila
-- con `created_at` en `favorites`, y el dueño se alcanza por join. Copiar eso a
-- otra tabla solo agrega algo que puede desincronizarse — que es exactamente el
-- bug que hoy tiene el badge de Favoritos. El feed se deriva al leer.
--
-- Lo único no derivable es el mensaje, así que esa sí es tabla.
-- Migración aditiva: una columna y una tabla nuevas.

-- Marca de "hasta acá vi". Un solo timestamp por usuario en vez de un estado
-- de leído por notificación: alcanza para el badge y no hay nada que mantener.
alter table public.profiles
  add column if not exists notifications_seen_at timestamptz default now();

create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  -- Solo usuarios registrados escriben. El visitante anónimo sigue teniendo
  -- WhatsApp y teléfono en la ficha, así que no se pierde alcance y no queda
  -- un endpoint de inserción abierto que haya que defender del spam.
  sender_id   uuid not null references public.profiles(id) on delete cascade,
  body        text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at  timestamptz not null default now()
);

create index if not exists messages_property_idx on public.messages (property_id, created_at desc);
create index if not exists messages_sender_idx on public.messages (sender_id, created_at desc);

alter table public.messages enable row level security;

drop policy if exists "messages insert own" on public.messages;
create policy "messages insert own"
  on public.messages for insert to authenticated
  with check (sender_id = auth.uid());

-- Lee el dueño de la propiedad y quien escribió. Nadie más.
drop policy if exists "messages read owner or sender" on public.messages;
create policy "messages read owner or sender"
  on public.messages for select to authenticated
  using (
    sender_id = auth.uid()
    or exists (
      select 1 from public.properties p
      where p.id = messages.property_id and p.owner_id = auth.uid()
    )
  );

-- Feed del dueño. security definer + auth.uid() adentro: cada quien ve solo lo
-- suyo, sin depender de que el cliente filtre. Mismo patrón que
-- increment_property_views.
--
-- Los likes van sin autor a propósito: `favorites` es privado por RLS y decir
-- "Juan guardó tu casa" filtraría lo que el usuario guardó.
create or replace function public.owner_activity()
returns table (
  kind        text,
  property_id uuid,
  title       text,
  actor_name  text,
  body        text,
  created_at  timestamptz,
  is_new      boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with seen as (
    select coalesce(notifications_seen_at, '-infinity'::timestamptz) as at
    from public.profiles where id = auth.uid()
  )
  select * from (
    select
      'like'::text,
      p.id,
      p.title,
      null::text,
      null::text,
      f.created_at,
      f.created_at > (select at from seen)
    from public.favorites f
    join public.properties p on p.id = f.property_id
    where p.owner_id = auth.uid()

    union all

    select
      'message'::text,
      p.id,
      p.title,
      coalesce(pr.name, 'Usuario'),
      m.body,
      m.created_at,
      m.created_at > (select at from seen)
    from public.messages m
    join public.properties p on p.id = m.property_id
    left join public.profiles pr on pr.id = m.sender_id
    where p.owner_id = auth.uid()
  ) activity
  order by created_at desc
  limit 100;
$$;

-- Contador del badge: mismo criterio que el feed, sin traer las filas.
create or replace function public.owner_unread_count()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int from public.owner_activity() where is_new;
$$;

create or replace function public.mark_notifications_seen()
returns void
language sql
volatile
security definer
set search_path = public
as $$
  update public.profiles set notifications_seen_at = now() where id = auth.uid();
$$;

revoke all on function public.owner_activity() from public;
revoke all on function public.owner_unread_count() from public;
revoke all on function public.mark_notifications_seen() from public;
grant execute on function public.owner_activity() to authenticated;
grant execute on function public.owner_unread_count() to authenticated;
grant execute on function public.mark_notifications_seen() to authenticated;

-- `properties.contacts_count` existe y se mapea a `listing.inquiries`, pero
-- nunca lo incrementó nadie. Ahora que hay mensajes, se mantiene solo — mismo
-- patrón que `sync_favorites_count`, incluido el DELETE: un perfil borrado
-- arrastra sus mensajes por cascade y el contador quedaría inflado.
create or replace function public.sync_contacts_count() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.properties
       set contacts_count = coalesce(contacts_count, 0) + 1
     where id = new.property_id;
  elsif tg_op = 'DELETE' then
    update public.properties
       set contacts_count = greatest(coalesce(contacts_count, 0) - 1, 0)
     where id = old.property_id;
  end if;
  return null;
end $$;

create or replace trigger trg_contacts_count
  after insert or delete on public.messages
  for each row execute function public.sync_contacts_count();
