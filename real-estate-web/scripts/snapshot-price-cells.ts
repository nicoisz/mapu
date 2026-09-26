/**
 * Snapshot mensual de precio por m² y por sector.
 *
 * La plusvalía necesita dos momentos en el tiempo. Este script produce uno
 * cada mes desde el inventario propio, que es la única serie que nadie puede
 * copiar. No muestra nada hoy: su valor depende del tiempo que lleve
 * corriendo (ver docs/PLAN-MAPA.md, PR 4 y PR 22).
 *
 * Emite SQL en vez de escribir en la base, igual que `backfill-coords.ts`.
 * El workflow lo aplica con `supabase db push`-style ejecución; a mano se
 * revisa antes de correr.
 *
 * Uso:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   npx tsx scripts/snapshot-price-cells.ts [YYYY-MM]
 */
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'
import { join } from 'path'
import { cellFor } from '../src/lib/priceZones'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_KEY
if (!url || !key) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (o la key pública).')
  process.exit(1)
}

interface Row {
  latitude: number
  longitude: number
  operation: 'sale' | 'rent'
  currency: string
  price: number
  monthly_rent: number | null
  area: number | null
}

interface Bucket {
  cellId: string
  center: { lat: number; lng: number }
  operation: string
  currency: string
  values: number[]
}

/** Primer día del mes pedido, o del mes en curso. */
function resolvePeriod(arg?: string): string {
  const now = arg ? new Date(`${arg}-01T00:00:00Z`) : new Date()
  if (Number.isNaN(now.getTime())) {
    console.error(`Período inválido: ${arg}. Usa YYYY-MM.`)
    process.exit(1)
  }
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

async function main() {
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')
  const period = resolvePeriod(args.find((a) => !a.startsWith('--')))
  const supabase = createClient(url!, key!)

  const { data, error } = await supabase
    .from('properties')
    .select('latitude, longitude, operation, currency, price, monthly_rent, area')
    .eq('status', 'active')

  if (error) {
    console.error('No se pudo leer properties:', error.message)
    process.exit(1)
  }

  const buckets = new Map<string, Bucket>()

  for (const row of (data ?? []) as Row[]) {
    // Sin superficie no hay precio por m². Sin precio tampoco.
    const price = row.operation === 'rent' ? (row.monthly_rent ?? row.price) : row.price
    if (!row.area || row.area <= 0 || !price || price <= 0) continue
    if (!Number.isFinite(row.latitude) || !Number.isFinite(row.longitude)) continue

    const cell = cellFor(row.latitude, row.longitude)
    const bucketKey = `${cell.id}|${row.operation}|${row.currency}`
    const bucket = buckets.get(bucketKey) ?? {
      cellId: cell.id,
      center: cell.center,
      operation: row.operation,
      currency: row.currency,
      values: [],
    }
    bucket.values.push(price / row.area)
    buckets.set(bucketKey, bucket)
  }

  if (!buckets.size) {
    console.log('Sin datos suficientes para el snapshot. No se escribe SQL.')
    return
  }

  const records = [...buckets.values()].map((b) => ({
    period,
    cell_id: b.cellId,
    center_lat: b.center.lat,
    center_lng: b.center.lng,
    operation: b.operation,
    currency: b.currency,
    price_per_m2_mean: Number(
      (b.values.reduce((sum, v) => sum + v, 0) / b.values.length).toFixed(4)
    ),
    price_per_m2_median: Number(median(b.values).toFixed(4)),
    n: b.values.length,
  }))

  const withLowN = records.filter((r) => r.n < 3).length
  console.log(`Período ${period}`)
  console.log(`Celdas: ${records.length} (${withLowN} con menos de 3 avisos)`)

  if (apply) {
    const { error: upsertError } = await supabase
      .from('price_cell_snapshots')
      .upsert(records, { onConflict: 'period,cell_id,operation,currency' })
    if (upsertError) {
      console.error('No se pudo escribir el snapshot:', upsertError.message)
      process.exit(1)
    }
    console.log('Snapshot aplicado.')
    return
  }

  const rows = records.map(
    (r) =>
      `  ('${r.period}', '${r.cell_id}', ${r.center_lat}, ${r.center_lng}, '${r.operation}', '${r.currency}', ${r.price_per_m2_mean}, ${r.price_per_m2_median}, ${r.n})`
  )

  const sql = [
    `-- Snapshot de precio por m² y sector — período ${period}.`,
    '-- Generado por scripts/snapshot-price-cells.ts.',
    '-- Idempotente: el unique (period, cell_id, operation, currency) hace que',
    '-- re-correrlo dentro del mismo mes actualice en vez de duplicar.',
    'insert into public.price_cell_snapshots',
    '  (period, cell_id, center_lat, center_lng, operation, currency, price_per_m2_mean, price_per_m2_median, n)',
    'values',
    rows.join(',\n'),
    'on conflict (period, cell_id, operation, currency) do update set',
    '  center_lat = excluded.center_lat,',
    '  center_lng = excluded.center_lng,',
    '  price_per_m2_mean = excluded.price_per_m2_mean,',
    '  price_per_m2_median = excluded.price_per_m2_median,',
    '  n = excluded.n;',
    '',
  ].join('\n')

  const out = join(__dirname, '..', 'supabase', `snapshot-${period}.sql`)
  writeFileSync(out, sql, 'utf8')
  console.log(`SQL escrito en ${out}. Corre con --apply para escribir en la base.`)
}

void main()
