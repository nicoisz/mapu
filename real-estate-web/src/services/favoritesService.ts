import { Property } from '@/types/property'
import { FavoritesStats } from '@/types/results'
import { propertyService } from './propertyService'
import { STORAGE_KEYS } from '@/constants'
import { getSupabase } from '@/lib/supabase'

// Anonymous visitors keep favorites in localStorage; signed-in users use the
// `favorites` table. On login the local list is merged into the account.

function getStorage() {
  if (typeof window === 'undefined') return null
  return window.localStorage
}

function loadLocalIds(): string[] {
  const storage = getStorage()
  if (!storage) return []
  const raw = storage.getItem(STORAGE_KEYS.FAVORITES)
  if (!raw) return []
  try { return JSON.parse(raw) as string[] } catch { return [] }
}

function saveLocalIds(ids: string[]): void {
  const storage = getStorage()
  if (storage) storage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(ids))
}

export const favoritesService = {
  /** Favorite ids for the current visitor (account table or local fallback). */
  async getFavoriteIds(userId: string | null): Promise<string[]> {
    if (!userId) return loadLocalIds()
    const { data, error } = await getSupabase().from('favorites').select('property_id').eq('user_id', userId)
    if (error) return []
    return data.map(r => r.property_id as string)
  },

  getLocalCount(): number {
    return loadLocalIds().length
  },

  /** Returns the new favorite state (true = now favorited). */
  async toggleFavorite(userId: string | null, property: Property): Promise<boolean> {
    if (!userId) {
      const ids = loadLocalIds()
      if (ids.includes(property.id)) {
        saveLocalIds(ids.filter(id => id !== property.id))
        return false
      }
      saveLocalIds([...ids, property.id])
      return true
    }

    const supabase = getSupabase()
    const { count } = await supabase
      .from('favorites')
      .select('property_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('property_id', property.id)

    if ((count ?? 0) > 0) {
      await supabase.from('favorites').delete().eq('user_id', userId).eq('property_id', property.id)
      return false
    }
    await supabase.from('favorites').insert({ user_id: userId, property_id: property.id })
    return true
  },

  /** Moves anonymous favorites into the account after login, then clears local. */
  async mergeLocalToAccount(userId: string): Promise<void> {
    const localIds = loadLocalIds()
    if (!localIds.length) return
    const supabase = getSupabase()
    // No unique constraint on (user_id, property_id) in this schema, so check
    // first and insert one by one, tolerating stale/non-existent ids.
    const { data: existing } = await supabase.from('favorites').select('property_id').eq('user_id', userId)
    const have = new Set((existing ?? []).map(r => r.property_id as string))
    for (const propertyId of localIds.filter(id => !have.has(id))) {
      await supabase.from('favorites').insert({ user_id: userId, property_id: propertyId }).then(() => {}, () => {})
    }
    saveLocalIds([])
  },

  async getFavoriteProperties(ids: string[]): Promise<Property[]> {
    try {
      return await propertyService.getByIds(ids)
    } catch {
      return []
    }
  },

  computeStats(properties: Property[]): FavoritesStats {
    const byType: FavoritesStats['byType'] = {}
    const byOperation: FavoritesStats['byOperation'] = {}
    const byCity: Record<string, number> = {}
    let totalPrice = 0

    properties.forEach(p => {
      byType[p.type] = (byType[p.type] ?? 0) + 1
      byOperation[p.operation] = (byOperation[p.operation] ?? 0) + 1
      const city = p.location.address.city
      byCity[city] = (byCity[city] ?? 0) + 1
      totalPrice += p.pricing.monthlyRent ?? p.pricing.price
    })

    return {
      totalCount: properties.length,
      byType,
      byOperation,
      byCity,
      averagePrice: properties.length ? totalPrice / properties.length : 0,
    }
  },
}
