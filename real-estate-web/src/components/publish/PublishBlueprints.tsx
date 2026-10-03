'use client'

import { useState, type CSSProperties } from 'react'
import Image from 'next/image'
import { Pause, Play } from 'lucide-react'

const SHEETS = ['casa-rural', 'galpon-lago', 'casa-urbana']

export function PublishBlueprints() {
  const [paused, setPaused] = useState(false)

  return (
    <aside
      className="publish-blueprints"
      data-paused={paused}
      aria-label="Ilustraciones arquitectónicas de MapU"
    >
      <div className="publish-blueprints-scene" aria-hidden="true">
        {SHEETS.map((sheet, index) => (
          <Image
            key={sheet}
            src={`/images/publish-blueprints/${sheet}.webp`}
            alt=""
            fill
            sizes="(max-width: 1023px) 740px, 480px"
            className="publish-blueprint-sheet"
            style={{ '--sheet-delay': `${index === 0 ? 0 : (index - 3) * 12}s` } as CSSProperties}
            draggable={false}
          />
        ))}
      </div>
      <button
        type="button"
        className="publish-blueprints-pause"
        aria-label={paused ? 'Reanudar fondo animado' : 'Pausar fondo animado'}
        aria-pressed={paused}
        onClick={() => setPaused((previous) => !previous)}
      >
        {paused ? <Play size={15} /> : <Pause size={15} />}
      </button>
    </aside>
  )
}
