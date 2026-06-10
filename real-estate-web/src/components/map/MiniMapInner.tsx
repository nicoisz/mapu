'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useTheme } from '@/hooks/useTheme'

const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron'

interface Props {
  latitude: number
  longitude: number
  label?: string
}

export default function MiniMapInner({ latitude, longitude }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: [longitude, latitude],
      zoom: 14,
      interactive: false,
      attributionControl: { compact: true },
    })

    const pin = document.createElement('div')
    pin.innerHTML = `<div style="
      width:16px;height:16px;background:rgb(var(--primary));
      border:3px solid white;border-radius:50%;
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
    "></div>`
    map.on('load', () => {
      new maplibregl.Marker({ element: pin }).setLngLat([longitude, latitude]).addTo(map)
    })
    mapRef.current = map

    return () => { map.remove(); mapRef.current = null }
  }, [latitude, longitude])

  return <div ref={containerRef} className={`w-full h-full ${theme === 'dark' ? 'map-dark' : ''}`} />
}
