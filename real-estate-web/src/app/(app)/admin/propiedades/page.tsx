'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { adminService } from '@/services/adminService'
import { propertyService } from '@/services/propertyService'
import { PropertyCard } from '@/components/property/PropertyCard'
import { rowToProperty } from '@/lib/propertyMapper'
import { Property } from '@/types/property'
import { STATUS_LABELS } from '@/constants'
import { SearchInput } from '@/components/ui/SearchInput'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

export default function AdminPropertiesPage() {
  const [rows, setRows] = useState<Property[]>([])
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Property | null>(null)

  const load = (s = status, term = search) => {
    setLoading(true)
    adminService
      .listProperties(s, term)
      .then((data) => setRows(data.map(rowToProperty)))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function performDelete(property: Property) {
    setBusyId(property.id)
    try {
      await propertyService.deleteProperty(property.id)
      setRows((prev) => prev.filter((p) => p.id !== property.id))
      setConfirmDelete(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar')
    } finally {
      setBusyId(null)
    }
  }

  async function handleRenew(property: Property) {
    setBusyId(property.id)
    try {
      const renewed = await propertyService.renewProperty(property.id)
      if (renewed) setRows((prev) => prev.map((p) => (p.id === property.id ? renewed : p)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al renovar')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(status, search)}
            placeholder="Buscar por título…"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            load(e.target.value, search)
          }}
          className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none"
        >
          <option value="all">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-error text-sm">{error}</p>}

      {loading ? (
        <div className="text-center py-8 text-on-surface-variant text-sm">
          Cargando propiedades…
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description="No se encontraron propiedades para los filtros."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rows.map((property) => (
            <div key={property.id} className="space-y-2">
              <PropertyCard property={property} />
              <div className="flex gap-3 justify-end">
                <Link
                  href={`/publicar?edit=${property.id}`}
                  className="text-xs text-accent hover:text-primary font-medium"
                >
                  Editar
                </Link>
                <button
                  onClick={() => handleRenew(property)}
                  disabled={busyId === property.id}
                  className="text-xs text-accent hover:text-primary font-medium disabled:opacity-50"
                  title="Extiende la publicación 30 días"
                >
                  Renovar
                </button>
                <button
                  onClick={() => setConfirmDelete(property)}
                  disabled={busyId === property.id}
                  className="text-xs text-error hover:text-error/80 font-medium disabled:opacity-50"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
        onConfirm={() => confirmDelete && performDelete(confirmDelete)}
      />
    </div>
  )
}
