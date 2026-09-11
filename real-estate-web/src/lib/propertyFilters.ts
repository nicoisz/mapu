/**
 * Filtros PostgREST compartidos entre cliente y servidor (puros, sin cliente).
 */

/** Listings que siguen publicados: status active y no vencidos.
 *  expires_at NULL (filas legacy) cuenta como que nunca vence. */
export function activeExpiryFilter(): string {
  return `expires_at.is.null,expires_at.gte.${new Date().toISOString()}`
}
