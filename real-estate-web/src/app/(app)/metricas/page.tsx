'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BarChart3, Eye, Heart, Lock, MessageSquare } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { metricsService, MemberMetrics, computeTotals } from '@/services/metricsService'
import { Sparkline } from '@/components/charts/Sparkline'
import { Badge } from '@/components/ui/Badge'
import { Property } from '@/types/property'
import { PROPERTY_TYPE_LABELS, STATUS_LABELS } from '@/constants'

const SCOPE_LABELS: Record<string, string> = {
  global: 'Toda la plataforma',
  org: 'Tu empresa',
  self: 'Tus propiedades',
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-surface-container-low rounded-xl p-4 text-center border border-outline-variant/40">
      <div className="font-headline font-bold text-2xl text-primary">{value.toLocaleString('es-CL')}</div>
      <div className="text-xs text-on-surface-variant mt-0.5">{label}</div>
    </div>
  )
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
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-background">
        <Lock size={48} className="text-on-surface-variant/40 mb-4" />
        <h2 className="font-headline text-xl font-bold text-on-surface">Necesitas iniciar sesión</h2>
        <p className="text-on-surface-variant text-sm mt-2">
          Para ver métricas debes tener una cuenta.
        </p>
        <Link
          href="/login"
          className="mt-6 bg-primary text-on-primary px-6 py-2.5 rounded-xl text-sm font-semibold hover:brightness-110 transition-all"
        >
          Iniciar sesión
        </Link>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-background pb-20">
      <div className="relative bg-surface-container-low border-b border-outline-variant/40 px-4 pt-7 pb-5 overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="relative flex items-center gap-2">
          <BarChart3 size={20} className="text-primary" />
          <h1 className="font-headline text-2xl font-bold text-on-surface">Métricas</h1>
          <Badge variant="gray" size="sm">
            {SCOPE_LABELS[scope] ?? 'Tus propiedades'}
          </Badge>
        </div>
        <p className="text-on-surface-variant text-sm mt-1">
          Visitas, favoritos y contactos de las publicaciones bajo tu alcance.
        </p>
      </div>

      <div className="p-4 space-y-4 max-w-5xl mx-auto">
        {error && <p className="text-error text-sm">{error}</p>}

        {loading ? (
          <div className="text-center py-8 text-on-surface-variant text-sm">Cargando métricas…</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Publicaciones" value={totals.listings} />
              <StatCard label="Visitas" value={totals.views} />
              <StatCard label="Favoritos" value={totals.favorites} />
              <StatCard label="Contactos" value={totals.contacts} />
            </div>

            <section className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-4">
              <h2 className="font-headline font-semibold text-on-surface text-sm mb-2">
                Visitas (últimos 30 días)
              </h2>
              <Sparkline data={series} />
            </section>

            {scope === 'org' && members.length > 0 && (
              <section className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-4">
                <h2 className="font-headline font-semibold text-on-surface text-sm mb-3">
                  Desglose por agente
                </h2>
                <div className="space-y-2">
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
                      <p className="text-sm font-bold text-primary">{m.views.toLocaleString('es-CL')} vistas</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {totals.listings > 0 && (
              <section className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-4">
                <h2 className="font-headline font-semibold text-on-surface text-sm mb-3">
                  Top por visitas
                </h2>
                <div className="space-y-2">
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
                </div>
              </section>
            )}

            {!loading && totals.listings === 0 && (
              <div className="text-center py-12 text-on-surface-variant">
                <p className="text-4xl mb-3">📊</p>
                <p className="font-medium text-on-surface">
                  Aún no hay publicaciones en este alcance
                </p>
                <p className="text-sm mt-1">Publica propiedades para ver sus métricas aquí.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
