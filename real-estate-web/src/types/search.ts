import { Currency, PropertyOperation, PropertyType } from './enums'
import { PropertyFeatures } from './property'

export interface PriceRangeFilter {
  min?: number
  max?: number
  currency: Currency
}

export interface RangeFilter {
  min?: number
  max?: number
}

export interface LocationFilter {
  center: { latitude: number; longitude: number }
  radius: number
}

export interface PropertySearchFilters {
  operation?: PropertyOperation
  type?: PropertyType[]
  priceRange?: PriceRangeFilter
  areaRange?: RangeFilter
  bedrooms?: RangeFilter
  bathrooms?: RangeFilter
  features?: Partial<PropertyFeatures>
  location?: LocationFilter
  tags?: string[]
  isPremium?: boolean
  publishedAfter?: string
}

export interface PropertySearchQuery {
  query?: string
  filters?: PropertySearchFilters
  sortBy?: 'price' | 'date' | 'area' | 'relevance'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface SearchSuggestion {
  text: string
  type: 'location' | 'property_type' | 'recent' | 'popular'
  icon?: string
}
