import { ContactMethod, PropertyOperation, PropertyType } from './enums'
import { Property } from './property'
import { User } from './user'

export interface AuthResult {
  success: boolean
  user?: User
  token?: string
  refreshToken?: string
  error?: string
}

export interface ContactResult {
  success: boolean
  method: ContactMethod
  message?: string
  error?: string
}

export interface ShareResult {
  success: boolean
  platform?: string
  error?: string
}

export interface FavoritesStats {
  totalCount: number
  byType: Partial<Record<PropertyType, number>>
  byOperation: Partial<Record<PropertyOperation, number>>
  byCity: Record<string, number>
  averagePrice: number
}

export interface ExportedFavorites {
  ids: string[]
  properties: Property[]
  exportDate: string
}
