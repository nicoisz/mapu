-- Data checks que ya deberían existir (espejo de la validación server-side).
-- Forward-only, seguros para datos existentes (los valores reales ya los cumplen).

-- price/area no negativos (zod ya exige > 0 en /api/publish; esto lo respalda en DB).
alter table public.properties
  add constraint properties_price_check check (price >= 0);

alter table public.properties
  add constraint properties_area_check check (area >= 0);

-- platform_role solo user | superadmin (admin_set_platform_role ya lo valida vía RPC).
alter table public.profiles
  add constraint profiles_platform_role_check check (platform_role in ('user', 'superadmin'));
