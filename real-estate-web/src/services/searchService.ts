import { propertyService } from './propertyService'
import { Property } from '@/types/property'
import { PropertySearchFilters, PropertySearchQuery, SearchSuggestion } from '@/types/search'
import { PropertyOperation, PropertyType } from '@/types/enums'
import { MAJOR_CITIES, STORAGE_KEYS } from '@/constants'

function getStorage() {
  if (typeof window === 'undefined') return null
  return window.localStorage
}

const POPULAR_SEARCHES = [
  'casa Las Condes',
  'departamento Providencia arriendo',
  'casa 3 dormitorios Santiago',
  'terreno Lo Barnechea',
  'depto Ñuñoa venta',
  'casa Viña del Mar',
]

const TYPE_KEYWORDS: Record<string, PropertyType> = {
  casa: PropertyType.HOUSE,
  casas: PropertyType.HOUSE,
  departamento: PropertyType.APARTMENT,
  departamentos: PropertyType.APARTMENT,
  depto: PropertyType.APARTMENT,
  deptos: PropertyType.APARTMENT,
  terreno: PropertyType.LAND,
  terrenos: PropertyType.LAND,
  oficina: PropertyType.OFFICE,
  oficinas: PropertyType.OFFICE,
  local: PropertyType.COMMERCIAL,
  locales: PropertyType.COMMERCIAL,
  bodega: PropertyType.WAREHOUSE,
  bodegas: PropertyType.WAREHOUSE,
}

const OPERATION_KEYWORDS: Record<string, PropertyOperation> = {
  arriendo: PropertyOperation.RENT,
  arrendar: PropertyOperation.RENT,
  alquiler: PropertyOperation.RENT,
  alquilar: PropertyOperation.RENT,
  venta: PropertyOperation.SALE,
  vender: PropertyOperation.SALE,
  comprar: PropertyOperation.SALE,
}

export const searchService = {
  parseSearchText(text: string): {
    cleanText: string
    implicitFilters: Partial<PropertySearchFilters>
  } {
    const words = text.toLowerCase().trim().split(/\s+/)
    const filters: Partial<PropertySearchFilters> = {}
    const usedIndices = new Set<number>()

    words.forEach((word, i) => {
      if (TYPE_KEYWORDS[word]) {
        filters.type = [TYPE_KEYWORDS[word]]
        usedIndices.add(i)
      }
      if (OPERATION_KEYWORDS[word]) {
        filters.operation = OPERATION_KEYWORDS[word]
        usedIndices.add(i)
      }
      const match = word.match(/^(\d+)d$/)
      if (match) {
        filters.bedrooms = { min: parseInt(match[1]) }
        usedIndices.add(i)
      }
      if (word === 'dormitorios' || word === 'dormitorio') {
        const prev = words[i - 1]
        if (prev && /^\d+$/.test(prev)) {
          filters.bedrooms = { min: parseInt(prev) }
          usedIndices.add(i)
          usedIndices.add(i - 1)
        }
      }
      MAJOR_CITIES.forEach((city) => {
        if (city.toLowerCase() === word || city.toLowerCase() === words.slice(i, i + 2).join(' ')) {
          usedIndices.add(i)
        }
      })
    })

    const cleanText = words.filter((_, i) => !usedIndices.has(i)).join(' ')
    return { cleanText, implicitFilters: filters }
  },

  buildSearchQuery(text: string, filters?: PropertySearchFilters): PropertySearchQuery {
    const { cleanText, implicitFilters } = searchService.parseSearchText(text)
    return {
      query: cleanText || text,
      filters: { ...implicitFilters, ...filters },
    }
  },

  searchProperties(query: PropertySearchQuery): Promise<Property[]> {
    return propertyService.searchProperties(query)
  },

  getSearchSuggestions(input: string): SearchSuggestion[] {
    if (!input || input.length < 2) return []
    const lower = input.toLowerCase()
    const suggestions: SearchSuggestion[] = []

    MAJOR_CITIES.forEach((city) => {
      if (city.toLowerCase().includes(lower)) {
        suggestions.push({ text: city, type: 'location' })
      }
    })

    Object.keys(TYPE_KEYWORDS).forEach((k) => {
      if (k.includes(lower) && !suggestions.find((s) => s.text === k)) {
        suggestions.push({ text: k, type: 'property_type' })
      }
    })

    POPULAR_SEARCHES.forEach((ps) => {
      if (ps.toLowerCase().includes(lower)) {
        suggestions.push({ text: ps, type: 'popular' })
      }
    })

    return suggestions.slice(0, 6)
  },

  getPopularSearches(): string[] {
    return POPULAR_SEARCHES
  },

  getRecentSearchTerms(): string[] {
    const storage = getStorage()
    if (!storage) return []
    const raw = storage.getItem(STORAGE_KEYS.RECENT_SEARCHES)
    if (!raw) return []
    try {
      return JSON.parse(raw) as string[]
    } catch {
      return []
    }
  },

  saveRecentSearch(term: string): void {
    const storage = getStorage()
    if (!storage || !term.trim()) return
    const current = searchService.getRecentSearchTerms()
    const updated = [term, ...current.filter((t) => t !== term)].slice(0, 10)
    storage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(updated))
  },

  clearRecentSearches(): void {
    const storage = getStorage()
    if (storage) storage.removeItem(STORAGE_KEYS.RECENT_SEARCHES)
  },
}
