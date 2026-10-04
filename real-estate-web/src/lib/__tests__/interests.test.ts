import { expect, it } from 'vitest'
import { cleanInterestFilters, defaultInterestFilters, interestLabel } from '@/lib/interests'
import { PropertyType } from '@/types/enums'

it('changing to land clears housing answers and required flags while keeping area', () => {
  const result = cleanInterestFilters({
    ...defaultInterestFilters(),
    types: [PropertyType.LAND],
    minBedrooms: 3,
    minBathrooms: 2,
    minArea: 100,
    required: ['minBedrooms', 'minBathrooms', 'minArea'],
  })
  expect(result.minBedrooms).toBeUndefined()
  expect(result.minBathrooms).toBeUndefined()
  expect(result.required).toEqual(['minArea'])
  expect(interestLabel(result)).toContain('Terrenos / parcelas')
})
it('omitting numeric and location criteria removes restrictions, including required', () => {
  const result = cleanInterestFilters({
    ...defaultInterestFilters(),
    maxPrice: 0,
    communes: [],
    alternativeCommunes: ['Valdivia'],
    required: ['maxPrice', 'communes', 'has_garden'],
  })
  expect(result.maxPrice).toBeUndefined()
  expect(result.alternativeCommunes).toEqual([])
  expect(result.required).toEqual([])
})
