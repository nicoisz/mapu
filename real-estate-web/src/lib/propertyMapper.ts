import { Property, PropertyImage } from '@/types/property'
import { ChileanRegion, ContactMethod, Currency, PropertyOperation, PropertyStatus, PropertyType } from '@/types/enums'

/**
 * Shape of a row in public.properties — the schema shared with the mobile app
 * (flat columns: latitude/longitude, address_*, has_*; see supabase/schema.sql).
 */
export interface PropertyRow {
  id: string
  owner_id: string
  title: string
  description: string
  type: string
  operation: string
  status: string
  latitude: number
  longitude: number
  address_street: string | null
  address_number: string | null
  address_commune: string | null
  address_city: string | null
  address_region: string | null
  address_postal_code: string | null
  price: number
  currency: string
  price_per_sqm: number | null
  monthly_rent: number | null
  deposit: number | null
  maintenance_fee: number | null
  is_negotiable: boolean | null
  bedrooms: number | null
  bathrooms: number | null
  area: number
  built_area: number | null
  lot_size: number | null
  parking_spots: number | null
  floors: number | null
  year_built: number | null
  has_garden: boolean | null
  has_pool: boolean | null
  has_gym: boolean | null
  has_security: boolean | null
  has_elevator: boolean | null
  has_balcony: boolean | null
  has_terrace: boolean | null
  has_air_conditioning: boolean | null
  has_heating: boolean | null
  pet_friendly: boolean | null
  furnished: boolean | null
  new_construction: boolean | null
  images: unknown
  virtual_tour_url: string | null
  floor_plan_url: string | null
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
  contact_whatsapp: string | null
  preferred_contact: string | null
  published_at: string | null
  expires_at: string | null
  is_premium: boolean | null
  is_featured: boolean | null
  views: number | null
  favorites_count: number | null
  contacts_count: number | null
  tags: string[] | null
  created_at: string
  updated_at: string
}

/** Tolerates both `[{url,...}]` (web) and `["url", ...]` (plain strings). */
function parseImages(raw: unknown): PropertyImage[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item, i): PropertyImage => {
      if (typeof item === 'string') return { id: `img-${i}`, url: item, order: i, isMain: i === 0 }
      const o = item as Record<string, unknown>
      return {
        id: String(o.id ?? `img-${i}`),
        url: String(o.url ?? ''),
        thumbnailUrl: typeof o.thumbnailUrl === 'string' ? o.thumbnailUrl : undefined,
        order: typeof o.order === 'number' ? o.order : i,
        isMain: typeof o.isMain === 'boolean' ? o.isMain : i === 0,
      }
    })
    .filter(img => img.url)
}

export function rowToProperty(row: PropertyRow): Property {
  const streetLine = [row.address_street, row.address_number].filter(Boolean).join(' ')
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description,
    type: row.type as PropertyType,
    operation: row.operation as PropertyOperation,
    status: row.status as PropertyStatus,
    location: {
      latitude: row.latitude,
      longitude: row.longitude,
      address: {
        street: row.address_street ?? '',
        number: row.address_number ?? undefined,
        commune: row.address_commune ?? undefined,
        city: row.address_city ?? '',
        region: (row.address_region as ChileanRegion) ?? ChileanRegion.METROPOLITANA,
        postalCode: row.address_postal_code ?? undefined,
        country: 'Chile',
      },
      displayAddress: [streetLine, row.address_commune ?? row.address_city].filter(Boolean).join(', ') || undefined,
    },
    pricing: {
      price: Number(row.price),
      currency: (row.currency as Currency) ?? Currency.CLP,
      pricePerSquareMeter: row.price_per_sqm != null ? Number(row.price_per_sqm) : undefined,
      monthlyRent: row.monthly_rent != null ? Number(row.monthly_rent) : undefined,
      deposit: row.deposit != null ? Number(row.deposit) : undefined,
      maintenanceFee: row.maintenance_fee != null ? Number(row.maintenance_fee) : undefined,
      isNegotiable: row.is_negotiable ?? false,
    },
    features: {
      area: Number(row.area),
      builtArea: row.built_area != null ? Number(row.built_area) : undefined,
      lotSize: row.lot_size != null ? Number(row.lot_size) : undefined,
      bedrooms: row.bedrooms ?? undefined,
      bathrooms: row.bathrooms ?? undefined,
      parkingSpots: row.parking_spots ?? undefined,
      floors: row.floors ?? undefined,
      yearBuilt: row.year_built ?? undefined,
      hasGarden: row.has_garden ?? undefined,
      hasPool: row.has_pool ?? undefined,
      hasGym: row.has_gym ?? undefined,
      hasSecurity: row.has_security ?? undefined,
      hasElevator: row.has_elevator ?? undefined,
      hasBalcony: row.has_balcony ?? undefined,
      hasTerrace: row.has_terrace ?? undefined,
      hasAirConditioning: row.has_air_conditioning ?? undefined,
      hasHeating: row.has_heating ?? undefined,
      petFriendly: row.pet_friendly ?? undefined,
      furnished: row.furnished ?? undefined,
      newConstruction: row.new_construction ?? undefined,
    },
    media: {
      images: parseImages(row.images),
      virtualTour: row.virtual_tour_url ?? undefined,
      floorPlan: row.floor_plan_url ?? undefined,
    },
    contact: {
      id: row.owner_id,
      name: row.contact_name ?? '',
      phone: row.contact_phone ?? undefined,
      email: row.contact_email ?? undefined,
      whatsapp: row.contact_whatsapp ?? undefined,
      preferredMethod: (row.preferred_contact as ContactMethod) ?? ContactMethod.WHATSAPP,
      isVerified: false,
    },
    listing: {
      publishedAt: row.published_at ?? row.created_at,
      expiresAt: row.expires_at ?? undefined,
      lastUpdated: row.updated_at,
      views: row.views ?? 0,
      favorites: row.favorites_count ?? 0,
      inquiries: row.contacts_count ?? 0,
      isPremium: row.is_premium ?? false,
      isHighlighted: false,
      isFeatured: row.is_featured ?? false,
      completenessScore: 80,
      qualityScore: 75,
    },
    tags: row.tags ?? [],
  }
}

/** Maps a (partial) Property to the column set accepted on insert/update. */
export function propertyToRow(p: Partial<Property>, ownerId?: string): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (ownerId) row.owner_id = ownerId
  if (p.title !== undefined) row.title = p.title
  if (p.description !== undefined) row.description = p.description
  if (p.type !== undefined) row.type = p.type
  if (p.operation !== undefined) row.operation = p.operation
  if (p.status !== undefined) row.status = p.status
  if (p.pricing) {
    row.price = Math.round(p.pricing.price)
    row.monthly_rent = p.pricing.monthlyRent != null ? Math.round(p.pricing.monthlyRent) : null
    row.currency = p.pricing.currency
    row.is_negotiable = p.pricing.isNegotiable
    if (p.pricing.deposit != null) row.deposit = Math.round(p.pricing.deposit)
    if (p.pricing.maintenanceFee != null) row.maintenance_fee = Math.round(p.pricing.maintenanceFee)
  }
  if (p.features) {
    const f = p.features
    row.area = f.area ?? 0
    row.bedrooms = f.bedrooms ?? null
    row.bathrooms = f.bathrooms ?? null
    row.parking_spots = f.parkingSpots ?? 0
    if (f.builtArea != null) row.built_area = f.builtArea
    if (f.lotSize != null) row.lot_size = f.lotSize
    if (f.floors != null) row.floors = f.floors
    if (f.yearBuilt != null) row.year_built = f.yearBuilt
    if (f.hasGarden != null) row.has_garden = f.hasGarden
    if (f.hasPool != null) row.has_pool = f.hasPool
    if (f.hasGym != null) row.has_gym = f.hasGym
    if (f.hasSecurity != null) row.has_security = f.hasSecurity
    if (f.hasElevator != null) row.has_elevator = f.hasElevator
    if (f.hasBalcony != null) row.has_balcony = f.hasBalcony
    if (f.hasTerrace != null) row.has_terrace = f.hasTerrace
    if (f.hasAirConditioning != null) row.has_air_conditioning = f.hasAirConditioning
    if (f.hasHeating != null) row.has_heating = f.hasHeating
    if (f.petFriendly != null) row.pet_friendly = f.petFriendly
    if (f.furnished != null) row.furnished = f.furnished
    if (f.newConstruction != null) row.new_construction = f.newConstruction
  }
  if (p.location) {
    row.latitude = p.location.latitude
    row.longitude = p.location.longitude
    row.address_street = p.location.address.street || null
    row.address_number = p.location.address.number ?? null
    row.address_commune = p.location.address.commune ?? null
    row.address_city = p.location.address.city || null
    row.address_region = p.location.address.region
  }
  if (p.media) row.images = p.media.images
  if (p.contact) {
    row.contact_name = p.contact.name
    row.contact_phone = p.contact.phone ?? null
    row.contact_email = p.contact.email ?? null
    row.contact_whatsapp = p.contact.whatsapp ?? null
    row.preferred_contact = p.contact.preferredMethod
  }
  if (p.tags !== undefined) row.tags = p.tags
  return row
}
