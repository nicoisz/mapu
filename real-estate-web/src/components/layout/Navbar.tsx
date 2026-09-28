'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BarChart3,
  Heart,
  LayoutDashboard,
  LogIn,
  LogOut,
  Map,
  Moon,
  Search,
  Shield,
  Sun,
  User,
} from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useFavoritesContext } from '@/contexts/FavoritesContext'
import { useTheme } from '@/hooks/useTheme'
import { APP_CONFIG } from '@/constants'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function ThemeToggle() {
  const { theme, toggle, mounted } = useTheme()
  return (
    <button
      onClick={toggle}
      className="p-2 rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
      title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
      aria-label="Cambiar tema"
    >
      {mounted && theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}

const navLinks = [
  { href: '/', label: 'Inicio', icon: Map },
  { href: '/buscar', label: 'Buscar', icon: Search },
  { href: '/favoritos', label: 'Favoritos', icon: Heart },
  { href: '/dashboard', label: 'Mis propiedades', icon: LayoutDashboard, authRequired: true },
  { href: '/metricas', label: 'Métricas', icon: BarChart3, authRequired: true },
]

// En el header desktop solo las opciones comunes a todos los roles.
const commonLinks = [
  { href: '/buscar', label: 'Buscar', icon: Search },
  { href: '/favoritos', label: 'Favoritos', icon: Heart },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuthContext()
  const { count: favCount } = useFavoritesContext()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      setScrolled((e as CustomEvent<{ y: number }>).detail.y > 40)
    }
    window.addEventListener('mapu:scroll', handler as EventListener)
    return () => window.removeEventListener('mapu:scroll', handler as EventListener)
  }, [])

  const isHome = pathname === '/'
  // En el hero la nav flota como pill centrado; al scrollear pasa a barra
  // completa. Es solo forma y posición: los colores son los del tema en los
  // dos estados, porque detrás del pill ya no hay foto sino el fondo.
  const pill = isHome && !scrolled

  function handleLogout() {
    logout()
    router.push('/login')
  }

  return (
    <nav
      className={cn(
        'fixed left-0 right-0 z-50 flex transition-all duration-500',
        pill ? 'top-4 px-4 justify-center' : 'top-0'
      )}
    >
      <div
        className={cn(
          'flex items-center transition-all duration-500',
          pill
            ? 'solid-chrome h-14 w-auto max-w-full gap-5 rounded-full border border-outline-variant/30 pl-5 pr-2'
            : 'solid-chrome h-16 w-full gap-4 px-4 border-b border-outline-variant/30'
        )}
      >
        <Link
          href="/"
          className="flex items-center gap-2 font-headline font-bold text-lg shrink-0 hover:opacity-90"
          title="Inicio"
        >
          <span className="material-symbols-outlined text-2xl text-primary">map</span>
          <span className="hidden text-on-surface sm:inline">{APP_CONFIG.name}</span>
          <span className="text-on-surface sm:hidden">MapU</span>
        </Link>

        <div className={pill ? 'w-2' : 'flex-1'} />

        <div className="hidden md:flex items-center gap-1">
          {commonLinks
            .filter(({ href }) => !(href === '/buscar' && pathname === '/buscar'))
            .map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors',
                    isActive
                      ? 'text-primary font-bold'
                      : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
                  )}
                >
                  <Icon size={16} />
                  {label === 'Favoritos' && favCount > 0 ? (
                    <span className="flex items-center gap-1">
                      {label}
                      <span className="text-xs rounded-full bg-accent px-1.5 py-px text-white">
                        {favCount}
                      </span>
                    </span>
                  ) : (
                    label
                  )}
                </Link>
              )
            })}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 rounded-full hover:opacity-90 focus:outline-none"
                  aria-label="Menú de usuario"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border-2 border-outline-variant"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-primary/20 border border-primary/30 text-primary">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <span className="hidden lg:inline text-sm font-medium text-on-surface">
                    {user.name.split(' ')[0]}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  {user.name} · {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                  <LayoutDashboard size={16} /> Mis propiedades
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/metricas')}>
                  <BarChart3 size={16} /> Métricas
                </DropdownMenuItem>
                {user.platformRole === 'superadmin' && (
                  <DropdownMenuItem onClick={() => router.push('/admin')}>
                    <Shield size={16} /> Panel admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut size={16} /> Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/login"
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 text-sm font-bold transition-all duration-200 hover:scale-95',
                'bg-primary text-on-primary',
                pill ? 'rounded-full' : 'rounded-lg'
              )}
            >
              <LogIn size={16} />
              Ingresar
            </Link>
          )}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface-container-lowest border-t border-outline-variant/20 flex md:hidden z-50">
        {navLinks.slice(0, 4).map(({ href, label, icon: Icon, authRequired }) => {
          if (authRequired && !isAuthenticated) return null
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center py-2 text-xs gap-0.5 transition-colors',
                isActive ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              )}
            >
              <div className="relative">
                <Icon size={20} />
                {href === '/favoritos' && favCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {favCount}
                  </span>
                )}
              </div>
              <span>{label === 'Mis propiedades' ? 'Panel' : label}</span>
            </Link>
          )
        })}
        <Link
          href={isAuthenticated ? '/perfil' : '/login'}
          className={cn(
            'flex-1 flex flex-col items-center py-2 text-xs gap-0.5 transition-colors',
            pathname === '/perfil' || pathname === '/login'
              ? 'text-primary'
              : 'text-on-surface-variant hover:text-on-surface'
          )}
        >
          <User size={20} />
          <span>{isAuthenticated ? 'Perfil' : 'Ingresar'}</span>
        </Link>
      </div>
    </nav>
  )
}
