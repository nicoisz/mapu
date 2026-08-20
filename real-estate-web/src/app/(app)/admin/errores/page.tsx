'use client'

import { useEffect, useState } from 'react'
import { Bug, ChevronDown, RefreshCw, Search } from 'lucide-react'
import { adminService, ErrorLogRow } from '@/services/adminService'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('es-CL')
}

export default function AdminErrorLogPage() {
  const [rows, setRows] = useState<ErrorLogRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = (term = search) => {
    setLoading(true)
    adminService
      .listErrorLogs(term)
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-surface-container-lowest rounded-lg border border-outline-variant/60 px-3 py-2">
          <Search size={16} className="text-on-surface-variant shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(search)}
            placeholder="Buscar por mensaje, usuario o ruta…"
            className="flex-1 bg-transparent text-sm focus:outline-none text-on-surface placeholder:text-on-surface-variant/60"
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
        <div className="flex flex-col items-center py-12 text-center text-on-surface-variant">
          <Bug size={32} className="text-on-surface-variant/40 mb-3" />
          <p className="font-medium text-on-surface text-sm">Sin errores registrados</p>
          <p className="text-xs mt-1 max-w-xs">
            Los errores de JavaScript de la app se registran aquí automáticamente (errores no
            capturados y promesas rechazadas).
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div
              key={r.id}
              className="bg-surface-container-low rounded-xl border border-outline-variant/40 overflow-hidden"
            >
              <button
                className="w-full flex items-start gap-3 p-4 text-left hover:bg-surface-container/60 transition-colors"
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Bug size={14} className="text-error shrink-0" />
                    <p className="text-sm font-medium text-on-surface truncate">
                      {r.message ?? 'Error sin mensaje'}
                    </p>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {formatWhen(r.created_at)}
                    {r.route && <span> · {r.route}</span>}
                    {r.name && <span> · {r.name}</span>}
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

              {expanded === r.id && (
                <div className="px-4 pb-4 space-y-3 border-t border-outline-variant/40 pt-3">
                  {r.stack && (
                    <div>
                      <p className="text-xs font-semibold text-on-surface-variant mb-1">Stack</p>
                      <pre className="text-xs text-on-surface whitespace-pre-wrap break-all bg-surface-container-highest/50 rounded-lg p-3 overflow-x-auto">
                        {r.stack}
                      </pre>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-on-surface-variant mb-1">
                      Contexto (JSON)
                    </p>
                    <pre className="text-xs text-on-surface whitespace-pre-wrap break-all bg-surface-container-highest/50 rounded-lg p-3 overflow-x-auto">
                      {JSON.stringify(
                        { ...(r.context ?? {}), user_id: r.user_id, id: r.id },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
