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
  hasInterests: boolean
  refresh: () => Promise<void>
} | null>(null)

export function InterestMatchesProvider({ children }: { children: ReactNode }) {
  const userId = useAuthContext().user?.id
  const [count, setCount] = useState<number | null>(null)
  const [hasInterests, setHasInterests] = useState(false)
  const request = useRef(0)
  const refresh = useCallback(async () => {
    const id = ++request.current
    if (!userId) {
      setCount(null)
      setHasInterests(false)
      return
    }
    try {
      const [next, interests] = await Promise.all([
        interestsService.getNewCount(),
        interestsService.list(),
      ])
      if (request.current === id) {
        setCount(next)
        setHasInterests(interests.length > 0)
      }
    } catch {
      if (request.current === id) setCount(null)
    }
  }, [userId])
  useEffect(() => {
    setCount(null)
    setHasInterests(false)
    void refresh()
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps -- Request sequence, not a DOM ref.
      request.current++
    }
  }, [refresh])
  return (
    <InterestMatchesContext.Provider value={{ count, hasInterests, refresh }}>
      {children}
    </InterestMatchesContext.Provider>
  )
}
export function useInterestMatches() {
  const context = useContext(InterestMatchesContext)
  if (!context) throw new Error('Missing InterestMatchesProvider')
  return context
}
