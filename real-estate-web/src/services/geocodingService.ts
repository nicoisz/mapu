/**
 * Geocoding via Nominatim (OpenStreetMap) — no API key required. Used in
 * /publicar to turn a street address into lat/lng instead of falling back to
 * the Santiago center. Public policy allows light usage; queries are the
 * concatenated address with a country filter.
 */
export async function geocodeAddress(address: {
  street?: string
  commune?: string
  city?: string
  region?: string
}): Promise<{ latitude: number; longitude: number } | null> {
  const parts = [address.street, address.commune, address.city, 'Chile'].filter(Boolean)
  if (!parts.length) return null

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', parts.join(', '))
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')
  url.searchParams.set('countrycodes', 'cl')

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'mapu-real-estate-web (contact: mapu.app.admin@gmail.com)' },
    })
    if (!res.ok) return null
    const data = (await res.json()) as { lat: string; lon: string }[]
    if (!data.length) return null
    return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}

export interface GeocodeSuggestion {
  latitude: number
  longitude: number
  label: string
}

/** Nominatim /search — lista de coincidencias para autocompletar dirección. */
export async function searchAddress(
  query: string,
  opts?: { commune?: string }
): Promise<GeocodeSuggestion[]> {
  if (!query.trim()) return []
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', opts?.commune ? `${query}, ${opts.commune}` : query)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '6')
  url.searchParams.set('countrycodes', 'cl')

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'mapu-real-estate-web (contact: mapu.app.admin@gmail.com)' },
    })
    if (!res.ok) return []
    const data = (await res.json()) as {
      lat: string
      lon: string
      display_name: string
    }[]
    return data.map((d) => ({
      latitude: parseFloat(d.lat),
      longitude: parseFloat(d.lon),
      label: d.display_name,
    }))
  } catch {
    return []
  }
}

export interface ReverseGeocodeResult {
  latitude: number
  longitude: number
  label: string
  street: string
  number?: string
  commune?: string
  city?: string
}

/** Nominatim /reverse — dirección a partir de coordenadas (pin del mapa). */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult | null> {
  const url = new URL('https://nominatim.openstreetmap.org/reverse')
  url.searchParams.set('lat', String(latitude))
  url.searchParams.set('lon', String(longitude))
  url.searchParams.set('format', 'json')

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'mapu-real-estate-web (contact: mapu.app.admin@gmail.com)' },
    })
    if (!res.ok) return null
    const data = (await res.json()) as {
      display_name?: string
      address?: {
        road?: string
        house_number?: string
        city?: string
        town?: string
        village?: string
        municipality?: string
      }
    }
    const a = data.address ?? {}
    return {
      latitude,
      longitude,
      label: data.display_name ?? '',
      street: a.road ?? '',
      number: a.house_number,
      city: a.city ?? a.town ?? a.village ?? a.municipality,
    }
  } catch {
    return null
  }
}
