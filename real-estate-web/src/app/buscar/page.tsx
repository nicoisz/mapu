'use client'

import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { gsap } from 'gsap'
import { Building2, KeyRound, List, Map as MapIcon, Tag } from 'lucide-react'
import { PropertyOperation } from '@/types/enums'
import { RENT_COLOR, SALE_COLOR } from '@/constants'
import { computePriceZones, findZone, getZoneColor, ZoneBucket } from '@/lib/priceZones'
import DynamicMapView from '@/components/map/DynamicMapView'
import { PropertyCard, PropertyCardSkeleton } from '@/components/property/PropertyCard'
import { SearchBar } from '@/components/search/SearchBar'
import { FilterPanel } from '@/components/search/FilterPanel'
import { ExchangeIndicators } from '@/components/layout/ExchangeIndicators'
import { useSearch } from '@/hooks/useSearch'
import { Property } from '@/types/property'
import { cn } from '@/lib/utils'
import { parseSearchOperation } from '@/lib/landingSearch'

type ViewMode = 'map' | 'list'
const ZONE_LABELS: Record<ZoneBucket, string> = {
  economic: 'Económica',
  mid: 'Media',
  premium: 'Premium',
}

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
    if (viewMode !== 'map' || !selected || !el || prefersReducedMotion) return
    gsap.fromTo(el, { x: 24, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: 'power3.out' })
  }, [selected, viewMode, prefersReducedMotion])

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
  } = useSearch(urlQuery, parseSearchOperation(searchParams.get('operation')))

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

  // Selecting a map pin in list mode filters only the list, never the map pins.
  const listed = useMemo(
    () =>
      viewMode === 'list' && selected
        ? results.filter((property) => property.id === selected.id)
        : visible,
    [viewMode, selected, results, visible]
  )

  useEffect(() => {
    if (selected && !results.some((property) => property.id === selected.id)) setSelected(null)
  }, [results, selected])

  function changeViewMode(next: ViewMode) {
    setSelected(null)
    setViewMode(next)
    if (next === 'list') setFitToken((token) => token + 1)
  }

  function selectMapProperty(property: Property) {
    setSelected((current) => (viewMode === 'list' && current?.id === property.id ? null : property))
  }

  // Paginate the list client-side (the map still clusters the full result set).
  // La lista llena hasta 4 columnas, así que 8 tarjetas no alcanzan a llenar
  // ni dos filas; la columna del mapa sigue siendo de una sola tarjeta de ancho.
  const PAGE_SIZE = viewMode === 'list' ? 24 : 8
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const pageItems = useMemo(() => listed.slice(0, visibleCount), [listed, visibleCount])
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [listed, PAGE_SIZE])

  // Counts per operation — the chips double as the map-pin color legend.
  const opCounts = useMemo(
    () => ({
      sale: visible.filter((p) => p.operation === PropertyOperation.SALE).length,
      rent: visible.filter((p) => p.operation === PropertyOperation.RENT).length,
    }),
    [visible]
  )

  // Price-zone of the selected property, matching the map's legend (diamond).
  const zoneMode: 'sale' | 'rent' = filters.operation === PropertyOperation.RENT ? 'rent' : 'sale'
  const selectedZone = useMemo(() => {
    if (!selected || results.length === 0) return null
    const { cells } = computePriceZones(results, zoneMode)
    const bucket = findZone(cells, selected.location.latitude, selected.location.longitude)?.bucket
    return bucket ? { color: getZoneColor(bucket), label: ZONE_LABELS[bucket] } : null
  }, [selected, results, zoneMode])

  return (
    <div className="h-full flex flex-col bg-background pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
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
            onClick={() => changeViewMode('map')}
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
            onClick={() => changeViewMode('list')}
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
        <span className="hidden md:flex items-center gap-1.5">
          <Building2 size={12} />
          <span className="font-semibold text-on-surface">{visible.length}</span>
          propiedad{visible.length !== 1 ? 'es' : ''} en esta zona
          {query && <span className="text-on-surface-variant"> · &quot;{query}&quot;</span>}
        </span>

        {/* Operation legend — mismo hex que los pines, vía @/constants.
            Va en `style` y no en clase: Tailwind compila clases literales,
            una arbitraria interpolada (`bg-[${VAR}]`) no se genera nunca. */}
        <span
          className="flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold"
          style={{ color: SALE_COLOR, backgroundColor: `${SALE_COLOR}1F` }}
        >
          <Tag size={11} />
          {opCounts.sale} venta
        </span>
        <span
          className="flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold"
          style={{ color: RENT_COLOR, backgroundColor: `${RENT_COLOR}1F` }}
        >
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
          <label className="hidden md:flex items-center gap-1.5">
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
      <div className="min-h-0 flex-1 flex overflow-hidden">
        <div className={cn('flex-1 relative', viewMode === 'list' ? 'hidden md:block' : '')}>
          <DynamicMapView
            properties={results}
            selectedId={selected?.id}
            focusOnSelection={viewMode === 'map'}
            onPropertySelect={selectMapProperty}
            onMapClick={closeDetail}
            onBoundsChange={setBounds}
            fitToken={fitToken}
            operation={filters.operation ?? null}
          />

          {/* Floating detail card over the map (the list collapses behind it). */}
          {viewMode === 'map' && selected && (
            <div
              ref={cardRef}
              data-testid="map-property-detail"
              className="absolute top-2 right-3 bottom-2 w-[440px] max-w-[calc(100%-1.5rem)] z-20"
            >
              <div className="h-full overflow-y-auto rounded-2xl">
                <PropertyCard
                  property={selected}
                  isSelected
                  detail
                  onClose={closeDetail}
                  zoneColor={selectedZone?.color}
                  zoneLabel={selectedZone?.label}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right column: the property list. Collapses (width → 0) while a
            property is selected so the map gets the full width. */}
        <div
          data-testid="search-property-list"
          ref={listColRef}
          className={cn(
            'relative bg-surface-container-low border-l border-outline-variant/40 overflow-hidden shrink-0',
            viewMode === 'list' ? 'flex-1 md:flex-none' : 'hidden md:block md:w-[380px]'
          )}
        >
          <div
            className={cn('h-full overflow-y-auto', viewMode === 'list' ? 'w-full' : 'w-[380px]')}
          >
            {viewMode === 'list' && selected && (
              <div className="flex items-center justify-between gap-3 border-b border-outline-variant/40 px-4 py-3 text-sm">
                <span className="truncate text-on-surface">
                  Propiedad seleccionada: {selected.title}
                </span>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="shrink-0 font-semibold text-primary hover:underline"
                >
                  Ver todas
                </button>
              </div>
            )}
            {isSearching && listed.length === 0 ? (
              <div
                className={cn(
                  'p-3 gap-3',
                  viewMode === 'list'
                    ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
                    : 'flex flex-col'
                )}
              >
                {Array.from({ length: 4 }, (_, i) => (
                  <PropertyCardSkeleton key={i} dense={viewMode === 'list'} />
                ))}
              </div>
            ) : listed.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center text-on-surface-variant">
                <Building2 size={40} className="mb-3 opacity-50" />
                <p className="font-medium text-on-surface">Sin propiedades en esta zona</p>
                <p className="text-sm mt-1">Mueve el mapa o ajusta los filtros</p>
              </div>
            ) : (
              <div
                className={cn(
                  'p-3 gap-3',
                  viewMode === 'list'
                    ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
                    : 'flex flex-col'
                )}
              >
                {pageItems.map((property) => (
                  <div key={property.id} className="prop-stagger">
                    <PropertyCard
                      property={property}
                      isSelected={selected?.id === property.id}
                      dense={viewMode === 'list'}
                      onClick={() =>
                        viewMode === 'list'
                          ? router.push(`/propiedad/${property.id}`)
                          : setSelected(property)
                      }
                    />
                  </div>
                ))}
                {listed.length > pageItems.length && (
                  <button
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="col-span-full w-full py-2.5 text-sm font-medium text-primary hover:underline"
                  >
                    Ver más ({listed.length - pageItems.length} restantes)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile view toggle */}
      <div className="md:hidden fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40">
        <button
          onClick={() => changeViewMode(viewMode === 'map' ? 'list' : 'map')}
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
