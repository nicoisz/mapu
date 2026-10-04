import { expect, it } from 'vitest'
import { defaultInterestFilters, simplifyInterestFilters } from '@/lib/interests'
import { readInterestDraft, writeInterestDraft, clearInterestDraft } from '@/lib/interestDraft'
import { PropertyType } from '@/types/enums'

it('treats all selected communes equally and removes indispensable flags', () => {
  const f = simplifyInterestFilters({
    ...defaultInterestFilters(),
    types: [PropertyType.HOUSE],
    communes: ['Valdivia'],
    alternativeCommunes: ['La Unión'],
    required: ['types', 'communes'],
  })
  expect(f.communes).toEqual(['Valdivia', 'La Unión'])
  expect(f.required).toEqual([])
  expect(f.alternativeCommunes).toEqual([])
})

it('keeps failed submissions per user with the same ID for retries; clears only the matching draft', () => {
  const values = new Map<string, string>()
  const storage = {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => {
      values.set(k, v)
    },
    removeItem: (k: string) => {
      values.delete(k)
    },
  }
  const draft = {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    editing: false,
    step: 6,
    pending: true,
    filters: { ...defaultInterestFilters(), types: [PropertyType.LAND] },
  }
  expect(writeInterestDraft('buyer-a', draft, storage)).toBe(true)
  expect(readInterestDraft('buyer-a', storage)).toEqual(draft)
  expect(readInterestDraft('buyer-b', storage)).toBeNull()
  clearInterestDraft('buyer-a', 'wrong-id', storage)
  expect(readInterestDraft('buyer-a', storage)?.pending).toBe(true)
  clearInterestDraft('buyer-a', draft.id, storage)
  expect(readInterestDraft('buyer-a', storage)).toBeNull()
})

it('does not claim to retain a draft when local storage is unavailable', () => {
  const storage = {
    getItem: () => null,
    setItem: () => {
      throw new Error('quota')
    },
    removeItem: () => {},
  }
  expect(
    writeInterestDraft(
      'buyer',
      {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        editing: false,
        step: 0,
        pending: false,
        filters: defaultInterestFilters(),
      },
      storage
    )
  ).toBe(false)
})
