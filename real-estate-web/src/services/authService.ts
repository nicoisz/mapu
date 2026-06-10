import { mockUsers, MOCK_CREDENTIALS } from '@/data'
import { AuthResult } from '@/types/results'
import { User } from '@/types/user'
import { SubscriptionType, UserType, ContactMethod } from '@/types/enums'
import { STORAGE_KEYS } from '@/constants'

function getStorage() {
  if (typeof window === 'undefined') return null
  return window.localStorage
}

function generateToken(userId: string): string {
  return btoa(JSON.stringify({ userId, exp: Date.now() + 86_400_000, iat: Date.now() }))
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const authService = {
  login(email: string, password: string): AuthResult {
    if (!email || !validateEmail(email)) return { success: false, error: 'Email inválido' }
    if (!password || password.length < 6) return { success: false, error: 'Contraseña inválida (mínimo 6 caracteres)' }

    const cred = MOCK_CREDENTIALS[email.toLowerCase()]
    if (!cred || cred.password !== password) return { success: false, error: 'Credenciales incorrectas' }

    const user = mockUsers.find(u => u.id === cred.userId)
    if (!user) return { success: false, error: 'Usuario no encontrado' }

    const token = generateToken(user.id)
    const storage = getStorage()
    if (storage) {
      storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
      storage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user))
    }

    return { success: true, user, token }
  },

  register(data: { name: string; email: string; password: string; userType?: UserType }): AuthResult {
    if (!data.name || data.name.length < 2) return { success: false, error: 'Nombre demasiado corto (mínimo 2 caracteres)' }
    if (!data.email || !validateEmail(data.email)) return { success: false, error: 'Email inválido' }
    if (!data.password || data.password.length < 6) return { success: false, error: 'Contraseña demasiado corta (mínimo 6 caracteres)' }
    if (MOCK_CREDENTIALS[data.email.toLowerCase()]) return { success: false, error: 'Ya existe una cuenta con ese email' }

    const now = new Date().toISOString()
    const newUser: User = {
      id: `user-${Date.now()}`,
      email: data.email.toLowerCase(),
      name: data.name,
      userType: data.userType ?? UserType.INDIVIDUAL,
      subscription: {
        type: SubscriptionType.FREE,
        startDate: now,
        isActive: true,
        features: ['basic_listings'],
        listingsLimit: 3,
        remainingListings: 3,
      },
      preferences: {
        language: 'es',
        currency: 'CLP',
        notifications: { email: true, push: false, sms: false, newProperties: false, priceChanges: false, messages: true },
        searchRadius: 5,
        mapType: 'standard',
      },
      stats: { totalListings: 0, activeListings: 0, soldProperties: 0, rentedProperties: 0, totalViews: 0, totalContacts: 0 },
      properties: [],
      savedProperties: [],
      recentlyViewed: [],
      contactInfo: { id: `c-${Date.now()}`, name: data.name, email: data.email, preferredMethod: ContactMethod.EMAIL, isVerified: false },
      createdAt: now,
      updatedAt: now,
      isEmailVerified: false,
      isPhoneVerified: false,
      isIdentityVerified: false,
    }

    const token = generateToken(newUser.id)
    const storage = getStorage()
    if (storage) {
      storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
      storage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser))
    }

    return { success: true, user: newUser, token }
  },

  loginWithSocial(provider: 'google' | 'apple' | 'facebook'): AuthResult {
    const email = `user_${provider}_${Date.now()}@${provider}.com`
    const name = `Usuario ${provider.charAt(0).toUpperCase() + provider.slice(1)}`
    return authService.register({ name, email, password: `social_${Date.now()}` })
  },

  logout(): void {
    const storage = getStorage()
    if (storage) {
      storage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
      storage.removeItem(STORAGE_KEYS.CURRENT_USER)
    }
  },

  getCurrentUser(): User | null {
    const storage = getStorage()
    if (!storage) return null
    const raw = storage.getItem(STORAGE_KEYS.CURRENT_USER)
    if (!raw) return null
    try { return JSON.parse(raw) as User } catch { return null }
  },

  isAuthenticated(): boolean {
    const storage = getStorage()
    if (!storage) return false
    return !!storage.getItem(STORAGE_KEYS.AUTH_TOKEN)
  },

  updateProfile(userId: string, updates: Partial<User>): AuthResult {
    const current = authService.getCurrentUser()
    if (!current || current.id !== userId) return { success: false, error: 'No autenticado' }
    const updated = { ...current, ...updates, updatedAt: new Date().toISOString() }
    const storage = getStorage()
    if (storage) storage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated))
    return { success: true, user: updated }
  },
}
