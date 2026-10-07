-- Código alfanumérico único de propiedad (3 dígitos base36 → 36^3 = 46.656
-- combinaciones) que se usa como identificador público en las URLs.
--
-- Diseño:
--   · sequence monótona → índice dentro del bloque de longitud → permutación
--     biyectiva → base36 con alfabeto mezclado. Sin colisiones y sin códigos
--     secuenciales (anti-enumeración).
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

-- 2) Identidad pública. base36 convierte n → dígitos estándar; el alfabeto
--    mezclado y la permutación modular evitan que los códigos sean
--    consecutivos (no se puede recorrer /propiedad/001,002,003...).
--
--    base36:  rellena a p_min_len y NO recorta (lpad recortaría: greatest).
--    encode:  para cada bloque de longitud L en [36^(L-1), 36^L) aplica
--             m = (a*x + c) mod D  (x = n - block, D = 36^L - block).
--             D = 36^(L-1)*35 → factores {2,3,5,7}; con a=1000003 (coprimo
--             con 2,3,5,7) la función es biyectiva en cada bloque.
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
  return lpad(v_result, greatest(p_min_len, length(v_result)), '0');
end;
$$;

-- Alfabeto mezclado fijo (permutación generada con paso coprimo con 36).
create or replace function public.code_alphabet()
returns text
language sql
immutable
set search_path to 'public', 'pg_temp'
as $$
  select string_agg(
           substr('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', ((i * 17 + 5) % 36) + 1, 1),
           '' order by i
         )
    from generate_series(0, 35) as i;
$$;

create or replace function public.encode_property_code(p_n bigint)
returns text
language plpgsql
immutable
set search_path to 'public', 'pg_temp'
as $$
declare
  v_digits constant text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  v_alpha text := public.code_alphabet();
  v_dict text := '';
  v_len integer := 3;
  v_block bigint := 0;
  v_pow bigint := 46656; -- 36^3
  v_domain bigint;
  v_m bigint;
  v_raw text;
  v_pos integer;
  v_idx integer;
  v_result text := '';
  v_a constant bigint := 1000003;
  v_c constant bigint := 12347;
begin
  while p_n >= v_pow loop
    v_block := v_pow;
    v_len := v_len + 1;
    v_pow := v_pow * 36;
  end loop;
  v_domain := v_pow - v_block;
  v_m := v_block + ((v_a * (p_n - v_block) + v_c) % v_domain);

  v_raw := public.base36(v_m, v_len);
  for v_pos in 1..length(v_raw) loop
    v_idx := strpos(v_digits, substr(v_raw, v_pos, 1)) - 1;
    v_result := v_result || substr(v_alpha, v_idx + 1, 1);
  end loop;
  return v_result;
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
    v_code := public.encode_property_code(nextval('public.property_code_seq'));
    exit when not exists (
      select 1 from public.forbidden_words f where f.word = lower(v_code)
    );
  end loop;
  return v_code;
end;
$$;

-- 3) La columna + asignación en insert. Los códigos se guardan en mayúsculas
--    (a5t == A5T), así que el lookup sólo tiene que hacer upper().
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

alter table public.properties
  add constraint properties_code_upper check (code = upper(code));

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
  else
    new.code := upper(new.code);
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

-- 5) No agregar una palabra prohibida que ya esté tomada como código.
--    (Se crea después del backfill para que el seed inicial no colisione.)
create or replace function public.forbid_word_code_collision()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
begin
  if exists (select 1 from public.properties p where p.code = upper(new.word)) then
    raise exception 'La palabra % ya está tomada como código de propiedad', new.word
      using errcode = '23505';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_forbidden_words_code_collision on public.forbidden_words;
create trigger trg_forbidden_words_code_collision
  before insert or update on public.forbidden_words
  for each row execute function public.forbid_word_code_collision();

-- 6) Los helpers de generación no se exponen por PostgREST (si no, cualquiera
--    llama encode_property_code(n) y enumera). Los triggers corren como
--    SECURITY DEFINER (owner), así que siguen funcionando sin EXECUTE extra.
revoke execute on function public.base36(bigint, integer) from public, anon, authenticated;
revoke execute on function public.code_alphabet() from public, anon, authenticated;
revoke execute on function public.encode_property_code(bigint) from public, anon, authenticated;
revoke execute on function public.generate_property_code() from public, anon, authenticated;
revoke execute on function public.contains_forbidden_word(text) from public, anon, authenticated;
revoke execute on function public.set_property_code() from public, anon, authenticated;
revoke execute on function public.forbid_property_text() from public, anon, authenticated;
revoke execute on function public.forbid_word_code_collision() from public, anon, authenticated;

grant execute on function public.contains_forbidden_word(text) to service_role;
