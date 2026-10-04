'use client'

import { useEffect, useState } from 'react'
import { Bug, Check, ChevronDown, RefreshCw } from 'lucide-react'
import { adminService, ErrorLogRow } from '@/services/adminService'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SearchInput } from '@/components/ui/SearchInput'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'
import { hideInternalIds } from '@/lib/diagnostics'

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('es-CL')
}

export default function AdminErrorLogPage() {
  const [rows, setRows] = useState<ErrorLogRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [status, setStatus] = useState<'all' | 'pending' | 'resolved'>('all')
  const [busy, setBusy] = useState<string | null>(null)

  const load = (term = search) => {
    setLoading(true)
    setError(null)
    adminService
      .listErrorLogs(term, 200, status === 'all' ? undefined : status === 'resolved')
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [status]) // eslint-disable-line react-hooks/exhaustive-deps
  async function resolve(row: ErrorLogRow) {
    setBusy(row.id)
    setError(null)
    try {
      await adminService.resolveErrorLog(row.id, !row.resolved)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar el estado')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <select
          aria-label="Estado del error"
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="rounded-lg border border-outline-variant bg-surface px-2 py-2 text-sm"
        >
          <option value="all">Todos</option>
          <option value="pending">Pendientes</option>
          <option value="resolved">Solucionados</option>
        </select>
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(search)}
            placeholder="Buscar por mensaje, usuario o ruta…"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => load('')}>
          <RefreshCw size={14} /> Actualizar
        </Button>
      </div>

      {error && <p className="text-error text-sm">{error}</p>}

      {loading && rows.length === 0 ? (
        <div className="text-center py-8 text-on-surface-variant text-sm">Cargando errores…</div>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Bug size={22} />}
            title="Sin errores registrados"
            description="Los errores de JavaScript de la app se registran aquí automáticamente (errores no capturados y promesas rechazadas)."
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <Card key={r.id} className="overflow-hidden">
              <button
                className="w-full flex items-start gap-3 p-4 text-left hover:bg-surface-container/60 transition-colors"
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Bug size={14} className="text-error shrink-0" />
                    <p className="text-sm font-medium text-on-surface truncate">
                      {hideInternalIds(r.message ?? 'Error sin mensaje')}
                    </p>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {formatWhen(r.created_at)}
                    {r.route && <span> · {hideInternalIds(r.route)}</span>}
                    <span> · {r.name || 'Visitante anónimo'}</span>
                    {r.email && <span> · {r.email}</span>}
                  </p>
                </div>
                <ChevronDown
                  size={16}
                  className={cn(
                    'text-on-surface-variant shrink-0 transition-transform',
                    expanded === r.id && 'rotate-180'
                  )}
                />
              </button>
              <div className="flex items-center justify-between gap-2 px-4 pb-3">
                <span className={`text-xs ${r.resolved ? 'text-tertiary' : 'text-error'}`}>
                  {r.resolved
                    ? `Solucionado${r.resolved_at ? ' · ' + formatWhen(r.resolved_at) : ''}`
                    : 'Pendiente'}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy === r.id}
                  onClick={() => void resolve(r)}
                >
                  {r.resolved ? <RefreshCw size={14} /> : <Check size={14} />}{' '}
                  {r.resolved ? 'Marcar pendiente' : 'Marcar solucionado'}
                </Button>
              </div>

              {expanded === r.id && (
                <div className="px-4 pb-4 space-y-3 border-t border-outline-variant/40 pt-3">
                  {r.stack && (
                    <div>
                      <p className="text-xs font-semibold text-on-surface-variant mb-1">Stack</p>
                      <pre className="text-xs text-on-surface whitespace-pre-wrap break-all bg-surface-container-highest/50 rounded-lg p-3 overflow-x-auto">
                        {hideInternalIds(r.stack)}
                      </pre>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-on-surface-variant mb-1">
                      Contexto (JSON)
                    </p>
                    <pre className="text-xs text-on-surface whitespace-pre-wrap break-all bg-surface-container-highest/50 rounded-lg p-3 overflow-x-auto">
                      {hideInternalIds(
                        JSON.stringify(
                          {
                            ...(r.context ?? {}),
                            usuario: r.name ?? 'Anónimo',
                            email: r.email,
                            fecha: r.created_at,
                            message: r.message,
                            resolved: r.resolved,
                          },
                          null,
                          2
                        )
                      )}
                    </pre>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
