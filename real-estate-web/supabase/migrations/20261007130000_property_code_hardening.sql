-- Hardening del código público de propiedad (sigue a
-- 20261007120000_property_codes.sql, que ya está aplicada):
--   1. Permutación anti-enumeración: el código deja de ser secuencial.
--   2. Case-insensitive: los códigos viven en mayúsculas (a5t == A5T).
--   3. Re-codificación de las propiedades existentes (decisión explícita:
--      invalida stickers/links ya impresos a propósito).
--   4. No se puede agregar una palabra prohibida que ya sea un código.
--   5. Los helpers no se exponen por PostgREST (si no, se enumera vía RPC).

-- 1) encode_property_code: permutación modular biyectiva por bloque de
--    longitud + alfabeto mezclado. Para el bloque [36^(L-1), 36^L):
--      m = (a * (n - block) + c) mod D,  D = 36^L - block = 36^(L-1)*35.
--    D tiene factores {2,3,5,7}; con a=1000003 (coprimo con ellos) la
--    función es biyectiva → sin colisiones y sin orden predecible.
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

-- 2) Genera el siguiente código libre: avanza la sequence, salta palabras
--    prohibidas y salta códigos ya usados (robusto ante espacios mezclados).
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
      )
      and not exists (
        select 1 from public.properties p where p.code = v_code
      );
  end loop;
  return v_code;
end;
$$;

-- 3) Trigger: normaliza a mayúsculas cuando el código llega explícito.
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

alter table public.properties
  drop constraint if exists properties_code_upper;
alter table public.properties
  add constraint properties_code_upper check (code = upper(code));

-- 4) Re-codificación de las existentes. Se suelta el índice único para evitar
--    colisiones transitorias entre códigos viejos y nuevos; la biyección más
--    la sequence garantizan que no se repitan.
drop index if exists public.properties_code_key;
update public.properties
   set code = public.generate_property_code();
create unique index if not exists properties_code_key
  on public.properties (code);

-- 5) No agregar una palabra prohibida que ya esté tomada como código.
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
