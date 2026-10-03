import { describe, expect, it } from 'vitest'
import { landingSearchUrl, parseSearchOperation } from '@/lib/landingSearch'
import { searchService } from '@/services/searchService'
import { PropertyOperation } from '@/types/enums'

describe('Landing search operation', () => {
  it.each(['sale', 'rent'] as const)('keeps %s explicit with an empty query', (operation) => {
    const url = new URL(landingSearchUrl(operation, '', ''), 'https://mapu.test')
    expect(url.searchParams.get('operation')).toBe(operation)
  })

  it('preserves location and type without allowing typed text to override Comprar', () => {
    const url = new URL(landingSearchUrl('sale', 'Ñuñoa arriendo', 'casa'), 'https://mapu.test')
    const filters = searchService.buildSearchQuery(url.searchParams.get('q')!, {
      operation: parseSearchOperation(url.searchParams.get('operation')),
    }).filters
    expect(filters?.operation).toBe(PropertyOperation.SALE)
    expect(url.searchParams.get('q')).toBe('Ñuñoa arriendo casa')
  })

  it('rejects unsupported URL operations', () => {
    expect(parseSearchOperation('invalid')).toBeUndefined()
    expect(parseSearchOperation(null)).toBeUndefined()
  })
})
