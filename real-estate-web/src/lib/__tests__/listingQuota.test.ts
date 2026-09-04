import { describe, it, expect } from 'vitest'
import { isPremiumAccount, hasReachedListingLimit } from '@/lib/listingQuota'

const NOW = new Date('2026-09-04T12:00:00Z')

describe('isPremiumAccount', () => {
  it('premium es premium siempre', () => {
    expect(isPremiumAccount('premium', null, NOW)).toBe(true)
    expect(isPremiumAccount('premium', '2020-01-01T00:00:00Z', NOW)).toBe(true)
  })

  it('free con trial activo cuenta como premium', () => {
    expect(isPremiumAccount('free', '2026-09-05T00:00:00Z', NOW)).toBe(true)
  })

  it('free con trial expirado no es premium', () => {
    expect(isPremiumAccount('free', '2026-09-03T00:00:00Z', NOW)).toBe(false)
  })

  it('free sin trial no es premium', () => {
    expect(isPremiumAccount('free', null, NOW)).toBe(false)
    expect(isPremiumAccount(null, null, NOW)).toBe(false)
    expect(isPremiumAccount(undefined, undefined, NOW)).toBe(false)
  })
})

describe('hasReachedListingLimit', () => {
  it('premium nunca alcanza el límite', () => {
    expect(hasReachedListingLimit(99, true)).toBe(false)
  })

  it('free por debajo del límite puede publicar', () => {
    expect(hasReachedListingLimit(0, false)).toBe(false)
  })

  it('free en el límite no puede publicar', () => {
    expect(hasReachedListingLimit(1, false)).toBe(true)
  })

  it('free por encima del límite no puede publicar', () => {
    expect(hasReachedListingLimit(5, false)).toBe(true)
  })

  it('respeta un límite custom', () => {
    expect(hasReachedListingLimit(2, false, 3)).toBe(false)
    expect(hasReachedListingLimit(3, false, 3)).toBe(true)
  })
})
