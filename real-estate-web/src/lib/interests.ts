import { PROPERTY_TYPE_LABELS } from '@/constants'
import { Currency, PropertyOperation, PropertyType } from '@/types/enums'
import type { InterestFilters } from '@/types/interests'

export const INTEREST_FEATURES: Record<string, string> = {
  has_garden: 'Jardín',
  has_pool: 'Piscina',
  has_gym: 'Gimnasio',
  has_security: 'Seguridad',
  has_elevator: 'Ascensor',
  has_balcony: 'Balcón',
  has_terrace: 'Terraza',
  has_air_conditioning: 'Aire acondicionado',
  has_heating: 'Calefacción',
  pet_friendly: 'Acepta mascotas',
  furnished: 'Amoblada',
  new_construction: 'Construcción nueva',
  parking: 'Estacionamiento',
}
export const INTEREST_CRITERIA: Record<string, string> = {
  types: 'Tipo de propiedad',
  communes: 'Ubicación',
  maxPrice: 'Presupuesto',
  minArea: 'Superficie mínima',
  minBedrooms: 'Dormitorios',
  minBathrooms: 'Baños',
  ...INTEREST_FEATURES,
}
export const interestTypeLabel = (type: PropertyType) =>
  type === PropertyType.LAND ? 'Terrenos / parcelas' : PROPERTY_TYPE_LABELS[type]
export const hasHousingTypes = (f: InterestFilters) =>
  f.types.some((t) => t === PropertyType.HOUSE || t === PropertyType.APARTMENT)
export const defaultInterestFilters = (): InterestFilters => ({
  version: 1,
  operation: PropertyOperation.SALE,
  types: [],
  communes: [],
  alternativeCommunes: [],
  currency: Currency.CLP,
  budgetFlexibility: 0,
  features: [],
  required: [],
})
export function cleanInterestFilters(input: InterestFilters): InterestFilters {
  const f = { ...input }
  if (!hasHousingTypes(f)) {
    delete f.minBedrooms
    delete f.minBathrooms
  }
  for (const key of ['maxPrice', 'minArea', 'minBedrooms', 'minBathrooms'] as const) {
    if (!f[key] || f[key]! <= 0) delete f[key]
  }
  f.alternativeCommunes = f.communes.length
    ? f.alternativeCommunes.filter((c) => !f.communes.includes(c))
    : []
  const answered = new Set([
    'types',
    ...(f.communes.length ? ['communes'] : []),
    ...f.features,
    ...['maxPrice', 'minArea', 'minBedrooms', 'minBathrooms'].filter((k) => k in f),
  ])
  f.required = f.required.filter((k) => answered.has(k))
  return f
}
export function interestLabel(f: InterestFilters): string {
  return [
    f.operation === 'sale' ? 'Comprar' : 'Arrendar',
    f.types.map(interestTypeLabel).join(' / '),
    f.communes.length ? `en ${f.communes.join(', ')}` : '',
    f.maxPrice
      ? `hasta ${new Intl.NumberFormat('es-CL', { style: 'currency', currency: f.currency, maximumFractionDigits: 0 }).format(f.maxPrice)}`
      : '',
  ]
    .filter(Boolean)
    .join(' ')
}
