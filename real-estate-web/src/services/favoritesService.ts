import { Property } from '@/types/property'
import { FavoritesStats, ExportedFavorites } from '@/types/results'
import { propertyService } from './propertyService'
import { STORAGE_KEYS } from '@/constants'

function getStorage() {
  if (typeof window === 'undefined') return null
  return window.localStorage
}

function loadIds(): string[] {
  const storage = getStorage()
  if (!storage) return []
  const raw = storage.getItem(STORAGE_KEYS.FAVORITES)
  if (!raw) return []
  try { return JSON.parse(raw) as string[] } catch { return [] }
}

function saveIds(ids: string[]): void {
  const storage = getStorage()
  if (storage) storage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(ids))
}

export const favoritesService = {
  getFavoriteIds(): string[] {
    return loadIds()
  },

  isFavorite(propertyId: string): boolean {
    return loadIds().includes(propertyId)
  },

  addToFavorites(property: Property): boolean {
    const ids = loadIds()
    if (ids.includes(property.id)) return false
    saveIds([...ids, property.id])
    return true
  },

  removeFromFavorites(propertyId: string): boolean {
    const ids = loadIds()
    const filtered = ids.filter(id => id !== propertyId)
    if (filtered.length === ids.length) return false
    saveIds(filtered)
    return true
  },

  toggleFavorite(property: Property): boolean {
    if (favoritesService.isFavorite(property.id)) {
      favoritesService.removeFromFavorites(property.id)
      return false
    } else {
      favoritesService.addToFavorites(property)
      return true
    }
  },

  getFavoriteProperties(): Property[] {
    const ids = loadIds()
    return ids.map(id => propertyService.getById(id)).filter(Boolean) as Property[]
  },

  getFavoriteCount(): number {
    return loadIds().length
  },

  getFavoritesStats(): FavoritesStats {
    const properties = favoritesService.getFavoriteProperties()
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

  clearAllFavorites(): boolean {
    saveIds([])
    return true
  },

  exportFavorites(): ExportedFavorites {
    const ids = loadIds()
    const properties = favoritesService.getFavoriteProperties()
    return { ids, properties, exportDate: new Date().toISOString() }
  },
}
