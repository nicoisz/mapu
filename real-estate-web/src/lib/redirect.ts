/**
 * Valida un destino `?next=` tras login. Solo permite rutas internas
 * absolutas; rechaza open-redirect (protocolo-relative, esquemas, backslash
 * y variantes codificadas). Devuelve '/' si el valor no es seguro.
 */
export function safeRedirectPath(raw: string | null | undefined): string {
  if (!raw) return '/'
  if (!raw.startsWith('/')) return '/'
  if (raw.startsWith('//')) return '/'
  if (raw.includes('\\') || raw.includes('\u0000')) return '/'

  let decoded: string
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    return '/'
  }
  if (decoded.startsWith('//')) return '/'
  if (decoded.includes('\\')) return '/'
  if (/^[a-z][a-z0-9+.-]*:/i.test(decoded)) return '/'

  return raw
}
