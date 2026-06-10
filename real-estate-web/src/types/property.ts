import { ChileanRegion, ContactMethod, Currency, PropertyOperation, PropertyStatus, PropertyType } from './enums'

export interface Address {
  street: string
  number?: string
  apartment?: string
  neighborhood?: string
  city: string
  commune?: string
  region: ChileanRegion
  postalCode?: string
  country: 'Chile'
}

export interface PropertyLocation {
  latitude: number
  longitude: number
  address: Address
  displayAddress?: string
}

export interface PriceHistoryEntry {
  price: number
  currency: Currency
  date: string
  changeReason?: string
}

export interface PropertyPricing {
  price: number
  currency: Currency
  pricePerSquareMeter?: number
  monthlyRent?: number
  deposit?: number
  maintenanceFee?: number
  propertyTax?: number
  hoaFees?: number
  originalPrice?: number
  priceHistory?: PriceHistoryEntry[]
  isNegotiable: boolean
  minimumPrice?: number
}

export interface PropertyFeatures {
  bedrooms?: number
  bathrooms?: number
  halfBathrooms?: number
  area: number
  builtArea?: number
  lotSize?: number
  parkingSpots?: number
  floors?: number
  yearBuilt?: number
  hasGarden?: boolean
  hasPool?: boolean
  hasGym?: boolean
  hasSecurity?: boolean
  hasElevator?: boolean
  hasBalcony?: boolean
  hasTerrace?: boolean
  hasFireplace?: boolean
  hasAirConditioning?: boolean
  hasHeating?: boolean
  hasWater?: boolean
  hasElectricity?: boolean
  hasGas?: boolean
  hasInternet?: boolean
  petFriendly?: boolean
  furnished?: boolean
  newConstruction?: boolean
}

export interface PropertyImage {
  id: string
  url: string
  thumbnailUrl?: string
  caption?: string
  order: number
  isMain: boolean
  room?: string
}

export interface PropertyMedia {
  images: PropertyImage[]
  virtualTour?: string
  floorPlan?: string
}

export interface PropertyListing {
  publishedAt: string
  expiresAt?: string
  lastUpdated: string
  views: number
  favorites: number
  inquiries: number
  isPremium: boolean
  isHighlighted: boolean
  isFeatured: boolean
  completenessScore: number
  qualityScore: number
}

export interface NearbyPlace {
  name: string
  type: string
  distance: number
  rating?: number
}

export interface ContactInfo {
  id: string
  name: string
  email?: string
  phone?: string
  whatsapp?: string
  preferredMethod: ContactMethod
  avatar?: string
  isVerified: boolean
  responseTime?: string
  languages?: string[]
}

export interface Property {
  id: string
  title: string
  description: string
  type: PropertyType
  operation: PropertyOperation
  status: PropertyStatus
  location: PropertyLocation
  pricing: PropertyPricing
  features: PropertyFeatures
  media: PropertyMedia
  ownerId: string
  contact: ContactInfo
  listing: PropertyListing
  tags?: string[]
  nearbyPlaces?: NearbyPlace[]
  legalStatus?: string
  energyRating?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'
}

export interface PropertyMapMarker {
  id: string
  latitude: number
  longitude: number
  price: number
  currency: Currency
  operation: PropertyOperation
  type: PropertyType
  isSelected?: boolean
  isPremium?: boolean
}
