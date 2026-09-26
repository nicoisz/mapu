'use client'

import { useEffect, useState } from 'react'
import { notificationsService } from '@/services/notificationsService'
import { useAuthContext } from '@/contexts/AuthContext'

/**
 * Cantidad de notificaciones sin ver, para el badge del menú.
 *
 * Se consulta al montar. Sin polling ni realtime: el requisito es que aparezcan
 * al entrar al módulo o recargar, y navegar entre rutas ya remonta el sidebar.
 */
export function useUnreadNotifications(): number {
  const { isAuthenticated } = useAuthContext()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isAuthenticated) {
      setCount(0)
      return
    }
    let active = true
    notificationsService.getUnreadCount().then((n) => {
      if (active) setCount(n)
    })
    return () => {
      active = false
    }
  }, [isAuthenticated])

  return count
}
