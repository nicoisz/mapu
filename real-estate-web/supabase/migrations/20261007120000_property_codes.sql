-- Código alfanumérico único de propiedad (3 dígitos base36 → 36^3 = 46.656
-- combinaciones) que se usa como identificador público en las URLs.
--
-- Diseño:
--   · sequence monótona → base36 con relleno a 3 → sin colisiones por diseño.
--   · la longitud sube sola a 4 cuando la sequence supera 36^3 (46656).
--   · las palabras de forbidden_words se saltan (p.ej. FUK, WEA, CUM).
--   · el trigger asigna el código en CUALQUIER insert (web, móvil, seed).

-- 1) Palabras prohibidas. Sirven para códigos y para moderar texto de usuario.
create table if not exists public.forbidden_words (
  word text primary key,
  created_at timestamp with time zone not null default now(),
  constraint forbidden_words_lowercase check (word = lower(word))
);

alter table public.forbidden_words enable row level security;

drop policy if exists "forbidden words readable by all" on public.forbidden_words;
create policy "forbidden words readable by all"
  on public.forbidden_words for select to anon, authenticated using (true);

grant select on public.forbidden_words to anon, authenticated;

insert into public.forbidden_words (word) values
  ('wea'), ('weon'), ('aweonao'), ('ctm'), ('qlo'), ('qliao'), ('culiao'),
  ('conchetumare'), ('chupala'), ('pico'), ('pija'), ('pene'), ('tula'),
  ('puta'), ('puto'), ('mierda'), ('culo'), ('maricon'), ('concha'),
  ('fuk'), ('fuc'), ('fux'), ('fuck'), ('fack'), ('cum'),
  ('ass'), ('fag'), ('tit'), ('tits'), ('sex'), ('dick'), ('cock'),
  ('cunt'), ('pussy'), ('bitch'), ('whore'), ('slut'),
  ('nazi'), ('nigger'), ('nigga'), ('rape')
on conflict (word) do nothing;

-- 2) Secuencia e identidad base36. base36(1)='001', base36(35)='00Z',
--    base36(36)='010', base36(46656)='1000' (4 dígitos, escalado automático).
create sequence if not exists public.property_code_seq as bigint start with 1;

create or replace function public.base36(p_num bigint, p_min_len integer default 3)
returns text
language plpgsql
immutable
set search_path to 'public', 'pg_temp'
as $$
declare
  v_digits constant text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  v_result text := '';
  v_n bigint := p_num;
  v_rem integer;
begin
  if v_n < 0 then
    raise exception 'base36: número negativo';
  end if;
  loop
    v_rem := (v_n % 36)::integer;
    v_result := substr(v_digits, v_rem + 1, 1) || v_result;
    v_n := v_n / 36;
    exit when v_n = 0;
  end loop;
  -- Ojo: lpad recorta si la cadena ya es más larga; por eso el greatest.
  return lpad(v_result, greatest(p_min_len, length(v_result)), '0');
end;
$$;

-- Genera el siguiente código libre: avanza la sequence y salta prohibidas.
create or replace function public.generate_property_code()
returns text
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_code text;
begin
  loop
    v_code := public.base36(nextval('public.property_code_seq'), 3);
    exit when not exists (
      select 1 from public.forbidden_words f where f.word = lower(v_code)
    );
  end loop;
  return v_code;
end;
$$;

-- 3) La columna + asignación en insert.
alter table public.properties
  add column if not exists code text;

do $$
begin
  if exists (select 1 from public.properties where code is null) then
    update public.properties
       set code = public.generate_property_code()
     where code is null;
  end if;
end $$;

alter table public.properties
  alter column code set not null;

create unique index if not exists properties_code_key
  on public.properties (code);

create or replace function public.set_property_code()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
begin
  if new.code is null or new.code = '' then
    new.code := public.generate_property_code();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_properties_set_code on public.properties;
create trigger trg_properties_set_code
  before insert on public.properties
  for each row execute function public.set_property_code();

-- 4) Moderación de texto de usuario (título/descripción) con la misma tabla.
create or replace function public.contains_forbidden_word(p_text text)
returns boolean
language sql
stable
set search_path to 'public', 'pg_temp'
as $$
  select coalesce(p_text, '') <> '' and exists (
    select 1
      from public.forbidden_words f
     where lower(p_text) ~ ('\m' || f.word || '\M')
  );
$$;

create or replace function public.forbid_property_text()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
begin
  if public.contains_forbidden_word(new.title) then
    raise exception 'El título contiene una palabra no permitida'
      using errcode = '23514';
  end if;
  if public.contains_forbidden_word(new.description) then
    raise exception 'La descripción contiene una palabra no permitida'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_properties_forbid_words on public.properties;
create trigger trg_properties_forbid_words
  before insert or update of title, description on public.properties
  for each row execute function public.forbid_property_text();
