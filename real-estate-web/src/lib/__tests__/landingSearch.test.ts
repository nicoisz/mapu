import { describe, expect, it } from 'vitest'
import { isPropertyCode, landingSearchUrl, parseSearchOperation } from '@/lib/landingSearch'
import { searchService } from '@/services/searchService'
import { PropertyOperation } from '@/types/enums'

describe('Landing search operation', () => {
  it.each(['sale', 'rent'] as const)('keeps %s explicit with an empty query', (operation) => {
    const url = new URL(landingSearchUrl(operation, '', ''), 'https://luky.test')
    expect(url.searchParams.get('operation')).toBe(operation)
  })

  it('preserves location and type without allowing typed text to override Comprar', () => {
    const url = new URL(landingSearchUrl('sale', 'Ñuñoa arriendo', 'casa'), 'https://luky.test')
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

  it('detects property codes but not plain words', () => {
    expect(isPropertyCode('AF5')).toBe(true)
    expect(isPropertyCode('0P8')).toBe(true)
    expect(isPropertyCode(' 1000 ')).toBe(true)
    expect(isPropertyCode('wea')).toBe(false)
    expect(isPropertyCode('sur')).toBe(false)
    expect(isPropertyCode('Ñuñoa')).toBe(false)
    expect(isPropertyCode('abcdef')).toBe(false)
  })
})
