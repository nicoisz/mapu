/**
 * Geocoding con un solo proveedor configurable (Nominatim por defecto).
 *
 * Cambios respecto a la versión anterior:
 * - URL base configurable vía `NEXT_PUBLIC_GEOCODING_URL` (permite self-hosted
 *   Nominatim o un proxy) con fallback a openstreetmap.org.
 * - Throttle: mínimo 1.1s entre llamadas (respeta política de uso de
 *   Nominatim: 1 req/s) — evita que varios usuarios/autocompletados baneen la IP.
 * - Cache por clave de consulta para no repetir requests iguales.
 */

import { GEOCODING_MIN_INTERVAL_MS } from '@/constants'
import { isInsideChile } from '@/lib/geo'

const BASE_URL =
  process.env.NEXT_PUBLIC_GEOCODING_URL?.replace(/\/$/, '') || 'https://nominatim.openstreetmap.org'

const USER_AGENT = 'mapu-real-estate-web (contact: mapu.app.admin@gmail.com)'

/** Throttle simple: encola y espacia las llamadas GEOCODING_MIN_INTERVAL_MS. */
let lastCallAt = 0
let pending: Promise<unknown> = Promise.resolve()
function throttle<T>(fn: () => Promise<T>): Promise<T> {
  const result = pending.then(async () => {
    const wait = lastCallAt + GEOCODING_MIN_INTERVAL_MS - Date.now()
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait))
    try {
      return await fn()
    } finally {
      lastCallAt = Date.now()
    }
  })
  pending = result.catch(() => undefined)
  return result
}
/** Cache en memoria de resultados por clave (evita requests repetidos). */
const cache = new Map<string, unknown>()
const CACHE_MAX = 300

function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key) as T | undefined
  if (hit !== undefined) return Promise.resolve(hit)
  return fn().then((value) => {
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string)
    cache.set(key, value)
    return value
  })
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) return null
  return (await res.json()) as T
}

const searchUrl = (q: string, limit: number): string => {
  const url = new URL(`${BASE_URL}/search`)
  url.searchParams.set('q', q)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('countrycodes', 'cl')
  return url.toString()
}

const reverseUrl = (lat: number, lng: number): string => {
  const url = new URL(`${BASE_URL}/reverse`)
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lng))
  url.searchParams.set('format', 'json')
  return url.toString()
}

export interface GeocodeSuggestion {
  latitude: number
  longitude: number
  label: string
}

export async function searchAddress(
  query: string,
  opts?: { commune?: string; city?: string; region?: string }
): Promise<GeocodeSuggestion[]> {
  if (!query.trim()) return []
  const q = Array.from(
    new Set([query.trim(), opts?.commune, opts?.city, opts?.region, 'Chile'].filter(Boolean))
  ).join(', ')
  return cached(`sug:${q}`, () =>
    throttle(async () => {
      const data = await fetchJson<{ lat: string; lon: string; display_name: string }[]>(
        searchUrl(q, 6)
      )
      return (data ?? [])
        .map((d) => ({
          latitude: parseFloat(d.lat),
          longitude: parseFloat(d.lon),
          label: d.display_name,
        }))
        .filter((suggestion) => isInsideChile(suggestion.latitude, suggestion.longitude))
    })
  )
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

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult | null> {
  const key = `rev:${latitude.toFixed(5)},${longitude.toFixed(5)}`
  return cached(key, () =>
    throttle(async () => {
      const data = await fetchJson<{
        display_name?: string
        address?: {
          road?: string
          house_number?: string
          city?: string
          town?: string
          village?: string
          municipality?: string
          county?: string
        }
      }>(reverseUrl(latitude, longitude))
      if (!data) return null
      const a = data.address ?? {}
      const city = a.city ?? a.town ?? a.village ?? a.municipality
      return {
        latitude,
        longitude,
        label: data.display_name ?? '',
        street: a.road ?? '',
        number: a.house_number,
        commune: a.county ?? city,
        city,
      }
    })
  )
}
