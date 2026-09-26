import { Property } from '@/types/property'
import { Currency, PropertyOperation } from '@/types/enums'

/**
 * Choropleth zones built from the actual property dataset — no external
 * boundary files needed. Properties are aggregated into a hexagonal grid;
 * each populated hex gets the mean price of the properties inside it, and
 * buckets are assigned by terciles over the set of cell means (equitable:
 * ~1/3 of zones in each band). Ranges come from the data, not hardcoded.
 *
 * `sale` buckets use `pricing.price`; `rent` buckets use `monthlyRent`
 * (falling back to `price`), so the two operations are compared separately.
 */

export type ZoneMode = 'sale' | 'rent'
export type ZoneBucket = 'economic' | 'mid' | 'premium'

export interface ZoneCell {
  id: string
  center: { lat: number; lng: number }
  meanPrice: number
  count: number
  bucket: ZoneBucket
}

export interface PriceZoneLegend {
  ranges: Partial<Record<ZoneBucket, [number, number]>>
  /** Moneda en la que están expresados los rangos (ver `dominantCurrency`). */
  currency: Currency
}

/** Hex radius in degrees (~200 m at Santiago's latitude). */
const HEX_RADIUS = 0.0018

const COLORS: Record<ZoneBucket, string> = {
  economic: '#3B82F6', // azul — zona económica
  mid: '#8B5CF6', // morado — coste medio
  premium: '#D4AF37', // dorado — zona más cara
}

export function getZoneColor(bucket: ZoneBucket): string {
  return COLORS[bucket]
}

/** easeOutElastic: overshoots past the target and oscillates back (muelle). */
export function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  const c4 = (2 * Math.PI) / 3
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

/** Rounds fractional axial coords to the nearest hex cell (pointy-top). */
function axialRound(q: number, r: number): { q: number; r: number } {
  const y = -q - r
  let rq = Math.round(q)
  let rr = Math.round(r)
  const ry = Math.round(y)
  const dq = Math.abs(q - rq)
  const dr = Math.abs(r - rr)
  const dy = Math.abs(y - ry)
  if (dq > dr && dq > dy) rq = -ry - rr
  else if (dr > dy) rr = -rq - ry
  return { q: rq, r: rr }
}

/** Lng/lat → axial hex coords. Longitude is cos(lat)-scaled so hexes stay
 *  roughly equilateral on screen across Chile's latitudes. */
function axialFromLngLat(lng: number, lat: number, rad: number): { q: number; r: number } {
  const x = lng * Math.cos((lat * Math.PI) / 180)
  const y = lat
  const q = ((2 / 3) * x) / rad
  const r = (-(1 / 3) * x + (Math.sqrt(3) / 3) * y) / rad
  return axialRound(q, r)
}

/** Axial coords → center lng/lat (pointy-top hexes).
 *
 *  Inverse of `axialFromLngLat`: the y-axis is the raw latitude, and the x-axis
 *  is longitude pre-scaled by cos(lat). Recovered as
 *    lat = rad·√3·(r + q/2)      (from the r equation)
 *    lng = q·rad·1.5 / cos(lat)  (undoing the cos(lat) scaling of x)
 */
function centerLngLat(q: number, r: number, rad: number): { lat: number; lng: number } {
  const lat = rad * Math.sqrt(3) * (r + q / 2)
  const x = q * rad * 1.5
  const cosLat = Math.cos((lat * Math.PI) / 180)
  return { lat, lng: x / (cosLat || 1) }
}

/** Polygon vertices for a pointy-top hex (6 corners, first one at the top). */
function hexVertices(lng: number, lat: number, rad: number): [number, number][] {
  const cosLat = Math.cos((lat * Math.PI) / 180) || 1
  const verts: [number, number][] = []
  for (let i = 0; i < 6; i++) {
    const ang = (Math.PI / 180) * (60 * i + 30)
    verts.push([lng + (rad * Math.cos(ang)) / cosLat, lat + rad * Math.sin(ang)])
  }
  return verts
}

/** Assigns each cell a bucket by terciles over the sorted cell means. Falls
 *  back to a mid split when there are fewer than 3 populated cells. */
function assignBuckets(cells: ZoneCell[]): void {
  const n = cells.length
  if (n === 0) return
  const sorted = [...cells].sort((a, b) => a.meanPrice - b.meanPrice)
  let lo: number
  let hi: number
  if (n === 1) {
    lo = hi = sorted[0].meanPrice
  } else if (n === 2) {
    lo = sorted[0].meanPrice
    hi = sorted[1].meanPrice
  } else {
    lo = sorted[Math.ceil(n / 3) - 1].meanPrice
    hi = sorted[Math.ceil((2 * n) / 3) - 1].meanPrice
  }
  cells.forEach((cell) => {
    if (cell.meanPrice <= lo) cell.bucket = 'economic'
    else if (cell.meanPrice <= hi) cell.bucket = 'mid'
    else cell.bucket = 'premium'
  })
}

/** Finds the populated hex cell containing a coordinate, or undefined if that
 *  sector has no property data. Reuses the exact same axial bucketing as
 *  computePriceZones, so lookups stay consistent with the rendered map. */
export function findZone(cells: ZoneCell[], lat: number, lng: number): ZoneCell | undefined {
  const { q, r } = axialFromLngLat(lng, lat, HEX_RADIUS)
  const key = `${q}:${r}`
  return cells.find((c) => c.id === key)
}

/**
 * Moneda dominante del conjunto, para no promediar monedas distintas.
 *
 * Un promedio que mezcla CLP con USD no significa nada: 300.000 y 300.000.000
 * entran al mismo tercil. Hoy toda la app publica en CLP, así que esto no
 * cambia ningún resultado; existe para que el día que entre otra moneda las
 * zonas no empiecen a mentir en silencio.
 */
function dominantCurrency(properties: Property[]): Currency {
  const counts = new Map<Currency, number>()
  for (const p of properties) {
    counts.set(p.pricing.currency, (counts.get(p.pricing.currency) ?? 0) + 1)
  }
  let winner = Currency.CLP
  let best = 0
  for (const [currency, count] of counts) {
    if (count > best) {
      winner = currency
      best = count
    }
  }
  return winner
}

/** Mean price per populated hex cell + tercile bucket. */
export function computePriceZones(
  properties: Property[],
  mode: ZoneMode
): { cells: ZoneCell[]; legend: PriceZoneLegend } {
  const rad = HEX_RADIUS
  const agg = new Map<string, { sum: number; count: number }>()
  const centers = new Map<string, { lat: number; lng: number }>()

  // Solo la operación del modo. Antes no se filtraba: en modo "arriendo" una
  // propiedad en venta entraba igual, con su precio de venta como fallback,
  // y arrastraba los terciles hacia arriba.
  const operation = mode === 'rent' ? PropertyOperation.RENT : PropertyOperation.SALE
  const scoped = properties.filter((p) => p.operation === operation)
  const currency = dominantCurrency(scoped)

  for (const p of scoped) {
    if (p.pricing.currency !== currency) continue
    const price = mode === 'rent' ? (p.pricing.monthlyRent ?? p.pricing.price) : p.pricing.price
    if (!price || price <= 0) continue

    const { q, r } = axialFromLngLat(p.location.longitude, p.location.latitude, rad)
    const key = `${q}:${r}`
    const cur = agg.get(key) ?? { sum: 0, count: 0 }
    cur.sum += price
    cur.count += 1
    agg.set(key, cur)
    centers.set(key, centerLngLat(q, r, rad))
  }

  const cells: ZoneCell[] = [...agg.entries()].map(([key, a]) => {
    const c = centers.get(key)!
    return { id: key, center: c, meanPrice: a.sum / a.count, count: a.count, bucket: 'mid' }
  })
  assignBuckets(cells)

  const ranges: PriceZoneLegend['ranges'] = {}
  for (const bucket of ['economic', 'mid', 'premium'] as ZoneBucket[]) {
    const values = cells.filter((c) => c.bucket === bucket).map((c) => c.meanPrice)
    if (values.length) ranges[bucket] = [Math.min(...values), Math.max(...values)]
  }

  return { cells, legend: { ranges, currency } }
}

export interface ZoneFeatureProperties {
  id: string
  bucket: ZoneBucket
  meanPrice: number
  count: number
}

/** GeoJSON FeatureCollection of hex polygons ready for map.addSource/setData. */
export function zonesToGeoJSON(cells: ZoneCell[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: cells.map((cell) => ({
      type: 'Feature' as const,
      id: cell.id,
      properties: {
        id: cell.id,
        bucket: cell.bucket,
        meanPrice: Math.round(cell.meanPrice),
        count: cell.count,
      } satisfies ZoneFeatureProperties,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          [
            ...hexVertices(cell.center.lng, cell.center.lat, HEX_RADIUS),
            hexVertices(cell.center.lng, cell.center.lat, HEX_RADIUS)[0],
          ],
        ],
      },
    })),
  }
}

/** GeoJSON of one hexagon per property, centered exactly on the property's
 *  pin, colored by the bucket of the cell that contains it. Keeps the pin at
 *  the visual center of its zone. Properties with no priced cell are skipped. */
export function propertyHexesToGeoJSON(
  properties: Property[],
  cells: ZoneCell[]
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = []
  for (const p of properties) {
    const cell = findZone(cells, p.location.latitude, p.location.longitude)
    if (!cell) continue
    const verts = hexVertices(p.location.longitude, p.location.latitude, HEX_RADIUS)
    features.push({
      type: 'Feature' as const,
      id: p.id,
      properties: {
        id: p.id,
        bucket: cell.bucket,
        meanPrice: Math.round(cell.meanPrice),
        count: cell.count,
      } satisfies ZoneFeatureProperties,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[...verts, verts[0]]],
      },
    })
  }
  return { type: 'FeatureCollection' as const, features }
}

/** Scales a hex's vertices around its center — used by the elastic animation. */
export function scaleZoneGeometry(
  verts: [number, number][],
  center: { lat: number; lng: number },
  scale: number
): [number, number][] {
  return verts.map(([lng, lat]) => [
    center.lng + (lng - center.lng) * scale,
    center.lat + (lat - center.lat) * scale,
  ])
}
