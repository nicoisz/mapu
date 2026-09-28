'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

/* Secciones de la landing. Solo markup y estado local: todas las entradas
   al hacer scroll las registra la página en un único gsap.context, por
   clase, para que un solo ctx.revert() limpie todo al desmontar. */

/** Titular partido en palabras para el reveal escalonado. Cada palabra va en
 *  un contenedor con overflow oculto: GSAP la sube desde abajo y el recorte
 *  hace que aparezca por detrás de una línea invisible. `wordClass` separa
 *  el hero (entra al cargar) de los títulos de sección (entran con scroll). */
export function Words({
  text,
  className,
  wordClass = 'hero-word',
}: {
  text: string
  className?: string
  wordClass?: string
}) {
  const words = text.split(' ')
  return (
    <span className={className}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom">
          <span className={cn(wordClass, 'inline-block')}>
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        </span>
      ))}
    </span>
  )
}

/** Eyebrow + título con reveal por palabra + bajada. Es el encabezado común
 *  de las secciones, para que todas entren igual. */
export function SectionIntro({
  eyebrow,
  title,
  sub,
  align = 'center',
}: {
  eyebrow: string
  title: string
  sub?: string
  align?: 'center' | 'left'
}) {
  return (
    <div
      className={cn('space-y-4', align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-xl')}
    >
      <span className="section-fade inline-flex items-center gap-2 rounded-full border border-outline-variant/50 bg-surface-container-low/70 px-3 py-1 text-xs font-semibold text-on-surface-variant">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        {eyebrow}
      </span>
      <h2 className="section-title font-headline text-3xl font-bold leading-tight tracking-tight text-on-surface sm:text-4xl">
        <Words text={title} wordClass="section-word" />
      </h2>
      {sub && <p className="section-fade text-on-surface-variant sm:text-lg">{sub}</p>}
    </div>
  )
}

/* ─── Reel de producto ─────────────────────────────────────────── */

/** Host real si está configurado; si no, la barra muestra solo la ruta.
 *  No se inventa un dominio que capaz no es el tuyo. */
const SITE_HOST = (() => {
  try {
    return process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL).host : ''
  } catch {
    return ''
  }
})()

/** Capturas reales de la app (ver public/showcase). `origin` es hacia dónde
 *  se acerca el Ken Burns: al centro del mapa, a la grilla, a la foto, a
 *  las métricas. */
const SLIDES = [
  {
    src: '/showcase/mapa.webp',
    label: 'Mapa de precios',
    path: '/buscar',
    origin: '45% 48%',
    alt: 'Mapa de Santiago con pines de precio por propiedad y leyenda de zonas económica, media y premium',
  },
  {
    src: '/showcase/lista.webp',
    label: 'Búsqueda',
    path: '/buscar',
    origin: '72% 30%',
    alt: 'Búsqueda en modo lista: grilla de propiedades con foto, precio y características junto al mapa',
  },
  {
    src: '/showcase/ficha.webp',
    label: 'Ficha',
    path: '/propiedad',
    origin: '50% 32%',
    alt: 'Ficha de una casa en Las Condes con galería, precio, características y contacto del agente',
  },
  {
    src: '/showcase/panel.webp',
    label: 'Panel del vendedor',
    path: '/dashboard',
    origin: '62% 24%',
    alt: 'Panel del vendedor con propiedades activas, visitas, contactos y gráfico de los últimos 30 días',
  },
]
const SLIDE_MS = 5200

/** Chips satélite alrededor del marco. Los datos repiten lo que se ve en las
 *  capturas, para que la historia cierre. */
const REEL_CHIPS = [
  { pos: 'left-[-3rem] top-[12%]', icon: 'hexagon', text: 'Zona premium · $220M–$450M' },
  { pos: 'right-[-3.5rem] top-[34%]', icon: 'favorite', text: '28 favoritos' },
  { pos: 'left-[-2rem] top-[56%]', icon: 'chat', text: '12 mensajes nuevos' },
]

export function ProductReel() {
  const [active, setActive] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Cuatro capturas a pantalla completa animándose fuera de pantalla es
  // trabajo tirado: fuera de vista el reel se pausa.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const paused = hovered || !inView
  const slide = SLIDES[active]

  return (
    <section className="reel-trigger mx-auto max-w-[1440px] px-6 py-24 lg:px-20">
      <SectionIntro
        eyebrow="Producto"
        title="Todo el mercado en una pantalla"
        sub="Busca sobre el mapa, compara por zona y publica, sin saltar entre portales."
      />

      <div ref={ref} className="relative mx-auto mt-14 max-w-5xl" style={{ perspective: 1600 }}>
        {REEL_CHIPS.map((chip) => (
          <div
            key={chip.text}
            aria-hidden
            className={cn('pointer-events-none absolute z-20 hidden lg:block', chip.pos)}
          >
            <div className="reel-chip">
              <div className="chip-float">
                <span className="solid-chrome flex items-center gap-2 whitespace-nowrap rounded-2xl border border-outline-variant/40 px-4 py-2.5 text-sm font-semibold text-on-surface">
                  <span className="material-symbols-outlined text-[18px] text-primary">
                    {chip.icon}
                  </span>
                  {chip.text}
                </span>
              </div>
            </div>
          </div>
        ))}

        <div
          className="reel reel-frame overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-low shadow-elevated"
          data-paused={paused}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocusCapture={() => setHovered(true)}
          onBlurCapture={() => setHovered(false)}
        >
          {/* Barra de navegador: da el contexto de "esto es la app". */}
          <div className="flex h-11 items-center gap-2 border-b border-outline-variant/40 px-4">
            <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
            <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
            <span className="h-3 w-3 rounded-full bg-[#28C840]" />
            <span className="mx-auto flex min-w-0 items-center gap-1.5 rounded-full bg-surface-container px-4 py-1 text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              <span className="truncate">
                {SITE_HOST}
                {slide.path}
              </span>
            </span>
            <span className="w-[52px]" />
          </div>

          <div className="relative aspect-[16/10] overflow-hidden bg-surface-container-lowest">
            {SLIDES.map((s, i) => (
              <Image
                key={s.src}
                src={s.src}
                alt={s.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 1024px"
                aria-hidden={i !== active}
                className={cn(
                  'reel-slide object-cover object-top',
                  i === active ? 'opacity-100' : 'opacity-0'
                )}
                style={{ transformOrigin: s.origin, animationDelay: `${-i * 2.7}s` }}
              />
            ))}
          </div>
        </div>

        {/* Pestañas con barra de progreso: es lo que hace que se lea como
            video. Cuando la barra termina, pasa a la siguiente vista. */}
        <div
          role="tablist"
          aria-label="Vistas de la app"
          className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {SLIDES.map((s, i) => (
            <button
              key={s.src}
              role="tab"
              aria-selected={i === active}
              onClick={() => setActive(i)}
              className={cn(
                'reel-tab rounded-xl border px-4 py-3 text-left transition-colors',
                i === active
                  ? 'border-primary/40 bg-primary/10 text-on-surface'
                  : 'border-outline-variant/40 text-on-surface-variant hover:bg-surface-container'
              )}
            >
              <span className="block text-sm font-semibold">{s.label}</span>
              <span className="mt-2.5 block h-1 overflow-hidden rounded-full bg-outline-variant/40">
                {i === active && (
                  <span
                    key={active}
                    className="reel-progress block h-full rounded-full bg-primary"
                    style={{ '--reel-ms': `${SLIDE_MS}ms` } as React.CSSProperties}
                    data-paused={paused}
                    onAnimationEnd={() => setActive((n) => (n + 1) % SLIDES.length)}
                  />
                )}
              </span>
            </button>
          ))}
        </div>

        <div className="section-fade mt-10 flex justify-center">
          <Link
            href="/mapa"
            className="btn-shine inline-flex items-center gap-3 rounded-full bg-primary px-8 py-4 font-bold text-on-primary shadow-elevated transition-transform hover:scale-105"
          >
            <span className="material-symbols-outlined">explore</span>
            Abrir el mapa interactivo
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ─── Hub de funciones ─────────────────────────────────────────── */

/** Solo funciones que existen hoy en la app. */
const HUB_FEATURES = [
  { icon: 'map', label: 'Mapa interactivo' },
  { icon: 'hexagon', label: 'Zonas de precio' },
  { icon: 'favorite', label: 'Favoritos' },
  { icon: 'chat', label: 'Mensajes' },
  { icon: 'star', label: 'Reseñas' },
  { icon: 'monitoring', label: 'Métricas' },
  { icon: 'groups', label: 'Corredoras' },
  { icon: 'currency_exchange', label: 'UF y dólar' },
]

/** Posiciones sobre una elipse alrededor del centro, arrancando arriba. La
 *  elipse es más ancha que alta porque los chips son más anchos que altos. */
const HUB_POINTS = HUB_FEATURES.map((_, i) => {
  const a = (-90 + i * (360 / HUB_FEATURES.length)) * (Math.PI / 180)
  return { x: +(50 + 40 * Math.cos(a)).toFixed(2), y: +(50 + 36 * Math.sin(a)).toFixed(2) }
})

export function FeatureHub() {
  return (
    <section className="hub-trigger mx-auto max-w-[1440px] px-6 py-24 lg:px-20">
      <SectionIntro
        eyebrow="Plataforma"
        title="Todo lo que necesitas, en un solo lugar"
        sub="Buscar, comparar, contactar y publicar pasa por la misma app."
      />

      <div className="hub relative mx-auto mt-14 flex max-w-[680px] flex-wrap justify-center gap-3 md:block md:aspect-square">
        <svg
          aria-hidden
          viewBox="0 0 100 100"
          className="hub-lines pointer-events-none absolute inset-0 h-full w-full"
        >
          {HUB_POINTS.map((p, i) => (
            <line
              key={i}
              className="hub-line stroke-primary/35"
              x1="50"
              y1="50"
              x2={p.x}
              y2={p.y}
              strokeWidth="0.25"
              pathLength={1}
              style={{ strokeDasharray: 1 }}
            />
          ))}
          {/* Un punto que viaja por cada línea, del centro hacia afuera. */}
          {HUB_POINTS.map((p, i) => (
            <circle key={i} className="hub-pulse fill-primary" r="0.7">
              <animateMotion
                dur="3.2s"
                begin={`${i * 0.4}s`}
                repeatCount="indefinite"
                path={`M50 50 L${p.x} ${p.y}`}
              />
            </circle>
          ))}
        </svg>

        <div
          className="hub-slot w-full md:w-auto"
          style={{ '--x': '50%', '--y': '50%' } as React.CSSProperties}
        >
          <div className="hub-center solid-chrome mx-auto flex w-fit items-center gap-3 rounded-3xl border border-outline-variant/40 px-7 py-5 shadow-elevated">
            <span className="material-symbols-outlined text-3xl text-primary">map</span>
            <span className="font-headline text-2xl font-bold text-on-surface">MapU</span>
          </div>
        </div>

        {HUB_FEATURES.map((f, i) => (
          <div
            key={f.label}
            className="hub-slot"
            style={
              { '--x': `${HUB_POINTS[i].x}%`, '--y': `${HUB_POINTS[i].y}%` } as React.CSSProperties
            }
          >
            <div className="hub-chip">
              <div className="chip-float" style={{ animationDelay: `${-i * 0.75}s` }}>
                <span className="flex items-center gap-2 whitespace-nowrap rounded-full border border-outline-variant/40 bg-surface-container-low px-4 py-2 text-sm font-semibold text-on-surface shadow-soft">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <span className="material-symbols-outlined text-[16px]">{f.icon}</span>
                  </span>
                  {f.label}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ─── Actividad del vendedor ───────────────────────────────────── */

/** Mismos dos tipos que tiene la app: `like` (anónimo, porque favorites es
 *  privado) y `message` (con nombre). No hay push: el feed se ve al entrar a
 *  Notificaciones, y la maqueta es esa pantalla, no un lock screen. */
const ACTIVITY = [
  {
    kind: 'message',
    who: 'Martina Soto',
    title: 'Casa moderna en Las Condes',
    body: 'Hola, ¿se puede visitar el sábado en la mañana?',
    when: 'hace 2 min',
    isNew: true,
  },
  {
    kind: 'like',
    who: null,
    title: 'Departamento en Providencia',
    body: null,
    when: 'hace 18 min',
    isNew: true,
  },
  {
    kind: 'message',
    who: 'Diego Paredes',
    title: 'Casa familiar en Ñuñoa',
    body: '¿Acepta crédito hipotecario?',
    when: 'hace 1 h',
    isNew: true,
  },
  {
    kind: 'like',
    who: null,
    title: 'Casa moderna en Las Condes',
    body: null,
    when: 'hace 3 h',
    isNew: false,
  },
] as const

const SELLER_POINTS = [
  'Mensajes de interesados, con su nombre',
  'Cada favorito que suma tu publicación',
  'Visitas de los últimos 30 días en tu panel',
  'Renuevas en un clic cuando vence',
]

export function ActivityFeed() {
  return (
    <section className="activity-trigger mx-auto max-w-[1440px] px-6 py-24 lg:px-20">
      <div className="grid items-center gap-16 lg:grid-cols-2">
        <div className="space-y-8">
          <SectionIntro
            align="left"
            eyebrow="Para vendedores"
            title="Sabes quién se interesa por tu propiedad"
            sub="Mensajes, favoritos y visitas de cada publicación, reunidos en tu panel."
          />
          <ul className="space-y-3">
            {SELLER_POINTS.map((point) => (
              <li key={point} className="activity-check flex items-center gap-3 text-on-surface">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Teléfono con la pantalla de Notificaciones de la app. */}
        <div className="relative mx-auto">
          <span
            aria-hidden
            className="orb"
            style={{
              top: '12%',
              left: '-30%',
              width: 360,
              height: 360,
              background: 'rgb(var(--primary) / 0.22)',
            }}
          />
          <div
            role="img"
            aria-label="Pantalla de notificaciones con mensajes y favoritos de tus publicaciones"
            className="activity-phone relative w-[300px] overflow-hidden rounded-[2.75rem] border-[10px] border-surface-container-highest bg-background shadow-elevated sm:w-[320px]"
          >
            <div className="flex items-center justify-between px-6 pt-3 text-[11px] font-semibold text-on-surface">
              <span>9:41</span>
              <span className="h-5 w-20 rounded-full bg-surface-container-highest" />
              <span className="material-symbols-outlined text-[14px]">signal_cellular_alt</span>
            </div>
            <div className="flex items-center justify-between px-5 pb-3 pt-5">
              <span className="font-headline text-lg font-bold text-on-surface">Actividad</span>
              <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                3 nuevas
              </span>
            </div>
            <ul className="space-y-2.5 px-3 pb-8">
              {ACTIVITY.map((a, i) => (
                <li
                  key={i}
                  className="activity-item flex gap-3 rounded-2xl border border-outline-variant/40 bg-surface-container-low p-3"
                >
                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                      a.kind === 'message' ? 'bg-primary/15 text-primary' : 'bg-error/15 text-error'
                    )}
                  >
                    <span
                      className="material-symbols-outlined text-[18px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {a.kind === 'message' ? 'chat' : 'favorite'}
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] leading-snug text-on-surface">
                      {a.kind === 'message' ? (
                        <>
                          <b>{a.who}</b> escribió por <b>{a.title}</b>
                        </>
                      ) : (
                        <>
                          A alguien le gustó <b>{a.title}</b>
                        </>
                      )}
                    </p>
                    {a.body && (
                      <p className="mt-1.5 rounded-xl bg-surface-container px-3 py-2 text-[12px] text-on-surface-variant">
                        {a.body}
                      </p>
                    )}
                    <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-on-surface-variant">
                      {a.isNew && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                      {a.when}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
