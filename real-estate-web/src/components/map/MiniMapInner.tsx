'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useTheme } from '@/hooks/useTheme'
import { zonesToGeoJSON, getZoneColor, ZoneCell } from '@/lib/priceZones'

const STYLE_LIGHT = 'https://tiles.openfreemap.org/styles/positron'
const STYLE_DARK = 'https://tiles.openfreemap.org/styles/dark'

const ZONE_SOURCE = 'mini-price-zones'
const ZONE_LAYER = 'mini-price-zones-fill'

interface Props {
  latitude: number
  longitude: number
  label?: string
  /** Optional price-zone cells to paint under the pin (choropleth). */
  cells?: ZoneCell[]
  /** Cell id to outline once zones are rendered. */
  highlightId?: string
  /** Enable pan/zoom navigation + navigation controls. */
  interactive?: boolean
}

export default function MiniMapInner({
  latitude,
  longitude,
  cells,
  highlightId,
  interactive,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const styleRef = useRef('')
  const loadedRef = useRef(false)
  const { theme, mounted } = useTheme()

  const cellsRef = useRef(cells)
  cellsRef.current = cells
  const highlightRef = useRef(highlightId)
  highlightRef.current = highlightId
  const interactiveRef = useRef(interactive)
  interactiveRef.current = interactive

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const initialStyle = document.documentElement.classList.contains('dark')
      ? STYLE_DARK
      : STYLE_LIGHT
    styleRef.current = initialStyle
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: initialStyle,
      center: [longitude, latitude],
      zoom: 13,
      interactive: !!interactiveRef.current,
      attributionControl: { compact: true },
    })
    if (interactiveRef.current) {
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    }

    const pin = document.createElement('div')
    pin.innerHTML = `<div style="
      width:16px;height:16px;background:#FF4D1C;
      border:3px solid white;border-radius:50%;
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
    "></div>`
    map.on('load', () => {
      new maplibregl.Marker({ element: pin }).setLngLat([longitude, latitude]).addTo(map)
      loadedRef.current = true
      renderZones()
    })
    mapRef.current = map

    return () => {
      loadedRef.current = false
      map.remove()
      mapRef.current = null
    }
  }, [latitude, longitude])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mounted) return
    const next = theme === 'dark' ? STYLE_DARK : STYLE_LIGHT
    if (styleRef.current === next) return
    styleRef.current = next
    map.setStyle(next)
    // setStyle drops custom sources; re-render once the new style is ready.
    const rerender = () => renderZones()
    if (map.isStyleLoaded()) rerender()
    else map.once('styledata', rerender)
  }, [theme, mounted])

  useEffect(() => {
    renderZones()
  }, [cells, highlightId])

  // Paints the price-zone choropleth (if cells were provided) and outlines the
  // cell that contains the marker. Idempotent: re-adds after setStyle too.
  function renderZones() {
    const map = mapRef.current
    if (!map || !loadedRef.current) return

    const currentCells = cellsRef.current
    const currentHighlight = highlightRef.current

    if (map.getSource(ZONE_SOURCE)) {
      ;(map.getSource(ZONE_SOURCE) as maplibregl.GeoJSONSource).setData(
        currentCells?.length ? zonesToGeoJSON(currentCells) : { type: 'FeatureCollection', features: [] }
      )
    } else if (currentCells?.length) {
      map.addSource(ZONE_SOURCE, {
        type: 'geojson',
        data: zonesToGeoJSON(currentCells),
      })
      map.addLayer({
        id: ZONE_LAYER,
        type: 'fill',
        source: ZONE_SOURCE,
        paint: {
          'fill-color': [
            'match',
            ['get', 'bucket'],
            'economic',
            getZoneColor('economic'),
            'mid',
            getZoneColor('mid'),
            'premium',
            getZoneColor('premium'),
            '#888888',
          ],
          'fill-opacity': 0.3,
          'fill-outline-color': 'rgba(255,255,255,0.5)',
        },
      })
    }

    // Keep the highlight line layer in sync (add/update filter, or drop).
    const hlId = currentCells?.some((c) => c.id === currentHighlight)
      ? currentHighlight
      : undefined
    if (map.getLayer('mini-zone-highlight')) {
      if (hlId) {
        map.setFilter('mini-zone-highlight', ['==', ['get', 'id'], hlId])
      } else {
        map.removeLayer('mini-zone-highlight')
      }
    } else if (hlId) {
      map.addLayer({
        id: 'mini-zone-highlight',
        type: 'line',
        source: ZONE_SOURCE,
        paint: { 'line-color': '#111111', 'line-width': 2.5 },
        filter: ['==', ['get', 'id'], hlId],
      })
    }
  }

  return <div ref={containerRef} className="w-full h-full" />
}
