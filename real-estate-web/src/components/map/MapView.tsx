'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import Supercluster from 'supercluster'
import { Property } from '@/types/property'
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/constants'
import { getMapPinPrice } from '@/lib/utils'
import { useTheme } from '@/hooks/useTheme'

// OpenFreeMap — free vector tiles, no API key. Native styles per theme.
const STYLE_LIGHT = 'https://tiles.openfreemap.org/styles/positron'
const STYLE_DARK = 'https://tiles.openfreemap.org/styles/dark'

const ACCENT = '#FF4D1C'

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

/** Monochrome price pill — only the selected one takes the accent. */
function makePinElement(label: string, isSelected: boolean, isDark: boolean): HTMLDivElement {
  const wrap = document.createElement('div')
  wrap.style.cursor = 'pointer'

  const bg = isSelected ? ACCENT : isDark ? '#1D1D24' : '#ffffff'
  const fg = isSelected ? '#ffffff' : isDark ? '#F5F4F2' : '#141414'
  const edge = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.12)'

  const inner = document.createElement('div')
  inner.style.transition = 'transform 0.15s ease'
  inner.style.transformOrigin = 'bottom center'
  inner.style.transform = isSelected ? 'scale(1.12)' : 'scale(1)'
  inner.style.animation = 'pinPop 0.3s cubic-bezier(0.34,1.56,0.64,1) both'
  inner.innerHTML = `
    <div style="
      background:${bg};color:${fg};
      padding:4px 10px;border-radius:9999px;
      font-size:11px;font-weight:700;white-space:nowrap;font-family:Manrope,sans-serif;
      box-shadow:0 3px 10px rgba(0,0,0,0.3);
      border:1.5px solid ${isSelected ? ACCENT : edge};
    ">${label}</div>
    <div style="
      width:0;height:0;margin:-1px auto 0;
      border-left:5px solid transparent;border-right:5px solid transparent;
      border-top:6px solid ${isSelected ? ACCENT : bg};
    "></div>`
  wrap.appendChild(inner)

  if (!isSelected) {
    wrap.onmouseenter = () => { inner.style.transform = 'scale(1.08)' }
    wrap.onmouseleave = () => { inner.style.transform = 'scale(1)' }
  }
  return wrap
}

/** Monochrome cluster circle; takes the accent on hover. */
function makeClusterElement(count: number, isDark: boolean): HTMLDivElement {
  const wrap = document.createElement('div')
  wrap.style.cursor = 'pointer'
  const size = count < 10 ? 38 : count < 100 ? 46 : 56

  const bg = isDark ? '#15151A' : '#ffffff'
  const fg = isDark ? '#F5F4F2' : '#141414'
  const edge = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)'

  const inner = document.createElement('div')
  inner.style.transition = 'transform 0.15s ease'
  inner.style.animation = 'pinPop 0.3s cubic-bezier(0.34,1.56,0.64,1) both'
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
  const indexRef = useRef<Supercluster<PointProps> | null>(null)
  const byIdRef = useRef<Map<string, Property>>(new Map())
  const readyRef = useRef(false)
  const styleRef = useRef('')
  const { theme, mounted } = useTheme()

  // Keep latest callbacks without re-creating the map.
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
    const initialStyle = document.documentElement.classList.contains('dark') ? STYLE_DARK : STYLE_LIGHT
    styleRef.current = initialStyle
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: initialStyle,
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
    const byId = new Map<string, Property>()
    const points: Supercluster.PointFeature<PointProps>[] = properties.map(p => {
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
    const isDark = document.documentElement.classList.contains('dark')

    clusters.forEach(c => {
      const [lng, lat] = c.geometry.coordinates

      if ('cluster' in c.properties) {
        const clusterId = c.properties.cluster_id
        const key = `cluster-${clusterId}`
        seen.add(key)
        if (markersRef.current.has(key)) return // stable cluster, keep it

        const el = makeClusterElement(c.properties.point_count, isDark)
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

      const isSelected = propId === selectedId
      const el = makePinElement(getMapPinPrice(property), isSelected, isDark)
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

  // ── Swap basemap + restyle markers when the theme flips ──────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mounted) return
    const nextStyle = theme === 'dark' ? STYLE_DARK : STYLE_LIGHT
    if (styleRef.current === nextStyle) return
    styleRef.current = nextStyle
    map.setStyle(nextStyle)
    // Markers are DOM overlays (they survive setStyle) but their colors are
    // theme-dependent — rebuild them.
    markersRef.current.forEach(m => m.remove())
    markersRef.current.clear()
    renderClusters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, mounted])

  return <div ref={containerRef} className="w-full h-full" />
}
