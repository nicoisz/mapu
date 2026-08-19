'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Heart, LayoutDashboard, LogIn, LogOut, Map, Moon, Search, Sun, User } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useFavoritesContext } from '@/contexts/FavoritesContext'
import { useTheme } from '@/hooks/useTheme'
import { APP_CONFIG } from '@/constants'
import { cn } from '@/lib/utils'

function ThemeToggle({ light }: { light?: boolean }) {
  const { theme, toggle, mounted } = useTheme()
  return (
    <button
      onClick={toggle}
      className={cn(
        'p-2 rounded-full transition-colors',
        light
          ? 'text-white/70 hover:text-white hover:bg-white/10'
          : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
      )}
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
  // On the landing hero the nav floats as a centered dark pill (doesn't span
  // the full width); after scrolling it becomes the regular full-width bar.
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
            ? 'h-14 w-auto max-w-full gap-5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 pl-5 pr-2 text-white shadow-elevated'
            : 'h-16 w-full gap-4 px-4 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-outline-variant/30 shadow-sm text-on-surface'
        )}
      >
        <Link
          href="/"
          className="flex items-center gap-2 font-headline font-bold text-lg shrink-0 hover:opacity-90"
          title="Inicio"
        >
          <span
            className={cn(
              'material-symbols-outlined text-2xl',
              pill ? 'text-[#FF4D1C]' : 'text-primary'
            )}
          >
            map
          </span>
          <span className={cn('hidden sm:inline', pill ? 'text-white' : 'text-on-surface')}>
            {APP_CONFIG.name}
          </span>
          <span className={cn('sm:hidden', pill ? 'text-white' : 'text-on-surface')}>MapU</span>
        </Link>

        <div className={pill ? 'w-2' : 'flex-1'} />

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon, authRequired }) => {
            if (authRequired && !isAuthenticated) return null
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors',
                  pill
                    ? isActive
                      ? 'text-[#FF4D1C] font-bold'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                    : isActive
                      ? 'text-primary font-bold'
                      : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
                )}
              >
                <Icon size={16} />
                {label === 'Favoritos' && favCount > 0 ? (
                  <span className="flex items-center gap-1">
                    {label}
                    <span
                      className={cn(
                        'text-xs rounded-full px-1.5 py-px text-white',
                        pill ? 'bg-[#FF4D1C]' : 'bg-accent'
                      )}
                    >
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
          <ThemeToggle light={pill} />
          {isAuthenticated ? (
            <>
              <Link href="/perfil" className="flex items-center gap-2 hover:opacity-90">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className={cn(
                      'w-8 h-8 rounded-full object-cover border-2',
                      pill ? 'border-white/30' : 'border-outline-variant'
                    )}
                  />
                ) : (
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                      pill
                        ? 'bg-white/15 border border-white/20 text-white'
                        : 'bg-primary/20 border border-primary/30 text-primary'
                    )}
                  >
                    {user?.name.charAt(0)}
                  </div>
                )}
                <span
                  className={cn(
                    'hidden md:inline text-sm font-medium',
                    pill ? 'text-white' : 'text-on-surface'
                  )}
                >
                  {user?.name.split(' ')[0]}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                aria-label="Cerrar sesión"
                className={cn(
                  'p-2 rounded-full transition-colors',
                  pill
                    ? 'text-white/60 hover:text-white hover:bg-white/10'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                )}
                title="Cerrar sesión"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 text-sm font-bold transition-all duration-200 hover:scale-95',
                pill
                  ? 'bg-[#FF4D1C] text-white rounded-full'
                  : 'bg-primary text-on-primary rounded-lg'
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
        {navLinks.map(({ href, label, icon: Icon, authRequired }) => {
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
