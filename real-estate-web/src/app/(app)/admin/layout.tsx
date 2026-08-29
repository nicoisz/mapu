'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/contexts/AuthContext'
import { adminAccessStatus } from '@/lib/access'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, isLoading } = useAuthContext()
  const status = adminAccessStatus({ isLoading, user })

  // No autenticado → login; autenticado sin rol → su panel.
  const redirectTo = status === 'redirect' ? '/login?next=/admin' : '/dashboard'
  const mustRedirect = status === 'redirect' || status === 'blocked'
  useEffect(() => {
    if (mustRedirect) router.replace(redirectTo)
  }, [mustRedirect, redirectTo, router])

  if (status === 'loading' || mustRedirect) {
    return (
      <div className="h-full flex items-center justify-center text-on-surface-variant text-sm">
        Cargando…
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="p-4 max-w-5xl mx-auto">{children}</div>
    </div>
  )
}
