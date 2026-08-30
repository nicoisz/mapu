export const APP_CONFIG = {
  name: 'MapU Real Estate',
  version: '1.0.0',
  description: 'Encuentra tu propiedad ideal en Chile',
}

export const FREE_PLAN_LISTINGS_LIMIT = 3
export const LISTING_EXPIRATION_DAYS = 30
export const DEFAULT_SEARCH_RADIUS_KM = 5

/** Límite de resultados por consulta de catálogo (mapa/búsqueda) para evitar
 *  cargas sin cota en DB grandes. La lista del mapa pagina sobre este set. */
export const MAX_QUERY_RESULTS = 1000

/** Intervalo mínimo entre llamadas al geocoder (cumple política de uso). */
export const GEOCODING_MIN_INTERVAL_MS = 1100

export const DEFAULT_MAP_CENTER = {
  latitude: -33.4489,
  longitude: -70.6693,
}

export const DEFAULT_MAP_ZOOM = 12

// Target center + radius shown when switching to list view on /buscar.
export const LIST_VIEW_CENTER = {
  latitude: -33.625951,
  longitude: -70.855756,
}
export const LIST_VIEW_RADIUS_KM = 50

export const MAJOR_CITIES = [
  'Santiago',
  'Valparaíso',
  'Viña del Mar',
  'Concepción',
  'La Serena',
  'Antofagasta',
  'Temuco',
  'Rancagua',
  'Talca',
  'Arica',
  'Chillán',
  'Puerto Montt',
]

export const STORAGE_KEYS = {
  AUTH_TOKEN: '@RealEstate:auth_token',
  REFRESH_TOKEN: '@RealEstate:refresh_token',
  CURRENT_USER: '@RealEstate:current_user',
  FAVORITES: '@RealEstate:favorites',
  ONBOARDING_COMPLETED: '@RealEstate:onboarding_completed',
  RECENT_SEARCHES: '@RealEstate:recent_searches',
  USER_PROPERTIES: '@RealEstate:user_properties',
}

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  house: 'Casa',
  apartment: 'Departamento',
  land: 'Terreno',
  office: 'Oficina',
  commercial: 'Local comercial',
  warehouse: 'Bodega',
}

export const OPERATION_LABELS: Record<string, string> = {
  sale: 'Venta',
  rent: 'Arriendo',
}

export const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  expired: 'Expirado',
  sold: 'Vendido',
  rented: 'Arrendado',
}
