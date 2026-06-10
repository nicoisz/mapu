'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { authService } from '@/services/authService'
import { User } from '@/types/user'
import { AuthResult } from '@/types/results'
import { SubscriptionType, UserType } from '@/types/enums'
import { FREE_PLAN_LISTINGS_LIMIT } from '@/constants'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

interface AuthContextValue extends AuthState {
  login(email: string, password: string): Promise<AuthResult>
  register(data: { name: string; email: string; password: string; userType?: UserType }): Promise<AuthResult>
  loginWithSocial(provider: 'google' | 'apple' | 'facebook'): Promise<AuthResult>
  logout(): void
  updateProfile(updates: Partial<User>): Promise<AuthResult>
  clearError(): void
  hasSubscription(type: SubscriptionType): boolean
  hasRemainingListings(): boolean
  getRemainingListings(): number
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    const user = authService.getCurrentUser()
    setState({ user, isAuthenticated: !!user, isLoading: false, error: null })
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    setState(s => ({ ...s, isLoading: true, error: null }))
    const result = authService.login(email, password)
    setState(s => ({
      ...s,
      isLoading: false,
      user: result.user ?? null,
      isAuthenticated: result.success,
      error: result.error ?? null,
    }))
    return result
  }, [])

  const register = useCallback(async (data: { name: string; email: string; password: string; userType?: UserType }): Promise<AuthResult> => {
    setState(s => ({ ...s, isLoading: true, error: null }))
    const result = authService.register(data)
    setState(s => ({
      ...s,
      isLoading: false,
      user: result.user ?? null,
      isAuthenticated: result.success,
      error: result.error ?? null,
    }))
    return result
  }, [])

  const loginWithSocial = useCallback(async (provider: 'google' | 'apple' | 'facebook'): Promise<AuthResult> => {
    setState(s => ({ ...s, isLoading: true, error: null }))
    const result = authService.loginWithSocial(provider)
    setState(s => ({
      ...s,
      isLoading: false,
      user: result.user ?? null,
      isAuthenticated: result.success,
      error: result.error ?? null,
    }))
    return result
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    setState({ user: null, isAuthenticated: false, isLoading: false, error: null })
  }, [])

  const updateProfile = useCallback(async (updates: Partial<User>): Promise<AuthResult> => {
    if (!state.user) return { success: false, error: 'No autenticado' }
    const result = authService.updateProfile(state.user.id, updates)
    if (result.success && result.user) {
      setState(s => ({ ...s, user: result.user! }))
    }
    return result
  }, [state.user])

  const clearError = useCallback(() => setState(s => ({ ...s, error: null })), [])

  const hasSubscription = useCallback((type: SubscriptionType): boolean => {
    if (!state.user) return false
    if (type === SubscriptionType.FREE) return true
    return state.user.subscription.type === type && state.user.subscription.isActive
  }, [state.user])

  const getRemainingListings = useCallback((): number => {
    if (!state.user) return 0
    if (state.user.subscription.type === SubscriptionType.PREMIUM) return Infinity
    return state.user.subscription.remainingListings ?? (FREE_PLAN_LISTINGS_LIMIT - state.user.properties.length)
  }, [state.user])

  const hasRemainingListings = useCallback((): boolean => getRemainingListings() > 0, [getRemainingListings])

  return (
    <AuthContext.Provider value={{
      ...state,
      login, register, loginWithSocial, logout, updateProfile,
      clearError, hasSubscription, hasRemainingListings, getRemainingListings,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider')
  return ctx
}
