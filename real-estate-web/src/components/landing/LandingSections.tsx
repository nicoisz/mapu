'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BrandLogo } from '@/components/layout/BrandLogo'
import {
  ArrowRight,
  Camera,
  ChevronDown,
  Handshake,
  LineChart,
  MapPinned,
  Star,
} from 'lucide-react'
import { reviewService, Review } from '@/services/reviewService'
import { cn } from '@/lib/utils'
import { LandingAccents } from './LandingAccents'

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
      className={cn(
        'relative z-10 space-y-4',
        align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-xl'
      )}
    >
      <span className="section-fade inline-flex items-center gap-2 rounded-full border border-outline-variant/60 bg-surface-container-lowest px-3 py-1 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
        <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
        {eyebrow}
      </span>
      <h2 className="section-title font-display text-4xl leading-[1.02] text-on-surface sm:text-5xl">
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
    <section className="reel-trigger landing-section relative isolate mx-auto max-w-[1440px] px-6 py-24 lg:px-20">
      <LandingAccents variant="contour" className="accent-reel" />
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
            className="map-launch-glow btn-shine inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 font-bold text-on-secondary shadow-elevated transition-transform hover:scale-105"
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
    <section className="hub-trigger landing-section relative isolate mx-auto max-w-[1440px] px-6 py-24 lg:px-20">
      <LandingAccents variant="orbit" className="accent-hub" />
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
            <BrandLogo />
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
    <section className="activity-trigger landing-section relative isolate mx-auto max-w-[1440px] px-6 py-24 lg:px-20">
      <LandingAccents variant="orbit" className="accent-activity" />
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

/* ─── Resultados concretos ─────────────────────────────────────── */

/* Condiciones del producto; no representan cifras de adopción. */
const STATS = [
  { value: '1 gratis', label: 'Propiedad para particulares' },
  { value: '14', label: 'Ciudades de Chile en el mapa' },
  { value: '0%', label: 'Comisión por venta o arriendo' },
]

/* Fotos dispersas en los bordes, como el collage de "Concrete Results" de
   Casavo. Solo en desktop: en móvil no hay ancho para que respiren. Cada una
   lleva su propio parallax (ver GSAP en la página). */
const RESULTS_IMGS = [
  { src: '/1.jpg', cls: 'left-0 top-40 w-52 -rotate-3' },
  { src: '/landing/country-sunset.webp', cls: 'right-0 top-36 w-60 rotate-2' },
  { src: '/3.jpg', cls: 'left-24 bottom-24 w-44 rotate-2' },
]

export function StatsBand() {
  return (
    <section className="results-trigger relative isolate mx-auto max-w-[1440px] overflow-hidden px-6 py-44 lg:px-20">
      <LandingAccents variant="contour" className="accent-results" />
      {RESULTS_IMGS.map((im) => (
        <div
          key={im.src}
          aria-hidden
          className={cn(
            'results-img pointer-events-none absolute hidden overflow-hidden rounded-2xl border border-outline-variant/30 shadow-elevated lg:block',
            im.cls
          )}
        >
          <Image
            src={im.src}
            alt=""
            width={420}
            height={320}
            sizes="260px"
            className="h-40 w-full object-cover"
          />
        </div>
      ))}

      <div className="section-title relative z-10 mx-auto max-w-2xl text-center">
        <h2 className="font-display text-4xl leading-[1.08] text-on-surface sm:text-5xl">
          <Words text="Un gran mapa empieza con tu propiedad" wordClass="section-word" />
        </h2>
        <p className="section-fade mx-auto mt-6 max-w-lg text-lg text-on-surface-variant">
          Queremos que miles de propiedades encuentren su lugar aquí. Comencemos con la tuya. Tu
          primera propiedad es gratis como particular; corredoras y quienes publican más de una
          propiedad cuentan con planes de pago.
        </p>
      </div>

      <div className="relative z-10 mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-3">
        {STATS.map((s) => (
          <div key={s.label} className="stat-item text-center">
            <p className="font-display text-4xl leading-none text-on-surface sm:text-5xl">
              {s.value}
            </p>
            <p className="mt-3 text-sm text-on-surface-variant">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ─── Por qué LUKY ─────────────────────────────────────────────── */

const WHY = [
  {
    icon: MapPinned,
    title: 'Todo el mercado en un mapa',
    desc: 'Busca, filtra y compara propiedades sin salir del mapa, comuna por comuna.',
  },
  {
    icon: LineChart,
    title: 'Precios por zona',
    desc: 'Zonas económica, media y premium calculadas con datos reales del mercado.',
  },
  {
    icon: Handshake,
    title: 'Contacto directo',
    desc: 'Escribe a quien publica, sin intermediarios ni comisiones escondidas.',
  },
  {
    icon: Camera,
    title: 'Avisos con fotos reales',
    desc: 'Galería, características y ubicación de cada propiedad en una ficha clara.',
  },
]

export function WhyLuky() {
  return (
    <section className="why-trigger landing-section relative isolate mx-auto max-w-[1440px] px-6 py-24 lg:px-20">
      <LandingAccents variant="route" className="accent-why" />
      <h2 className="section-title relative z-10 mx-auto max-w-3xl text-center font-display text-4xl leading-[1.08] text-on-surface sm:text-5xl">
        <Words text="Por qué LUKY" wordClass="section-word" />
      </h2>
      <div className="relative z-10 mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {WHY.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.title}
              className="why-card card-motion why-detail relative overflow-hidden flex min-h-[340px] flex-col rounded-2xl bg-surface-container p-7"
            >
              <span aria-hidden className="why-detail-orbit" />
              <span className="why-icon relative z-10">
                <Icon size={44} strokeWidth={1.25} className="text-on-surface" />
              </span>
              <div className="mt-24 space-y-3">
                <h3 className="font-display text-2xl leading-tight text-on-surface">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-on-surface-variant">{item.desc}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/* ─── Tarjetas CTA ─────────────────────────────────────────────── */

const CTA_CARDS = [
  {
    img: '/3.jpg',
    title: 'Publica tu propiedad',
    desc: 'Una propiedad gratis para particulares. Planes para corredoras y más propiedades.',
    cta: 'Publicar ahora',
    href: '/publicar',
  },
  {
    img: '/showcase/mapa.webp',
    title: 'Explora el mapa',
    desc: 'Mira precios por zona y encuentra tu próximo barrio.',
    cta: 'Abrir el mapa',
    href: '/mapa',
  },
  {
    img: '/1.jpg',
    title: 'Encuentra tu casa',
    desc: 'Filtra por comuna, precio y metros, y guarda tus favoritas.',
    cta: 'Buscar propiedades',
    href: '/buscar',
  },
]

export function CtaCards() {
  return (
    <section className="mx-auto max-w-[1440px] px-6 py-20 lg:px-20">
      <div className="grid gap-6 md:grid-cols-3">
        {CTA_CARDS.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="card-motion card-reveal group relative flex min-h-[440px] flex-col justify-end overflow-hidden rounded-[1.75rem]"
          >
            <Image
              src={card.img}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
            />
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent"
            />
            <div className="relative z-10 space-y-3 p-7 text-white">
              <h3 className="font-display text-2xl leading-tight sm:text-[1.75rem]">
                {card.title}
              </h3>
              <p className="text-sm text-white/80">{card.desc}</p>
              <span className="mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-on-secondary">
                {card.cta}
                <ArrowRight size={16} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

/* ─── Historias reales (reseñas) ───────────────────────────────── */

/** Solo reseñas reales y de 4+ estrellas. Si no hay, la sección no se
 *  dibuja: mejor ausente que con testimonios de relleno. */
export function Testimonials() {
  const [reviews, setReviews] = useState<Review[]>([])

  useEffect(() => {
    let active = true
    reviewService
      .listAll()
      .then((all) => {
        if (active) {
          setReviews(all.filter((r) => r.rating >= 4 && r.comment.trim().length > 0).slice(0, 3))
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  if (reviews.length === 0) return null

  return (
    <section className="mx-auto max-w-[1440px] px-6 py-24 lg:px-20">
      <SectionIntro
        eyebrow="Historias reales"
        title="Lo que dicen quienes ya usaron LUKY"
        sub="Experiencias de compradores, vendedores y corredoras en la plataforma."
      />
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {reviews.map((r) => (
          <figure
            key={r.id}
            className="card-motion flex h-full flex-col gap-6 rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-7"
          >
            <div className="flex gap-0.5" aria-label={`${r.rating} de 5 estrellas`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={i < r.rating ? 'fill-accent text-accent' : 'text-outline-variant'}
                />
              ))}
            </div>
            <blockquote className="flex-1 font-headline text-lg leading-snug text-on-surface">
              «{r.comment}»
            </blockquote>
            <figcaption className="flex items-center gap-3 border-t border-outline-variant/40 pt-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container text-sm font-bold text-accent">
                {(r.author_name ?? '?').charAt(0)}
              </span>
              <span className="text-sm">
                <b className="block text-on-surface">{r.author_name ?? 'Usuario LUKY'}</b>
                <span className="text-on-surface-variant">
                  {r.property_title ? `Sobre «${r.property_title}»` : 'En LUKY'}
                </span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

/* ─── Preguntas frecuentes ─────────────────────────────────────── */

export const FAQS = [
  {
    q: '¿Publicar una propiedad tiene costo?',
    a: 'Los particulares pueden publicar su primera propiedad gratis en LUKY. Las corredoras y quienes publican más de una propiedad necesitan un plan de pago. No cobramos comisión por la venta o el arriendo.',
  },
  {
    q: '¿Dónde puedo publicar mi propiedad gratis en Chile?',
    a: 'En LUKY PROPIEDADES. Los particulares publican su primera propiedad gratis y sin comisión por la venta o el arriendo. Puedes publicar sin iniciar sesión y luego gestionar visitas, favoritos y contactos desde tu panel.',
  },
  {
    q: '¿De dónde salen los precios por zona?',
    a: 'Se calculan con los valores de las propiedades publicadas en cada comuna y se pintan sobre el mapa en zonas económica, media y premium.',
  },
  {
    q: '¿Qué son las zonas económica, media y premium?',
    a: 'Son las tres categorías con las que LUKY pinta el mapa de precios de una comuna, según los valores de las propiedades publicadas en ella. Sirven para comparar barrios de un vistazo antes de decidir.',
  },
  {
    q: '¿Cómo contacto a quien publica?',
    a: 'Desde la ficha de la propiedad puedes escribirle directo o llamarlo. No hay intermediarios en el medio.',
  },
  {
    q: '¿Puedo publicar desde el celular?',
    a: 'Sí. LUKY funciona en el navegador del teléfono y también en la app, con la misma cuenta y tus favoritos sincronizados.',
  },
]

export function FaqAccordion() {
  const id = useId()
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})

  return (
    <section
      id="faq"
      className="landing-section relative isolate mx-auto max-w-[1440px] px-6 py-24 lg:px-20"
    >
      <LandingAccents variant="contour" className="accent-faq" />
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionIntro
          align="left"
          eyebrow="Preguntas frecuentes"
          title="Lo que suele preguntarse"
          sub="Y si queda algo, escríbenos: estamos para ayudarte con tu propiedad."
        />
        <div className="divide-y divide-outline-variant/50 border-y border-outline-variant/50">
          {FAQS.map((faq, index) => {
            const open = !!expanded[index]
            const panelId = id + '-answer-' + index
            return (
              <div key={faq.q} className="py-5">
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() =>
                    setExpanded((current) => ({ ...current, [index]: !current[index] }))
                  }
                  className="flex w-full items-center justify-between gap-4 rounded-sm text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                >
                  <span className="font-headline text-base font-semibold text-on-surface sm:text-lg">
                    {faq.q}
                  </span>
                  <ChevronDown
                    size={20}
                    className="faq-chevron shrink-0 text-on-surface-variant"
                    data-open={open}
                  />
                </button>
                <div
                  id={panelId}
                  className="faq-panel"
                  data-open={open}
                  aria-hidden={!open}
                  inert={!open}
                >
                  <div className="min-h-0 overflow-hidden">
                    <p className="pt-3 max-w-2xl leading-relaxed text-on-surface-variant">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}{' '}
        </div>
      </div>
    </section>
  )
}
