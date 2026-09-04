'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BarChart3, Eye, Heart, Lock, MessageSquare } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { metricsService, MemberMetrics, computeTotals } from '@/services/metricsService'
import { Sparkline } from '@/components/charts/Sparkline'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Property } from '@/types/property'
import { PROPERTY_TYPE_LABELS, STATUS_LABELS } from '@/constants'

const SCOPE_LABELS: Record<string, string> = {
  global: 'Toda la plataforma',
  org: 'Tu empresa',
  self: 'Tus propiedades',
}

export default function MetricasPage() {
  const { user, isAuthenticated, isLoading } = useAuthContext()
  const [properties, setProperties] = useState<Property[]>([])
  const [series, setSeries] = useState<{ day: string; count: number }[]>([])
  const [members, setMembers] = useState<MemberMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const scope = metricsService.scopeFor(user)
  const totals = useMemo(() => computeTotals(properties), [properties])
  const topByViews = useMemo(
    () => [...properties].sort((a, b) => b.listing.views - a.listing.views).slice(0, 10),
    [properties]
  )

  useEffect(() => {
    if (!user) return
    let active = true
    setLoading(true)
    Promise.all([
      metricsService.getScopeProperties(user),
      metricsService.getViewsSeries(user),
      scope === 'org' ? metricsService.getMemberBreakdown(user) : Promise.resolve([]),
    ])
      .then(([props, serie, memberMetrics]) => {
        if (!active) return
        setProperties(props)
        setSeries(serie)
        setMembers(memberMetrics)
      })
      .catch((e) => active && setError(e instanceof Error ? e.message : 'Error al cargar métricas'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [user?.id, scope]) // eslint-disable-line react-hooks/exhaustive-deps

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
          description="Para ver métricas debes tener una cuenta."
          action={
            <Link href="/login" className="block">
              <Button>Iniciar sesión</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-background pb-16">
      <PageHeader
        icon={<BarChart3 size={20} />}
        title="Métricas"
        badge={
          <Badge variant="gray" size="sm">
            {SCOPE_LABELS[scope] ?? 'Tus propiedades'}
          </Badge>
        }
        description="Visitas, favoritos y contactos de las publicaciones bajo tu alcance."
      />

      <div className="mx-auto w-full max-w-5xl space-y-6 px-6 py-6">
        {error && <p className="text-error text-sm">{error}</p>}

        {loading ? (
          <div className="text-center py-8 text-on-surface-variant text-sm">Cargando métricas…</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard label="Publicaciones" value={totals.listings} />
              <StatCard label="Visitas" value={totals.views} icon={<Eye size={16} />} />
              <StatCard label="Favoritos" value={totals.favorites} icon={<Heart size={16} />} />
              <StatCard
                label="Contactos"
                value={totals.contacts}
                icon={<MessageSquare size={16} />}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Visitas · últimos 30 días</CardTitle>
              </CardHeader>
              <CardContent>
                <Sparkline data={series} />
              </CardContent>
            </Card>

            {scope === 'org' && members.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Desglose por agente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {members.map((m) => (
                    <div
                      key={m.userId}
                      className="flex items-center gap-3 border-b border-outline-variant/40 pb-2 last:border-0 last:pb-0"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                        {m.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-on-surface truncate">{m.name}</p>
                        <p className="text-xs text-on-surface-variant">
                          {m.listings} publicaciones · {m.favorites} favs · {m.contacts} contactos
                        </p>
                      </div>
                      <p className="text-sm font-bold text-primary">
                        {m.views.toLocaleString('es-CL')} vistas
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {totals.listings > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Top por visitas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {topByViews.map((p, i) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 border-b border-outline-variant/40 pb-2 last:border-0 last:pb-0"
                    >
                      <span className="text-xs font-bold text-on-surface-variant w-5 shrink-0">
                        {i + 1}
                      </span>
                      <Link
                        href={`/propiedad/${p.id}`}
                        className="flex-1 min-w-0 hover:text-primary transition-colors"
                      >
                        <p className="text-sm font-medium text-on-surface truncate">{p.title}</p>
                        <p className="text-xs text-on-surface-variant truncate">
                          {PROPERTY_TYPE_LABELS[p.type]} · {p.location.address.city}
                        </p>
                      </Link>
                      <Badge size="sm" variant="gray">
                        {STATUS_LABELS[p.status] ?? p.status}
                      </Badge>
                      <div className="flex items-center gap-3 text-xs text-on-surface-variant shrink-0">
                        <span className="flex items-center gap-1">
                          <Eye size={12} /> {p.listing.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart size={12} /> {p.listing.favorites}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare size={12} /> {p.listing.inquiries}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {!loading && totals.listings === 0 && (
              <Card>
                <EmptyState
                  icon={<BarChart3 size={22} />}
                  title="Aún no hay publicaciones en este alcance"
                  description="Publica propiedades para ver sus métricas aquí."
                />
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
