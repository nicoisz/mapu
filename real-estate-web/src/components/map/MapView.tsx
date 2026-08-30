'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl, { StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import Supercluster from 'supercluster'
import { Property } from '@/types/property'
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, LIST_VIEW_CENTER, LIST_VIEW_RADIUS_KM } from '@/constants'
import { formatPriceShort, getMapPinPrice } from '@/lib/utils'
import { PropertyOperation, Currency } from '@/types/enums'
import { useTheme } from '@/hooks/useTheme'
import {
  computePriceZones,
  propertyHexesToGeoJSON,
  findZone,
  getZoneColor,
  easeOutElastic,
  scaleZoneGeometry,
  ZoneMode,
  ZoneBucket,
  ZoneCell,
} from '@/lib/priceZones'

// OpenFreeMap — free vector tiles, no API key. Native styles per theme.
const STYLE_LIGHT = 'https://tiles.openfreemap.org/styles/positron'
const STYLE_DARK = 'https://tiles.openfreemap.org/styles/dark'

// Esri World Imagery — free satellite raster tiles (attribution required).
const SATELLITE_SOURCES: StyleSpecification['sources'] = {
  satellite: {
    type: 'raster',
    tiles: [
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    ],
    tileSize: 256,
    maxzoom: 19,
    attribution: 'Imagery © Esri, Maxar, Earthstar Geographics',
  },
  // Esri reference overlays, designed to sit on top of World Imagery.
  'esri-roads': {
    type: 'raster',
    tiles: [
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
    ],
    tileSize: 256,
    maxzoom: 19,
  },
  'esri-labels': {
    type: 'raster',
    tiles: [
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    ],
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

// Price-zone choropleth source/layer ids (added on top of the basemap).
const ZONE_SOURCE = 'price-zones'
const ZONE_LAYER = 'price-zones-fill'

type BaseLayer = 'streets' | 'satellite' | 'hybrid'

interface MapViewProps {
  properties: Property[]
  selectedId?: string | null
  onPropertySelect?: (property: Property) => void
  onMapClick?: () => void
  onBoundsChange?: (bounds: maplibregl.LngLatBounds) => void
  center?: { lat: number; lng: number }
  zoom?: number
  /** Increment this to fly/fit the view to all properties (e.g. list view). */
  fitToken?: number
}

/** Each property as a GeoJSON point feature for supercluster. */
type PointProps = { propertyId: string }

// NOTE: MapLibre drives the `transform` of the marker's root element to
// position it on the map, so we must NOT set transform on `wrap` — doing so
// clobbers the translate and the marker jumps to the corner. All scale/hover
// effects go on an inner element instead.

/** Price pill colored by operation (sale/rent); the selected one scales up
 *  with a solid white ring. */
function makePinElement(
  label: string,
  isSelected: boolean,
  isRent: boolean,
  animate: boolean,
  zoneColor?: string | null
): HTMLDivElement {
  const wrap = document.createElement('div')
  wrap.style.cursor = 'pointer'

  const bg = isRent ? RENT_COLOR : SALE_COLOR
  const edge = isSelected ? '#ffffff' : 'rgba(255,255,255,0.55)'
  const diamond = zoneColor
    ? `<span style="width:7px;height:7px;display:inline-block;background:${zoneColor};transform:rotate(45deg);border:1px solid rgba(255,255,255,.85);border-radius:1px;margin-right:5px;vertical-align:middle;"></span>`
    : ''

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
    ">${diamond}${label}</div>
    <div style="
      width:0;height:0;margin:-1px auto 0;
      border-left:5px solid transparent;border-right:5px solid transparent;
      border-top:6px solid ${bg};
    "></div>`
  wrap.appendChild(inner)

  if (!isSelected) {
    wrap.onmouseenter = () => {
      inner.style.transform = 'scale(1.08)'
    }
    wrap.onmouseleave = () => {
      inner.style.transform = 'scale(1)'
    }
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

export default function MapView({
  properties,
  selectedId,
  onPropertySelect,
  onMapClick,
  onBoundsChange,
  center,
  zoom,
  fitToken,
}: MapViewProps) {
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

  // ── Price zones ────────────────────────────────────────────────
  const [zonesOn, setZonesOn] = useState(true)
  const [zoneMode, setZoneMode] = useState<ZoneMode>('sale')
  const [zoneRanges, setZoneRanges] = useState<Record<ZoneBucket, [number, number]>>()
  const [activeBucket, setActiveBucket] = useState<ZoneBucket | null>(null)
  const zoneGeoRef = useRef<GeoJSON.FeatureCollection | null>(null)
  const globalCellsRef = useRef<ZoneCell[] | null>(null)
  const animRef = useRef<number | null>(null)
  const zoneModeRef = useRef<ZoneMode>(zoneMode)
  zoneModeRef.current = zoneMode
  const zonesOnRef = useRef(zonesOn)
  zonesOnRef.current = zonesOn
  const activeBucketRef = useRef<ZoneBucket | null>(activeBucket)
  activeBucketRef.current = activeBucket

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
      center: center
        ? [center.lng, center.lat]
        : [DEFAULT_MAP_CENTER.longitude, DEFAULT_MAP_CENTER.latitude],
      zoom: zoom ?? DEFAULT_MAP_ZOOM,
      attributionControl: { compact: true },
    })
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    map.on('load', () => {
      readyRef.current = true
      ensureZones()
      buildIndex()
      renderClusters()
      boundsRef.current?.(map.getBounds())
    })
    // setStyle (theme/base-layer switch) drops custom sources; re-add the zone
    // layers + data whenever the style reloads, instead of trying to restore
    // once after a specific setStyle call.
    map.on('styledata', () => {
      if (readyRef.current) ensureZones()
    })
    // Re-cluster as the user pans/zooms, then report the new bounds.
    map.on('moveend', () => {
      renderClusters()
      boundsRef.current?.(map.getBounds())
    })
    // A click on the empty basemap (not on a marker) deselects.
    map.on('click', () => mapClickRef.current?.())
    mapRef.current = map

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      markersRef.current.forEach((m) => m.remove())
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
    const bucket = activeBucketRef.current
    const cells = globalCellsRef.current
    // Filter to the active zone bucket (pins), using the zone classification.
    const visible = bucket && cells ? data.filter((p) => findZone(cells, p.location.latitude, p.location.longitude)?.bucket === bucket) : data
    const byId = new Map<string, Property>()
    const points: Supercluster.PointFeature<PointProps>[] = visible.map((p) => {
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
    const bbox: [number, number, number, number] = [
      b.getWest(),
      b.getSouth(),
      b.getEast(),
      b.getNorth(),
    ]
    const z = Math.round(map.getZoom())
    const clusters = index.getClusters(bbox, z)

    const seen = new Set<string>()
    const prevKeys = prevKeysRef.current
    // Satellite/hybrid imagery is dark-ish: light pills read best on it.
    const isDark =
      layerRef.current !== 'streets' ? false : document.documentElement.classList.contains('dark')
    const currentSelectedId = selectedIdRef.current

    clusters.forEach((c) => {
      const [lng, lat] = c.geometry.coordinates

      if ('cluster' in c.properties) {
        const clusterId = c.properties.cluster_id
        const key = `cluster-${clusterId}`
        seen.add(key)
        if (markersRef.current.has(key)) return // stable cluster, keep it

        const el = makeClusterElement(c.properties.point_count, isDark, !prevKeys.has(key))
        el.addEventListener('click', (e) => {
          e.stopPropagation()
          const expansionZoom = index.getClusterExpansionZoom(clusterId)
          map.flyTo({
            center: [lng, lat],
            zoom: Math.min(expansionZoom, 18),
            speed: 1,
            essential: true,
          })
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
      const el = makePinElement(
        getMapPinPrice(property),
        isSelected,
        isRent,
        !prevKeys.has(key),
        bucketColorFor(property)
      )
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        selectRef.current?.(property)
      })

      // Replace any existing pin for this id so selection styling stays fresh.
      markersRef.current.get(key)?.remove()
      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([property.location.longitude, property.location.latitude])
        .addTo(map)
      markersRef.current.set(key, marker)
    })

    // Drop markers no longer in view (or merged into a cluster).
    markersRef.current.forEach((marker, key) => {
      if (!seen.has(key)) {
        marker.remove()
        markersRef.current.delete(key)
      }
    })
    prevKeysRef.current = seen
  }

  // ── Price-zone choropleth layers ───────────────────────────────
  // Zone hexes are added as a vector fill layer so the whole region is tinted
  // by mean price (blue = economic, purple = mid, gold = premium).
  function addZoneLayers(map: maplibregl.Map) {
    if (map.getSource(ZONE_SOURCE)) return
    map.addSource(ZONE_SOURCE, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
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
        'fill-opacity': 0.5,
        'fill-outline-color': 'rgba(255,255,255,0.85)',
      },
    })
    // Cursor + click: the selected hex does an elastic scale "boing" using the
    // easeOutElastic curve, re-feeding geometry through setData() (MapLibre
    // can't CSS-deform canvas geometry, so we swap GeoJSON coordinates live).
    map.on('mouseenter', ZONE_LAYER, () => (map.getCanvas().style.cursor = 'pointer'))
    map.on('mouseleave', ZONE_LAYER, () => (map.getCanvas().style.cursor = ''))
    map.on('click', ZONE_LAYER, (e) => {
      const feat = e.features?.[0]
      const id = feat?.properties?.id as string | undefined
      if (!id || !zoneGeoRef.current) return
      const source = map.getSource(ZONE_SOURCE) as maplibregl.GeoJSONSource
      if (!source || !source.setData) return
      if (animRef.current) cancelAnimationFrame(animRef.current)
      // Find the target feature and animate it, keeping all others intact.
      const target = zoneGeoRef.current.features.find(
        (f) => (f.properties as { id: string })?.id === id
      )
      if (!target) return
      const targetGeom = target.geometry as GeoJSON.Polygon
      const ring = targetGeom.coordinates[0]
      // Hex center = midpoint of two opposite corners (v0 ↔ v3).
      const center = {
        lat: (ring[0][1] + ring[3][1]) / 2,
        lng: (ring[0][0] + ring[3][0]) / 2,
      }
      const start = performance.now()
      const DUR = 900
      const tick = (now: number) => {
        const t = Math.min((now - start) / DUR, 1)
        const s = 1 + 0.35 * easeOutElastic(t)
        const scaled = scaleZoneGeometry(ring.slice(0, -1) as [number, number][], center, s)
        const copy: GeoJSON.FeatureCollection = JSON.parse(JSON.stringify(zoneGeoRef.current))
        const copyTarget = copy.features.find(
          (f) => (f.properties as { id: string })?.id === id
        ) as GeoJSON.Feature<GeoJSON.Polygon>
        copyTarget.geometry.coordinates = [[...scaled, scaled[0]]]
        source.setData(copy)
        if (t < 1) animRef.current = requestAnimationFrame(tick)
      }
      animRef.current = requestAnimationFrame(tick)
    })
  }

  // Recompute zones from the current dataset + mode, update the layer data.
  function updateZones() {
    const map = mapRef.current
    if (!map || !readyRef.current) return
    const source = map.getSource(ZONE_SOURCE) as maplibregl.GeoJSONSource | undefined
    if (!source || !source.setData) return
    if (!zonesOnRef.current) {
      source.setData({ type: 'FeatureCollection', features: [] })
      setZoneRanges(undefined)
      zoneGeoRef.current = null
      return
    }
    const data = propsDataRef.current
    const { cells, legend } = computePriceZones(data, zoneModeRef.current)
    globalCellsRef.current = cells
    setZoneRanges(legend.ranges as Record<ZoneBucket, [number, number]>)
    const bucket = activeBucketRef.current
    // One hexagon per property, centered on its pin. Filter to the active bucket.
    const visible = bucket
      ? data.filter((p) => findZone(cells, p.location.latitude, p.location.longitude)?.bucket === bucket)
      : data
    zoneGeoRef.current = propertyHexesToGeoJSON(visible, cells)
    source.setData(zoneGeoRef.current)
  }

  // Zone color for a property's pin (diamond), or null when zones are hidden.
  function bucketColorFor(p: Property): string | null {
    if (!zonesOnRef.current || !globalCellsRef.current) return null
    const bucket = findZone(globalCellsRef.current, p.location.latitude, p.location.longitude)
      ?.bucket
    return bucket ? getZoneColor(bucket) : null
  }

  // Recompute zones + rebuild pins. Called whenever zones/filters change.
  function refresh() {
    updateZones()
    buildIndex()
    renderClusters()
  }

  // Idempotent: re-add the zone source/layer if setStyle removed them, then
  // refresh the data. Safe to call on every styledata event.
  function ensureZones() {
    const map = mapRef.current
    if (!map || !readyRef.current) return
    if (!map.getSource(ZONE_SOURCE)) addZoneLayers(map)
    updateZones()
  }

  // Rebuild the index + redraw when the dataset, zone mode, visibility or the
  // active zone filter changes.
  useEffect(() => {
    if (!readyRef.current) return
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties, activeBucket, zoneMode, zonesOn])

  // Redraw (restyle pins) when the selection changes.
  useEffect(() => {
    renderClusters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  // ── Fly to the selected property ─────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedId) return
    const p = properties.find((x) => x.id === selectedId)
    if (p)
      map.flyTo({
        center: [p.location.longitude, p.location.latitude],
        zoom: Math.max(map.getZoom(), 14),
        speed: 0.8,
        essential: true,
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  // ── Zoom to the fixed list-view target on request (list view) ────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !fitToken) return
    // Center on the configured point and cover a LIST_VIEW_RADIUS_KM radius.
    const { latitude, longitude } = LIST_VIEW_CENTER
    const dLat = LIST_VIEW_RADIUS_KM / 111.32
    const dLng = LIST_VIEW_RADIUS_KM / (111.32 * Math.cos((latitude * Math.PI) / 180))
    const target: [[number, number], [number, number]] = [
      [longitude - dLng, latitude - dLat],
      [longitude + dLng, latitude + dLat],
    ]
    const opts = { padding: 60, maxZoom: 15, speed: 0.8, duration: 600, essential: true }
    // The list column animates to a narrower width right as this fires, so fit
    // against the *current* container size and re-fit on each resize until the
    // animation settles — keeps the properties centered in the compressed map.
    const doFit = () => {
      map.resize()
      map.fitBounds(target, opts)
    }
    doFit()
    const onResize = () => doFit()
    map.on('resize', onResize)
    const settle = setTimeout(() => map.off('resize', onResize), 800)
    return () => {
      map.off('resize', onResize)
      clearTimeout(settle)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitToken])

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
      layer === 'satellite'
        ? STYLE_SATELLITE
        : layer === 'hybrid'
          ? STYLE_HYBRID
          : theme === 'dark'
            ? STYLE_DARK
            : STYLE_LIGHT
    map.setStyle(style)
    // Markers are DOM overlays (they survive setStyle) but their colors are
    // theme/layer-dependent — rebuild them. The zone layers are re-added
    // automatically by the persistent 'styledata' handler.
    markersRef.current.forEach((m) => m.remove())
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
        {(
          [
            ['streets', 'Mapa'],
            ['satellite', 'Satélite'],
            ['hybrid', 'Híbrido'],
          ] as [BaseLayer, string][]
        ).map(([value, label]) => (
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

      {/* Price zones control + legend */}
      <div className="absolute bottom-24 left-3 z-10 flex flex-col gap-2 items-start">
        <div className="flex rounded-full overflow-hidden border border-outline-variant/40 shadow-elevated bg-surface-container-low">
          <button
            onClick={() => setZonesOn((v) => !v)}
            className={
              zonesOn
                ? 'px-3.5 py-1.5 text-xs font-bold bg-primary text-on-primary'
                : 'px-3.5 py-1.5 text-xs font-medium text-on-surface-variant hover:text-on-surface transition-colors'
            }
            title="Mostrar/ocultar zonas de precio"
          >
            Zonas precio
          </button>
          {zonesOn && (
            <div className="flex">
              {(['sale', 'rent'] as ZoneMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setZoneMode(mode)}
                  className={
                    zoneMode === mode
                      ? 'px-3 py-1.5 text-xs font-bold bg-surface-container-highest text-primary'
                      : 'px-3 py-1.5 text-xs font-medium text-on-surface-variant hover:text-on-surface transition-colors'
                  }
                >
                  {mode === 'sale' ? 'Venta' : 'Arriendo'}
                </button>
              ))}
            </div>
          )}
        </div>

        {zonesOn && zoneRanges && (
          <div className="rounded-xl border border-outline-variant/40 shadow-elevated bg-surface-container-low p-3 w-56">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                Zonas por precio · {zoneMode === 'sale' ? 'venta' : 'arriendo'}
              </p>
              {activeBucket && (
                <button
                  onClick={() => setActiveBucket(null)}
                  className="text-[10px] font-semibold text-primary hover:underline"
                >
                  Ver todos
                </button>
              )}
            </div>
            {(['economic', 'mid', 'premium'] as ZoneBucket[]).map((bucket) => {
              const range = zoneRanges[bucket]
              const active = activeBucket === bucket
              return (
                <button
                  key={bucket}
                  onClick={() => setActiveBucket(active ? null : bucket)}
                  title={`Mostrar solo ${bucket === 'economic' ? 'económicas' : bucket === 'mid' ? 'de valor medio' : 'premium'}`}
                  className={`flex items-center gap-2 text-xs py-1.5 px-2 -mx-2 rounded-lg w-full text-left transition-all ${
                    active
                      ? 'bg-primary/10 ring-1 ring-primary'
                      : 'hover:bg-surface-container-highest'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-sm shrink-0"
                    style={{ backgroundColor: getZoneColor(bucket) }}
                  />
                  <span className="font-semibold text-on-surface capitalize">
                    {bucket === 'economic' ? 'Económica' : bucket === 'mid' ? 'Media' : 'Premium'}
                  </span>
                  {range && (
                    <span className="ml-auto text-on-surface-variant">
                      {formatPriceShort(range[0], Currency.CLP)} –{' '}
                      {formatPriceShort(range[1], Currency.CLP)}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
