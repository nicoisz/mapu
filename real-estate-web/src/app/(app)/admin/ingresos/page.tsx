'use client'

import { useEffect, useState } from 'react'
import { CreditCard, Info } from 'lucide-react'
import { adminService, RevenueSnapshot } from '@/services/adminService'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { EmptyState } from '@/components/ui/EmptyState'

const PLAN_LABELS: Record<string, string> = { free: 'Gratuito', premium: 'Premium' }

function clp(amount: number): string {
  return `$${amount.toLocaleString('es-CL')}`
}

export default function AdminRevenuePage() {
  const [data, setData] = useState<RevenueSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    adminService
      .getRevenue()
      .then((r) => active && setData(r))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  if (loading && !data) {
    return <div className="text-center py-8 text-on-surface-variant text-sm">Cargando…</div>
  }
  if (error && !data) return <p className="text-error text-sm">{error}</p>
  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Ingresos totales" value={clp(data.totalRevenue)} />
        <StatCard label="Pagos pagados" value={data.paidCount} />
        <StatCard label="Pagos pendientes" value={data.pendingCount} />
        <StatCard label="Propiedades vendidas" value={data.soldProperties} />
      </div>

      <div className="flex items-start gap-2 rounded-2xl border border-outline-variant/50 bg-surface-container-low p-4 text-xs text-on-surface-variant">
        <Info size={14} className="shrink-0 mt-0.5 text-primary" />
        <p>
          Ingresos calculados sobre pagos con estado <span className="font-medium">paid</span>. La
          integración con Mercado Pago aún no está conectada, por lo que es probable que los pagos
          figuren como pendientes y las cifras sean bajas.
        </p>
      </div>

      {data.byPlan.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ingresos por plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.byPlan.map(({ plan, total, count }) => (
              <div
                key={plan}
                className="flex items-center justify-between border-b border-outline-variant/40 pb-2 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium text-on-surface">{PLAN_LABELS[plan] ?? plan}</p>
                  <p className="text-xs text-on-surface-variant">{count} pagos</p>
                </div>
                <p className="text-sm font-bold text-primary">{clp(total)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {data.byMonth.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ingresos por mes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {data.byMonth.map(({ month, total }) => (
              <div key={month} className="flex items-center gap-2">
                <span className="text-xs text-on-surface-variant w-20 shrink-0">{month}</span>
                <div className="h-2 flex-1 bg-surface-container-highest rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${Math.min(100, (total / data.totalRevenue) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-on-surface w-24 text-right shrink-0">
                  {clp(total)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pagos recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recent.length === 0 ? (
            <EmptyState
              icon={<CreditCard size={22} />}
              title="Sin pagos aún"
              description="Los pagos aparecerán aquí cuando haya transacciones."
            />
          ) : (
            <div className="space-y-2">
              {data.recent.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 border-b border-outline-variant/40 pb-2 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CreditCard size={14} className="text-on-surface-variant shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-on-surface truncate">
                        {PLAN_LABELS[p.plan] ?? p.plan}
                      </p>
                      <p className="text-xs text-on-surface-variant truncate">
                        {new Date(p.created_at).toLocaleString('es-CL')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold text-on-surface">{clp(p.amount)}</span>
                    <Badge size="sm" variant={p.status === 'paid' ? 'success' : 'gray'}>
                      {p.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
