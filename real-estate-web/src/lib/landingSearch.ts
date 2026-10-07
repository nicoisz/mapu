import { PropertyOperation } from '@/types/enums'

export function parseSearchOperation(value: string | null): PropertyOperation | undefined {
  return value === PropertyOperation.SALE || value === PropertyOperation.RENT ? value : undefined
}

/** Un código de propiedad es 3-4 alfanuméricos con al menos un dígito. El
 *  dígito evita rutear búsquedas de 3 letras (p.ej. "sur") a /propiedad. */
export function isPropertyCode(value: string): boolean {
  const v = value.trim()
  return /^[A-Za-z0-9]{3,4}$/.test(v) && /[0-9]/.test(v)
}

export function landingSearchUrl(tab: 'sale' | 'rent', location: string, type: string): string {
  const params = new URLSearchParams({ operation: tab })
  const query = [location.trim(), type].filter(Boolean).join(' ')
  if (query) params.set('q', query)
  return `/buscar?${params}`
}
