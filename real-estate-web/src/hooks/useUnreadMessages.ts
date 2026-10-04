'use client'
import { useEffect, useState } from 'react'
import { useAuthContext } from '@/contexts/AuthContext'
import { messagesService } from '@/services/messagesService'

export function useUnreadMessages() {
  const userId = useAuthContext().user?.id
  const [count, setCount] = useState(0)
  useEffect(() => {
    setCount(0)
    if (!userId) return
    let active = true
    const refresh = () => {
      void messagesService.unreadCount().then(
        (n) => {
          if (active) setCount(n)
        },
        () => {}
      )
    }
    refresh()
    window.addEventListener('mapu:messages-changed', refresh)
    return () => {
      active = false
      window.removeEventListener('mapu:messages-changed', refresh)
    }
  }, [userId])
  return count
}
