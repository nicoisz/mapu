'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BrandLogo } from '@/components/layout/BrandLogo'
import { HeroGallery } from '@/components/landing/HeroGallery'
import { LandingAccents } from '@/components/landing/LandingAccents'
import { useRouter } from 'next/navigation'
import { propertyService } from '@/services/propertyService'
import { formatPriceShort } from '@/lib/utils'
import { PropertyOperation } from '@/types/enums'
import { Property } from '@/types/property'
import { useFavoritesContext } from '@/contexts/FavoritesContext'
import { cn } from '@/lib/utils'
import { landingSearchUrl } from '@/lib/landingSearch'
import {
  ActivityFeed,
  CtaCards,
  FaqAccordion,
  ProductReel,
  SectionIntro,
  StatsBand,
  Testimonials,
  WhyMapu,
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

/** Search tabs select an explicit operation filter or start a publication. */
const HERO_TABS = [
  { id: 'sale', label: 'Comprar' },
  { id: 'rent', label: 'Arrendar' },
  { id: 'publish', label: 'Publicar' },
] as const
type HeroTab = (typeof HERO_TABS)[number]['id']

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
        <span
          key={i}
          className="word-in inline-block font-semibold underline decoration-2 underline-offset-4"
        >
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
        'absolute top-4 right-4 p-2 bg-surface-container-lowest/60 rounded-full transition-colors',
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
  const [tab, setTab] = useState<HeroTab>('sale')
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
    if (tab === 'publish') {
      router.push('/publicar')
      return
    }
    router.push(landingSearchUrl(tab, searchValue, propertyType))
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

        if (scroller.querySelector('.property-card'))
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
          const words = title.querySelectorAll('.section-word')
          if (words.length === 0) return
          gsap.from(words, {
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

        gsap.to('.hero-photo-parallax', {
          yPercent: 8,
          ease: 'none',
          scrollTrigger: {
            trigger: '[data-hero]',
            start: 'top top',
            end: 'bottom top',
            scrub: 1.2,
          },
        })

        gsap.utils.toArray<HTMLElement>('.landing-accents').forEach((accent, index) => {
          const section = accent.closest('section')
          gsap.fromTo(
            accent.querySelectorAll('.ambient-drawing'),
            { strokeDashoffset: 1 },
            {
              strokeDashoffset: 0,
              duration: 1.8,
              stagger: 0.16,
              ease: 'power2.out',
              scrollTrigger: { trigger: section, start: 'top 82%' },
            }
          )
          gsap.fromTo(
            accent.querySelector('.ambient-orbit'),
            { y: 35, rotate: -8 },
            {
              y: -55,
              rotate: index % 2 ? 10 : 5,
              ease: 'none',
              scrollTrigger: {
                trigger: section,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1.5,
              },
            }
          )
        })

        // Por qué LUKY: las tarjetas entran escalonadas.
        gsap.from('.why-card', {
          scrollTrigger: { trigger: '.why-card', start: 'top 85%' },
          y: 36,
          opacity: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
        })

        // Animate complete action cards; individual CSS translate handles hover separately.
        gsap.utils.toArray<HTMLElement>('.card-reveal').forEach((card, index) => {
          gsap.from(card, {
            y: 24,
            scale: 0.985,
            opacity: 0,
            duration: 0.75,
            delay: (index % 3) * 0.07,
            ease: 'power3.out',
            clearProps: 'transform,opacity',
            scrollTrigger: { trigger: card, start: 'top 90%', once: true },
          })
        })

        // Resultados: el collage con parallax. Cada foto recorre una distancia
        // grande y distinta (±170/±220/±140 px) para que las capas se muevan a
        // velocidad muy distinta; esa diferencia es la profundidad. Las cifras
        // aparecen de a una.
        gsap.utils.toArray<HTMLElement>('.results-img').forEach((img, i) => {
          const range = [340, 440, 280][i % 3]
          gsap.fromTo(
            img,
            { y: range / 2 },
            {
              y: -range / 2,
              ease: 'none',
              scrollTrigger: {
                trigger: '.results-trigger',
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1,
              },
            }
          )
        })
        gsap.from('.stat-item', {
          scrollTrigger: { trigger: '.results-trigger', start: 'top 62%' },
          y: 30,
          opacity: 0,
          duration: 0.7,
          stagger: 0.12,
          ease: 'power3.out',
        })

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
        data-hero
        className="brand-gradient relative -mt-16 flex min-h-[94vh] items-center overflow-hidden bg-secondary px-6 pt-28 pb-16 text-on-secondary lg:pt-[138px] lg:pb-9"
      >
        <div className="relative z-10 mx-auto grid w-full max-w-[1440px] items-center gap-12 lg:grid-cols-2 lg:px-6">
          <div>
            <h1 className="font-display text-[2.75rem] leading-[1.04] sm:text-6xl lg:text-[3.9rem] xl:text-[4.4rem]">
              <Words text="Tu lugar en Chile" className="block" />
              <Words text="está en el mapa" className="block" />
            </h1>

            <p className="hero-reveal mt-6 max-w-lg text-base leading-relaxed sm:text-lg">
              Busca, compara y publica propiedades en todo Chile. Sin <RotatingPain />
            </p>

            {/* Pestañas subrayadas, como el conmutador de Casavo. */}
            <div
              role="tablist"
              aria-label="Qué quieres hacer"
              className="hero-reveal mt-9 flex w-fit gap-7 border-b border-on-secondary/25"
            >
              {HERO_TABS.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    '-mb-px border-b-2 pb-3 text-sm font-semibold transition-colors',
                    tab === t.id
                      ? 'border-on-secondary'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearch} className="hero-reveal mt-6 w-full max-w-xl space-y-3">
              <div className="flex flex-col rounded-xl bg-surface-container-lowest p-1.5 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
                  <span className="material-symbols-outlined select-none text-on-surface-variant">
                    search
                  </span>
                  <label htmlFor="hero-q" className="sr-only">
                    Ciudad, barrio o región
                  </label>
                  <input
                    id="hero-q"
                    type="text"
                    readOnly={tab === 'publish'}
                    value={tab === 'publish' ? '' : searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder={
                      tab === 'rent'
                        ? '¿Dónde quieres arrendar?'
                        : tab === 'publish'
                          ? 'Completa tu propiedad sin iniciar sesión'
                          : 'Ciudad, barrio o región...'
                    }
                    className="w-full bg-transparent py-3 text-[15px] text-on-surface placeholder:text-on-surface-variant focus:outline-none"
                  />
                </div>
                {tab !== 'publish' && (
                  <>
                    <div className="mx-1 hidden h-7 w-px shrink-0 bg-outline-variant sm:block" />
                    <label htmlFor="hero-type" className="sr-only">
                      Tipo de propiedad
                    </label>
                    <select
                      id="hero-type"
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                      className="cursor-pointer bg-transparent px-3 py-3 text-[15px] text-on-surface focus:outline-none sm:w-44"
                    >
                      <option value="">Tipo de propiedad</option>
                      <option value="casa">Casa</option>
                      <option value="departamento">Departamento</option>
                      <option value="terreno">Terreno</option>
                      <option value="oficina">Oficina</option>
                    </select>
                  </>
                )}
              </div>
              <button
                type="submit"
                className="search-shimmer w-full rounded-lg bg-primary py-3.5 text-[15px] font-semibold text-on-primary transition-all hover:brightness-110 active:scale-[0.99]"
              >
                <span className="search-light-label">
                  {tab === 'publish' ? 'Publicar' : tab === 'rent' ? 'Arrendar' : 'Buscar'}
                </span>
              </button>
            </form>

            <p className="hero-reveal mt-4 text-sm text-on-secondary/65">
              Una propiedad gratis para particulares · planes para corredoras y más propiedades
            </p>

            <p className="hero-reveal mt-16 text-sm font-medium">
              Construyamos el próximo gran mapa inmobiliario de Chile
            </p>
          </div>

          <div className="hero-reveal relative mx-auto w-full max-w-[620px] lg:max-w-none">
            <HeroGallery />
          </div>
        </div>
      </section>

      {/* ─── RESULTADOS ───────────────────────────────────── */}
      <StatsBand />

      {/* ─── MARQUEE DE COMUNAS ───────────────────────────── */}
      <section
        aria-label="Comunas con propiedades publicadas"
        className="marquee-mask overflow-hidden border-y border-outline-variant/40 bg-surface-container-low py-5"
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
                  <span className="material-symbols-outlined text-[16px] text-accent">
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

      {/* ─── POR QUÉ MAPU ─────────────────────────────────── */}
      <WhyMapu />

      {/* ─── DESTACADAS ───────────────────────────────────── */}
      <section className="property-grid-trigger landing-section relative isolate mx-auto max-w-[1440px] px-6 py-16 lg:px-20">
        <LandingAccents variant="route" className="accent-featured" />
        <div className="relative z-10 mb-10 flex items-end justify-between gap-6">
          <SectionIntro
            align="left"
            eyebrow="Destacadas"
            title="Propiedades destacadas"
            sub="Las mejores oportunidades del mercado inmobiliario chileno."
          />
          <Link
            href="/buscar"
            className="ml-4 flex shrink-0 items-center gap-2 font-bold text-accent hover:underline"
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
                <div className="property-card card-motion spotlight accent-glow h-full overflow-hidden rounded-3xl border border-outline-variant/50 bg-surface-container-lowest">
                  <div className="relative h-60 overflow-hidden">
                    {mainImg && (
                      <Image
                        src={mainImg.url}
                        alt={property.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    )}
                    <FavBtn property={property} />
                  </div>

                  <div className="space-y-4 p-6">
                    <div className="space-y-2">
                      <p className="font-display text-2xl text-on-surface">
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

      {/* ─── ACTIVIDAD DEL VENDEDOR ───────────────────────── */}
      <ActivityFeed />

      {/* ─── HISTORIAS REALES ─────────────────────────────── */}
      <Testimonials />

      {/* ─── TARJETAS CTA ─────────────────────────────────── */}
      <CtaCards />

      {/* ─── FAQ ──────────────────────────────────────────── */}
      <FaqAccordion />

      {/* ─── CTA ──────────────────────────────────────────── */}
      <section className="cta-trigger landing-section relative isolate mx-auto max-w-[1440px] px-6 py-16 lg:px-20">
        <div className="cta-card relative overflow-hidden rounded-3xl bg-primary p-10 text-on-primary md:p-14">
          <span
            aria-hidden
            className="orb"
            style={{
              top: '-34%',
              right: '-6%',
              width: 320,
              height: 320,
              background: 'rgb(var(--secondary) / 0.35)',
            }}
          />
          <div className="relative z-10 flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="max-w-2xl space-y-4 text-center md:text-left">
              <h2 className="font-display text-3xl leading-tight sm:text-4xl">
                ¿Tienes una propiedad para publicar?
              </h2>
              <p className="text-lg leading-relaxed opacity-80">
                Una propiedad gratis para particulares. Los mensajes y favoritos llegan a tu panel.
              </p>
            </div>
            <Link
              href="/publicar"
              className="btn-shine shrink-0 rounded-full bg-secondary px-10 py-4 text-lg font-bold text-on-secondary shadow-elevated transition-all hover:scale-105 md:px-12 md:py-5"
            >
              Publicar ahora
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────── */}
      <footer className="border-t border-outline-variant/30 bg-surface-container-lowest pb-20 md:pb-0">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-6 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-20">
          <div className="space-y-4">
            <BrandLogo />
            <p className="max-w-xs text-sm leading-relaxed text-on-surface-variant">
              El mapa de propiedades de Chile. Busca, compara y publica sin comisiones.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                aria-label="Compartir LUKY"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high text-on-surface transition-colors hover:bg-secondary hover:text-on-secondary"
              >
                <span className="material-symbols-outlined text-[20px]">share</span>
              </a>
            </div>
          </div>

          {[
            {
              title: 'Servicios',
              links: [
                { label: 'Buscar propiedades', href: '/buscar' },
                { label: 'Mapa interactivo', href: '/mapa' },
                { label: 'Publicar propiedad', href: '/publicar' },
                { label: 'Favoritos', href: '/favoritos' },
              ],
            },
            {
              title: 'Cuenta',
              links: [
                { label: 'Ingresar', href: '/login' },
                { label: 'Crear cuenta', href: '/register' },
                { label: 'Mi panel', href: '/dashboard' },
                { label: 'Métricas', href: '/metricas' },
              ],
            },
            {
              title: 'Recursos',
              links: [
                { label: 'Preguntas frecuentes', href: '#faq' },
                { label: 'Explorar el mapa', href: '/mapa' },
                { label: 'Contacto', href: '/' },
              ],
            },
          ].map((col) => (
            <div key={col.title} className="space-y-3">
              <h3 className="text-sm font-bold text-on-surface">{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-on-surface-variant transition-colors hover:text-accent"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-outline-variant/30">
          <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 px-6 py-6 text-sm text-on-surface-variant md:flex-row lg:px-20">
            <p>© 2026 LUKY PROPIEDADES Chile — Todos los derechos reservados</p>
            <div className="flex gap-6">
              {['Privacidad', 'Términos', 'Mapa del Sitio'].map((link) => (
                <a key={link} href="#" className="transition-colors hover:text-accent">
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
