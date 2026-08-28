'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useTheme } from '@/hooks/useTheme'

const STYLE_LIGHT = 'https://tiles.openfreemap.org/styles/positron'
const STYLE_DARK = 'https://tiles.openfreemap.org/styles/dark'

interface Props {
  latitude: number
  longitude: number
  onChange: (lat: number, lng: number) => void
}

export default function LocationPickerInner({ latitude, longitude, onChange }: Props) {
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

    const pin = document.createElement('div')
    pin.innerHTML = `<div style="
      width:18px;height:18px;background:#FF4D1C;
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
  }, [latitude, longitude])

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
