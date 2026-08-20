'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bug, Building, Building2, Lock, ShieldCheck, Star, TrendingUp, Users } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { PlatformRole } from '@/types/enums'
import { cn } from '@/lib/utils'

const ADMIN_TABS: { href: string; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { href: '/admin', label: 'Panel', icon: ShieldCheck },
  { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { href: '/admin/propiedades', label: 'Propiedades', icon: Building2 },
  { href: '/admin/empresas', label: 'Empresas', icon: Building },
  { href: '/admin/resenas', label: 'Reseñas', icon: Star },
  { href: '/admin/ingresos', label: 'Ingresos', icon: TrendingUp },
  { href: '/admin/errores', label: 'Errores', icon: Bug },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, isAuthenticated, isLoading } = useAuthContext()
  const isAdmin = user?.platformRole === PlatformRole.SUPERADMIN

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-on-surface-variant text-sm">
        Cargando…
      </div>
    )
  }

  if (!isAuthenticated || !user || !isAdmin) {
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
      <div className="relative bg-surface-container-low border-b border-outline-variant/40 px-4 pt-7 pb-4 overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={20} className="text-primary" />
            <h1 className="font-headline text-2xl font-bold text-on-surface">
              Panel de administración
            </h1>
          </div>
          <p className="text-on-surface-variant text-sm">
            Superadministrador · gestión global del sistema.
          </p>
        </div>

        <div className="relative flex gap-1 mt-4 bg-surface-container rounded-lg p-1 w-fit flex-wrap">
          {ADMIN_TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all',
                  active
                    ? 'bg-surface-container-highest shadow-soft text-primary font-medium'
                    : 'text-on-surface-variant hover:text-on-surface'
                )}
              >
                <Icon size={14} /> {label}
              </Link>
            )
          })}
        </div>
      </div>

      <div className="p-4 max-w-5xl mx-auto">{children}</div>
    </div>
  )
}
