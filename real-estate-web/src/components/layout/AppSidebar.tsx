'use client'

import { useEffect, useState } from 'react'
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
  PanelLeft,
  ShieldCheck,
  Star,
  TrendingUp,
  UserRound,
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
  icon: React.ComponentType<{ size?: number; className?: string }>
}

const COLLAPSE_KEY = 'mapu:sidebar-collapsed'

export function AppSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAuthContext()
  const { count: favCount } = useFavoritesContext()
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  // Persistir colapso entre sesiones.
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1')
    } catch {
      /* ignore */
    }
  }, [])

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }

  const role: AppRole = getAppRole(user)

  const exploreItems: NavItem[] = [
    { href: '/buscar', label: 'Explorar', icon: Map },
    { href: '/favoritos', label: 'Favoritos', icon: Heart },
    { href: '/dashboard', label: 'Mis propiedades', icon: LayoutDashboard },
  ]

  const metricsItem: NavItem = { href: '/metricas', label: 'Métricas', icon: BarChart3 }
  const teamItem: NavItem = { href: '/equipo', label: 'Mi empresa', icon: Building2 }
  const profileItem: NavItem = { href: '/perfil', label: 'Mi perfil', icon: UserRound }

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
    items = [...adminItems, metricsItem, profileItem]
    showTeamSeparator = true
  } else if (role === 'org_owner' || role === 'org_admin') {
    items = [teamItem, metricsItem, ...exploreItems, profileItem]
  } else if (role === 'org_agent') {
    items = [teamItem, ...exploreItems, metricsItem, profileItem]
  } else {
    items = [...exploreItems, metricsItem, profileItem]
  }

  function handleLogout() {
    logout()
    window.location.href = '/login'
  }

  const navLinkClasses = cn(
    'relative flex items-center rounded-xl text-sm font-medium transition-colors',
    collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'
  )

  const sidebar = (
    <div className="flex h-full flex-col border-r border-outline-variant/40 bg-surface-container-lowest">
      {/* Desktop collapse toggle */}
      <div
        className={cn(
          'hidden h-12 shrink-0 items-center justify-between border-b border-outline-variant/40 md:flex',
          collapsed ? 'px-2' : 'px-3'
        )}
      >
        {!collapsed && (
          <span className="font-headline text-sm font-bold text-primary">MapU</span>
        )}
        <button
          onClick={toggleCollapsed}
          className={cn(
            'rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface',
            collapsed && 'mx-auto'
          )}
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          <PanelLeft size={18} className={cn('transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>

      <div className="flex justify-end px-3 py-2 md:hidden">
        <button
          onClick={() => setOpen(false)}
          className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container"
          aria-label="Cerrar menú"
        >
          <X size={18} />
        </button>
      </div>

      <nav
        className={cn(
          'flex-1 overflow-y-auto space-y-1',
          collapsed ? 'p-2' : 'p-3'
        )}
      >
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                navLinkClasses,
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              )}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && label}
              {!collapsed && href === '/favoritos' && favCount > 0 && (
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
                navLinkClasses,
                pathname === '/dashboard'
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              )}
              title={collapsed ? 'Mi panel personal' : undefined}
            >
              <LayoutDashboard size={18} className="shrink-0" />
              {!collapsed && 'Mi panel personal'}
            </Link>
          </>
        )}
      </nav>

      <div
        className={cn(
          'border-t border-outline-variant/40',
          collapsed ? 'p-2' : 'p-3'
        )}
      >
        {!collapsed && <ExchangeIndicators className="justify-center mb-3" />}
        {isAuthenticated && user ? (
          <div className={cn('space-y-2', collapsed && 'space-y-3')}>
            <Link
              href="/perfil"
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center rounded-xl transition-colors hover:bg-surface-container',
                collapsed ? 'justify-center px-2 py-2' : 'gap-3 px-2 py-2'
              )}
              title={collapsed ? user.name : undefined}
            >
              <Avatar className="h-9 w-9 shrink-0">
                {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-on-surface truncate">{user.name}</p>
                  <p className="text-xs text-on-surface-variant truncate">
                    {role === 'superadmin' ? 'Superadmin' : user.email}
                  </p>
                </div>
              )}
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'text-on-surface-variant',
                collapsed ? 'justify-center px-2' : 'w-full justify-start'
              )}
              onClick={handleLogout}
              title={collapsed ? 'Cerrar sesión' : undefined}
            >
              <LogOut size={16} />
              {!collapsed && 'Cerrar sesión'}
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

  // Anonymous visitors keep the current full-bleed layout (no sidebar).
  if (!isAuthenticated) {
    return (
      <div className="h-full">
        <div className="h-full min-h-0 overflow-hidden">{children}</div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden h-full shrink-0 transition-[width] duration-200 ease-in-out md:block',
          collapsed ? 'w-[72px]' : 'w-56'
        )}
      >
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 h-full">{sidebar}</div>
        </div>
      )}

      {/* Content */}
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-outline-variant/40 px-3 md:hidden">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container"
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>
          <span className="font-headline font-bold text-primary">MapU</span>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  )
}
