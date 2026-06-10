'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, Camera, ChevronRight, Globe, Lock, LogOut, Mail, Phone, Shield, Star } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { SubscriptionType, UserType } from '@/types/enums'

const USER_TYPE_LABELS: Record<UserType, string> = {
  individual: 'Particular',
  agent: 'Corredor inmobiliario',
  company: 'Empresa / Inmobiliaria',
}

export default function PerfilPage() {
  const router = useRouter()
  const { user, isAuthenticated, logout, hasSubscription } = useAuthContext()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  if (!isAuthenticated || !user) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-background">
        <Lock size={48} className="text-on-surface-variant/40 mb-4" />
        <h2 className="font-headline text-xl font-bold text-on-surface">No has iniciado sesión</h2>
        <Link href="/login" className="mt-6 bg-primary text-on-primary px-6 py-2.5 rounded-xl text-sm font-semibold hover:brightness-110 transition-all">Iniciar sesión</Link>
      </div>
    )
  }

  const isPremium = hasSubscription(SubscriptionType.PREMIUM)

  function handleLogout() {
    logout()
    router.push('/login')
  }

  return (
    <div className="h-full overflow-y-auto bg-background pb-20">
      {/* Header */}
      <div className="relative bg-surface-container-low border-b border-outline-variant/40 px-4 pt-8 pb-6 overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="relative flex flex-col items-center text-center">
          <div className="relative mb-3">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full object-cover border-4 border-primary/30" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary/20 text-primary flex items-center justify-center text-3xl font-bold border-4 border-primary/30">
                {user.name.charAt(0)}
              </div>
            )}
            <button className="absolute bottom-0 right-0 bg-primary text-on-primary rounded-full p-1.5 shadow-soft">
              <Camera size={12} />
            </button>
          </div>
          <h1 className="font-headline font-bold text-2xl text-on-surface">{user.name}</h1>
          <p className="text-on-surface-variant text-sm">{user.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={isPremium ? 'premium' : 'gray'} size="sm">
              {isPremium ? '★ Premium' : 'Plan gratuito'}
            </Badge>
            <span className="text-on-surface-variant/50 text-xs">•</span>
            <span className="text-on-surface-variant text-xs">{USER_TYPE_LABELS[user.userType]}</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="relative grid grid-cols-3 gap-3 mt-6 max-w-md mx-auto">
          <div className="text-center">
            <div className="font-headline font-bold text-2xl text-primary">{user.stats.totalListings}</div>
            <div className="text-xs text-on-surface-variant">Publicaciones</div>
          </div>
          <div className="text-center">
            <div className="font-headline font-bold text-2xl text-primary">{user.stats.totalViews.toLocaleString()}</div>
            <div className="text-xs text-on-surface-variant">Vistas</div>
          </div>
          <div className="text-center">
            {user.stats.rating ? (
              <>
                <div className="font-headline font-bold text-2xl flex items-center justify-center gap-1 text-primary">
                  <Star size={16} className="fill-primary text-primary" />
                  {user.stats.rating}
                </div>
                <div className="text-xs text-on-surface-variant">{user.stats.reviewCount} reseñas</div>
              </>
            ) : (
              <>
                <div className="font-headline font-bold text-2xl text-on-surface">—</div>
                <div className="text-xs text-on-surface-variant">Sin reseñas</div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* Account info */}
        <section className="bg-surface-container-low rounded-2xl border border-outline-variant/40 overflow-hidden">
          <h2 className="px-4 pt-4 pb-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Mi cuenta</h2>

          <div className="divide-y divide-outline-variant/40">
            <div className="flex items-center gap-3 px-4 py-3">
              <Mail size={16} className="text-on-surface-variant" />
              <div className="flex-1">
                <p className="text-xs text-on-surface-variant">Email</p>
                <p className="text-sm font-medium text-on-surface">{user.email}</p>
              </div>
              {user.isEmailVerified && <Shield size={14} className="text-accent" />}
            </div>

            {user.contactInfo?.phone && (
              <div className="flex items-center gap-3 px-4 py-3">
                <Phone size={16} className="text-on-surface-variant" />
                <div className="flex-1">
                  <p className="text-xs text-on-surface-variant">Teléfono</p>
                  <p className="text-sm font-medium text-on-surface">{user.contactInfo.phone}</p>
                </div>
                {user.isPhoneVerified && <Shield size={14} className="text-accent" />}
              </div>
            )}

            {user.companyName && (
              <div className="flex items-center gap-3 px-4 py-3">
                <Globe size={16} className="text-on-surface-variant" />
                <div className="flex-1">
                  <p className="text-xs text-on-surface-variant">Empresa</p>
                  <p className="text-sm font-medium text-on-surface">{user.companyName}</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Subscription */}
        <section className="bg-surface-container-low rounded-2xl border border-outline-variant/40 overflow-hidden">
          <h2 className="px-4 pt-4 pb-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Suscripción</h2>

          <div className={`mx-4 mb-4 rounded-xl p-4 border ${isPremium ? 'bg-primary-container/40 border-primary/40' : 'bg-surface-container border-outline-variant/40'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-on-surface">{isPremium ? '★ Premium' : 'Plan gratuito'}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {isPremium
                    ? `Activo hasta ${user.subscription.expiresAt ? new Date(user.subscription.expiresAt).toLocaleDateString('es-CL') : 'sin vencimiento'}`
                    : `${user.subscription.remainingListings ?? 0} publicaciones restantes`
                  }
                </p>
              </div>
              {!isPremium && (
                <button
                  onClick={() => alert('Upgrade a Premium (próximamente)')}
                  className="bg-primary text-on-primary text-xs font-bold px-3 py-1.5 rounded-full hover:brightness-110 transition-all"
                >
                  Mejorar
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Settings */}
        <section className="bg-surface-container-low rounded-2xl border border-outline-variant/40 overflow-hidden">
          <h2 className="px-4 pt-4 pb-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Configuración</h2>

          <div className="divide-y divide-outline-variant/40">
            {[
              { icon: Bell, label: 'Notificaciones', desc: 'Gestiona tus alertas' },
              { icon: Globe, label: 'Idioma y moneda', desc: `${user.preferences.language === 'es' ? 'Español' : 'English'} · ${user.preferences.currency}` },
              { icon: Shield, label: 'Privacidad y seguridad', desc: 'Contraseña y datos' },
            ].map(item => (
              <button key={item.label} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container transition-colors">
                <item.icon size={16} className="text-on-surface-variant" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-on-surface">{item.label}</p>
                  <p className="text-xs text-on-surface-variant">{item.desc}</p>
                </div>
                <ChevronRight size={14} className="text-on-surface-variant" />
              </button>
            ))}
          </div>
        </section>

        {/* Logout */}
        <section>
          {showLogoutConfirm ? (
            <div className="bg-surface-container-low rounded-2xl border border-error/40 p-4 space-y-3">
              <p className="text-sm text-on-surface font-medium">¿Cerrar sesión?</p>
              <div className="flex gap-3">
                <Button variant="danger" size="sm" fullWidth onClick={handleLogout}>
                  Sí, cerrar sesión
                </Button>
                <Button variant="outline" size="sm" fullWidth onClick={() => setShowLogoutConfirm(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-surface-container-low rounded-2xl border border-outline-variant/40 text-error hover:bg-error/10 transition-colors"
            >
              <LogOut size={16} />
              <span className="text-sm font-medium">Cerrar sesión</span>
            </button>
          )}
        </section>
      </div>
    </div>
  )
}
