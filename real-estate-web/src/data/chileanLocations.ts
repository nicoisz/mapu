import regionesComunas from './chile-regiones-comunas.json'
import localidades from './chile-localidades.json'

/**
 * Catálogo geográfico chileno vendido desde pituteando_front:
 *  - chile-regiones-comunas.json: región → comunas
 *  - chile-localidades.json:      localidades/ciudades por comuna
 * Una ciudad/localidad pertenece a una comuna; una comuna a una región.
 */

type RegionCommunes = Record<string, string[]>

interface LocalidadRow {
  region: string
  comuna: string
  name: string
  type?: string
}

const regionCommunes = regionesComunas as RegionCommunes
const localidadRows = localidades as LocalidadRow[]

export const REGIONS: string[] = Object.keys(regionCommunes)

export function communesForRegion(region: string): string[] {
  return regionCommunes[region] ?? []
}

/** Localidades/ciudades de una comuna, en orden y sin duplicados. */
export function localitiesForCommune(commune: string): string[] {
  const seen = new Set<string>()
  const names: string[] = []
  for (const l of localidadRows) {
    if (l.comuna === commune && !seen.has(l.name)) {
      seen.add(l.name)
      names.push(l.name.trim())
    }
  }
  return names
}

/** "SAN MIGUEL" → "San Miguel". Solo para mostrar, no altera el dato crudo. */
export function titleCase(s: string): string {
  return s.toLowerCase().replace(/(^|[\s-])(\S)/g, (_, sep: string, ch: string) => sep + ch.toUpperCase())
}
