'use client'

import { Suspense, useMemo, useState } from 'react'
import { Building2, List, Map as MapIcon } from 'lucide-react'
import DynamicMapView from '@/components/map/DynamicMapView'
import { PropertyCard } from '@/components/property/PropertyCard'
import { SearchBar } from '@/components/search/SearchBar'
import { FilterPanel } from '@/components/search/FilterPanel'
import { useSearch } from '@/hooks/useSearch'
import { Property } from '@/types/property'
import { cn } from '@/lib/utils'

type ViewMode = 'map' | 'list'

/** Anything exposing maplibre's bounds.contains — keeps the page free of the
 *  maplibre-gl import while still filtering the list by the visible area. */
interface Bounds { contains(lngLat: [number, number]): boolean }

function SearchContent() {
  const [showFilters, setShowFilters] = useState(false)
  const [selected, setSelected] = useState<Property | null>(null)
  const [bounds, setBounds] = useState<Bounds | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('map')

  const {
    query, filters, results, suggestions, activeFilterCount,
    handleQueryChange, handleSearch, updateFilters, clearFilters, setSuggestions,
  } = useSearch()

  // List shows only the properties inside the area the map is currently showing.
  const visible = useMemo(
    () => (bounds ? results.filter(p => bounds.contains([p.location.longitude, p.location.latitude])) : results),
    [results, bounds]
  )

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Search header */}
      <div className="px-3 py-2.5 bg-surface-container-low border-b border-outline-variant/40 flex items-center gap-2 shrink-0">
        <SearchBar
          value={query}
          onChange={handleQueryChange}
          onSearch={handleSearch}
          suggestions={suggestions}
          activeFilterCount={activeFilterCount}
          onFilterClick={() => setShowFilters(true)}
          placeholder="Ciudad, barrio o tipo..."
          className="flex-1"
        />
        <div className="hidden md:flex items-center gap-1 bg-surface-container rounded-lg p-1 shrink-0">
          <button
            onClick={() => setViewMode('map')}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all', viewMode === 'map' ? 'bg-surface-container-highest shadow-soft text-primary font-medium' : 'text-on-surface-variant hover:text-on-surface')}
          >
            <MapIcon size={14} /> Mapa
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all', viewMode === 'list' ? 'bg-surface-container-highest shadow-soft text-primary font-medium' : 'text-on-surface-variant hover:text-on-surface')}
          >
            <List size={14} /> Solo lista
          </button>
        </div>
      </div>

      {/* Count bar */}
      <div className="px-4 py-1.5 bg-surface-container border-b border-outline-variant/40 flex items-center gap-3 text-xs text-on-surface-variant shrink-0">
        <span className="flex items-center gap-1.5">
          <Building2 size={12} />
          <span className="font-semibold text-on-surface">{visible.length}</span>
          propiedad{visible.length !== 1 ? 'es' : ''} en esta zona
          {query && <span className="text-on-surface-variant"> · &quot;{query}&quot;</span>}
        </span>
        {activeFilterCount > 0 && (
          <button onClick={clearFilters} className="ml-auto text-accent hover:underline">Limpiar filtros</button>
        )}
      </div>

      {/* Map + list */}
      <div className="flex-1 flex overflow-hidden">
        <div className={cn('flex-1 relative', viewMode === 'list' ? 'hidden md:block' : '')}>
          <DynamicMapView
            properties={results}
            selectedId={selected?.id}
            onPropertySelect={setSelected}
            onBoundsChange={setBounds}
          />

          {selected && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-72 z-20">
              <PropertyCard property={selected} isSelected compact />
              <button
                onClick={() => setSelected(null)}
                className="absolute -top-2 -right-2 bg-surface-container-highest rounded-full w-5 h-5 flex items-center justify-center shadow-soft border border-outline-variant/40 text-on-surface-variant hover:text-on-surface text-sm leading-none"
              >
                ×
              </button>
            </div>
          )}
        </div>

        <div className={cn('bg-surface-container-low border-l border-outline-variant/40 overflow-y-auto', viewMode === 'list' ? 'flex-1' : 'hidden md:block w-[380px]')}>
          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-on-surface-variant">
              <Building2 size={40} className="mb-3 opacity-50" />
              <p className="font-medium text-on-surface">Sin propiedades en esta zona</p>
              <p className="text-sm mt-1">Mueve el mapa o ajusta los filtros</p>
            </div>
          ) : (
            <div className={cn('p-3 gap-3', viewMode === 'list' ? 'grid sm:grid-cols-2 lg:grid-cols-3' : 'flex flex-col')}>
              {visible.map(property => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  isSelected={selected?.id === property.id}
                  onClick={() => setSelected(property)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile view toggle */}
      <div className="md:hidden fixed bottom-16 right-4 z-20">
        <button
          onClick={() => setViewMode(v => (v === 'map' ? 'list' : 'map'))}
          className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-full shadow-elevated text-sm font-semibold"
        >
          {viewMode === 'map' ? <><List size={16} /> Lista</> : <><MapIcon size={16} /> Mapa</>}
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

export default function BuscarPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  )
}
