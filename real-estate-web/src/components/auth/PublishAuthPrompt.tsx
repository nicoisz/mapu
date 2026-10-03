'use client'

import Link from 'next/link'
import { ArrowRight, BookmarkCheck, Check } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { AuthVisual } from './AuthVisual'

export function PublishAuthPrompt({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-auth-parallax data-auth-scroll className="publish-auth-dialog">
        <div className="publish-auth-copy">
          <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary-container text-accent">
            <BookmarkCheck size={25} />
          </span>
          <DialogTitle className="font-display text-[2rem] leading-[1.08] sm:text-[2.5rem]">
            Continúa con tu cuenta
          </DialogTitle>
          <DialogDescription className="mt-4 text-base leading-relaxed">
            Lo básico ya está listo. Inicia sesión o crea tu cuenta para continuar con la ubicación
            de tu propiedad.
          </DialogDescription>
          <p className="mt-5 flex items-center gap-2 text-sm font-medium text-on-surface">
            <Check size={16} className="text-tertiary" /> Tu borrador está guardado en este
            navegador.
          </p>
          <div className="mt-7 grid gap-3">
            <Link
              href="/login?next=%2Fpublicar"
              className="flex items-center justify-center gap-3 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-on-primary transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Iniciar sesión <ArrowRight size={17} />
            </Link>
            <Link
              href="/register?next=%2Fpublicar"
              className="rounded-xl border border-outline-variant bg-surface px-5 py-3.5 text-center text-sm font-semibold text-on-surface transition-colors hover:border-secondary hover:bg-secondary-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Crear cuenta
            </Link>
          </div>
          <p className="mt-5 text-xs leading-relaxed text-on-surface-variant">
            Tu propiedad aparecerá en el mapa solo cuando completes las etapas y confirmes la
            publicación.
          </p>
        </div>
        <AuthVisual compact />
      </DialogContent>
    </Dialog>
  )
}
