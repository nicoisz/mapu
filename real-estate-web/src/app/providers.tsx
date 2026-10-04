'use client'

import { ReactNode, useEffect } from 'react'
import { AuthProvider, useAuthContext } from '@/contexts/AuthContext'
import { FavoritesProvider } from '@/contexts/FavoritesContext'
import { InterestMatchesProvider } from '@/contexts/InterestMatchesContext'
import { initErrorLogging, setErrorLogUser } from '@/lib/errorLogging'

function ErrorLogBindings() {
  const { user } = useAuthContext()
  useEffect(() => {
    setErrorLogUser(user ? { id: user.id, email: user.email, name: user.name } : null)
  }, [user])
  return null
}

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    initErrorLogging()
  }, [])

  return (
    <AuthProvider>
      <ErrorLogBindings />
      <InterestMatchesProvider>
        <FavoritesProvider>{children}</FavoritesProvider>
      </InterestMatchesProvider>
    </AuthProvider>
  )
}
