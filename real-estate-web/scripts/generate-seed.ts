/**
 * Genera supabase/seed.sql a partir de los datos mock, compatible con el
 * esquema real del proyecto (columnas planas, compartido con la app móvil).
 * Las propiedades demo se asignan al perfil más antiguo y se etiquetan con
 * 'demo-seed' para poder borrarlas/regenerarlas.
 *
 * Uso: npx tsx scripts/generate-seed.ts
 */
import { writeFileSync } from 'fs'
import { join } from 'path'
import { mockProperties } from '../src/data/mockProperties'
import { Property } from '../src/types/property'

const q = (s: string | undefined | null) => (s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`)
const n = (v: number | undefined | null) => (v == null ? 'null' : String(v))
const b = (v: boolean | undefined | null) => (v == null ? 'false' : String(v))
const j = (v: unknown) => `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`

const OWNER = `(select id from public.profiles order by created_at asc limit 1)`

function row(p: Property): string {
  const f = p.features
  const tags = [...(p.tags ?? []), 'demo-seed']
  return `(
  ${OWNER},
  ${q(p.title)}, ${q(p.description)}, ${q(p.type)}, ${q(p.operation)}, ${q(p.status)},
  ${n(p.location.latitude)}, ${n(p.location.longitude)},
  ${q(p.location.address.street)}, ${q(p.location.address.number)}, ${q(p.location.address.commune)}, ${q(p.location.address.city)}, ${q(p.location.address.region)},
  ${n(Math.round(p.pricing.price))}, ${q(p.pricing.currency)}, ${p.pricing.monthlyRent != null ? n(Math.round(p.pricing.monthlyRent)) : 'null'}, ${b(p.pricing.isNegotiable)},
  ${n(f.bedrooms)}, ${n(f.bathrooms)}, ${n(f.area)}, ${n(f.builtArea)}, ${n(f.lotSize)}, ${n(f.parkingSpots ?? 0)}, ${n(f.floors)}, ${n(f.yearBuilt)},
  ${b(f.hasGarden)}, ${b(f.hasPool)}, ${b(f.hasGym)}, ${b(f.hasSecurity)}, ${b(f.hasElevator)}, ${b(f.hasBalcony)}, ${b(f.hasTerrace)}, ${b(f.hasAirConditioning)}, ${b(f.hasHeating)},
  ${b(f.petFriendly)}, ${b(f.furnished)}, ${b(f.newConstruction)},
  ${j(p.media.images)},
  ${q(p.contact.name)}, ${q(p.contact.phone)}, ${q(p.contact.email)}, ${q(p.contact.whatsapp)}, ${q(p.contact.preferredMethod)},
  ${q(p.listing.publishedAt)}, ${p.listing.expiresAt ? q(p.listing.expiresAt) : `now() + interval '90 days'`},
  ${b(p.listing.isPremium)}, ${b(p.listing.isFeatured)}, ${n(p.listing.views)}, ${n(p.listing.favorites)}, ${n(p.listing.inquiries)},
  array[${tags.map(t => q(t)).join(',')}]
)`
}

const sql = `-- ============================================================
-- MapU — datos de demostración (generado desde src/data/mockProperties.ts)
-- Compatible con el esquema existente del proyecto (app móvil).
--
-- REQUISITO: debe existir al menos un perfil (crea una cuenta primero,
-- desde la web o la app móvil). Las propiedades demo se asignan al perfil
-- más antiguo y llevan el tag 'demo-seed' (re-ejecutar las regenera).
-- ============================================================

do $$
begin
  if not exists (select 1 from public.profiles) then
    raise exception 'No hay perfiles: crea una cuenta primero y vuelve a ejecutar este seed.';
  end if;
end $$;

delete from public.properties where 'demo-seed' = any(tags);

insert into public.properties (
  owner_id,
  title, description, type, operation, status,
  latitude, longitude,
  address_street, address_number, address_commune, address_city, address_region,
  price, currency, monthly_rent, is_negotiable,
  bedrooms, bathrooms, area, built_area, lot_size, parking_spots, floors, year_built,
  has_garden, has_pool, has_gym, has_security, has_elevator, has_balcony, has_terrace, has_air_conditioning, has_heating,
  pet_friendly, furnished, new_construction,
  images,
  contact_name, contact_phone, contact_email, contact_whatsapp, preferred_contact,
  published_at, expires_at,
  is_premium, is_featured, views, favorites_count, contacts_count,
  tags
) values
${mockProperties.map(row).join(',\n')};
`

const out = join(__dirname, '..', 'supabase', 'seed.sql')
writeFileSync(out, sql)
console.log(`OK: ${out} (${mockProperties.length} propiedades)`)
