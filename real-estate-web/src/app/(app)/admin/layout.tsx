'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Bug, Building2, ShieldCheck, Star, TrendingUp, Users } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { adminAccessStatus } from '@/lib/access'
import { PageHeader } from '@/components/ui/PageHeader'

const SECTION_META: Record<string, { title: string; description: string; icon: React.ReactNode }> =
  {
    '/admin': {
      title: 'Panel de administración',
      description: 'Resumen de la plataforma: usuarios, propiedades e ingresos.',
      icon: <ShieldCheck size={20} />,
    },
    '/admin/usuarios': {
      title: 'Usuarios',
      description: 'Cuentas, roles y verificaciones.',
      icon: <Users size={20} />,
    },
    '/admin/propiedades': {
      title: 'Propiedades',
      description: 'Todas las publicaciones de la plataforma.',
      icon: <Building2 size={20} />,
    },
    '/admin/empresas': {
      title: 'Empresas',
      description: 'Inmobiliarias y corredoras registradas.',
      icon: <Building2 size={20} />,
    },
    '/admin/ingresos': {
      title: 'Ingresos',
      description: 'Pagos y ventas.',
      icon: <TrendingUp size={20} />,
    },
    '/admin/resenas': {
      title: 'Reseñas',
      description: 'Moderación de reseñas de la plataforma.',
      icon: <Star size={20} />,
    },
    '/admin/errores': {
      title: 'Log de errores',
      description: 'Errores client-side de la app.',
      icon: <Bug size={20} />,
    },
  }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
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

  const meta = SECTION_META[pathname] ?? SECTION_META['/admin']

  return (
    <div className="h-full overflow-y-auto bg-background">
      <PageHeader icon={meta.icon} title={meta.title} description={meta.description} />
      <div className="mx-auto w-full max-w-5xl px-6 py-6">{children}</div>
    </div>
  )
}
