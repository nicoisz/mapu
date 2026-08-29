'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { adminAccessStatus } from '@/lib/access'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, isLoading } = useAuthContext()
  const status = adminAccessStatus({ isLoading, user })

  // No autenticado → redirigir al login (guard client-side; el control de
  // acceso real va en la DB via RLS).
  const redirecting = status === 'redirect'
  useEffect(() => {
    if (redirecting) router.replace('/login?next=/admin')
  }, [redirecting, router])

  if (status === 'loading' || status === 'redirect') {
    return (
      <div className="h-full flex items-center justify-center text-on-surface-variant text-sm">
        Cargando…
      </div>
    )
  }

  if (status === 'blocked') {
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
