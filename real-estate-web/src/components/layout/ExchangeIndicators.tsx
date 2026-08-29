'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface Point {
  value: number
  date: string
}

const fmt = new Intl.NumberFormat('es-CL', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Último valor desde la API pública mindicador.cl (serie[0] = hoy). */
async function fetchLatest(url: string): Promise<Point | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    const latest = data?.serie?.[0]
    return latest ? { value: Number(latest.valor), date: String(latest.fecha) } : null
  } catch {
    return null
  }
}

/** Indicadores de mercado (UF y Dólar de Chile) — barra de búsqueda y sidebar. */
export function ExchangeIndicators({ className }: { className?: string }) {
  const [uf, setUf] = useState<Point | null>(null)
  const [usd, setUsd] = useState<Point | null>(null)

  useEffect(() => {
    let active = true
    fetchLatest('https://api.mindicador.cl/api/uf').then((v) => active && setUf(v))
    fetchLatest('https://api.mindicador.cl/api/dolar').then((v) => active && setUsd(v))
    return () => {
      active = false
    }
  }, [])

  return (
    <div className={cn('flex items-center gap-1.5 text-xs', className)}>
      <span
        className="flex items-center gap-1 rounded-full bg-surface-container px-2 py-0.5 border border-outline-variant/40"
        title={uf?.date ? `Valor UF al ${uf.date}` : 'Valor UF'}
      >
        <span className="font-semibold text-on-surface-variant">UF</span>
        <span className="font-bold text-primary">{uf ? fmt.format(uf.value) : '—'}</span>
      </span>
      <span
        className="flex items-center gap-1 rounded-full bg-surface-container px-2 py-0.5 border border-outline-variant/40"
        title={usd?.date ? `Dólar al ${usd.date}` : 'Dólar observado'}
      >
        <span className="font-semibold text-on-surface-variant">Dólar</span>
        <span className="font-bold text-primary">{usd ? fmt.format(usd.value) : '—'}</span>
      </span>
    </div>
  )
}
