'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { mockProperties } from '@/data'
import { formatPriceShort } from '@/lib/utils'
import { PropertyOperation } from '@/types/enums'
import { useFavoritesContext } from '@/contexts/FavoritesContext'
import { cn } from '@/lib/utils'

const FEATURED = mockProperties.filter(p => p.listing.isFeatured || p.listing.isPremium).slice(0, 3)

const HERO_IMAGES = [
  { src: '/1.jpg', alt: 'Propiedad de lujo en Chile' },
  { src: '/2.jpg', alt: 'Casa moderna en Santiago' },
  { src: '/3.jpg', alt: 'Vista de propiedad premium' },
]

function HeroCarousel() {
  const [current, setCurrent] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Trigger Ken Burns on first slide after mount
    setMounted(true)
    const id = setInterval(() => setCurrent(c => (c + 1) % HERO_IMAGES.length), 5500)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      {HERO_IMAGES.map((img, i) => {
        const active = i === current
        return (
          <div
            key={i}
            className="absolute inset-0 overflow-hidden"
            style={{
              opacity: active ? 1 : 0,
              transition: 'opacity 1200ms ease-in-out',
              zIndex: active ? 1 : 0,
            }}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              style={{
                objectFit: 'cover',
                objectPosition: 'center 30%',
                transform: active && mounted ? 'scale(1.06)' : 'scale(1)',
                transition: active && mounted ? 'transform 8000ms linear' : 'none',
              }}
              priority={i === 0}
              sizes="100vw"
            />
          </div>
        )
      })}

      {/* Single theme-independent scrim: dark through the middle (keeps the
          centered headline readable over any photo) while the bottom fades to
          the page background so the hero blends into the next section. */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-background via-black/35 to-black/45"
        style={{ zIndex: 2 }}
      />

      {/* Dot indicators */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3" style={{ zIndex: 20 }}>
        {HERO_IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Imagen ${i + 1}`}
            className={cn(
              'rounded-full transition-all duration-500',
              i === current
                ? 'bg-primary w-8 h-2'
                : 'bg-white/30 w-2 h-2 hover:bg-white/60'
            )}
          />
        ))}
      </div>
    </>
  )
}

const STATS = [
  { value: '15k+', label: 'Propiedades' },
  { value: '12', label: 'Regiones' },
  { value: '24/7', label: 'Soporte Digital' },
  { value: '5.0', label: 'Valoración Media' },
]

const STEPS = [
  {
    num: '01',
    title: 'Busca con IA',
    desc: 'Nuestra inteligencia artificial aprende tus gustos para ofrecerte solo lo mejor.',
  },
  {
    num: '02',
    title: 'Agenda Online',
    desc: 'Reserva visitas presenciales o tours virtuales 3D con un solo clic.',
  },
  {
    num: '03',
    title: 'Cierra el Trato',
    desc: 'Gestión digital de contratos y documentos con total seguridad legal.',
  },
]

function FavBtn({ propertyId }: { propertyId: string }) {
  const { isFavorite, toggle } = useFavoritesContext()
  const fav = isFavorite(propertyId)
  const property = mockProperties.find(p => p.id === propertyId)

  return (
    <button
      onClick={e => { e.preventDefault(); e.stopPropagation(); if (property) toggle(property) }}
      className={cn(
        'absolute top-4 right-4 p-2 bg-surface-container-lowest/50 backdrop-blur-md rounded-full transition-colors',
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
  const scrollRef = useRef<HTMLDivElement>(null)

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const parts = [searchValue.trim(), propertyType].filter(Boolean)
    router.push(parts.length ? `/buscar?q=${encodeURIComponent(parts.join(' '))}` : '/buscar')
  }

  useEffect(() => {
    let ctx: { revert: () => void } | undefined
    let cancelled = false

    Promise.all([
      import('gsap').then(m => m.default ?? m.gsap),
      import('gsap/ScrollTrigger').then(m => m.ScrollTrigger),
    ]).then(([gsap, ScrollTrigger]) => {
      const scroller = scrollRef.current
      if (cancelled || !scroller) return
      gsap.registerPlugin(ScrollTrigger)
      ScrollTrigger.defaults({ scroller })

      // gsap.context scopes every tween/trigger to this component. ctx.revert()
      // on unmount strips ALL the inline styles GSAP applied, so returning to
      // the landing never leaves text stuck at low opacity.
      ctx = gsap.context(() => {
        gsap.from('.hero-reveal', {
          y: 50, opacity: 0, duration: 1, stagger: 0.2, ease: 'power3.out',
        })

        gsap.from('.stat-item', {
          scrollTrigger: { trigger: '.stats-trigger', start: 'top 80%' },
          y: 30, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'back.out(1.7)',
        })

        gsap.from('.property-card', {
          scrollTrigger: { trigger: '.property-grid-trigger', start: 'top 70%' },
          y: 60, opacity: 0, duration: 1, stagger: 0.15, ease: 'power3.out',
        })

        gsap.from('.map-content', {
          scrollTrigger: { trigger: '.map-trigger', start: 'top 60%' },
          x: -50, opacity: 0, duration: 1.2, ease: 'power2.out',
        })

        gsap.from('.step-card', {
          scrollTrigger: { trigger: '.how-trigger', start: 'top 70%' },
          scale: 0.9, opacity: 0, duration: 0.8, stagger: 0.2, ease: 'power1.out',
        })

        gsap.from('.cta-trigger', {
          scrollTrigger: { trigger: '.cta-trigger', start: 'top 85%' },
          y: 100, opacity: 0, duration: 1, ease: 'power4.out',
        })
      }, scroller)

      // Recalculate trigger positions once everything is laid out — fixes
      // sections staying hidden when arriving via client-side navigation.
      ScrollTrigger.refresh()
    })

    return () => { cancelled = true; ctx?.revert() }
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      window.dispatchEvent(new CustomEvent('mapu:scroll', { detail: { y: el.scrollTop } }))
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div ref={scrollRef} className="overflow-y-auto h-full selection:bg-primary selection:text-on-primary">

      {/* ─── HERO ─────────────────────────────────────────── */}
      <section className="relative h-[600px] md:h-[870px] flex items-center justify-center overflow-hidden -mt-16">
        <HeroCarousel />

        <div className="relative w-full max-w-[1440px] px-6 lg:px-20 text-center space-y-8" style={{ zIndex: 10 }}>
          <h1 className="hero-reveal font-headline text-4xl md:text-6xl lg:text-7xl font-bold text-[#FBF7F2] max-w-4xl mx-auto drop-shadow-2xl leading-[1.05]">
            Encuentra tu propiedad ideal en Chile
          </h1>
          <p className="hero-reveal text-[#FBF7F2]/85 text-lg md:text-xl max-w-2xl mx-auto drop-shadow-lg -mt-2">
            Hogares con alma, en las mejores zonas del país.
          </p>

          {/* Glass search bar */}
          <form className="hero-reveal max-w-4xl mx-auto glass-panel p-4 rounded-xl" onSubmit={handleSearch}>
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 w-full relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline select-none">search</span>
                <input
                  type="text"
                  value={searchValue}
                  onChange={e => setSearchValue(e.target.value)}
                  placeholder="Ciudad, barrio o región..."
                  className="w-full pl-12 pr-4 py-4 bg-surface-container-low border border-outline-variant/30 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-on-surface placeholder:text-outline"
                />
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <select
                  value={propertyType}
                  onChange={e => setPropertyType(e.target.value)}
                  className="flex-1 md:w-40 py-4 px-4 bg-surface-container-low border border-outline-variant/30 rounded-lg text-on-surface focus:outline-none"
                >
                  <option value="">Tipo</option>
                  <option value="casa">Casa</option>
                  <option value="departamento">Departamento</option>
                  <option value="terreno">Terreno</option>
                  <option value="oficina">Oficina</option>
                </select>
                <button
                  type="submit"
                  className="bg-primary text-on-primary font-bold px-8 md:px-10 py-4 rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 shrink-0"
                >
                  <span className="material-symbols-outlined">filter_list</span>
                  Buscar
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* ─── STATS ────────────────────────────────────────── */}
      <section className="py-16 px-6 lg:px-20 max-w-[1440px] mx-auto stats-trigger">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(s => (
            <div key={s.label} className="text-center stat-item space-y-2">
              <p className="text-primary font-headline text-4xl md:text-5xl font-bold">{s.value}</p>
              <p className="text-on-surface-variant text-xs font-bold tracking-widest uppercase">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FEATURED PROPERTIES GRID ─────────────────────── */}
      <section className="py-16 px-6 lg:px-20 max-w-[1440px] mx-auto property-grid-trigger">
        <div className="flex justify-between items-end mb-8">
          <div className="space-y-2">
            <h2 className="font-headline text-3xl font-semibold text-on-surface">Propiedades Destacadas</h2>
            <p className="text-on-surface-variant">Las mejores oportunidades del mercado inmobiliario chileno.</p>
          </div>
          <Link href="/buscar" className="text-primary font-bold flex items-center gap-2 hover:underline shrink-0 ml-4">
            Ver todas <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURED.map(property => {
            const mainImg = property.media.images.find(i => i.isMain) ?? property.media.images[0]
            const price = property.operation === PropertyOperation.RENT
              ? (property.pricing.monthlyRent ?? property.pricing.price)
              : property.pricing.price
            const displayPrice = formatPriceShort(price, property.pricing.currency)
            const isRent = property.operation === PropertyOperation.RENT

            return (
              <Link key={property.id} href={`/propiedad/${property.id}`} className="block group">
                <div className="tonal-layer-1 rounded-xl overflow-hidden warm-glow transition-all duration-300 property-card h-full">
                  <div className="relative h-64 overflow-hidden">
                    {mainImg && (
                      <Image
                        src={mainImg.url}
                        alt={property.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    )}
                    <FavBtn propertyId={property.id} />
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="space-y-2">
                      <p className="text-primary font-headline font-bold text-2xl tracking-tight">
                        {displayPrice}
                        {isRent && <span className="text-on-surface-variant text-base font-normal">/mes</span>}
                      </p>
                      <h3 className="font-headline text-xl font-semibold text-on-surface truncate">
                        {property.title}
                      </h3>
                      <p className="flex items-center gap-1 text-on-surface-variant text-sm">
                        <span className="material-symbols-outlined text-base">location_on</span>
                        {property.location.address.commune ?? property.location.address.city},{' '}
                        {property.location.address.region}
                      </p>
                    </div>

                    <div className="flex justify-between pt-4 border-t border-outline-variant/30">
                      {property.features.bedrooms !== undefined && (
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-outline">bed</span>
                          <span className="text-on-surface-variant">{property.features.bedrooms}</span>
                        </div>
                      )}
                      {property.features.bathrooms !== undefined && (
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-outline">bathtub</span>
                          <span className="text-on-surface-variant">{property.features.bathrooms}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-outline">straighten</span>
                        <span className="text-on-surface-variant">{property.features.area} m²</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ─── MAP SECTION ──────────────────────────────────── */}
      <section className="relative h-[500px] md:h-[600px] my-16 overflow-hidden map-trigger">
        <div className="absolute inset-0 bg-surface-container-lowest map-pattern">
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        </div>

        <div className="relative z-10 flex h-full items-center px-6 lg:px-20 max-w-[1440px] mx-auto">
          <div className="max-w-xl space-y-8 map-content">
            <h2 className="font-headline text-4xl md:text-5xl font-bold text-on-surface leading-tight">
              Explora propiedades sobre el mapa
            </h2>
            <p className="text-on-surface-variant text-lg leading-relaxed">
              Visualiza de forma interactiva la ubicación exacta de tu próximo hogar. Filtra por barrios, servicios cercanos y conectividad en tiempo real.
            </p>
            <Link
              href="/mapa"
              className="inline-flex items-center gap-3 bg-primary text-on-primary font-bold px-8 py-4 rounded-full hover:scale-105 transition-transform shadow-lg"
              style={{ boxShadow: '0 10px 30px rgba(180, 90, 48, 0.25)' }}
            >
              <span className="material-symbols-outlined">explore</span>
              Abrir Mapa Interactivo
            </Link>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────── */}
      <section className="py-16 px-6 lg:px-20 max-w-[1440px] mx-auto how-trigger">
        <div className="text-center space-y-3 mb-16">
          <h2 className="font-headline text-3xl font-semibold text-on-surface">Tu camino a casa es simple</h2>
          <p className="text-on-surface-variant">MapU redefine la experiencia de búsqueda con tecnología avanzada.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {STEPS.map(step => (
            <div key={step.num} className="space-y-4 text-center group step-card">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-surface-container-highest flex items-center justify-center border border-outline-variant/30 group-hover:bg-primary transition-colors duration-500">
                <span className="font-headline text-2xl font-bold text-primary group-hover:text-on-primary transition-colors duration-500">
                  {step.num}
                </span>
              </div>
              <h3 className="font-headline text-xl font-semibold text-on-surface">{step.title}</h3>
              <p className="text-on-surface-variant leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────── */}
      <section className="py-16 px-6 lg:px-20 max-w-[1440px] mx-auto cta-trigger">
        <div className="relative bg-surface-container-high rounded-3xl p-10 md:p-12 overflow-hidden border border-outline-variant/20 shadow-2xl">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-primary/5 rounded-full blur-[80px]" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl text-center md:text-left space-y-4">
              <h2 className="font-headline text-3xl font-semibold text-on-surface">
                ¿Tienes una propiedad para publicar?
              </h2>
              <p className="text-on-surface-variant text-lg leading-relaxed">
                Únete a la plataforma inmobiliaria más avanzada de Chile y llega a miles de compradores calificados.
              </p>
            </div>
            <Link
              href="/publicar"
              className="shrink-0 bg-primary text-on-primary font-bold px-10 md:px-12 py-4 md:py-5 rounded-xl hover:scale-105 transition-all text-lg"
              style={{ boxShadow: '0 10px 30px rgba(180, 90, 48, 0.35)' }}
            >
              Publicar Ahora
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────── */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant/20 pb-20 md:pb-0">
        <div className="flex flex-col md:flex-row justify-between items-center py-12 px-6 lg:px-20 max-w-[1440px] mx-auto gap-8">
          <div className="flex flex-col items-center md:items-start gap-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">map</span>
              <span className="font-headline font-bold text-primary text-lg">MapU Real Estate</span>
            </div>
            <p className="text-on-surface-variant text-sm text-center md:text-left">
              © 2026 MapU Real Estate Chile - Todos los derechos reservados
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 md:gap-8">
            {['Privacidad', 'Términos', 'Contacto', 'Mapa del Sitio'].map(link => (
              <a
                key={link}
                href="#"
                className="text-on-surface-variant hover:text-primary underline transition-all text-xs font-bold tracking-widest uppercase"
              >
                {link}
              </a>
            ))}
          </div>

          <div className="flex gap-4">
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center hover:bg-primary transition-colors text-on-surface hover:text-on-primary"
            >
              <span className="material-symbols-outlined">share</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
