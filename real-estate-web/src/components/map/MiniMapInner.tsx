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
  label?: string
}

export default function MiniMapInner({ latitude, longitude }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const styleRef = useRef('')
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
      zoom: 14,
      interactive: false,
      attributionControl: { compact: true },
    })

    const pin = document.createElement('div')
    pin.innerHTML = `<div style="
      width:16px;height:16px;background:#FF4D1C;
      border:3px solid white;border-radius:50%;
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
    "></div>`
    map.on('load', () => {
      new maplibregl.Marker({ element: pin }).setLngLat([longitude, latitude]).addTo(map)
    })
    mapRef.current = map

    return () => {
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
  }, [theme, mounted])

  return <div ref={containerRef} className="w-full h-full" />
}
