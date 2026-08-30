'use client'

import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { gsap } from 'gsap'
import { Building2, KeyRound, List, Map as MapIcon, Tag, X } from 'lucide-react'
import { PropertyOperation } from '@/types/enums'
import DynamicMapView from '@/components/map/DynamicMapView'
import { PropertyCard, PropertyCardSkeleton } from '@/components/property/PropertyCard'
import { SearchBar } from '@/components/search/SearchBar'
import { FilterPanel } from '@/components/search/FilterPanel'
import { ExchangeIndicators } from '@/components/layout/ExchangeIndicators'
import { useSearch } from '@/hooks/useSearch'
import { Property } from '@/types/property'
import { cn } from '@/lib/utils'

type ViewMode = 'map' | 'list'

/** Anything exposing maplibre's bounds.contains — keeps the page free of the
 *  maplibre-gl import while still filtering the list by the visible area. */
interface Bounds {
  contains(lngLat: [number, number]): boolean
}

function SearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlQuery = searchParams.get('q') ?? ''
  const [showFilters, setShowFilters] = useState(false)
  const [selected, setSelected] = useState<Property | null>(null)
  const [bounds, setBounds] = useState<Bounds | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('map')
  const [fitToken, setFitToken] = useState(0)
  const listColRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Pop the floating detail card out, then deselect (which re-expands the list).
  const closeDetail = useCallback(() => {
    const el = cardRef.current
    if (!el || prefersReducedMotion) {
      setSelected(null)
      return
    }
    gsap.to(el, {
      x: 24,
      opacity: 0,
      duration: 0.22,
      ease: 'power2.in',
      onComplete: () => setSelected(null),
    })
  }, [prefersReducedMotion])

  // Desktop list width drives the proportion: 'map' = sidebar (380px, map ~2/3),
  // 'list' = list dominant (~2/3, map shrinks to ~1/3). In map mode, selecting a
  // property collapses the list to 0 so the floating detail card owns the map.
  // Mobile shows one view at a time, so we just clear inline width there.
  useLayoutEffect(() => {
    const el = listColRef.current
    if (!el) return
    const isDesktop = window.matchMedia('(min-width: 768px)').matches
    if (!isDesktop) {
      gsap.set(el, { clearProps: 'width,opacity' })
      return
    }

    let width: number | string = 380
    let opacity = 1
    if (viewMode === 'list') width = '66.6667%'
    else if (selected) {
      width = 0
      opacity = 0
    }

    if (prefersReducedMotion) gsap.set(el, { width, opacity })
    else gsap.to(el, { width, opacity, duration: 0.45, ease: 'power3.inOut' })
  }, [selected, viewMode, prefersReducedMotion])

  // Pop the floating detail card in when a property is picked.
  useLayoutEffect(() => {
    const el = cardRef.current
    if (!selected || !el || prefersReducedMotion) return
    gsap.fromTo(el, { x: 24, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: 'power3.out' })
  }, [selected?.id, prefersReducedMotion])

  const {
    query,
    filters,
    results,
    suggestions,
    activeFilterCount,
    sort,
    setSort,
    isSearching,
    searchError,
    handleQueryChange,
    handleSearch,
    updateFilters,
    clearFilters,
    setSuggestions,
  } = useSearch(urlQuery)

  // Stagger the cards in when a new result set arrives (not on map pans).
  useLayoutEffect(() => {
    const col = listColRef.current
    if (!col || prefersReducedMotion || results.length === 0) return
    gsap.fromTo(
      col.querySelectorAll('.prop-stagger'),
      { y: 20, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.45,
        stagger: 0.05,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      }
    )
  }, [results, prefersReducedMotion])

  // List shows only the properties inside the area the map is currently showing.
  const visible = useMemo(
    () =>
      bounds
        ? results.filter((p) => bounds.contains([p.location.longitude, p.location.latitude]))
        : results,
    [results, bounds]
  )

  // Paginate the list client-side (the map still clusters the full result set).
  const PAGE_SIZE = 8
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const pageItems = useMemo(() => visible.slice(0, visibleCount), [visible, visibleCount])
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [visible])

  // Counts per operation — the chips double as the map-pin color legend.
  const opCounts = useMemo(
    () => ({
      sale: visible.filter((p) => p.operation === PropertyOperation.SALE).length,
      rent: visible.filter((p) => p.operation === PropertyOperation.RENT).length,
    }),
    [visible]
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
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all',
              viewMode === 'map'
                ? 'bg-surface-container-highest shadow-soft text-primary font-medium'
                : 'text-on-surface-variant hover:text-on-surface'
            )}
          >
            <MapIcon size={14} /> Mapa
          </button>
          <button
            onClick={() => {
              setViewMode('list')
              setFitToken((t) => t + 1)
            }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all',
              viewMode === 'list'
                ? 'bg-surface-container-highest shadow-soft text-primary font-medium'
                : 'text-on-surface-variant hover:text-on-surface'
            )}
          >
            <List size={14} /> Lista
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

        {/* Operation legend — colors match the map pins */}
        <span className="flex items-center gap-1 rounded-full bg-[#FF4D1C]/12 text-[#FF4D1C] px-2 py-0.5 font-semibold">
          <Tag size={11} />
          {opCounts.sale} venta
        </span>
        <span className="flex items-center gap-1 rounded-full bg-[#0D9488]/12 text-[#0D9488] px-2 py-0.5 font-semibold">
          <KeyRound size={11} />
          {opCounts.rent} arriendo
        </span>
        {searchError && <span className="text-error">· {searchError}</span>}
        <div className="ml-auto flex items-center gap-3">
          <ExchangeIndicators className="hidden lg:flex" />
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="text-accent hover:underline">
              Limpiar filtros
            </button>
          )}
          <label className="flex items-center gap-1.5">
            <span className="hidden sm:inline">Ordenar:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="bg-surface-container-highest border border-outline-variant/40 rounded-md px-1.5 py-1 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="recent">Más recientes</option>
              <option value="price_asc">Menor precio</option>
              <option value="price_desc">Mayor precio</option>
              <option value="area_desc">Mayor superficie</option>
            </select>
          </label>
        </div>
      </div>

      {/* Map + list */}
      <div className="flex-1 flex overflow-hidden">
        <div className={cn('flex-1 relative', viewMode === 'list' ? 'hidden md:block' : '')}>
          <DynamicMapView
            properties={results}
            selectedId={selected?.id}
            onPropertySelect={setSelected}
            onMapClick={closeDetail}
            onBoundsChange={setBounds}
            fitToken={fitToken}
          />

          {/* Floating detail card over the map (the list collapses behind it). */}
          {selected && (
            <div
              ref={cardRef}
              className="absolute top-2 right-3 bottom-2 w-[440px] max-w-[calc(100%-1.5rem)] overflow-y-auto z-20 rounded-2xl"
            >
              <PropertyCard property={selected} isSelected />
              <button
                onClick={closeDetail}
                aria-label="Cerrar detalle"
                className="absolute -top-3 -right-3 bg-surface-container-highest rounded-full w-8 h-8 flex items-center justify-center shadow-soft border border-outline-variant/40 text-on-surface-variant hover:text-error hover:border-error transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Right column: the property list. Collapses (width → 0) while a
            property is selected so the map gets the full width. */}
        <div
          ref={listColRef}
          className={cn(
            'relative bg-surface-container-low border-l border-outline-variant/40 overflow-hidden shrink-0',
            viewMode === 'list' ? 'flex-1 md:flex-none' : 'hidden md:block md:w-[380px]'
          )}
        >
          <div
            className={cn('h-full overflow-y-auto', viewMode === 'list' ? 'w-full' : 'w-[380px]')}
          >
            {isSearching && visible.length === 0 ? (
              <div
                className={cn(
                  'p-3 gap-3',
                  viewMode === 'list' ? 'grid grid-cols-1 sm:grid-cols-2' : 'flex flex-col'
                )}
              >
                {Array.from({ length: 4 }, (_, i) => (
                  <PropertyCardSkeleton key={i} />
                ))}
              </div>
            ) : visible.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center text-on-surface-variant">
                <Building2 size={40} className="mb-3 opacity-50" />
                <p className="font-medium text-on-surface">Sin propiedades en esta zona</p>
                <p className="text-sm mt-1">Mueve el mapa o ajusta los filtros</p>
              </div>
            ) : (
              <div
                className={cn(
                  'p-3 gap-3',
                  viewMode === 'list' ? 'grid grid-cols-1 sm:grid-cols-2' : 'flex flex-col'
                )}
              >
                {pageItems.map((property) => (
                  <div key={property.id} className="prop-stagger">
                    <PropertyCard
                      property={property}
                      isSelected={selected?.id === property.id}
                      onClick={() => router.push(`/propiedad/${property.id}`)}
                    />
                  </div>
                ))}
                {visible.length > pageItems.length && (
                  <button
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="w-full py-2.5 text-sm font-medium text-primary hover:underline"
                  >
                    Ver más ({visible.length - pageItems.length} restantes)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile view toggle */}
      <div className="md:hidden fixed bottom-16 right-4 z-20">
        <button
          onClick={() => setViewMode((v) => (v === 'map' ? 'list' : 'map'))}
          className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-full shadow-elevated text-sm font-semibold"
        >
          {viewMode === 'map' ? (
            <>
              <List size={16} /> Lista
            </>
          ) : (
            <>
              <MapIcon size={16} /> Mapa
            </>
          )}
        </button>
      </div>

      {showFilters && (
        <FilterPanel
          filters={filters}
          onApply={(f) => {
            updateFilters(f)
            setSuggestions([])
          }}
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
