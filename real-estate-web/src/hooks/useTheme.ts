'use client'

import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

function currentTheme(): Theme {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

/** Reads the theme the anti-FOUC script applied and lets the user flip it.
 *  The single source of truth is the `dark` class on <html>; every hook
 *  instance subscribes to it via a MutationObserver, so a toggle in one
 *  component (e.g. the navbar) updates ALL consumers (map, mini-map, …).
 *  Persists to localStorage. */
export function useTheme() {
  // Dark-first default matches the anti-FOUC script and avoids a flash.
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setTheme(currentTheme())
    const observer = new MutationObserver(() => setTheme(currentTheme()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  function toggle() {
    const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark'
    document.documentElement.classList.toggle('dark', next === 'dark')
    try {
      localStorage.setItem('theme', next)
    } catch {
      /* storage may be unavailable */
    }
    // The MutationObserver above propagates `next` to every useTheme() instance.
  }

  return { theme, toggle, mounted }
}
