'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import Link from 'next/link'
import { Heart, X } from 'lucide-react'
import { favoritesService } from '@/services/favoritesService'
import { useAuthContext } from '@/contexts/AuthContext'
import { Property } from '@/types/property'

/** Anonymous visitors can save a few favorites locally; beyond this they must
 *  register so their list is tied to an account. Logged-in users are unlimited. */
export const ANON_FAVORITES_LIMIT = 3

interface FavoritesContextValue {
  favoriteIds: string[]
  isFavorite(id: string): boolean
  toggle(property: Property): void
  count: number
  /** Max favorites for the current visitor, or null when unlimited. */
  limit: number | null
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuthContext()
  const userId = user?.id ?? null
  // Start empty so the server-rendered HTML matches the first client render.
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [promptOpen, setPromptOpen] = useState(false)

  // Load (and on login, first merge anonymous favorites into the account).
  useEffect(() => {
    let active = true
    async function load() {
      if (userId) await favoritesService.mergeLocalToAccount(userId)
      const ids = await favoritesService.getFavoriteIds(userId)
      if (active) setFavoriteIds(ids)
    }
    void load()
    return () => { active = false }
  }, [userId])

  const isFavorite = useCallback((id: string) => favoriteIds.includes(id), [favoriteIds])

  const toggle = useCallback((property: Property) => {
    const alreadyFav = favoriteIds.includes(property.id)
    // Block only when an anonymous visitor tries to ADD beyond the limit.
    if (!alreadyFav && !isAuthenticated && favoriteIds.length >= ANON_FAVORITES_LIMIT) {
      setPromptOpen(true)
      return
    }
    // Optimistic update; reconcile with the service result in the background.
    setFavoriteIds(ids => (alreadyFav ? ids.filter(id => id !== property.id) : [...ids, property.id]))
    favoritesService.toggleFavorite(userId, property).catch(() => {
      setFavoriteIds(ids => (alreadyFav ? [...ids, property.id] : ids.filter(id => id !== property.id)))
    })
  }, [favoriteIds, isAuthenticated, userId])

  return (
    <FavoritesContext.Provider
      value={{
        favoriteIds,
        isFavorite,
        toggle,
        count: favoriteIds.length,
        limit: isAuthenticated ? null : ANON_FAVORITES_LIMIT,
      }}
    >
      {children}
      {promptOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-[fadeIn_.2s_ease]">
          <div className="bg-surface-container-low w-full max-w-sm rounded-2xl shadow-elevated border border-outline-variant/40 p-6 text-center relative">
            <button
              onClick={() => setPromptOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
            <div className="w-14 h-14 mx-auto rounded-full bg-primary/15 flex items-center justify-center mb-3">
              <Heart size={26} className="text-primary fill-primary" />
            </div>
            <h2 className="font-headline text-xl font-bold text-on-surface">Crea tu lista de favoritos</h2>
            <p className="text-on-surface-variant text-sm mt-2">
              Guardaste {ANON_FAVORITES_LIMIT} propiedades. Regístrate gratis para guardar todas las que quieras y verlas desde cualquier dispositivo.
            </p>
            <div className="mt-5 space-y-2">
              <Link
                href="/register"
                onClick={() => setPromptOpen(false)}
                className="block w-full bg-primary text-on-primary font-semibold py-2.5 rounded-lg hover:brightness-110 transition-all"
              >
                Crear cuenta gratis
              </Link>
              <button
                onClick={() => setPromptOpen(false)}
                className="block w-full text-on-surface-variant text-sm py-2 hover:text-on-surface transition-colors"
              >
                Ahora no
              </button>
            </div>
          </div>
        </div>
      )}
    </FavoritesContext.Provider>
  )
}

export function useFavoritesContext(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavoritesContext must be used inside FavoritesProvider')
  return ctx
}
