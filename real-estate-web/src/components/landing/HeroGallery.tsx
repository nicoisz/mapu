'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

const SLIDES = [
  {
    src: '/2.jpg',
    alt: 'Valle verde y colinas bajo la luz dorada del atardecer',
    position: '50% 50%',
  },
  {
    src: '/landing/country-sunset.webp',
    alt: 'Casa de campo entre árboles y colinas al atardecer',
    position: '66% 50%',
  },
  {
    src: '/landing/city-neighborhood.webp',
    alt: 'Casas y árboles de un barrio urbano bajo la luz cálida de la mañana',
    position: '50% 50%',
  },
  {
    src: '/landing/forest-house.webp',
    alt: 'Casa rodeada de bosque con los últimos rayos de sol',
    position: '50% 65%',
  },
]
const SLIDE_MS = 6500

export function HeroGallery() {
  const root = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [inView, setInView] = useState(false)
  const [pageVisible, setPageVisible] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [ready, setReady] = useState<Set<number>>(() => new Set())
  const [failed, setFailed] = useState<Set<number>>(() => new Set())

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncMotion = () => setReducedMotion(media.matches)
    const syncVisibility = () => setPageVisible(!document.hidden)
    syncMotion()
    syncVisibility()
    media.addEventListener('change', syncMotion)
    document.addEventListener('visibilitychange', syncVisibility)
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.15,
    })
    if (root.current) observer.observe(root.current)
    return () => {
      media.removeEventListener('change', syncMotion)
      document.removeEventListener('visibilitychange', syncVisibility)
      observer.disconnect()
    }
  }, [])

  const running = inView && pageVisible && !paused && !reducedMotion

  useEffect(() => {
    if (!running) return
    const timer = window.setTimeout(() => {
      for (let offset = 1; offset < SLIDES.length; offset++) {
        const next = (active + offset) % SLIDES.length
        if (ready.has(next) && !failed.has(next)) {
          setActive(next)
          break
        }
      }
    }, SLIDE_MS)
    return () => window.clearTimeout(timer)
  }, [active, running, ready, failed])

  function selectSlide(index: number) {
    if (ready.has(index) && !failed.has(index)) {
      setActive(index)
    }
  }

  return (
    <div
      ref={root}
      role="region"
      aria-label="Paisajes y hogares"
      aria-roledescription="carrusel"
      className="hero-gallery relative"
      data-active-slide={active}
      data-running={running}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false)
      }}
    >
      <span aria-hidden className="hero-photo-orbit" />
      <div className="hero-photo-frame relative overflow-hidden rounded-[1.75rem] bg-white shadow-elevated">
        <div className="hero-photo-parallax absolute -inset-y-[12%] inset-x-0">
          {SLIDES.map((slide, index) => (
            <div
              key={slide.src}
              aria-hidden={index !== active}
              className={cn('hero-photo-slide absolute inset-0', index === active && 'is-active')}
              data-running={running && index === active}
            >
              <div className="hero-photo-drift absolute inset-0">
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  priority={index === 0}
                  loading={index === 0 ? undefined : 'lazy'}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 50vw"
                  className="object-cover"
                  style={{ objectPosition: slide.position }}
                  onLoad={() => setReady((current) => new Set(current).add(index))}
                  onError={() => setFailed((current) => new Set(current).add(index))}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="hero-gallery-controls absolute inset-x-5 bottom-5 flex items-center justify-center">
          <div className="flex items-center gap-1 rounded-full bg-black/20 px-2 py-1 text-white backdrop-blur-md">
            {SLIDES.map((slide, index) => (
              <button
                key={slide.src}
                type="button"
                aria-label={'Ver imagen ' + (index + 1)}
                aria-pressed={index === active}
                disabled={!ready.has(index) || failed.has(index)}
                onClick={() => selectSlide(index)}
                className="group flex h-9 w-9 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-30"
              >
                <span
                  className={cn(
                    'h-2 w-2 rounded-full bg-white transition-[transform,opacity] duration-500',
                    index === active ? 'scale-125' : 'opacity-55 group-hover:opacity-100'
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
