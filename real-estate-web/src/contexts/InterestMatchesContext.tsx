'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useAuthContext } from './AuthContext'
import { interestsService } from '@/services/interestsService'

const InterestMatchesContext = createContext<{
  count: number | null
  refresh: () => Promise<void>
} | null>(null)

export function InterestMatchesProvider({ children }: { children: ReactNode }) {
  const userId = useAuthContext().user?.id
  const [count, setCount] = useState<number | null>(null)
  const request = useRef(0)
  const refresh = useCallback(async () => {
    const id = ++request.current
    if (!userId) {
      setCount(null)
      return
    }
    try {
      const next = await interestsService.getNewCount()
      if (request.current === id) setCount(next)
    } catch {
      if (request.current === id) setCount(null)
    }
  }, [userId])
  useEffect(() => {
    setCount(null)
    void refresh()
    return () => {
      request.current++
    }
  }, [refresh])
  return (
    <InterestMatchesContext.Provider value={{ count, refresh }}>
      {children}
    </InterestMatchesContext.Provider>
  )
}
export function useInterestMatches() {
  const context = useContext(InterestMatchesContext)
  if (!context) throw new Error('Missing InterestMatchesProvider')
  return context
}
