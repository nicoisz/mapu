import { ContactInfo } from './property'
import { SubscriptionType, UserType } from './enums'

export interface UserSubscription {
  type: SubscriptionType
  startDate: string
  expiresAt?: string
  isActive: boolean
  features: string[]
  listingsLimit?: number
  remainingListings?: number
}

export interface NotificationPreferences {
  email: boolean
  push: boolean
  sms: boolean
  newProperties: boolean
  priceChanges: boolean
  messages: boolean
}

export interface UserPreferences {
  language: 'es' | 'en'
  currency: 'CLP' | 'USD'
  notifications: NotificationPreferences
  searchRadius: number
  mapType: 'standard' | 'satellite' | 'hybrid'
}

export interface UserStats {
  totalListings: number
  activeListings: number
  soldProperties: number
  rentedProperties: number
  totalViews: number
  totalContacts: number
  averageResponseTime?: number
  rating?: number
  reviewCount?: number
}

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  userType: UserType
  subscription: UserSubscription
  preferences: UserPreferences
  stats: UserStats
  properties: string[]
  savedProperties: string[]
  recentlyViewed: string[]
  contactInfo?: ContactInfo
  companyName?: string
  companyLogo?: string
  licenseNumber?: string
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
  isEmailVerified: boolean
  isPhoneVerified: boolean
  isIdentityVerified: boolean
}
