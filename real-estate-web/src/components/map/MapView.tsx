'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Property } from '@/types/property'
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/constants'
import { getMapPinPrice } from '@/lib/utils'
import { PropertyOperation } from '@/types/enums'
import { useTheme } from '@/hooks/useTheme'

// OpenFreeMap — free vector tiles, no API key. 'positron' is a clean light
// basemap; in dark mode we tint the canvas via CSS (see globals.css .map-dark).
const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron'

interface MapViewProps {
  properties: Property[]
  selectedId?: string | null
  onPropertySelect?: (property: Property) => void
  onBoundsChange?: (bounds: maplibregl.LngLatBounds) => void
  center?: { lat: number; lng: number }
  zoom?: number
}

/** Builds the themed price-pill marker element (auto-themes via CSS vars). */
function makePinElement(label: string, isSelected: boolean, isRent: boolean): HTMLDivElement {
  const wrap = document.createElement('div')
  wrap.style.cursor = 'pointer'
  wrap.style.transition = 'transform 0.15s ease'
  wrap.style.transform = isSelected ? 'scale(1.12)' : 'scale(1)'

  const bg = isRent ? 'var(--accent)' : 'var(--primary)'
  const fg = isRent ? '#ffffff' : 'var(--on-primary)'

  wrap.innerHTML = `
    <div style="
      background:rgb(${bg});color:rgb(${fg});
      padding:4px 9px;border-radius:9999px;
      font-size:11px;font-weight:700;white-space:nowrap;font-family:Manrope,sans-serif;
      box-shadow:0 3px 10px rgba(0,0,0,0.28);
      border:2px solid rgba(255,255,255,0.85);
      ${isSelected ? 'outline:2px solid rgb(' + bg + ');outline-offset:1px;' : ''}
    ">${label}</div>
    <div style="
      width:0;height:0;margin:-1px auto 0;
      border-left:5px solid transparent;border-right:5px solid transparent;
      border-top:6px solid rgba(255,255,255,0.85);
    "></div>`
  return wrap
}

export default function MapView({ properties, selectedId, onPropertySelect, onBoundsChange, center, zoom }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map())
  const readyRef = useRef(false)
  const { theme } = useTheme()

  // Keep latest callbacks without re-creating the map.
  const selectRef = useRef(onPropertySelect)
  selectRef.current = onPropertySelect
  const boundsRef = useRef(onBoundsChange)
  boundsRef.current = onBoundsChange

  // ── Create map once ──────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: center ? [center.lng, center.lat] : [DEFAULT_MAP_CENTER.longitude, DEFAULT_MAP_CENTER.latitude],
      zoom: zoom ?? DEFAULT_MAP_ZOOM,
      attributionControl: { compact: true },
    })
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    map.on('load', () => {
      readyRef.current = true
      renderMarkers()
      boundsRef.current?.(map.getBounds())
    })
    map.on('moveend', () => boundsRef.current?.(map.getBounds()))
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

  // ── (Re)render markers when data or selection changes ────────────
  function renderMarkers() {
    const map = mapRef.current
    if (!map || !readyRef.current) return

    const seen = new Set<string>()
    properties.forEach(property => {
      seen.add(property.id)
      const isSelected = property.id === selectedId
      const isRent = property.operation === PropertyOperation.RENT
      const el = makePinElement(getMapPinPrice(property), isSelected, isRent)
      el.addEventListener('click', e => { e.stopPropagation(); selectRef.current?.(property) })

      // Replace any existing marker for this id with a fresh, restyled one.
      markersRef.current.get(property.id)?.remove()
      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([property.location.longitude, property.location.latitude])
        .addTo(map)
      markersRef.current.set(property.id, marker)
    })

    // Drop markers for properties no longer present.
    markersRef.current.forEach((marker, id) => {
      if (!seen.has(id)) { marker.remove(); markersRef.current.delete(id) }
    })
  }

  useEffect(() => {
    renderMarkers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties, selectedId])

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

  return <div ref={containerRef} className={`w-full h-full ${theme === 'dark' ? 'map-dark' : ''}`} />
}
