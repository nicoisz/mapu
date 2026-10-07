import { Currency, PropertyOperation, PropertyType } from '@/types/enums'
import type { InterestFilters } from '@/types/interests'
import { simplifyInterestFilters } from './interests'

export interface InterestDraft {
  id: string
  editing: boolean
  filters: InterestFilters
  step: number
  pending: boolean
}
type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
const key = (userId: string) => `luky:interest-draft:${userId}`

export function readInterestDraft(userId: string, storage?: DraftStorage): InterestDraft | null {
  try {
    const raw = (storage ?? window.localStorage).getItem(key(userId))
    if (!raw || raw.length > 32000) return null
    const d = JSON.parse(raw) as InterestDraft
    const f = d.filters
    if (
      !/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(d.id) ||
      typeof d.editing !== 'boolean' ||
      typeof d.pending !== 'boolean' ||
      !Number.isInteger(d.step) ||
      d.step < 0 ||
      d.step > 8 ||
      !f ||
      f.version !== 1 ||
      !Object.values(PropertyOperation).includes(f.operation) ||
      !Object.values(Currency).includes(f.currency)
    )
      return null
    for (const field of [
      'types',
      'communes',
      'alternativeCommunes',
      'features',
      'required',
    ] as const) {
      if (
        !Array.isArray(f[field]) ||
        f[field].length > 100 ||
        f[field].some((v) => typeof v !== 'string')
      )
        return null
    }
    if (
      f.types.some((v) => !Object.values(PropertyType).includes(v)) ||
      (d.pending && !f.types.length)
    )
      return null
    for (const field of ['maxPrice', 'minArea', 'minBedrooms', 'minBathrooms'] as const)
      if (f[field] !== undefined && (typeof f[field] !== 'number' || !Number.isFinite(f[field])))
        return null
    if (![0, 10, 20, 30].includes(f.budgetFlexibility)) return null
    return { ...d, filters: simplifyInterestFilters(f) }
  } catch {
    return null
  }
}
export function writeInterestDraft(
  userId: string,
  draft: InterestDraft,
  storage?: DraftStorage
): boolean {
  try {
    ;(storage ?? window.localStorage).setItem(key(userId), JSON.stringify(draft))
    return true
  } catch {
    return false
  }
}
export function clearInterestDraft(userId: string, draftId: string, storage?: DraftStorage): void {
  try {
    if (readInterestDraft(userId, storage)?.id === draftId)
      (storage ?? window.localStorage).removeItem(key(userId))
  } catch {
    /* Storage unavailable: never break the form. */
  }
}
