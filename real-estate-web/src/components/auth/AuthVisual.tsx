'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ArrowRight, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

const TIPS = [
  {
    title: 'La primera foto abre la puerta.',
    text: 'Usa luz natural y una vista despejada del espacio principal.',
  },
  {
    title: 'Una ubicación precisa hace la diferencia.',
    text: 'Revisa el pin del mapa para que las personas puedan conocer el entorno.',
  },
  {
    title: 'Los detalles ayudan a decidir.',
    text: 'Cuenta qué hace especial tu propiedad y revisa sus características antes de publicar.',
  },
]

export function AuthVisual({ compact = false }: { compact?: boolean }) {
  const root = useRef<HTMLElement>(null)
  const [tip, setTip] = useState(0)

  useEffect(() => {
    const element = root.current
    if (!element) return
    const surface = element.closest<HTMLElement>('[data-auth-parallax]') ?? element
    const scroll = element.closest<HTMLElement>('[data-auth-scroll]')
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let x = 0
    let y = 0
    const render = () => {
      frame = 0
      const offset = motion.matches ? 0 : Math.min(40, (scroll?.scrollTop ?? 0) * 0.12)
      element.style.setProperty('--auth-x', `${motion.matches ? 0 : x}px`)
      element.style.setProperty('--auth-y', `${motion.matches ? 0 : y - offset}px`)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(render)
    }
    const move = (event: PointerEvent) => {
      if (motion.matches || event.pointerType !== 'mouse') return
      const bounds = surface.getBoundingClientRect()
      x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 24
      y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 20
      schedule()
    }
    const reset = () => {
      x = 0
      y = 0
      schedule()
    }
    surface.addEventListener('pointermove', move, { passive: true })
    surface.addEventListener('pointerleave', reset)
    scroll?.addEventListener('scroll', schedule, { passive: true })
    motion.addEventListener('change', reset)
    return () => {
      cancelAnimationFrame(frame)
      surface.removeEventListener('pointermove', move)
      surface.removeEventListener('pointerleave', reset)
      scroll?.removeEventListener('scroll', schedule)
      motion.removeEventListener('change', reset)
    }
  }, [])

  return (
    <aside
      ref={root}
      className={cn('auth-visual', compact && 'auth-visual-compact')}
      aria-label="Consejos de LUKY"
    >
      <h2 className="auth-visual-heading font-display">
        {compact ? (
          'Tu propiedad tiene un lugar aquí.'
        ) : (
          <>
            Tu lugar en Chile
            <br />
            está en el mapa.
          </>
        )}
      </h2>
      <div className="auth-photo-scene">
        <svg aria-hidden="true" className="auth-orbits" viewBox="0 0 600 440" fill="none">
          <ellipse cx="300" cy="220" rx="290" ry="145" transform="rotate(-25 300 220)" />
          <ellipse cx="300" cy="220" rx="275" ry="170" transform="rotate(22 300 220)" />
          <circle cx="548" cy="92" r="5" />
        </svg>
        <div className="auth-photo-main">
          <Image
            src="/2.jpg"
            alt="Valle verde y colinas de Chile al atardecer"
            fill
            priority={!compact}
            sizes={compact ? '(max-width: 767px) 80vw, 360px' : '(max-width: 1023px) 85vw, 44vw'}
            className="object-cover"
          />
        </div>
        <div className="auth-photo-detail">
          <Image
            src="/landing/country-sunset.webp"
            alt="Casa de campo entre árboles y colinas"
            fill
            sizes={compact ? '170px' : '(max-width: 1023px) 35vw, 220px'}
            className="object-cover"
          />
        </div>
      </div>
      {!compact && (
        <div className="auth-tip">
          <div className="flex items-center justify-between gap-4">
            <p className="flex items-center gap-2 text-xs font-semibold text-accent">
              <Lightbulb size={16} /> Consejo para publicar
            </p>
            <button
              type="button"
              onClick={() => setTip((current) => (current + 1) % TIPS.length)}
              aria-label="Ver siguiente consejo"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-outline-variant text-on-surface transition-colors hover:bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <ArrowRight size={17} />
            </button>
          </div>
          <div aria-live="polite" aria-atomic="true">
            <h3 className="mt-2 font-headline text-xl font-semibold text-on-surface">
              {TIPS[tip].title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{TIPS[tip].text}</p>
          </div>
        </div>
      )}
    </aside>
  )
}
