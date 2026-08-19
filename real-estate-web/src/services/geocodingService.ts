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
