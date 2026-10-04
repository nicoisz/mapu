'use client'

import { useEffect, useRef, useState } from 'react'
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
import { useInterestMatches } from '@/contexts/InterestMatchesContext'
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
  const { count: matchCount } = useInterestMatches()
  const { count: favCount } = useFavoritesContext()
  const [scrolled, setScrolled] = useState(false)

  // La barra se achica recién cuando el hero termina de pasar bajo el nav,
  // no a los pocos px de scroll: mientras se ve el naranjo del hero, la barra
  // tiene que seguir naranja y a todo el ancho.
  const heroThreshold = useRef(40)
  useEffect(() => {
    setScrolled(false)
    const measure = () => {
      const hero = document.querySelector<HTMLElement>('[data-hero]')
      heroThreshold.current = hero ? Math.max(160, hero.offsetHeight - 80) : 40
    }
    const handler = (e: Event) => {
      setScrolled((e as CustomEvent<{ y: number }>).detail.y > heroThreshold.current)
    }
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('mapu:scroll', handler as EventListener)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('mapu:scroll', handler as EventListener)
    }
  }, [pathname])

  const isHome = pathname === '/'
  // En el hero la barra es naranja a todo el ancho (mismo color que el hero);
  // al salir del hero se achica a un pill blanco centrado. En el resto del
  // sitio la barra queda sólida de borde a borde.
  const floating = isHome && scrolled
  const heroBar = isHome && !scrolled

  function handleLogout() {
    logout()
    router.push('/login')
  }

  return (
    <nav
      className={cn(
        'fixed left-0 right-0 z-50 flex justify-center transition-all duration-500',
        floating ? 'top-4 px-4' : 'top-0 px-0'
      )}
    >
      <div
        className={cn(
          'flex w-full items-center transition-all duration-500',
          floating
            ? 'solid-chrome h-14 max-w-2xl gap-5 rounded-full border border-outline-variant/30 pl-5 pr-2'
            : heroBar
              ? 'h-16 max-w-full gap-4 rounded-none bg-secondary px-4 text-on-secondary'
              : 'solid-chrome h-16 max-w-full gap-4 rounded-none border-b border-outline-variant/30 px-4'
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
        <div className={floating ? 'w-2' : 'flex-1'} />
        <div className="hidden md:flex items-center gap-1">
          {isAuthenticated && (
            <Link
              href="/para-ti"
              className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-on-surface-variant hover:bg-surface-container hover:text-primary"
            >
              Para ti
              {matchCount !== null && matchCount > 0 && (
                <span className="rounded-full bg-accent px-1.5 text-xs text-white">
                  {matchCount}
                </span>
              )}
            </Link>
          )}
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
                    href === '/buscar' && 'nav-shine',
                    heroBar
                      ? isActive
                        ? 'font-bold text-on-secondary'
                        : 'text-on-secondary/75 hover:bg-black/5 hover:text-on-secondary'
                      : isActive
                        ? 'font-bold text-primary'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
                  )}
                >
                  <Icon
                    size={16}
                    className={href === '/buscar' ? 'search-light-icon' : undefined}
                  />
                  {label === 'Favoritos' && favCount > 0 ? (
                    <span className="flex items-center gap-1">
                      {label}
                      <span className="text-xs rounded-full bg-accent px-1.5 py-px text-white">
                        {favCount}
                      </span>
                    </span>
                  ) : (
                    <span className={href === '/buscar' ? 'search-light-label' : undefined}>
                      {label}
                    </span>
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
                floating ? 'rounded-full' : 'rounded-lg'
              )}
            >
              <LogIn size={16} />
              Ingresar
            </Link>
          )}
        </div>{' '}
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
              <span
                className={cn(
                  'flex flex-col items-center gap-0.5',
                  href === '/buscar' && 'nav-shine px-4 py-1'
                )}
              >
                <div className="relative">
                  <Icon
                    size={20}
                    className={href === '/buscar' ? 'search-light-icon' : undefined}
                  />
                  {href === '/favoritos' && favCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {favCount}
                    </span>
                  )}
                </div>
                <span className={href === '/buscar' ? 'search-light-label' : undefined}>
                  {label === 'Mis propiedades' ? 'Panel' : label}
                </span>
              </span>
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
