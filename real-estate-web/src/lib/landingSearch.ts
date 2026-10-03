import { PropertyOperation } from '@/types/enums'

export function parseSearchOperation(value: string | null): PropertyOperation | undefined {
  return value === PropertyOperation.SALE || value === PropertyOperation.RENT ? value : undefined
}

export function landingSearchUrl(tab: 'sale' | 'rent', location: string, type: string): string {
  const params = new URLSearchParams({ operation: tab })
  const query = [location.trim(), type].filter(Boolean).join(' ')
  if (query) params.set('q', query)
  return `/buscar?${params}`
}
