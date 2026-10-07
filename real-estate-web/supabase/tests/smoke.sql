-- Smoke test (pgTAP): valida que una base vacía, tras `supabase db reset` + seed,
-- reconstruye el esquema y los datos esperados. Se ejecuta con `supabase test db`.
begin;
select plan(28);

-- Tablas esenciales
select has_table('public', 'profiles', 'profiles existe');
select has_table('public', 'properties', 'properties existe');
select has_table('public', 'favorites', 'favorites existe');
select has_table('public', 'property_views', 'property_views existe');
select has_table('public', 'reviews', 'reviews existe');
select has_table('public', 'organizations', 'organizations existe');
select has_table('public', 'organization_members', 'organization_members existe');
select has_table('public', 'payments', 'payments existe');
select has_table('public', 'error_logs', 'error_logs existe');
select has_table('public', 'org_invites', 'org_invites existe');

-- RPCs esenciales
select has_function('public', 'increment_property_views', array['uuid'], 'increment_property_views existe');
select has_function('public', 'get_owner_views', array['uuid', 'integer'], 'get_owner_views existe');
select has_function('public', 'get_property_views', array['uuid', 'integer'], 'get_property_views existe');
select has_function('public', 'admin_list_users', array['text'], 'admin_list_users existe');
select has_function('public', 'set_member_role', array['uuid', 'uuid', 'text'], 'set_member_role existe');
select has_function('public', 'is_superadmin', array[]::text[], 'is_superadmin existe');

-- Código de propiedad y palabras prohibidas
select has_table('public', 'forbidden_words', 'forbidden_words existe');
select has_function('public', 'generate_property_code', array[]::text[], 'generate_property_code existe');
select has_function('public', 'contains_forbidden_word', array['text'], 'contains_forbidden_word existe');

-- Datos del seed
select is((select count(*)::int from public.profiles), 1, 'seed creó 1 perfil demo');
select is((select count(*)::int from public.properties), 15, 'seed creó 15 propiedades demo');

-- Cada propiedad tiene código y son únicos (los asigna el trigger en el insert).
select is(
  (select count(*)::int from public.properties where code is null), 0,
  'todas las propiedades tienen código'
);
select is(
  (select count(distinct code)::int from public.properties), 15,
  'los códigos de propiedad son únicos'
);

-- base36: 3 dígitos hasta 36^3, luego escala a 4 automáticamente.
select is(public.base36(35), '00Z', 'base36(35) = 00Z');
select is(public.base36(46656), '1000', 'base36(36^3) escala a 4 dígitos');

-- La misma tabla modera texto de usuario (límites de palabra).
select ok(public.contains_forbidden_word('una wea de casa'), 'detecta palabra prohibida');
select ok(not public.contains_forbidden_word('estamos weando'), 'no marca subcadenas');

select ok(
  public.generate_property_code() not in (select word from public.forbidden_words),
  'el código generado nunca es una palabra prohibida'
);

select * from finish();
rollback;
