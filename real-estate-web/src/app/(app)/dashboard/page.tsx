'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  AlertCircle,
  Building2,
  Eye,
  Heart,
  Lock,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCw,
  Star,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { getSupabase } from '@/lib/supabase'
import { propertyService } from '@/services/propertyService'
import { Sparkline } from '@/components/charts/Sparkline'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { EmptyState } from '@/components/ui/EmptyState'
import { GlowLoader } from '@/components/ui/GlowLoader'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatDate, getDisplayPrice, getRemainingDays } from '@/lib/utils'
import { Property } from '@/types/property'
import { SubscriptionType, PlatformRole } from '@/types/enums'
import { FREE_PLAN_LISTINGS_LIMIT, PROPERTY_TYPE_LABELS, STATUS_LABELS } from '@/constants'

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const asId = searchParams.get('as')
  const { user, isAuthenticated, isLoading, hasSubscription, refreshUser } = useAuthContext()
  const [properties, setProperties] = useState<Property[]>([])
  const [loadingProps, setLoadingProps] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Property | null>(null)
  const [asUser, setAsUser] = useState<{ id: string; name: string; email: string } | null>(null)
  const [viewsSeries, setViewsSeries] = useState<{ day: string; count: number }[]>([])

  // Superadmin impersonation: only when a superadmin passes ?as=<id>.
  const impersonating = !!asId && user?.platformRole === PlatformRole.SUPERADMIN
  const effectiveUserId = impersonating ? asId : user?.id

  useEffect(() => {
    if (!impersonating || !asId) return
    let active = true
    getSupabase()
      .from('profiles')
      .select('id, name, email')
      .eq('id', asId)
      .maybeSingle()
      .then(
        ({ data }) => {
          if (active && data) setAsUser({ id: data.id, name: data.name, email: data.email })
        },
        () => {}
      )
    return () => {
      active = false
    }
  }, [impersonating, asId])

  const loadProperties = useCallback(async () => {
    if (!effectiveUserId) return
    setLoadingProps(true)
    try {
      setProperties(await propertyService.getUserProperties(effectiveUserId))
    } catch {
      setProperties([])
    } finally {
      setLoadingProps(false)
    }
  }, [effectiveUserId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void loadProperties()
  }, [loadProperties])

  useEffect(() => {
    if (!effectiveUserId) return
    let active = true
    propertyService.getViewsSeries(effectiveUserId).then((s) => {
      if (active) setViewsSeries(s)
    })
    return () => {
      active = false
    }
  }, [effectiveUserId])

  // Listings whose expiry date passed are shown (and renewable) as expired.
  const { activeProps, expiredProps, totals } = useMemo(() => {
    const now = Date.now()
    const isExpired = (p: Property) =>
      p.status === 'expired' ||
      (p.listing.expiresAt ? new Date(p.listing.expiresAt).getTime() < now : false)
    const active = properties.filter((p) => p.status === 'active' && !isExpired(p))
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
    return (
      <div className="h-full flex items-center justify-center text-on-surface-variant text-sm">
        Cargando…
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background p-8">
        <EmptyState
          icon={<Lock size={22} />}
          title="Necesitas iniciar sesión"
          description="Para gestionar tus propiedades debes tener una cuenta."
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
  const remaining = Math.max(0, FREE_PLAN_LISTINGS_LIMIT - activeProps.length)

  async function handleRenew(id: string) {
    if (impersonating) return
    setBusyId(id)
    const renewed = await propertyService.renewProperty(id)
    setBusyId(null)
    if (renewed) {
      await loadProperties()
      void refreshUser()
    }
  }

  async function handleDelete(id: string) {
    if (impersonating) return
    setBusyId(id)
    const ok = await propertyService.deleteProperty(id)
    setBusyId(null)
    setConfirmDelete(null)
    if (ok) {
      await loadProperties()
      void refreshUser()
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-background pb-16">
      {/* Impersonation banner */}
      {impersonating && (
        <div className="sticky top-0 z-30 flex items-center gap-3 bg-primary/10 border-b border-primary/30 px-4 py-2">
          <UserRound size={16} className="text-primary shrink-0" />
          <p className="text-sm text-on-surface flex-1 min-w-0">
            <span className="font-semibold">Modo inspección:</span> viendo el panel de{' '}
            {asUser ? <span className="font-semibold">{asUser.name}</span> : 'este usuario'} — solo
            lectura
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline shrink-0"
          >
            <X size={14} /> Salir
          </button>
        </div>
      )}

      {/* Header */}
      <PageHeader
        title={user.name}
        badge={
          <Badge variant={isPremium ? 'premium' : 'gray'} size="sm">
            {isPremium ? '★ Premium' : 'Plan gratuito'}
          </Badge>
        }
        description={
          isPremium
            ? 'Publica sin límites y haz crecer tu cartera.'
            : `${remaining} de ${FREE_PLAN_LISTINGS_LIMIT} publicaciones gratuitas disponibles.`
        }
        actions={
          <>
            <Button
              onClick={() => router.push('/publicar')}
              disabled={!isPremium && remaining === 0}
            >
              <Plus size={16} />
              Nueva propiedad
            </Button>
            {!isPremium && (
              <Link href="/mejorar">
                <Button variant="outline">
                  <Star size={16} className="text-primary" />
                  Premium
                </Button>
              </Link>
            )}
          </>
        }
      />

      <div className="mx-auto w-full max-w-5xl space-y-6 px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Propiedades activas"
            value={activeProps.length}
            icon={<Building2 size={16} />}
            hint={`${properties.length} en total`}
          />
          <StatCard label="Visitas" value={totals.views} icon={<Eye size={16} />} />
          <StatCard label="Contactos" value={totals.contacts} icon={<MessageSquare size={16} />} />
        </div>

        {/* Free plan limit */}
        {!isPremium && (
          <Card className="p-5">
            <div className="flex items-center justify-between text-sm text-on-surface">
              <span className="font-medium">Publicaciones gratuitas</span>
              <span className="font-bold">
                {remaining} / {FREE_PLAN_LISTINGS_LIMIT}
              </span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-surface-container-highest overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(remaining / FREE_PLAN_LISTINGS_LIMIT) * 100}%` }}
              />
            </div>
          </Card>
        )}

        {/* Views metric */}
        <Card>
          <CardHeader>
            <CardTitle>Visitas · últimos 30 días</CardTitle>
          </CardHeader>
          <CardContent>
            <Sparkline data={viewsSeries} />
          </CardContent>
        </Card>

        {!isPremium && remaining === 0 && (
          <div className="flex items-start gap-3 rounded-2xl border border-error/40 bg-error-container/40 p-4 text-sm">
            <AlertCircle size={16} className="text-error shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-on-surface">Límite alcanzado</p>
              <p className="text-on-surface-variant text-xs mt-0.5">
                Actualiza a Premium para publicar sin límites.
              </p>
            </div>
          </div>
        )}

        {loadingProps && (
          <div className="flex justify-center py-8">
            <GlowLoader label="Cargando propiedades…" />
          </div>
        )}

        {/* Active properties */}
        {activeProps.length > 0 && (
          <section className="space-y-4">
            <SectionHeading title="Propiedades activas" count={activeProps.length} />
            <div className="space-y-3">
              {activeProps.map((property) => {
                const { amount, suffix } = getDisplayPrice(property)
                const daysLeft = property.listing.expiresAt
                  ? getRemainingDays(property.listing.expiresAt)
                  : null
                return (
                  <Card key={property.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/propiedad/${property.id}`}
                          className="font-medium text-on-surface text-sm hover:text-primary transition-colors line-clamp-1"
                        >
                          {property.title}
                        </Link>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          {PROPERTY_TYPE_LABELS[property.type]} • {property.location.address.city}
                        </p>
                        <p className="font-bold text-primary text-sm mt-1">
                          {amount}
                          {suffix}
                        </p>
                      </div>
                      <Badge variant="success" size="sm">
                        {STATUS_LABELS[property.status]}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <Eye size={11} />
                        {property.listing.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart size={11} />
                        {property.listing.favorites}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare size={11} />
                        {property.listing.inquiries}
                      </span>
                      {daysLeft !== null && (
                        <span className={daysLeft < 7 ? 'text-error font-medium' : ''}>
                          Expira en {daysLeft}d
                        </span>
                      )}
                      {!impersonating && (
                        <>
                          <Link
                            href={`/publicar?edit=${property.id}`}
                            className="ml-auto flex items-center gap-1 text-accent hover:text-primary transition-colors"
                          >
                            <Pencil size={11} />
                            Editar
                          </Link>
                          <button
                            onClick={() => setConfirmDelete(property)}
                            disabled={busyId === property.id}
                            className="flex items-center gap-1 text-error/80 hover:text-error transition-colors disabled:opacity-50"
                          >
                            <Trash2 size={11} />
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          </section>
        )}

        {/* Expired properties */}
        {expiredProps.length > 0 && (
          <section className="space-y-4">
            <SectionHeading title="Propiedades expiradas" count={expiredProps.length} />
            <div className="space-y-3">
              {expiredProps.map((property) => (
                <Card key={property.id} className="p-4 opacity-75">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-on-surface text-sm line-clamp-1">
                        {property.title}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Expiró el{' '}
                        {property.listing.expiresAt ? formatDate(property.listing.expiresAt) : '—'}
                      </p>
                    </div>
                    <Badge variant="gray" size="sm">
                      Expirado
                    </Badge>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {!impersonating && (
                      <>
                        <button
                          onClick={() => handleRenew(property.id)}
                          disabled={busyId === property.id || (!isPremium && remaining === 0)}
                          className="flex items-center gap-1 text-xs text-accent border border-accent/60 rounded-lg px-2.5 py-1.5 hover:bg-accent hover:text-on-tertiary transition-colors disabled:opacity-50 disabled:pointer-events-none"
                        >
                          <RefreshCw
                            size={11}
                            className={busyId === property.id ? 'animate-spin' : ''}
                          />
                          Renovar 30 días
                        </button>
                        <button
                          onClick={() => setConfirmDelete(property)}
                          disabled={busyId === property.id}
                          className="flex items-center gap-1 text-xs text-error border border-error/40 rounded-lg px-2.5 py-1.5 hover:bg-error hover:text-on-error transition-colors disabled:opacity-50"
                        >
                          <Trash2 size={11} />
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {!loadingProps && properties.length === 0 && (
          <Card>
            <EmptyState
              icon={<Building2 size={22} />}
              title="Aún no has publicado propiedades"
              description="Haz clic en «Nueva propiedad» para comenzar."
            />
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        title="¿Eliminar propiedad?"
        description={
          confirmDelete
            ? `"${confirmDelete.title}" se eliminará definitivamente. Esta acción no se puede deshacer.`
            : undefined
        }
        confirmLabel="Eliminar"
        busy={busyId === confirmDelete?.id}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete.id)}
      />
    </div>
  )
}
