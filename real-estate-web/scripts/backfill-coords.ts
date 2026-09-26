/**
 * Encuentra las propiedades con coordenadas inválidas —las que quedaron en el
 * centro por defecto antes de que publicar exigiera una ubicación real, más
 * cualquiera fuera de Chile— las re-geocodifica desde su dirección y **emite
 * SQL** en `supabase/fix-coords.sql`.
 *
 * No escribe en la base: genera el SQL para revisarlo y correrlo en el SQL
 * Editor, igual que `seed.sql` y `fix-auth-trigger.sql`. Un script local que
 * hace UPDATE contra producción es justo lo que no queremos.
 *
 * Uso:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   npx tsx scripts/backfill-coords.ts
 */
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'
import { join } from 'path'
import { DEFAULT_MAP_CENTER, GEOCODING_MIN_INTERVAL_MS } from '../src/constants'
import { isInsideChile, isSamePoint } from '../src/lib/geo'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_KEY
if (!url || !key) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (o la key pública).')
  process.exit(1)
}

const NOMINATIM =
  process.env.NEXT_PUBLIC_GEOCODING_URL?.replace(/\/$/, '') || 'https://nominatim.openstreetmap.org'
const USER_AGENT = 'mapu-real-estate-web backfill-coords (contact: mapu.app.admin@gmail.com)'

interface Row {
  id: string
  title: string
  latitude: number
  longitude: number
  address_street: string | null
  address_number: string | null
  address_commune: string | null
  address_city: string | null
  address_region: string | null
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Una consulta por vez, espaciada, para respetar la política de Nominatim. */
async function geocode(row: Row): Promise<{ lat: number; lng: number } | null> {
  const query = [
    [row.address_street, row.address_number].filter(Boolean).join(' '),
    row.address_commune,
    row.address_city,
    'Chile',
  ]
    .filter(Boolean)
    .join(', ')

  const search = new URL(`${NOMINATIM}/search`)
  search.searchParams.set('q', query)
  search.searchParams.set('format', 'json')
  search.searchParams.set('limit', '1')
  search.searchParams.set('countrycodes', 'cl')

  const res = await fetch(search.toString(), { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) return null
  const data = (await res.json()) as { lat: string; lon: string }[]
  if (!data.length) return null

  const lat = parseFloat(data[0].lat)
  const lng = parseFloat(data[0].lon)
  return isInsideChile(lat, lng) ? { lat, lng } : null
}

async function main() {
  const supabase = createClient(url!, key!)
  const { data, error } = await supabase
    .from('properties')
    .select(
      'id, title, latitude, longitude, address_street, address_number, address_commune, address_city, address_region'
    )

  if (error) {
    console.error('No se pudo leer properties:', error.message)
    process.exit(1)
  }

  const rows = (data ?? []) as Row[]
  const broken = rows.filter(
    (r) =>
      !isInsideChile(r.latitude, r.longitude) ||
      isSamePoint(r.latitude, r.longitude, DEFAULT_MAP_CENTER)
  )

  console.log(`Propiedades revisadas: ${rows.length}`)
  console.log(`Con coordenadas inválidas: ${broken.length}`)
  if (!broken.length) return

  const updates: string[] = []
  const failed: Row[] = []

  for (const row of broken) {
    const hit = await geocode(row)
    if (hit) {
      updates.push(
        `update public.properties set latitude = ${hit.lat}, longitude = ${hit.lng} where id = '${row.id}';`
      )
      console.log(`  ✓ ${row.title} → ${hit.lat}, ${hit.lng}`)
    } else {
      failed.push(row)
      console.log(`  ✗ ${row.title} — sin resultado para su dirección`)
    }
    await sleep(GEOCODING_MIN_INTERVAL_MS)
  }

  const header = [
    '-- Corrección de coordenadas de avisos publicados antes de que /publicar',
    '-- exigiera una ubicación real (ver PR 1 en docs/PLAN-MAPA.md).',
    '--',
    '-- Generado por scripts/backfill-coords.ts. Idempotente: cada UPDATE',
    '-- apunta a un id y fija un valor constante, así que re-aplicarlo no',
    '-- cambia nada. REVISAR las coordenadas antes de mergear: el geocoder',
    '-- puede devolver una calle del mismo nombre en otra comuna.',
    `-- Propiedades corregidas: ${updates.length} de ${broken.length}.`,
    '',
  ]
  const footer = failed.length
    ? [
        '',
        '-- Sin geocodificar (dirección insuficiente). Requieren revisión manual:',
        ...failed.map((r) => `--   ${r.id}  ${r.title}`),
      ]
    : []

  const out = join(__dirname, '..', 'supabase', 'fix-coords.sql')
  writeFileSync(out, [...header, ...updates, ...footer].join('\n') + '\n', 'utf8')
  console.log(`\nSQL escrito en ${out}`)
  if (failed.length) console.log(`${failed.length} propiedades necesitan revisión manual.`)
}

void main()
