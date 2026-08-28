'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { RouteProgress } from '@/components/ui/GlowLoader'

/** Muestra la línea de progreso glow en cada navegación dentro del dashboard. */
export function NavigationGlow() {
  const pathname = usePathname()
  const [active, setActive] = useState(false)

  useEffect(() => {
    setActive(true)
    const t = setTimeout(() => setActive(false), 500)
    return () => clearTimeout(t)
  }, [pathname])

  return <RouteProgress active={active} />
}
