'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Building,
  Building2,
  Bell,
  Bug,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Sun,
  MessageCircle,
  PanelLeft,
  ShieldCheck,
  Star,
  TrendingUp,
  UserRound,
  Users,
  Sparkles,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useFavoritesContext } from '@/contexts/FavoritesContext'
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications'
import { ExchangeIndicators } from '@/components/layout/ExchangeIndicators'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { getAppRole, AppRole } from '@/lib/roles'
import { useInterestMatches } from '@/contexts/InterestMatchesContext'
import { useTheme } from '@/hooks/useTheme'
import { useUnreadMessages } from '@/hooks/useUnreadMessages'

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
  const unreadCount = useUnreadNotifications()
  const unreadMessages = useUnreadMessages()
  const { count: matchCount, hasInterests } = useInterestMatches()

  const badgeFor = (href: string) =>
    href === '/favoritos'
      ? favCount
      : href === '/notificaciones'
        ? unreadCount
        : href === '/mensajes'
          ? unreadMessages
          : href === '/para-ti'
            ? (matchCount ?? 0)
            : 0
  const [open, setOpen] = useState(false)
  const [desktopCollapsed, setCollapsed] = useState(false)
  const collapsed = desktopCollapsed && !open
  const [triggerTarget, setTriggerTarget] = useState<HTMLElement | null>(null)
  const drawer = useRef<HTMLDialogElement>(null)
  const { theme, select } = useTheme()

  useEffect(() => {
    setTriggerTarget(document.getElementById('sidebar-trigger'))
  }, [])
  useEffect(() => {
    const dialog = drawer.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])
  useEffect(() => {
    const query = window.matchMedia('(min-width: 768px)')
    const closeOnDesktop = () => {
      if (query.matches) setOpen(false)
    }
    query.addEventListener('change', closeOnDesktop)
    return () => query.removeEventListener('change', closeOnDesktop)
  }, [])

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
    { href: '/favoritos', label: 'Favoritos', icon: Heart },
    { href: '/para-ti', label: 'Propiedades para ti', icon: Sparkles },
    { href: '/intereses', label: 'Mis intereses', icon: SlidersHorizontal },
    { href: '/dashboard', label: 'Mis propiedades', icon: LayoutDashboard },
    { href: '/mensajes', label: 'Mensajes', icon: MessageCircle },
    { href: '/notificaciones', label: 'Notificaciones', icon: Bell },
  ]

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
    items = [...adminItems, profileItem]
    showTeamSeparator = true
  } else if (role === 'org_owner' || role === 'org_admin') {
    items = [teamItem, ...exploreItems, profileItem]
  } else if (role === 'org_agent') {
    items = [teamItem, ...exploreItems, profileItem]
  } else {
    items = [...exploreItems, profileItem]
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
        {!collapsed && <span className="font-headline text-sm font-bold text-primary">MapU</span>}
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

      <nav className={cn('flex-1 overflow-y-auto space-y-1', collapsed ? 'p-2' : 'p-3')}>
        {items
          .filter((item) => item.href !== '/para-ti' || hasInterests)
          .map(({ href, label, icon: Icon }) => {
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
                aria-label={label}
                title={collapsed ? label : undefined}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && label}
                {!collapsed && badgeFor(href) > 0 && (
                  <span className="ml-auto text-xs rounded-full px-1.5 py-px bg-accent text-white">
                    {badgeFor(href)}
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

      <div className={cn('border-t border-outline-variant/40', collapsed ? 'p-2' : 'p-3')}>
        <div
          className={cn('mb-3 flex gap-1', collapsed && 'flex-col')}
          role="group"
          aria-label="Tema"
        >
          {(
            [
              { value: 'light', label: 'Claro', icon: Sun },
              { value: 'dark', label: 'Oscuro', icon: Moon },
            ] as const
          ).map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              aria-label={`Modo ${label.toLowerCase()}`}
              aria-pressed={theme === value}
              onClick={() => {
                if (isAuthenticated) select(value)
              }}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-lg p-2 text-xs transition-colors',
                theme === value
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container'
              )}
            >
              <Icon size={16} />
              {!collapsed && label}
            </button>
          ))}
        </div>
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
    <div
      className="internal-modules flex h-full"
      data-sidebar-collapsed={desktopCollapsed ? 'true' : 'false'}
    >
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-[55] hidden transition-[width] duration-200 ease-in-out md:block',
          desktopCollapsed ? 'w-[72px]' : 'w-56'
        )}
      >
        {sidebar}
      </aside>

      {triggerTarget &&
        createPortal(
          <button
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={open}
            aria-controls="app-menu"
            className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container"
          >
            <Menu size={20} />
          </button>,
          triggerTarget
        )}
      <dialog
        ref={drawer}
        id="app-menu"
        aria-label="Menú principal"
        onCancel={() => setOpen(false)}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false)
        }}
        className="m-0 h-[100dvh] max-h-none w-full max-w-none border-0 bg-transparent p-0 backdrop:bg-black/50"
      >
        <div className="h-full w-72 max-w-[85vw] pb-[env(safe-area-inset-bottom)] bg-surface-container-lowest">
          {sidebar}
        </div>
      </dialog>
      <div
        className={cn(
          'flex h-full min-w-0 flex-1 flex-col transition-[margin] duration-200',
          desktopCollapsed ? 'md:ml-[72px]' : 'md:ml-56'
        )}
      >
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  )
}
