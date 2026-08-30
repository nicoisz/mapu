'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { PropertySearchFilters } from '@/types/search'
import { Currency, PropertyOperation, PropertyType } from '@/types/enums'
import { Button } from '@/components/ui/Button'
import { OPERATION_LABELS, PROPERTY_TYPE_LABELS } from '@/constants'

interface FilterPanelProps {
  filters: PropertySearchFilters
  onApply: (filters: PropertySearchFilters) => void
  onClose: () => void
}

const PROPERTY_TYPES = [
  PropertyType.HOUSE,
  PropertyType.APARTMENT,
  PropertyType.LAND,
  PropertyType.OFFICE,
  PropertyType.COMMERCIAL,
]
const BEDROOM_OPTIONS = [1, 2, 3, 4]

export function FilterPanel({ filters, onApply, onClose }: FilterPanelProps) {
  const [local, setLocal] = useState<PropertySearchFilters>(filters)

  function toggleType(type: PropertyType) {
    const current = local.type ?? []
    const updated = current.includes(type) ? current.filter((t) => t !== type) : [...current, type]
    setLocal((f) => ({ ...f, type: updated.length ? updated : undefined }))
  }

  function setOperation(op: PropertyOperation | undefined) {
    setLocal((f) => ({ ...f, operation: op }))
  }

  function setBedrooms(min: number | undefined) {
    setLocal((f) => ({ ...f, bedrooms: min ? { min } : undefined }))
  }

  function setPriceMin(val: string) {
    const n = val ? parseInt(val) : undefined
    setLocal((f) => ({ ...f, priceRange: { ...f.priceRange, currency: Currency.CLP, min: n } }))
  }

  function setPriceMax(val: string) {
    const n = val ? parseInt(val) : undefined
    setLocal((f) => ({ ...f, priceRange: { ...f.priceRange, currency: Currency.CLP, max: n } }))
  }

  function handleClear() {
    setLocal({})
    onApply({})
  }

  const activeCount = [
    local.operation,
    local.type?.length,
    local.priceRange,
    local.areaRange,
    local.bedrooms,
  ].filter(Boolean).length

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-[fadeIn_.2s_ease]">
      <div className="bg-surface-container-low w-full max-w-xl rounded-2xl shadow-elevated border border-outline-variant/40 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/40">
          <h2 className="font-headline font-semibold text-lg text-on-surface">Filtros</h2>
          <div className="flex items-center gap-3">
            {activeCount > 0 && (
              <span className="text-sm text-accent">
                {activeCount} activo{activeCount !== 1 ? 's' : ''}
              </span>
            )}
            <button
              onClick={onClose}
              aria-label="Cerrar filtros"
              className="p-1.5 hover:bg-surface-container-high rounded-lg transition-colors text-on-surface-variant"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-6">
          {/* Operation */}
          <div>
            <p className="text-sm font-medium text-on-surface-variant mb-2">Operación</p>
            <div className="flex gap-2">
              {([undefined, PropertyOperation.SALE, PropertyOperation.RENT] as const).map((op) => (
                <button
                  key={op ?? 'all'}
                  onClick={() => setOperation(op)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-all ${
                    local.operation === op
                      ? 'bg-primary text-on-primary border-primary'
                      : 'border-outline-variant/60 text-on-surface-variant hover:border-primary hover:text-primary'
                  }`}
                >
                  {op === undefined ? 'Todos' : OPERATION_LABELS[op]}
                </button>
              ))}
            </div>
          </div>

          {/* Property types */}
          <div>
            <p className="text-sm font-medium text-on-surface-variant mb-2">Tipo de propiedad</p>
            <div className="flex flex-wrap gap-2">
              {PROPERTY_TYPES.map((type) => {
                const selected = local.type?.includes(type)
                return (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                      selected
                        ? 'bg-primary text-on-primary border-primary'
                        : 'border-outline-variant/60 text-on-surface-variant hover:border-primary'
                    }`}
                  >
                    {PROPERTY_TYPE_LABELS[type]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Bedrooms */}
          <div>
            <p className="text-sm font-medium text-on-surface-variant mb-2">
              Mínimo de dormitorios
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setBedrooms(undefined)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-all ${!local.bedrooms ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant/60 text-on-surface-variant hover:border-primary'}`}
              >
                Cualquiera
              </button>
              {BEDROOM_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setBedrooms(n)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-all ${local.bedrooms?.min === n ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant/60 text-on-surface-variant hover:border-primary'}`}
                >
                  {n === 4 ? '4+' : n}
                </button>
              ))}
            </div>
          </div>

          {/* Price range */}
          <div>
            <p className="text-sm font-medium text-on-surface-variant mb-2">
              Rango de precio (CLP)
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Mínimo"
                value={local.priceRange?.min ?? ''}
                onChange={(e) => setPriceMin(e.target.value)}
                className="flex-1 border border-outline-variant/60 bg-surface-container-lowest text-on-surface rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-on-surface-variant/60"
              />
              <span className="text-on-surface-variant">—</span>
              <input
                type="number"
                placeholder="Máximo"
                value={local.priceRange?.max ?? ''}
                onChange={(e) => setPriceMax(e.target.value)}
                className="flex-1 border border-outline-variant/60 bg-surface-container-lowest text-on-surface rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-on-surface-variant/60"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-outline-variant/40">
          <Button variant="outline" onClick={handleClear} className="flex-1">
            Limpiar
          </Button>
          <Button
            onClick={() => {
              onApply(local)
              onClose()
            }}
            className="flex-1"
          >
            Aplicar filtros
          </Button>
        </div>
      </div>
    </div>
  )
}
