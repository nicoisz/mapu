'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useTheme } from '@/hooks/useTheme'
import { SALE_COLOR } from '@/constants'

const STYLE_LIGHT = 'https://tiles.openfreemap.org/styles/positron'
const STYLE_DARK = 'https://tiles.openfreemap.org/styles/dark'

interface Props {
  latitude: number
  longitude: number
  onChange: (lat: number, lng: number) => void
  selected: boolean
}

export default function LocationPickerInner({ latitude, longitude, onChange, selected }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const styleRef = useRef('')
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const { theme, mounted } = useTheme()

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
      zoom: 15,
      attributionControl: { compact: true },
    })
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

    const pin = document.createElement('button')
    pin.type = 'button'
    pin.setAttribute('aria-label', 'Mover pin de ubicación con las flechas del teclado')
    pin.innerHTML = `<div style="
      width:18px;height:18px;background:${SALE_COLOR};
      border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.35);
      cursor:grab;
    "></div>`
    const marker = new maplibregl.Marker({
      element: pin,
      draggable: true,
    })
      .setLngLat([longitude, latitude])
      .addTo(map)
    markerRef.current = marker

    const canvas = map.getCanvas()
    canvas.setAttribute(
      'aria-label',
      'Mapa de ubicación: presiona Enter para colocar el pin en el centro'
    )
    canvas.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return
      event.preventDefault()
      const center = map.getCenter()
      marker.setLngLat(center)
      onChangeRef.current(center.lat, center.lng)
    })

    pin.addEventListener('keydown', (event) => {
      const shifts: Record<string, [number, number]> = {
        ArrowUp: [0, -8],
        ArrowDown: [0, 8],
        ArrowLeft: [-8, 0],
        ArrowRight: [8, 0],
      }
      const shift = shifts[event.key]
      if (!shift) return
      event.preventDefault()
      event.stopPropagation()
      const point = map.project(marker.getLngLat())
      const next = map.unproject([point.x + shift[0], point.y + shift[1]])
      marker.setLngLat(next)
      onChangeRef.current(next.lat, next.lng)
    })

    marker.on('dragend', () => {
      const lngLat = marker.getLngLat()
      onChangeRef.current(lngLat.lat, lngLat.lng)
    })
    // Click on empty map moves the pin.
    map.on('click', (e) => {
      const { lng, lat } = e.lngLat
      marker.setLngLat([lng, lat])
      onChangeRef.current(lat, lng)
    })

    mapRef.current = map
    return () => {
      marker.remove()
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    if (!map || !marker) return
    const old = marker.getLngLat()
    const changed = old.lat !== latitude || old.lng !== longitude
    marker.setLngLat([longitude, latitude])
    marker.getElement().hidden = !selected
    if (selected && changed) map.easeTo({ center: [longitude, latitude], duration: 300 })
  }, [latitude, longitude, selected])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mounted) return
    const next = theme === 'dark' ? STYLE_DARK : STYLE_LIGHT
    if (styleRef.current === next) return
    styleRef.current = next
    map.setStyle(next)
  }, [theme, mounted])

  return <div ref={containerRef} className="w-full h-full" />
}
