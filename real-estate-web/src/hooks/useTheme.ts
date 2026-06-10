'use client'

import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

/** Reads the theme the anti-FOUC script already applied, and lets the user flip it.
 *  Persists to localStorage; falls back to the OS preference when unset. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const isDark = document.documentElement.classList.contains('dark')
    setTheme(isDark ? 'dark' : 'light')
  }, [])

  function toggle() {
    setTheme(prev => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      document.documentElement.classList.toggle('dark', next === 'dark')
      try {
        localStorage.setItem('theme', next)
      } catch {
        /* storage may be unavailable */
      }
      return next
    })
  }

  return { theme, toggle, mounted }
}
