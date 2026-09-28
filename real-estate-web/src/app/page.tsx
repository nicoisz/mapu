'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { propertyService } from '@/services/propertyService'
import { formatPriceShort } from '@/lib/utils'
import { PropertyOperation } from '@/types/enums'
import { Property } from '@/types/property'
import { useFavoritesContext } from '@/contexts/FavoritesContext'
import { cn } from '@/lib/utils'
import {
  ActivityFeed,
  FeatureHub,
  ProductReel,
  SectionIntro,
  Words,
} from '@/components/landing/LandingSections'

/** Lo que la gente quiere dejar de hacer. Rota bajo el titular. */
const PAIN_POINTS = [
  'recorrer comunas a ciegas',
  'llamar por precios que no están publicados',
  'conocer el barrio después de firmar',
  'comparar fichas en diez pestañas',
]

const COMUNAS = [
  'Las Condes',
  'Providencia',
  'Ñuñoa',
  'Vitacura',
  'La Reina',
  'Lo Barnechea',
  'Viña del Mar',
  'Concón',
  'Concepción',
  'Valdivia',
  'Puerto Varas',
  'La Serena',
  'Antofagasta',
  'Temuco',
]

const STEPS = [
  {
    num: '01',
    title: 'Busca sobre el mapa',
    desc: 'Filtra por comuna, precio y metros sin salir del mapa. Las zonas de precio se pintan solas.',
  },
  {
    num: '02',
    title: 'Agenda online',
    desc: 'Reserva visitas presenciales o tours virtuales con un clic, directo con quien publica.',
  },
  {
    num: '03',
    title: 'Cierra el trato',
    desc: 'Gestión digital de contratos y documentos, con respaldo legal de punta a punta.',
  },
]

/** Orbes del fondo del hero. Tres, puestos a mano: dan profundidad sin
 *  leerse como ruido. El color sale de las variables del tema. */
const ORBS = [
  { top: '-8%', left: '-6%', size: 380, tint: 'var(--orb-1)', delay: '0s' },
  { top: '38%', right: '-10%', size: 460, tint: 'var(--orb-2)', delay: '-5s' },
  { bottom: '-18%', left: '30%', size: 340, tint: 'var(--orb-3)', delay: '-9s' },
]

function RotatingPain() {
  const [i, setI] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setI((n) => (n + 1) % PAIN_POINTS.length), 2800)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      {/* El lector de pantalla recibe la lista completa una vez. El rotador
          queda oculto: anunciar un cambio de texto cada 2,8 s es ruido. */}
      <span className="sr-only">{PAIN_POINTS.join(', ')}.</span>
      <span aria-hidden className="inline-block align-bottom">
        <span key={i} className="word-in inline-block font-semibold text-primary">
          {PAIN_POINTS[i]}
        </span>
      </span>
    </>
  )
}

function FavBtn({ property }: { property: Property }) {
  const { isFavorite, toggle } = useFavoritesContext()
  const fav = isFavorite(property.id)

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle(property)
      }}
      className={cn(
        'absolute top-4 right-4 p-2 bg-surface-container-lowest/50 rounded-full transition-colors',
        fav ? 'text-error' : 'text-on-surface hover:text-error'
      )}
      aria-label={fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontVariationSettings: fav ? "'FILL' 1" : "'FILL' 0" }}
      >
        favorite
      </span>
    </button>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const [searchValue, setSearchValue] = useState('')
  const [propertyType, setPropertyType] = useState('')
  const [featured, setFeatured] = useState<Property[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    propertyService
      .getFeatured(3)
      .then((props) => {
        if (active) setFeatured(props)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const parts = [searchValue.trim(), propertyType].filter(Boolean)
    router.push(parts.length ? `/buscar?q=${encodeURIComponent(parts.join(' '))}` : '/buscar')
  }

  useEffect(() => {
    let ctx: { revert: () => void } | undefined
    let cancelled = false

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    Promise.all([
      import('gsap').then((m) => m.default ?? m.gsap),
      import('gsap/ScrollTrigger').then((m) => m.ScrollTrigger),
    ]).then(([gsap, ScrollTrigger]) => {
      const scroller = scrollRef.current
      if (cancelled || !scroller) return
      gsap.registerPlugin(ScrollTrigger)
      ScrollTrigger.defaults({ scroller })

      // gsap.context scopes every tween/trigger to this component. ctx.revert()
      // on unmount strips ALL the inline styles GSAP applied, so returning to
      // the landing never leaves text stuck at low opacity.
      ctx = gsap.context(() => {
        gsap
          .timeline()
          .from('.hero-word', { yPercent: 115, duration: 0.9, stagger: 0.06, ease: 'power3.out' })
          .from(
            '.hero-reveal',
            { y: 24, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' },
            0.25
          )

        gsap.from('.property-card', {
          scrollTrigger: { trigger: '.property-grid-trigger', start: 'top 75%' },
          y: 48,
          opacity: 0,
          duration: 0.9,
          stagger: 0.12,
          ease: 'power3.out',
        })

        // Títulos de sección: mismo reveal por palabra que el hero, pero
        // disparado al entrar en pantalla en vez de al cargar.
        gsap.utils.toArray<HTMLElement>('.section-title').forEach((title) => {
          gsap.from(title.querySelectorAll('.section-word'), {
            yPercent: 115,
            duration: 0.8,
            stagger: 0.05,
            ease: 'power3.out',
            scrollTrigger: { trigger: title, start: 'top 86%' },
          })
        })
        gsap.utils.toArray<HTMLElement>('.section-fade').forEach((el) => {
          gsap.from(el, {
            y: 18,
            opacity: 0,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 90%' },
          })
        })

        // Reel: la ventana de la app se inclina hacia atrás y cae en su
        // lugar, el gesto típico de una landing de producto.
        gsap.from('.reel-frame', {
          scrollTrigger: { trigger: '.reel-frame', start: 'top 85%' },
          rotateX: 16,
          y: 70,
          scale: 0.93,
          opacity: 0,
          transformOrigin: 'center top',
          duration: 1.3,
          ease: 'power3.out',
        })
        gsap.from('.reel-tab', {
          scrollTrigger: { trigger: '.reel-frame', start: 'top 70%' },
          y: 16,
          opacity: 0,
          duration: 0.6,
          stagger: 0.08,
          delay: 0.4,
          ease: 'power3.out',
        })
        // Chips satélite con parallax a distintas velocidades: la diferencia
        // de velocidad entre capas es lo que da profundidad.
        gsap.utils.toArray<HTMLElement>('.reel-chip').forEach((chip, i) => {
          gsap.to(chip, {
            y: [-45, -20, -65][i % 3],
            ease: 'none',
            scrollTrigger: {
              trigger: '.reel-trigger',
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          })
        })

        // Hub: aparece el centro, las líneas se dibujan hacia afuera y los
        // chips saltan al final de cada una.
        const hubTl = gsap.timeline({
          scrollTrigger: { trigger: '.hub', start: 'top 72%' },
        })
        hubTl
          .from('.hub-center', { scale: 0.8, opacity: 0, duration: 0.7, ease: 'back.out(1.6)' })
          .fromTo(
            '.hub-line',
            { strokeDashoffset: 1 },
            { strokeDashoffset: 0, duration: 0.9, stagger: 0.05, ease: 'power2.out' },
            0.2
          )
          .from(
            '.hub-chip',
            { scale: 0.6, opacity: 0, duration: 0.55, stagger: 0.06, ease: 'back.out(1.8)' },
            0.45
          )

        // Actividad: el teléfono entra y los avisos van apareciendo de a uno,
        // como llegan en la app.
        const actTl = gsap.timeline({
          scrollTrigger: { trigger: '.activity-phone', start: 'top 78%' },
        })
        actTl
          .from('.activity-phone', {
            y: 60,
            rotate: -3,
            opacity: 0,
            duration: 1,
            ease: 'power3.out',
          })
          .from(
            '.activity-item',
            { y: 22, opacity: 0, scale: 0.96, duration: 0.5, stagger: 0.4, ease: 'power2.out' },
            0.55
          )
        gsap.from('.activity-check', {
          scrollTrigger: { trigger: '.activity-trigger', start: 'top 70%' },
          x: -16,
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out',
        })

        // La línea de "cómo funciona" se dibuja de izquierda a derecha y las
        // tarjetas entran detrás de ella.
        gsap.from('.how-line', {
          scrollTrigger: { trigger: '.how-trigger', start: 'top 72%' },
          scaleX: 0,
          transformOrigin: 'left center',
          duration: 1.1,
          ease: 'power2.inOut',
        })
        gsap.from('.step-card', {
          scrollTrigger: { trigger: '.how-trigger', start: 'top 72%' },
          y: 36,
          opacity: 0,
          duration: 0.8,
          stagger: 0.18,
          ease: 'power3.out',
        })

        gsap.from('.cta-card', {
          scrollTrigger: { trigger: '.cta-trigger', start: 'top 88%' },
          y: 56,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out',
        })
      }, scroller)

      // Recalculate trigger positions once everything is laid out — fixes
      // sections staying hidden when arriving via client-side navigation.
      ScrollTrigger.refresh()
    })

    return () => {
      cancelled = true
      ctx?.revert()
    }
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      window.dispatchEvent(new CustomEvent('mapu:scroll', { detail: { y: el.scrollTop } }))
    }
    // Un solo listener para el halo de todas las tarjetas `.spotlight`, en
    // vez de uno por tarjeta: la posición se escribe en la que está bajo el
    // cursor y el CSS hace el resto.
    const onMove = (e: PointerEvent) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>('.spotlight')
      if (!card) return
      const r = card.getBoundingClientRect()
      card.style.setProperty('--mx', `${e.clientX - r.left}px`)
      card.style.setProperty('--my', `${e.clientY - r.top}px`)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    el.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      el.removeEventListener('pointermove', onMove)
    }
  }, [])

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto selection:bg-primary selection:text-on-primary"
    >
      {/* ─── HERO ─────────────────────────────────────────── */}
      <section
        className="hero-grid relative -mt-16 flex min-h-[94vh] items-center justify-center overflow-hidden px-6 pt-32 pb-20"
        style={
          {
            '--orb-1': 'rgb(var(--primary) / 0.30)',
            '--orb-2': 'rgb(var(--accent) / 0.24)',
            '--orb-3': 'rgb(var(--secondary) / 0.20)',
          } as React.CSSProperties
        }
      >
        {ORBS.map((orb, i) => (
          <span
            key={i}
            aria-hidden
            className="orb"
            style={{
              top: orb.top,
              left: orb.left,
              right: orb.right,
              bottom: orb.bottom,
              width: orb.size,
              height: orb.size,
              background: orb.tint,
              animationDelay: orb.delay,
            }}
          />
        ))}

        <div className="relative z-10 mx-auto grid w-full max-w-[1440px] items-center gap-14 lg:grid-cols-2 lg:px-14">
          <div>
            <span className="hero-reveal inline-flex items-center gap-2 rounded-full border border-outline-variant/50 bg-surface-container-low px-3.5 py-1.5 text-xs font-semibold text-on-surface-variant">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              Venta y arriendo, de Antofagasta a Puerto Varas
            </span>

            <h1 className="mt-7 font-headline text-[2.75rem] font-extrabold leading-[0.95] tracking-tight text-on-surface sm:text-6xl lg:text-5xl xl:text-6xl">
              <Words text="Encuentra tu lugar" className="block" />
              <Words text="en el mapa de Chile" className="mt-1 block text-primary" />
            </h1>

            <p className="hero-reveal mt-7 max-w-xl text-base text-on-surface-variant sm:text-lg">
              Sin <RotatingPain />
            </p>

            {/* El buscador se queda en el hero: es la acción principal. */}
            <form
              onSubmit={handleSearch}
              className="hero-reveal solid-chrome mt-9 flex w-full max-w-2xl flex-col items-stretch gap-2 rounded-2xl border border-outline-variant/40 p-2 sm:flex-row sm:items-center sm:rounded-full"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3 pl-4">
                <span className="material-symbols-outlined select-none text-on-surface-variant">
                  search
                </span>
                <label htmlFor="hero-q" className="sr-only">
                  Ciudad, barrio o región
                </label>
                <input
                  id="hero-q"
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Ciudad, barrio o región..."
                  className="w-full bg-transparent py-3 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none"
                />
              </div>
              <div className="hidden h-7 w-px shrink-0 bg-outline-variant/60 sm:block" />
              <label htmlFor="hero-type" className="sr-only">
                Tipo de propiedad
              </label>
              <select
                id="hero-type"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="cursor-pointer bg-transparent px-4 py-3 text-sm text-on-surface focus:outline-none sm:w-44"
              >
                <option value="">Tipo de propiedad</option>
                <option value="casa">Casa</option>
                <option value="departamento">Departamento</option>
                <option value="terreno">Terreno</option>
                <option value="oficina">Oficina</option>
              </select>
              <button
                type="submit"
                className="btn-shine shrink-0 rounded-xl bg-primary px-8 py-3 text-sm font-bold text-on-primary transition-all hover:scale-[0.98] hover:brightness-110 sm:rounded-full"
              >
                Buscar
              </button>
            </form>

            <div className="hero-reveal mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-on-surface-variant">
              {[
                'Publicar es gratis',
                'Precios por zona calculados del mercado',
                'Sin comisión',
              ].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-accent">
                    check_circle
                  </span>
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Captura real del mapa: el producto se explica solo. */}
          <div className="hero-reveal relative hidden overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-low shadow-elevated lg:block">
            <Image
              src="/showcase/mapa.webp"
              alt="Mapa de Santiago con pines de precio por propiedad y zonas económica, media y premium"
              width={1600}
              height={1000}
              priority
              sizes="(max-width: 1024px) 0px, 55vw"
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>

      {/* ─── MARQUEE DE COMUNAS ───────────────────────────── */}
      <section
        aria-label="Comunas con propiedades publicadas"
        className="marquee-mask overflow-hidden border-y border-outline-variant/30 bg-surface-container-low/40 py-5"
      >
        <div className="marquee-track">
          {/* La lista va dos veces para que el loop no salte al reiniciar.
              La copia es decorativa y se esconde del lector de pantalla. */}
          {[0, 1].map((copy) => (
            <div key={copy} aria-hidden={copy === 1} className="flex shrink-0 gap-10 pr-10">
              {COMUNAS.map((comuna) => (
                <span
                  key={comuna}
                  className="flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-[16px] text-outline">
                    location_on
                  </span>
                  {comuna}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ─── REEL DE PRODUCTO ─────────────────────────────── */}
      <ProductReel />

      {/* ─── HUB DE FUNCIONES ─────────────────────────────── */}
      <FeatureHub />

      {/* ─── DESTACADAS ───────────────────────────────────── */}
      <section className="property-grid-trigger mx-auto max-w-[1440px] px-6 py-16 lg:px-20">
        <div className="mb-10 flex items-end justify-between gap-6">
          <SectionIntro
            align="left"
            eyebrow="Destacadas"
            title="Propiedades destacadas"
            sub="Las mejores oportunidades del mercado inmobiliario chileno."
          />
          <Link
            href="/buscar"
            className="ml-4 flex shrink-0 items-center gap-2 font-bold text-primary hover:underline"
          >
            Ver todas <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((property) => {
            const mainImg = property.media.images.find((i) => i.isMain) ?? property.media.images[0]
            const price =
              property.operation === PropertyOperation.RENT
                ? (property.pricing.monthlyRent ?? property.pricing.price)
                : property.pricing.price
            const displayPrice = formatPriceShort(price, property.pricing.currency)
            const isRent = property.operation === PropertyOperation.RENT

            return (
              <Link key={property.id} href={`/propiedad/${property.id}`} className="group block">
                <div className="property-card spotlight accent-glow h-full overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-low transition-all duration-300 group-hover:-translate-y-1.5">
                  <div className="relative h-60 overflow-hidden">
                    {mainImg && (
                      <Image
                        src={mainImg.url}
                        alt={property.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    )}
                    <FavBtn property={property} />
                  </div>

                  <div className="space-y-4 p-6">
                    <div className="space-y-2">
                      <p className="font-headline text-2xl font-bold tracking-tight text-on-surface">
                        {displayPrice}
                        {isRent && (
                          <span className="text-base font-normal text-on-surface-variant">
                            /mes
                          </span>
                        )}
                      </p>
                      <h3 className="truncate font-headline text-lg font-semibold text-on-surface">
                        {property.title}
                      </h3>
                      <p className="flex items-center gap-1 text-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-base">location_on</span>
                        {property.location.address.commune ?? property.location.address.city},{' '}
                        {property.location.address.region}
                      </p>
                    </div>

                    <div className="flex justify-between border-t border-outline-variant/30 pt-4 text-on-surface-variant">
                      {property.features.bedrooms !== undefined && (
                        <span className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-outline">bed</span>
                          {property.features.bedrooms}
                        </span>
                      )}
                      {property.features.bathrooms !== undefined && (
                        <span className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-outline">bathtub</span>
                          {property.features.bathrooms}
                        </span>
                      )}
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-outline">straighten</span>
                        {property.features.area} m²
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ─── CÓMO FUNCIONA ────────────────────────────────── */}
      <section className="how-trigger mx-auto max-w-[1440px] px-6 py-20 lg:px-20">
        <div className="mb-16">
          <SectionIntro
            eyebrow="Cómo funciona"
            title="Tu camino a casa es simple"
            sub="MapU redefine la experiencia de búsqueda con tecnología avanzada."
          />
        </div>

        <div className="relative">
          {/* Línea que une los tres pasos, se dibuja al entrar en pantalla.
              Solo en desktop, que es donde los pasos van en fila. */}
          <span
            aria-hidden
            className="how-line absolute inset-x-[16.6%] top-10 hidden h-px bg-outline-variant/60 md:block"
          />
          <div className="relative grid grid-cols-1 gap-12 md:grid-cols-3">
            {STEPS.map((step) => (
              <div
                key={step.num}
                className="step-card spotlight group space-y-4 rounded-2xl border border-outline-variant/40 bg-surface-container-low p-8 text-center"
              >
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-outline-variant/40 bg-surface-container-high transition-colors duration-500 group-hover:bg-primary">
                  <span className="font-headline text-2xl font-bold text-primary transition-colors duration-500 group-hover:text-on-primary">
                    {step.num}
                  </span>
                </div>
                <h3 className="font-headline text-xl font-semibold text-on-surface">
                  {step.title}
                </h3>
                <p className="leading-relaxed text-on-surface-variant">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ACTIVIDAD DEL VENDEDOR ───────────────────────── */}
      <ActivityFeed />

      {/* ─── CTA ──────────────────────────────────────────── */}
      <section className="cta-trigger mx-auto max-w-[1440px] px-6 py-16 lg:px-20">
        <div className="cta-card grad-a relative overflow-hidden rounded-3xl p-10 md:p-14">
          <span
            aria-hidden
            className="orb"
            style={{
              top: '-34%',
              right: '-6%',
              width: 320,
              height: 320,
              background: 'rgb(255 255 255 / 0.25)',
            }}
          />
          <div className="relative z-10 flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="max-w-2xl space-y-4 text-center md:text-left">
              <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl">
                ¿Tienes una propiedad para publicar?
              </h2>
              <p className="text-lg leading-relaxed opacity-80">
                Publicar es gratis. Los mensajes y favoritos de cada aviso llegan a tu panel.
              </p>
            </div>
            <Link
              href="/publicar"
              className="btn-shine shrink-0 rounded-xl bg-surface-container-lowest px-10 py-4 text-lg font-bold text-on-surface shadow-elevated transition-all hover:scale-105 md:px-12 md:py-5"
            >
              Publicar ahora
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────── */}
      <footer className="border-t border-outline-variant/20 bg-surface-container-lowest pb-20 md:pb-0">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-8 px-6 py-12 md:flex-row lg:px-20">
          <div className="flex flex-col items-center gap-3 md:items-start">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">map</span>
              <span className="font-headline text-lg font-bold text-primary">MapU Real Estate</span>
            </div>
            <p className="text-center text-sm text-on-surface-variant md:text-left">
              © 2026 MapU Real Estate Chile - Todos los derechos reservados
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 md:gap-8">
            {['Privacidad', 'Términos', 'Contacto', 'Mapa del Sitio'].map((link) => (
              <a
                key={link}
                href="#"
                className="text-sm text-on-surface-variant underline transition-all hover:text-primary"
              >
                {link}
              </a>
            ))}
          </div>

          <div className="flex gap-4">
            <a
              href="#"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-highest text-on-surface transition-colors hover:bg-primary hover:text-on-primary"
            >
              <span className="material-symbols-outlined">share</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
