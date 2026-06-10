'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, Eye, Heart, Lock, MessageSquare, Plus, RefreshCw, Star, Trash2 } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { propertyService } from '@/services/propertyService'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatDate, getDisplayPrice, getRemainingDays } from '@/lib/utils'
import { Property } from '@/types/property'
import { SubscriptionType } from '@/types/enums'
import { FREE_PLAN_LISTINGS_LIMIT, PROPERTY_TYPE_LABELS, STATUS_LABELS } from '@/constants'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, hasSubscription, refreshUser } = useAuthContext()
  const [properties, setProperties] = useState<Property[]>([])
  const [loadingProps, setLoadingProps] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const loadProperties = useCallback(async () => {
    if (!user) return
    setLoadingProps(true)
    try {
      setProperties(await propertyService.getUserProperties(user.id))
    } catch {
      setProperties([])
    } finally {
      setLoadingProps(false)
    }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { void loadProperties() }, [loadProperties])

  // Listings whose expiry date passed are shown (and renewable) as expired.
  const { activeProps, expiredProps, totals } = useMemo(() => {
    const now = Date.now()
    const isExpired = (p: Property) =>
      p.status === 'expired' || (p.listing.expiresAt ? new Date(p.listing.expiresAt).getTime() < now : false)
    const active = properties.filter(p => p.status === 'active' && !isExpired(p))
    const expired = properties.filter(isExpired)
    return {
      activeProps: active,
      expiredProps: expired,
      totals: {
        views: properties.reduce((sum, p) => sum + p.listing.views, 0),
        contacts: properties.reduce((sum, p) => sum + p.listing.inquiries, 0),
      },
    }
  }, [properties])

  if (isLoading) {
    return <div className="h-full flex items-center justify-center text-on-surface-variant text-sm">Cargando…</div>
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-background">
        <Lock size={48} className="text-on-surface-variant/40 mb-4" />
        <h2 className="font-headline text-xl font-bold text-on-surface">Necesitas iniciar sesión</h2>
        <p className="text-on-surface-variant text-sm mt-2">Para gestionar tus propiedades debes tener una cuenta.</p>
        <Link href="/login" className="mt-6 bg-primary text-on-primary px-6 py-2.5 rounded-xl text-sm font-semibold hover:brightness-110 transition-all">Iniciar sesión</Link>
      </div>
    )
  }

  const isPremium = hasSubscription(SubscriptionType.PREMIUM)
  const remaining = Math.max(0, FREE_PLAN_LISTINGS_LIMIT - activeProps.length)

  async function handleRenew(id: string) {
    setBusyId(id)
    const renewed = await propertyService.renewProperty(id)
    setBusyId(null)
    if (renewed) {
      await loadProperties()
      void refreshUser()
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`¿Eliminar definitivamente "${title}"? Esta acción no se puede deshacer.`)) return
    setBusyId(id)
    const ok = await propertyService.deleteProperty(id)
    setBusyId(null)
    if (ok) {
      await loadProperties()
      void refreshUser()
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-background pb-20">
      {/* Header */}
      <div className="relative bg-surface-container-low border-b border-outline-variant/40 px-4 pt-7 pb-5 overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="relative flex items-center gap-3">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-full object-cover border-2 border-primary/30" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xl font-bold">
              {user.name.charAt(0)}
            </div>
          )}
          <div>
            <p className="font-headline font-bold text-xl text-on-surface">{user.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={isPremium ? 'premium' : 'gray'} size="sm">
                {isPremium ? '★ Premium' : 'Plan gratuito'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="relative grid grid-cols-3 gap-3 mt-4">
          <div className="bg-surface-container rounded-xl p-3 text-center border border-outline-variant/40">
            <div className="font-headline font-bold text-xl text-primary">{activeProps.length}</div>
            <div className="text-xs text-on-surface-variant mt-0.5">Activos</div>
          </div>
          <div className="bg-surface-container rounded-xl p-3 text-center border border-outline-variant/40">
            <div className="font-headline font-bold text-xl text-primary">{totals.views.toLocaleString()}</div>
            <div className="text-xs text-on-surface-variant mt-0.5">Vistas</div>
          </div>
          <div className="bg-surface-container rounded-xl p-3 text-center border border-outline-variant/40">
            <div className="font-headline font-bold text-xl text-primary">{totals.contacts}</div>
            <div className="text-xs text-on-surface-variant mt-0.5">Contactos</div>
          </div>
        </div>

        {/* Free plan limit */}
        {!isPremium && (
          <div className="relative mt-4 bg-surface-container rounded-xl p-3 border border-outline-variant/40">
            <div className="flex items-center justify-between text-sm mb-2 text-on-surface">
              <span>Publicaciones gratuitas</span>
              <span className="font-bold">{remaining} / {FREE_PLAN_LISTINGS_LIMIT}</span>
            </div>
            <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(remaining / FREE_PLAN_LISTINGS_LIMIT) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 space-y-4 max-w-3xl mx-auto">
        {/* Actions */}
        <div className="flex gap-3">
          <Button
            fullWidth
            onClick={() => router.push('/publicar')}
            disabled={!isPremium && remaining === 0}
          >
            <Plus size={16} />
            Nueva propiedad
          </Button>
          {!isPremium && (
            <Button variant="outline" onClick={() => alert('Upgrade a Premium (próximamente)')}>
              <Star size={16} className="text-primary" />
              Premium
            </Button>
          )}
        </div>

        {!isPremium && remaining === 0 && (
          <div className="flex items-start gap-3 bg-error-container/40 border border-error/40 rounded-xl p-3 text-sm">
            <AlertCircle size={16} className="text-error shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-on-surface">Límite alcanzado</p>
              <p className="text-on-surface-variant text-xs mt-0.5">Actualiza a Premium para publicar sin límites.</p>
            </div>
          </div>
        )}

        {loadingProps && (
          <div className="text-center py-8 text-on-surface-variant text-sm">Cargando propiedades…</div>
        )}

        {/* Active properties */}
        {activeProps.length > 0 && (
          <section>
            <h2 className="font-headline font-semibold text-on-surface mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent" />
              Propiedades activas ({activeProps.length})
            </h2>
            <div className="space-y-3">
              {activeProps.map(property => {
                const { amount, suffix } = getDisplayPrice(property)
                const daysLeft = property.listing.expiresAt ? getRemainingDays(property.listing.expiresAt) : null
                return (
                  <div key={property.id} className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <Link href={`/propiedad/${property.id}`} className="font-medium text-on-surface text-sm hover:text-primary transition-colors line-clamp-1">
                          {property.title}
                        </Link>
                        <p className="text-xs text-on-surface-variant mt-0.5">{PROPERTY_TYPE_LABELS[property.type]} • {property.location.address.city}</p>
                        <p className="font-bold text-primary text-sm mt-1">{amount}{suffix}</p>
                      </div>
                      <Badge variant="success" size="sm">{STATUS_LABELS[property.status]}</Badge>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1"><Eye size={11} />{property.listing.views}</span>
                      <span className="flex items-center gap-1"><Heart size={11} />{property.listing.favorites}</span>
                      <span className="flex items-center gap-1"><MessageSquare size={11} />{property.listing.inquiries}</span>
                      {daysLeft !== null && (
                        <span className={daysLeft < 7 ? 'text-error font-medium' : ''}>
                          Expira en {daysLeft}d
                        </span>
                      )}
                      <button
                        onClick={() => handleDelete(property.id, property.title)}
                        disabled={busyId === property.id}
                        className="ml-auto flex items-center gap-1 text-error/80 hover:text-error transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={11} />
                        Eliminar
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Expired properties */}
        {expiredProps.length > 0 && (
          <section>
            <h2 className="font-headline font-semibold text-on-surface mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-outline" />
              Propiedades expiradas ({expiredProps.length})
            </h2>
            <div className="space-y-3">
              {expiredProps.map(property => (
                <div key={property.id} className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-4 opacity-75">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-on-surface text-sm line-clamp-1">{property.title}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">Expiró el {property.listing.expiresAt ? formatDate(property.listing.expiresAt) : '—'}</p>
                    </div>
                    <Badge variant="gray" size="sm">Expirado</Badge>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleRenew(property.id)}
                      disabled={busyId === property.id || (!isPremium && remaining === 0)}
                      className="flex items-center gap-1 text-xs text-accent border border-accent/60 rounded-lg px-2.5 py-1.5 hover:bg-accent hover:text-on-tertiary transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <RefreshCw size={11} className={busyId === property.id ? 'animate-spin' : ''} />
                      Renovar 30 días
                    </button>
                    <button
                      onClick={() => handleDelete(property.id, property.title)}
                      disabled={busyId === property.id}
                      className="flex items-center gap-1 text-xs text-error border border-error/40 rounded-lg px-2.5 py-1.5 hover:bg-error hover:text-on-error transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={11} />
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {!loadingProps && properties.length === 0 && (
          <div className="text-center py-12 text-on-surface-variant">
            <p className="text-4xl mb-3">🏠</p>
            <p className="font-medium text-on-surface">Aún no has publicado propiedades</p>
            <p className="text-sm mt-1">Haz clic en &quot;Nueva propiedad&quot; para comenzar</p>
          </div>
        )}
      </div>
    </div>
  )
}
