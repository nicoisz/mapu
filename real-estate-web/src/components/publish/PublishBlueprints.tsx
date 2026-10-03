'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Pause, Play } from 'lucide-react'

const SHEETS = ['casa-rural', 'galpon-lago', 'casa-urbana']

export function PublishBlueprints() {
  const [paused, setPaused] = useState(false)

  return (
    <div className="publish-background-anchor" data-paused={paused}>
      <div className="publish-blueprints-scene" aria-hidden="true">
        {SHEETS.map((sheet) => (
          <Image
            key={sheet}
            src={`/images/publish-blueprints/${sheet}-lines.webp`}
            alt=""
            width={960}
            height={1440}
            sizes="(max-width: 767px) 420px, 560px"
            className="publish-blueprint-sheet"
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
    </div>
  )
}
