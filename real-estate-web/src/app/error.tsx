'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { captureError } from '@/lib/errorLogging'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    captureError({ message: `Error de página: ${error.message}`, stack: error.stack })
    console.error('Unhandled error:', error)
  }, [error])

  return (
    <div className="h-full min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-background">
      <AlertTriangle size={48} className="text-error mb-4" />
      <h2 className="font-headline text-2xl font-bold text-on-surface">Algo salió mal</h2>
      <p className="text-on-surface-variant text-sm mt-2 max-w-sm">
        Ocurrió un error inesperado. Intenta de nuevo; si persiste, recarga la página.
      </p>
      <button
        onClick={reset}
        className="mt-6 inline-flex items-center gap-2 bg-primary text-on-primary px-6 py-2.5 rounded-xl text-sm font-semibold hover:brightness-110 transition-all"
      >
        <RotateCcw size={15} /> Reintentar
      </button>
    </div>
  )
}
