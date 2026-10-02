-- Smoke test (pgTAP): valida que una base vacía, tras `supabase db reset` + seed,
-- reconstruye el esquema y los datos esperados. Se ejecuta con `supabase test db`.
begin;
select plan(18);

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

-- Datos del seed
select is((select count(*)::int from public.profiles), 1, 'seed creó 1 perfil demo');
select is((select count(*)::int from public.properties), 15, 'seed creó 15 propiedades demo');

select * from finish();
rollback;
