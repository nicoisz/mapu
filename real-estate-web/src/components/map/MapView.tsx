'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl, { StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import Supercluster from 'supercluster'
import { Property } from '@/types/property'
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/constants'
import { getMapPinPrice } from '@/lib/utils'
import { PropertyOperation } from '@/types/enums'
import { useTheme } from '@/hooks/useTheme'

// OpenFreeMap — free vector tiles, no API key. Native styles per theme.
const STYLE_LIGHT = 'https://tiles.openfreemap.org/styles/positron'
const STYLE_DARK = 'https://tiles.openfreemap.org/styles/dark'

// Esri World Imagery — free satellite raster tiles (attribution required).
const SATELLITE_SOURCES: StyleSpecification['sources'] = {
  satellite: {
    type: 'raster',
    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
    tileSize: 256,
    maxzoom: 19,
    attribution: 'Imagery © Esri, Maxar, Earthstar Geographics',
  },
  // Esri reference overlays, designed to sit on top of World Imagery.
  'esri-roads': {
    type: 'raster',
    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}'],
    tileSize: 256,
    maxzoom: 19,
  },
  'esri-labels': {
    type: 'raster',
    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'],
    tileSize: 256,
    maxzoom: 19,
  },
}

const STYLE_SATELLITE: StyleSpecification = {
  version: 8,
  sources: SATELLITE_SOURCES,
  layers: [{ id: 'satellite', type: 'raster', source: 'satellite' }],
}

// Hybrid = satellite imagery + streets + place labels on top.
const STYLE_HYBRID: StyleSpecification = {
  version: 8,
  sources: SATELLITE_SOURCES,
  layers: [
    { id: 'satellite', type: 'raster', source: 'satellite' },
    { id: 'roads', type: 'raster', source: 'esri-roads' },
    { id: 'labels', type: 'raster', source: 'esri-labels' },
  ],
}

const ACCENT = '#FF4D1C'
// Pin color per operation — must match the legend chips in /buscar.
export const SALE_COLOR = '#FF4D1C'
export const RENT_COLOR = '#0D9488'

type BaseLayer = 'streets' | 'satellite' | 'hybrid'

interface MapViewProps {
  properties: Property[]
  selectedId?: string | null
  onPropertySelect?: (property: Property) => void
  onMapClick?: () => void
  onBoundsChange?: (bounds: maplibregl.LngLatBounds) => void
  center?: { lat: number; lng: number }
  zoom?: number
}

/** Each property as a GeoJSON point feature for supercluster. */
type PointProps = { propertyId: string }

// NOTE: MapLibre drives the `transform` of the marker's root element to
// position it on the map, so we must NOT set transform on `wrap` — doing so
// clobbers the translate and the marker jumps to the corner. All scale/hover
// effects go on an inner element instead.

/** Price pill colored by operation (sale/rent); the selected one scales up
 *  with a solid white ring. */
function makePinElement(label: string, isSelected: boolean, isRent: boolean, animate: boolean): HTMLDivElement {
  const wrap = document.createElement('div')
  wrap.style.cursor = 'pointer'

  const bg = isRent ? RENT_COLOR : SALE_COLOR
  const edge = isSelected ? '#ffffff' : 'rgba(255,255,255,0.55)'

  const inner = document.createElement('div')
  inner.style.transition = 'transform 0.15s ease'
  inner.style.transformOrigin = 'bottom center'
  inner.style.transform = isSelected ? 'scale(1.15)' : 'scale(1)'
  if (animate) inner.style.animation = 'pinPop 0.3s cubic-bezier(0.34,1.56,0.64,1) both'
  inner.innerHTML = `
    <div style="
      background:${bg};color:#ffffff;
      padding:4px 10px;border-radius:9999px;
      font-size:11px;font-weight:700;white-space:nowrap;font-family:Manrope,sans-serif;
      box-shadow:0 3px 10px rgba(0,0,0,${isSelected ? '0.5' : '0.3'});
      border:${isSelected ? '2px' : '1.5px'} solid ${edge};
    ">${label}</div>
    <div style="
      width:0;height:0;margin:-1px auto 0;
      border-left:5px solid transparent;border-right:5px solid transparent;
      border-top:6px solid ${bg};
    "></div>`
  wrap.appendChild(inner)

  if (!isSelected) {
    wrap.onmouseenter = () => { inner.style.transform = 'scale(1.08)' }
    wrap.onmouseleave = () => { inner.style.transform = 'scale(1)' }
  }
  return wrap
}

/** Monochrome cluster circle; takes the accent on hover. */
function makeClusterElement(count: number, isDark: boolean, animate: boolean): HTMLDivElement {
  const wrap = document.createElement('div')
  wrap.style.cursor = 'pointer'
  const size = count < 10 ? 38 : count < 100 ? 46 : 56

  const bg = isDark ? '#15151A' : '#ffffff'
  const fg = isDark ? '#F5F4F2' : '#141414'
  const edge = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)'

  const inner = document.createElement('div')
  inner.style.transition = 'transform 0.15s ease'
  if (animate) inner.style.animation = 'pinPop 0.3s cubic-bezier(0.34,1.56,0.64,1) both'
  inner.innerHTML = `
    <div style="
      width:${size}px;height:${size}px;border-radius:9999px;
      background:${bg};color:${fg};
      display:flex;align-items:center;justify-content:center;
      font-size:13px;font-weight:800;font-family:Manrope,sans-serif;
      box-shadow:0 4px 14px rgba(0,0,0,0.35);
      border:2px solid ${edge};
      transition:background 0.2s ease,color 0.2s ease,border-color 0.2s ease;
    ">${count}</div>`
  wrap.appendChild(inner)

  const circle = inner.firstElementChild as HTMLElement
  wrap.onmouseenter = () => {
    inner.style.transform = 'scale(1.1)'
    circle.style.background = ACCENT
    circle.style.color = '#ffffff'
    circle.style.borderColor = ACCENT
  }
  wrap.onmouseleave = () => {
    inner.style.transform = 'scale(1)'
    circle.style.background = bg
    circle.style.color = fg
    circle.style.borderColor = edge
  }
  return wrap
}

export default function MapView({ properties, selectedId, onPropertySelect, onMapClick, onBoundsChange, center, zoom }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map())
  const prevKeysRef = useRef<Set<string>>(new Set())
  const indexRef = useRef<Supercluster<PointProps> | null>(null)
  const byIdRef = useRef<Map<string, Property>>(new Map())
  const readyRef = useRef(false)
  const styleKeyRef = useRef('')
  const { theme, mounted } = useTheme()
  const [layer, setLayer] = useState<BaseLayer>('streets')

  // Keep latest props in refs so the map's event handlers (created once) never
  // act on stale data — e.g. properties arriving from Supabase before 'load'.
  const propsDataRef = useRef(properties)
  propsDataRef.current = properties
  const selectedIdRef = useRef(selectedId)
  selectedIdRef.current = selectedId
  const layerRef = useRef(layer)
  layerRef.current = layer
  const selectRef = useRef(onPropertySelect)
  selectRef.current = onPropertySelect
  const mapClickRef = useRef(onMapClick)
  mapClickRef.current = onMapClick
  const boundsRef = useRef(onBoundsChange)
  boundsRef.current = onBoundsChange

  // ── Create map once ──────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    // Read the theme straight from the DOM (state may not be hydrated yet).
    const dark = document.documentElement.classList.contains('dark')
    styleKeyRef.current = dark ? 'dark' : 'light'
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: dark ? STYLE_DARK : STYLE_LIGHT,
      center: center ? [center.lng, center.lat] : [DEFAULT_MAP_CENTER.longitude, DEFAULT_MAP_CENTER.latitude],
      zoom: zoom ?? DEFAULT_MAP_ZOOM,
      attributionControl: { compact: true },
    })
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    map.on('load', () => {
      readyRef.current = true
      buildIndex()
      renderClusters()
      boundsRef.current?.(map.getBounds())
    })
    // Re-cluster as the user pans/zooms, then report the new bounds.
    map.on('moveend', () => { renderClusters(); boundsRef.current?.(map.getBounds()) })
    // A click on the empty basemap (not on a marker) deselects.
    map.on('click', () => mapClickRef.current?.())
    mapRef.current = map

    return () => {
      markersRef.current.forEach(m => m.remove())
      markersRef.current.clear()
      readyRef.current = false
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Build the supercluster index from the current properties ─────
  function buildIndex() {
    const data = propsDataRef.current
    const byId = new Map<string, Property>()
    const points: Supercluster.PointFeature<PointProps>[] = data.map(p => {
      byId.set(p.id, p)
      return {
        type: 'Feature',
        properties: { propertyId: p.id },
        geometry: { type: 'Point', coordinates: [p.location.longitude, p.location.latitude] },
      }
    })
    byIdRef.current = byId
    const index = new Supercluster<PointProps>({ radius: 60, maxZoom: 16 })
    index.load(points)
    indexRef.current = index
  }

  // ── (Re)render cluster + pin markers for the current viewport ────
  function renderClusters() {
    const map = mapRef.current
    const index = indexRef.current
    if (!map || !index || !readyRef.current) return

    const b = map.getBounds()
    const bbox: [number, number, number, number] = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]
    const z = Math.round(map.getZoom())
    const clusters = index.getClusters(bbox, z)

    const seen = new Set<string>()
    const prevKeys = prevKeysRef.current
    // Satellite/hybrid imagery is dark-ish: light pills read best on it.
    const isDark = layerRef.current !== 'streets' ? false : document.documentElement.classList.contains('dark')
    const currentSelectedId = selectedIdRef.current

    clusters.forEach(c => {
      const [lng, lat] = c.geometry.coordinates

      if ('cluster' in c.properties) {
        const clusterId = c.properties.cluster_id
        const key = `cluster-${clusterId}`
        seen.add(key)
        if (markersRef.current.has(key)) return // stable cluster, keep it

        const el = makeClusterElement(c.properties.point_count, isDark, !prevKeys.has(key))
        el.addEventListener('click', e => {
          e.stopPropagation()
          const expansionZoom = index.getClusterExpansionZoom(clusterId)
          map.flyTo({ center: [lng, lat], zoom: Math.min(expansionZoom, 18), speed: 1, essential: true })
        })
        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([lng, lat])
          .addTo(map)
        markersRef.current.set(key, marker)
        return
      }

      // Individual property pin.
      const propId = c.properties.propertyId
      const property = byIdRef.current.get(propId)
      if (!property) return
      const key = `point-${propId}`
      seen.add(key)

      const isSelected = propId === currentSelectedId
      const isRent = property.operation === PropertyOperation.RENT
      const el = makePinElement(getMapPinPrice(property), isSelected, isRent, !prevKeys.has(key))
      el.addEventListener('click', e => { e.stopPropagation(); selectRef.current?.(property) })

      // Replace any existing pin for this id so selection styling stays fresh.
      markersRef.current.get(key)?.remove()
      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([property.location.longitude, property.location.latitude])
        .addTo(map)
      markersRef.current.set(key, marker)
    })

    // Drop markers no longer in view (or merged into a cluster).
    markersRef.current.forEach((marker, key) => {
      if (!seen.has(key)) { marker.remove(); markersRef.current.delete(key) }
    })
    prevKeysRef.current = seen
  }

  // Rebuild the index + redraw when the dataset changes.
  useEffect(() => {
    if (!readyRef.current) return
    buildIndex()
    renderClusters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties])

  // Redraw (restyle pins) when the selection changes.
  useEffect(() => {
    renderClusters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  // ── Fly to the selected property ─────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedId) return
    const p = properties.find(x => x.id === selectedId)
    if (p) map.flyTo({ center: [p.location.longitude, p.location.latitude], zoom: Math.max(map.getZoom(), 14), speed: 0.8, essential: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  // ── Recenter when the center prop changes ────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !center) return
    map.flyTo({ center: [center.lng, center.lat], essential: true })
  }, [center])

  // ── Swap basemap when the theme or base layer changes ────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mounted) return
    const key = layer === 'streets' ? (theme === 'dark' ? 'dark' : 'light') : layer
    if (styleKeyRef.current === key) return
    styleKeyRef.current = key
    const style =
      layer === 'satellite' ? STYLE_SATELLITE :
      layer === 'hybrid' ? STYLE_HYBRID :
      theme === 'dark' ? STYLE_DARK : STYLE_LIGHT
    map.setStyle(style)
    // Markers are DOM overlays (they survive setStyle) but their colors are
    // theme/layer-dependent — rebuild them.
    markersRef.current.forEach(m => m.remove())
    markersRef.current.clear()
    prevKeysRef.current = new Set()
    renderClusters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, mounted, layer])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {/* Base layer switch */}
      <div className="absolute bottom-6 left-3 z-10 flex rounded-full overflow-hidden border border-outline-variant/40 shadow-elevated bg-surface-container-low">
        {([['streets', 'Mapa'], ['satellite', 'Satélite'], ['hybrid', 'Híbrido']] as [BaseLayer, string][]).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setLayer(value)}
            className={
              layer === value
                ? 'px-3.5 py-1.5 text-xs font-bold bg-primary text-on-primary'
                : 'px-3.5 py-1.5 text-xs font-medium text-on-surface-variant hover:text-on-surface transition-colors'
            }
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
