'use client'

import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

function currentTheme(): Theme {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

/** Reads the theme the anti-FOUC script applied and lets the user flip it.
 *  The single source of truth is the `dark` class on <html>; every hook
 *  instance subscribes to it via a MutationObserver, so a toggle in one
 *  component (e.g. the sidebar) updates ALL consumers (map, mini-map, …).
 *  Persists to localStorage. */
export function useTheme() {
  // Placeholder until mount; the real value comes from the anti-FOUC script.
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setTheme(currentTheme())
    const observer = new MutationObserver(() => setTheme(currentTheme()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  function select(next: Theme) {
    document.documentElement.classList.toggle('dark', next === 'dark')
    try {
      localStorage.setItem('theme', next)
    } catch {
      /* storage may be unavailable */
    }
    // The MutationObserver above propagates `next` to every useTheme() instance.
  }

  return { theme, select, mounted }
}
