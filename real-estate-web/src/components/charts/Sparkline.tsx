'use client'

/** Tiny SVG sparkline — no chart lib needed. */
export function Sparkline({ data }: { data: { day: string; count: number }[] }) {
  if (data.length < 2) {
    return (
      <div className="h-12 flex items-center justify-center text-xs text-on-surface-variant">
        {data.length === 1
          ? `${data[0].count} vista${data[0].count !== 1 ? 's' : ''}`
          : 'Sin datos aún'}
      </div>
    )
  }

  const W = 200
  const H = 48
  const max = Math.max(...data.map((d) => d.count), 1)
  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * W
      const y = H - (d.count / max) * (H - 4) - 2
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const total = data.reduce((s, d) => s + d.count, 0)

  return (
    <div className="space-y-1">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-12" aria-hidden>
        <polyline
          points={points}
          fill="none"
          stroke="rgb(var(--primary))"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="text-xs text-on-surface-variant">{total} vistas en el período</p>
    </div>
  )
}
