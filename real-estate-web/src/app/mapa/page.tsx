'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, List, Map } from 'lucide-react'
import DynamicMapView from '@/components/map/DynamicMapView'
import { PropertyCard } from '@/components/property/PropertyCard'
import { SearchBar } from '@/components/search/SearchBar'
import { FilterPanel } from '@/components/search/FilterPanel'
import { useSearch } from '@/hooks/useSearch'
import { Property } from '@/types/property'
import { cn } from '@/lib/utils'
import { PropertyOperation } from '@/types/enums'
import { Badge } from '@/components/ui/Badge'

type ViewMode = 'map' | 'list'

export default function MapaPage() {
  const router = useRouter()
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('map')
  const [showFilters, setShowFilters] = useState(false)

  const {
    query, filters, results, suggestions, activeFilterCount,
    handleQueryChange, handleSearch, updateFilters, clearFilters, setSuggestions,
  } = useSearch()

  const stats = useMemo(() => ({
    total: results.length,
    sale: results.filter(p => p.operation === PropertyOperation.SALE).length,
    rent: results.filter(p => p.operation === PropertyOperation.RENT).length,
  }), [results])

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Search bar */}
      <div className="px-3 py-2 bg-surface-container-low border-b border-outline-variant/40 flex items-center gap-2 shrink-0">
        <SearchBar
          value={query}
          onChange={handleQueryChange}
          onSearch={handleSearch}
          suggestions={suggestions}
          activeFilterCount={activeFilterCount}
          onFilterClick={() => setShowFilters(true)}
          className="flex-1"
        />
        <div className="hidden md:flex items-center gap-1 bg-surface-container rounded-lg p-1">
          <button
            onClick={() => setViewMode('map')}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all', viewMode === 'map' ? 'bg-surface-container-highest shadow-soft text-primary font-medium' : 'text-on-surface-variant hover:text-on-surface')}
          >
            <Map size={14} /> Mapa
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all', viewMode === 'list' ? 'bg-surface-container-highest shadow-soft text-primary font-medium' : 'text-on-surface-variant hover:text-on-surface')}
          >
            <List size={14} /> Lista
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="px-4 py-1.5 bg-surface-container border-b border-outline-variant/40 flex items-center gap-3 text-xs text-on-surface-variant shrink-0">
        <span className="flex items-center gap-1"><Building2 size={12} />{stats.total} propiedades</span>
        {stats.sale > 0 && <Badge variant="sale" size="sm">{stats.sale} en venta</Badge>}
        {stats.rent > 0 && <Badge variant="rent" size="sm">{stats.rent} en arriendo</Badge>}
        {activeFilterCount > 0 && (
          <button onClick={clearFilters} className="ml-auto text-accent hover:underline">Limpiar filtros</button>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        <div className={cn('flex-1 relative', viewMode === 'list' ? 'hidden md:block' : '')}>
          <DynamicMapView
            properties={results}
            selectedId={selectedProperty?.id}
            onPropertySelect={setSelectedProperty}
          />

          {selectedProperty && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-72 z-20">
              <PropertyCard
                property={selectedProperty}
                isSelected
                compact
                onClick={() => router.push(`/propiedad/${selectedProperty.id}`)}
              />
              <button
                onClick={() => setSelectedProperty(null)}
                className="absolute -top-2 -right-2 bg-surface-container-highest rounded-full w-5 h-5 flex items-center justify-center shadow-soft border border-outline-variant/40 text-on-surface-variant hover:text-on-surface text-sm leading-none"
              >
                ×
              </button>
            </div>
          )}
        </div>

        <div className={cn('bg-surface-container-low border-l border-outline-variant/40 overflow-y-auto', viewMode === 'list' ? 'flex-1' : 'hidden md:block w-[360px]')}>
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-on-surface-variant">
              <Building2 size={40} className="mb-3 opacity-50" />
              <p className="font-medium text-on-surface">Sin resultados</p>
              <p className="text-sm mt-1">Intenta con otros términos o limpia los filtros</p>
            </div>
          ) : (
            <div className="p-3 space-y-3">
              {results.map(property => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  isSelected={selectedProperty?.id === property.id}
                  onClick={() => setSelectedProperty(property)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile view toggle */}
      <div className="md:hidden fixed bottom-16 right-4 z-20">
        <button
          onClick={() => setViewMode(v => v === 'map' ? 'list' : 'map')}
          className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-full shadow-elevated text-sm font-semibold"
        >
          {viewMode === 'map' ? <><List size={16} /> Lista</> : <><Map size={16} /> Mapa</>}
        </button>
      </div>

      {showFilters && (
        <FilterPanel
          filters={filters}
          onApply={f => { updateFilters(f); setSuggestions([]) }}
          onClose={() => setShowFilters(false)}
        />
      )}
    </div>
  )
}
