import { beforeEach, describe, expect, it, vi } from 'vitest'

const rpc = vi.fn()
const getByIds = vi.fn()
vi.mock('@/lib/supabase', () => ({ getSupabase: () => ({ rpc }) }))
vi.mock('@/services/propertyService', () => ({ propertyService: { getByIds } }))
const { interestsService } = await import('@/services/interestsService')

beforeEach(() => {
  rpc.mockReset()
  getByIds.mockReset()
})

describe('interest RPC contracts', () => {
  it('preserves server scoring, ordering and read boundary with one property batch', async () => {
    rpc.mockResolvedValue({
      data: {
        seen_before: '2026-10-03T12:00:00Z',
        items: [
          {
            property_id: 'b',
            interest_id: 'i',
            filters: {
              version: 1,
              operation: 'sale',
              types: ['land'],
              communes: [],
              alternativeCommunes: [],
              currency: 'CLP',
              budgetFlexibility: 0,
              features: [],
              required: [],
            },
            score: 85,
            reasons: [],
            is_new: true,
          },
          {
            property_id: 'a',
            interest_id: 'i',
            filters: {
              version: 1,
              operation: 'sale',
              types: ['land'],
              communes: [],
              alternativeCommunes: [],
              currency: 'CLP',
              budgetFlexibility: 0,
              features: [],
              required: [],
            },
            score: 31,
            reasons: [],
            is_new: false,
          },
        ],
      },
      error: null,
    })
    getByIds.mockResolvedValue([{ id: 'a' }, { id: 'b' }])
    const result = await interestsService.getMatches(0)
    expect(result.items.map((m) => [m.property.id, m.score])).toEqual([
      ['b', 85],
      ['a', 31],
    ])
    expect(result.seenBefore).toBe('2026-10-03T12:00:00Z')
    expect(getByIds).toHaveBeenCalledExactlyOnceWith(['b', 'a'])
    expect(rpc).toHaveBeenCalledWith('get_interest_matches', { page_size: 20, page_offset: 0 })
  })
  it('does not disguise failed requests as zero matches or demand', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'database offline' } })
    await expect(interestsService.getNewCount()).rejects.toThrow()
    await expect(interestsService.getOwnedDemand(['p'])).rejects.toThrow()
    await expect(interestsService.markSeen('2026-10-03T12:00:00Z')).rejects.toThrow()
  })
  it('maps aggregate demand without exposing interested user identities', async () => {
    rpc.mockResolvedValue({
      data: [{ property_id: 'p', users: 2, exact_users: 1, partial_users: 1 }],
      error: null,
    })
    expect(await interestsService.getOwnedDemand(['p'])).toEqual([
      { propertyId: 'p', users: 2, exactUsers: 1, partialUsers: 1 },
    ])
  })
})
