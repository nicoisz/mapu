'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell,
  ChevronRight,
  CreditCard,
  Globe,
  Lock,
  LogOut,
  Mail,
  Phone,
  Shield,
  UserRound,
} from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Reviews } from '@/components/reviews/Reviews'
import { PlatformRole, SubscriptionType, UserType } from '@/types/enums'

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
      <div className="flex h-full flex-col items-center justify-center bg-background p-8">
        <EmptyState
          icon={<Lock size={22} />}
          title="No has iniciado sesión"
          action={
            <Link href="/login" className="block">
              <Button>Iniciar sesión</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const isPremium = hasSubscription(SubscriptionType.PREMIUM)

  function handleLogout() {
    logout()
    router.push('/login')
  }

  return (
    <div className="h-full overflow-y-auto bg-background pb-16">
      {/* Header */}
      <PageHeader
        icon={<UserRound size={20} />}
        title={user.name}
        badge={
          <Badge variant={isPremium ? 'premium' : 'gray'} size="sm">
            {isPremium ? '★ Premium' : 'Plan gratuito'}
          </Badge>
        }
        description={`${user.email} · ${USER_TYPE_LABELS[user.userType]}`}
      />

      <div className="mx-auto w-full max-w-2xl space-y-4 px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Publicaciones" value={user.stats.totalListings} />
          <StatCard label="Vistas" value={user.stats.totalViews} />
          <StatCard
            label="Calificación"
            value={user.stats.rating ? user.stats.rating : undefined}
            hint={
              user.stats.rating
                ? `${user.stats.reviewCount} reseñas`
                : 'Sin reseñas'
            }
          />
        </div>

        <section className="bg-surface-container-low rounded-2xl border border-outline-variant/40 overflow-hidden">
          <h2 className="px-4 pt-4 pb-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Mi cuenta
          </h2>

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
          <h2 className="px-4 pt-4 pb-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Suscripción
          </h2>

          <div
            className={`mx-4 mb-4 rounded-xl p-4 border ${isPremium ? 'bg-primary-container/40 border-primary/40' : 'bg-surface-container border-outline-variant/40'}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-on-surface">
                  {isPremium ? '★ Premium' : 'Plan gratuito'}
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {isPremium
                    ? `Activo hasta ${user.subscription.expiresAt ? new Date(user.subscription.expiresAt).toLocaleDateString('es-CL') : 'sin vencimiento'}`
                    : `${user.subscription.remainingListings ?? 0} publicaciones restantes`}
                </p>
              </div>
              {!isPremium && (
                <Link
                  href="/mejorar"
                  className="bg-primary text-on-primary text-xs font-bold px-3 py-1.5 rounded-full hover:brightness-110 transition-all"
                >
                  Mejorar
                </Link>
              )}
            </div>

            {user.platformRole === PlatformRole.SUPERADMIN && (
              <Link
                href="/mejorar"
                className="mt-3 flex items-center justify-between rounded-xl border border-outline-variant/60 px-3 py-2.5 text-sm hover:bg-surface-container transition-colors"
              >
                <span className="flex items-center gap-2 font-medium text-on-surface">
                  <CreditCard size={15} className="text-on-surface-variant" />
                  Gestionar plan y tarjetas
                </span>
                <ChevronRight size={15} className="text-on-surface-variant" />
              </Link>
            )}
          </div>
        </section>

        {/* Settings */}
        <section className="bg-surface-container-low rounded-2xl border border-outline-variant/40 overflow-hidden">
          <h2 className="px-4 pt-4 pb-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Configuración
          </h2>

          <div className="divide-y divide-outline-variant/40">
            {[
              { icon: Bell, label: 'Notificaciones', desc: 'Gestiona tus alertas' },
              {
                icon: Globe,
                label: 'Idioma y moneda',
                desc: `${user.preferences.language === 'es' ? 'Español' : 'English'} · ${user.preferences.currency}`,
              },
              { icon: Shield, label: 'Privacidad y seguridad', desc: 'Contraseña y datos' },
            ].map((item) => (
              <button
                key={item.label}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container transition-colors"
              >
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

        {/* Reviews */}
        <section className="bg-surface-container-low rounded-2xl border border-outline-variant/40 p-4">
          <Reviews subjectId={user.id} organizationId={user.organizationId} />
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
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={() => setShowLogoutConfirm(false)}
                >
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
