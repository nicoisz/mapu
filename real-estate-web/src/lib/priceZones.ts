import { Property } from '@/types/property'
import { PropertyOperation } from '@/types/enums'

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
}

/** Hex radius in degrees (~300 m at Santiago's latitude). */
const HEX_RADIUS = 0.0027

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

/** Mean price per populated hex cell + tercile bucket. */
export function computePriceZones(
  properties: Property[],
  mode: ZoneMode
): { cells: ZoneCell[]; legend: PriceZoneLegend } {
  const rad = HEX_RADIUS
  const agg = new Map<string, { sum: number; count: number }>()
  const centers = new Map<string, { lat: number; lng: number }>()

  for (const p of properties) {
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

  return { cells, legend: { ranges } }
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
