import Link from 'next/link'
import { Home, SearchX } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="h-full min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-background">
      <SearchX size={48} className="text-on-surface-variant/40 mb-4" />
      <h2 className="font-headline text-2xl font-bold text-on-surface">Página no encontrada</h2>
      <p className="text-on-surface-variant text-sm mt-2 max-w-sm">
        Lo que buscas no existe o ya no está disponible.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-primary text-on-primary px-6 py-2.5 rounded-xl text-sm font-semibold hover:brightness-110 transition-all"
        >
          <Home size={15} /> Ir al inicio
        </Link>
        <Link
          href="/buscar"
          className="inline-flex items-center gap-2 border border-primary/60 text-primary px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary hover:text-on-primary transition-colors"
        >
          Explorar propiedades
        </Link>
      </div>
    </div>
  )
}
