/**
 * Validación geográfica de coordenadas.
 *
 * Existe porque un aviso mal ubicado no es un problema de ese aviso: ensucia
 * el mapa, los clusters y las zonas de precio para todos. La regla es que una
 * propiedad sin coordenadas creíbles no se publica, en vez de caer en silencio
 * a un punto por defecto.
 */

/**
 * Caja que contiene el territorio nacional habitado: continente, Isla de
 * Pascua (lng ≈ -109,4), Juan Fernández (lng ≈ -80,7), Arica por el norte
 * (lat ≈ -17,5) y las islas al sur de Cabo de Hornos (lat ≈ -56,5).
 *
 * Es deliberadamente una caja y no un polígono: acá solo queremos descartar
 * el (0,0), el centro por defecto mal propagado y las coordenadas de otro
 * país. Afinar el borde con Argentina no aporta y da falsos negativos.
 */
export const CHILE_BOUNDS = {
  minLat: -56.6,
  maxLat: -17.4,
  minLng: -110.0,
  maxLng: -66.0,
} as const

/** true si la coordenada cae dentro de `CHILE_BOUNDS`. */
export function isInsideChile(latitude: number, longitude: number): boolean {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false
  return (
    latitude >= CHILE_BOUNDS.minLat &&
    latitude <= CHILE_BOUNDS.maxLat &&
    longitude >= CHILE_BOUNDS.minLng &&
    longitude <= CHILE_BOUNDS.maxLng
  )
}

/** Tolerancia para comparar contra un punto conocido: ~11 m. */
const SAME_POINT_EPSILON = 0.0001

/**
 * true si la coordenada es, en la práctica, el punto de referencia dado.
 * Se usa para detectar los avisos que quedaron en el centro por defecto
 * antes de que publicar exigiera una ubicación real.
 */
export function isSamePoint(
  latitude: number,
  longitude: number,
  reference: { latitude: number; longitude: number }
): boolean {
  return (
    Math.abs(latitude - reference.latitude) < SAME_POINT_EPSILON &&
    Math.abs(longitude - reference.longitude) < SAME_POINT_EPSILON
  )
}
