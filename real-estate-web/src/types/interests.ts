import type { Property } from './property'
import type { Currency, PropertyOperation, PropertyType } from './enums'

export interface InterestFilters {
  version: 1
  operation: PropertyOperation
  types: PropertyType[]
  communes: string[]
  alternativeCommunes: string[]
  currency: Currency
  budgetFlexibility: 0 | 10 | 20 | 30
  maxPrice?: number
  minArea?: number
  minBedrooms?: number
  minBathrooms?: number
  features: string[]
  required: string[]
}
export interface PropertyInterest {
  id: string
  filters: InterestFilters
  isActive: boolean
}
export interface MatchReason {
  key: string
  status: 'meets' | 'differs' | 'unknown'
}
export interface InterestMatch {
  property: Property
  interestId: string
  filters: InterestFilters
  score: number
  reasons: MatchReason[]
  isNew: boolean
}
export interface PropertyDemand {
  propertyId: string
  users: number
  exactUsers: number
  partialUsers: number
}
