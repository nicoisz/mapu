/**
 * Feature flags del mapa.
 *
 * Existen para que las fases que necesitan más de un PR antes de ser usables
 * puedan entrar a `main` apagadas, sin ramas de integración largas: en este
 * repo mergear a `main` es desplegar a producción (ver `docs/PLAN-MAPA.md`).
 *
 * Reglas:
 * - Cada flag se lee con su nombre literal. Next.js inlinea `NEXT_PUBLIC_*`
 *   en tiempo de build solo cuando la referencia es estática, así que
 *   `process.env[nombre]` NO funciona en el bundle del cliente.
 * - Por defecto apagadas: si la variable no está definida, la feature no existe.
 * - Se borran cuando la fase termina y la feature queda fija.
 */

/** Solo "true" y "1" encienden un flag; cualquier otra cosa lo deja apagado. */
function enabled(value: string | undefined): boolean {
  return value === 'true' || value === '1'
}

export const flags = {
  /** Capa Contexto: transporte, colegios, salud, áreas verdes (PR 15–18). */
  contexto: enabled(process.env.NEXT_PUBLIC_FEATURE_CONTEXTO),

  /** "Mis lugares": anclas e isocronas como filtro de búsqueda (PR 19–20). */
  misLugares: enabled(process.env.NEXT_PUBLIC_FEATURE_MIS_LUGARES),

  /** Capas de valor: UF/m², variación SII, sector en movimiento (PR 21–24). */
  valor: enabled(process.env.NEXT_PUBLIC_FEATURE_VALOR),
} as const

export type FeatureFlag = keyof typeof flags
