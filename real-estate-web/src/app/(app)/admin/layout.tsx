'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { PlatformRole } from '@/types/enums'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuthContext()
  const isAdmin = user?.platformRole === PlatformRole.SUPERADMIN

  // No autenticado → redirigir al login (guard client-side; el control de
  // acceso real lo impone la RLS de la DB en adminService).
  const isLoggedOut = !isLoading && (!isAuthenticated || !user)
  useEffect(() => {
    if (isLoggedOut) router.replace('/login?next=/admin')
  }, [isLoggedOut, router])

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-on-surface-variant text-sm">
        Cargando…
      </div>
    )
  }

  if (isLoggedOut) {
    return (
      <div className="h-full flex items-center justify-center text-on-surface-variant text-sm">
        Cargando…
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-background">
        <Lock size={48} className="text-on-surface-variant/40 mb-4" />
        <h2 className="font-headline text-xl font-bold text-on-surface">Acceso restringido</h2>
        <p className="text-on-surface-variant text-sm mt-2">
          Solo superadministradores pueden entrar aquí.
        </p>
        <Link
          href="/"
          className="mt-6 bg-primary text-on-primary px-6 py-2.5 rounded-xl text-sm font-semibold hover:brightness-110 transition-all"
        >
          Volver al inicio
        </Link>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="p-4 max-w-5xl mx-auto">{children}</div>
    </div>
  )
}
