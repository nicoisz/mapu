import { mockProperties } from '@/data'
import { Property } from '@/types/property'
import { PropertyStatus } from '@/types/enums'
import { PropertySearchQuery } from '@/types/search'
import { STORAGE_KEYS, LISTING_EXPIRATION_DAYS } from '@/constants'

function getStorage() {
  if (typeof window === 'undefined') return null
  return window.localStorage
}

function getUserProperties(): Property[] {
  const storage = getStorage()
  if (!storage) return []
  const raw = storage.getItem(STORAGE_KEYS.USER_PROPERTIES)
  if (!raw) return []
  try { return JSON.parse(raw) as Property[] } catch { return [] }
}

function saveUserProperties(properties: Property[]): void {
  const storage = getStorage()
  if (storage) storage.setItem(STORAGE_KEYS.USER_PROPERTIES, JSON.stringify(properties))
}

function getAllProperties(): Property[] {
  return [...mockProperties, ...getUserProperties()]
}

export const propertyService = {
  getAll(): Property[] {
    return getAllProperties()
  },

  getById(id: string): Property | null {
    return getAllProperties().find(p => p.id === id) ?? null
  },

  getUserProperties(userId: string): Property[] {
    return getAllProperties().filter(p => p.ownerId === userId)
  },

  searchProperties(query: PropertySearchQuery): Property[] {
    let results = getAllProperties()

    if (query.filters?.operation) {
      results = results.filter(p => p.operation === query.filters!.operation)
    }
    if (query.filters?.type?.length) {
      results = results.filter(p => query.filters!.type!.includes(p.type))
    }
    if (query.filters?.priceRange) {
      const { min, max } = query.filters.priceRange
      results = results.filter(p => {
        const price = p.pricing.monthlyRent ?? p.pricing.price
        if (min && price < min) return false
        if (max && price > max) return false
        return true
      })
    }
    if (query.filters?.areaRange) {
      const { min, max } = query.filters.areaRange
      results = results.filter(p => {
        if (min && p.features.area < min) return false
        if (max && p.features.area > max) return false
        return true
      })
    }
    if (query.filters?.bedrooms) {
      const { min } = query.filters.bedrooms
      if (min) results = results.filter(p => (p.features.bedrooms ?? 0) >= min)
    }
    if (query.query) {
      const q = query.query.toLowerCase()
      results = results.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.location.address.city.toLowerCase().includes(q) ||
        p.location.address.commune?.toLowerCase().includes(q) ||
        p.tags?.some(t => t.toLowerCase().includes(q))
      )
    }

    if (query.sortBy === 'price') {
      results.sort((a, b) => {
        const pa = a.pricing.monthlyRent ?? a.pricing.price
        const pb = b.pricing.monthlyRent ?? b.pricing.price
        return query.sortOrder === 'desc' ? pb - pa : pa - pb
      })
    } else if (query.sortBy === 'date') {
      results.sort((a, b) => {
        const da = new Date(a.listing.publishedAt).getTime()
        const db = new Date(b.listing.publishedAt).getTime()
        return query.sortOrder === 'asc' ? da - db : db - da
      })
    } else if (query.sortBy === 'area') {
      results.sort((a, b) => query.sortOrder === 'desc' ? b.features.area - a.features.area : a.features.area - b.features.area)
    }

    if (query.limit) results = results.slice(query.offset ?? 0, (query.offset ?? 0) + query.limit)

    return results
  },

  createProperty(userId: string, data: Partial<Property>): Property {
    const now = new Date().toISOString()
    const expiresAt = new Date(Date.now() + LISTING_EXPIRATION_DAYS * 86_400_000).toISOString()
    const property: Property = {
      id: `prop-${Date.now()}`,
      ownerId: userId,
      status: PropertyStatus.ACTIVE,
      listing: {
        publishedAt: now,
        expiresAt,
        lastUpdated: now,
        views: 0,
        favorites: 0,
        inquiries: 0,
        isPremium: false,
        isHighlighted: false,
        isFeatured: false,
        completenessScore: 80,
        qualityScore: 75,
      },
      ...data,
    } as Property

    const current = getUserProperties()
    saveUserProperties([...current, property])
    return property
  },

  updateProperty(id: string, updates: Partial<Property>): Property | null {
    const all = getUserProperties()
    const idx = all.findIndex(p => p.id === id)
    if (idx === -1) return null
    const updated = { ...all[idx], ...updates, listing: { ...all[idx].listing, lastUpdated: new Date().toISOString() } }
    all[idx] = updated
    saveUserProperties(all)
    return updated
  },

  deleteProperty(id: string): boolean {
    const all = getUserProperties()
    const filtered = all.filter(p => p.id !== id)
    if (filtered.length === all.length) return false
    saveUserProperties(filtered)
    return true
  },

  renewProperty(id: string): Property | null {
    const expiresAt = new Date(Date.now() + LISTING_EXPIRATION_DAYS * 86_400_000).toISOString()
    return propertyService.updateProperty(id, { status: PropertyStatus.ACTIVE, listing: { expiresAt } as Property['listing'] })
  },
}
