import Image from 'next/image'
import Link from 'next/link'
import { Map, SearchX } from 'lucide-react'

export default function PropertyNotFound() {
  return (
    <div className="relative flex h-full min-h-[80vh] flex-col items-center justify-center overflow-hidden bg-background px-6 text-center">
      {/* Fondo: logo de marca flotando, muy tenue, + orbes de color. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <Image
          src="/luky%20logo.svg"
          alt=""
          width={720}
          height={720}
          priority
          className="chip-float h-[72vmin] w-[72vmin] max-w-none object-contain opacity-[0.06] dark:brightness-[1.8]"
        />
      </div>
      <span
        aria-hidden
        className="orb"
        style={{
          top: '8%',
          left: '12%',
          width: 300,
          height: 300,
          background: 'rgb(var(--primary) / 0.28)',
        }}
      />
      <span
        aria-hidden
        className="orb"
        style={{
          bottom: '6%',
          right: '10%',
          width: 260,
          height: 260,
          background: 'rgb(var(--secondary) / 0.28)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center">
        <SearchX size={46} className="mb-4 text-on-surface-variant/50" />
        <h1 className="font-headline text-2xl font-bold text-on-surface md:text-3xl">
          Propiedad no disponible
        </h1>
        <p className="mt-2 max-w-sm text-sm text-on-surface-variant">
          Esta propiedad ya no está publicada, se venció o el código no existe. Puedes seguir
          explorando en el mapa.
        </p>
        <Link
          href="/mapa"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-on-primary transition-all hover:brightness-110"
        >
          <Map size={15} /> Volver al mapa
        </Link>
      </div>
    </div>
  )
}
