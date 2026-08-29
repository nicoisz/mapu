'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Building,
  Building2,
  Bug,
  Heart,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useFavoritesContext } from '@/contexts/FavoritesContext'
import { ExchangeIndicators } from '@/components/layout/ExchangeIndicators'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { getAppRole, AppRole } from '@/lib/roles'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number }>
}

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAuthContext()
  const { count: favCount } = useFavoritesContext()
  const [open, setOpen] = useState(false)

  const role: AppRole = getAppRole(user)

  const exploreItems: NavItem[] = [
    { href: '/buscar', label: 'Explorar', icon: Map },
    { href: '/favoritos', label: 'Favoritos', icon: Heart },
    { href: '/dashboard', label: 'Mis propiedades', icon: LayoutDashboard },
  ]

  const metricsItem: NavItem = { href: '/metricas', label: 'Métricas', icon: BarChart3 }
  const teamItem: NavItem = { href: '/equipo', label: 'Mi empresa', icon: Building2 }

  const adminItems: NavItem[] = [
    { href: '/admin', label: 'Panel', icon: ShieldCheck },
    { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
    { href: '/admin/propiedades', label: 'Propiedades', icon: Building2 },
    { href: '/admin/empresas', label: 'Empresas', icon: Building },
    { href: '/admin/resenas', label: 'Reseñas', icon: Star },
    { href: '/admin/ingresos', label: 'Ingresos', icon: TrendingUp },
    { href: '/admin/errores', label: 'Log de errores', icon: Bug },
  ]

  // Menú según rol: cada rol solo ve lo que le corresponde.
  let items: NavItem[]
  let showTeamSeparator = false
  if (role === 'superadmin') {
    items = [...adminItems, metricsItem]
    showTeamSeparator = true
  } else if (role === 'org_owner' || role === 'org_admin') {
    items = [teamItem, metricsItem, ...exploreItems]
  } else if (role === 'org_agent') {
    items = [teamItem, ...exploreItems, metricsItem]
  } else {
    items = [...exploreItems, metricsItem]
  }

  function handleLogout() {
    logout()
    window.location.href = '/login'
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-surface-container-lowest border-r border-outline-variant/40">
      <div className="flex justify-end px-3 py-2 md:hidden">
        <button
          onClick={() => setOpen(false)}
          className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container"
          aria-label="Cerrar menú"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              )}
            >
              <Icon size={18} />
              {label}
              {href === '/favoritos' && favCount > 0 && (
                <span className="ml-auto text-xs rounded-full px-1.5 py-px bg-accent text-white">
                  {favCount}
                </span>
              )}
            </Link>
          )
        })}
        {showTeamSeparator && (
          <>
            <div className="pt-3 mt-3 border-t border-outline-variant/40" />
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                pathname === '/dashboard'
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              )}
            >
              <LayoutDashboard size={18} />
              Mi panel personal
            </Link>
          </>
        )}
      </nav>

      <div className="p-3 border-t border-outline-variant/40">
        <ExchangeIndicators className="justify-center mb-3" />
        {isAuthenticated && user ? (
          <div className="space-y-2">
            <Link
              href="/perfil"
              className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-surface-container transition-colors"
            >
              <Avatar className="h-9 w-9">
                {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-on-surface truncate">{user.name}</p>
                <p className="text-xs text-on-surface-variant truncate">
                  {role === 'superadmin' ? 'Superadmin' : user.email}
                </p>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-on-surface-variant"
              onClick={handleLogout}
            >
              <LogOut size={16} /> Cerrar sesión
            </Button>
          </div>
        ) : (
          <Link href="/login" className="block w-full">
            <Button fullWidth>Ingresar</Button>
          </Link>
        )}
      </div>
    </div>
  )

  return (
    <div className="h-full flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 shrink-0 h-full">{sidebar}</aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 h-full">{sidebar}</div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0 h-full flex flex-col">
        <div className="md:hidden flex items-center gap-2 px-3 h-12 border-b border-outline-variant/40 shrink-0">
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container"
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>
          <span className="font-headline font-bold text-primary">MapU</span>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
      </div>
    </div>
  )
}
