'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { SlidersHorizontal } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useInterestMatches } from '@/contexts/InterestMatchesContext'
import { interestsService } from '@/services/interestsService'
import { interestLabel } from '@/lib/interests'
import type { InterestFilters, PropertyInterest } from '@/types/interests'
import { InterestQuiz } from '@/components/interests/InterestQuiz'
import { InterestSummary } from '@/components/interests/InterestSummary'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

export default function InterestsPage() {
  const { user, isLoading } = useAuthContext()
  const { refresh } = useInterestMatches()
  const [items, setItems] = useState<PropertyInterest[]>([])
  const [editing, setEditing] = useState<PropertyInterest | 'new' | null>(null)
  const [deleting, setDeleting] = useState<PropertyInterest | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    setError('')
    try {
      setItems(await interestsService.list())
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [user?.id])
  useEffect(() => {
    void load()
  }, [load])
  async function save(filters: InterestFilters) {
    await interestsService.save(editing && editing !== 'new' ? editing.id : null, filters)
    setEditing(null)
    await load()
    await refresh()
  }
  async function change(action: () => Promise<void>) {
    setBusy(true)
    setError('')
    try {
      await action()
      setDeleting(null)
      await load()
      await refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  if (isLoading) return <p className="p-8">Cargando…</p>
  if (!user)
    return (
      <div className="p-8">
        <p>Inicia sesión para definir tus intereses.</p>
        <Link href="/login" className="mt-4 inline-block underline">
          Iniciar sesión
        </Link>
      </div>
    )
  return (
    <div className="h-full overflow-y-auto bg-background pb-24">
      <PageHeader
        title="Mis intereses"
        description="Una pregunta a la vez. Define lo que buscas y ajusta tus preferencias cuando quieras."
        icon={<SlidersHorizontal size={22} />}
      />
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6">
        {editing ? (
          <InterestQuiz
            key={editing === 'new' ? 'new' : editing.id}
            initial={editing === 'new' ? undefined : editing.filters}
            onSave={save}
            onCancel={() => setEditing(null)}
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button onClick={() => setEditing('new')}>Crear interés</Button>
              <Link href="/para-ti" className="text-sm font-medium text-accent underline">
                Ver propiedades para ti
              </Link>
            </div>
            {loading && <p role="status">Cargando intereses…</p>}
            {!loading && !error && !items.length && (
              <p className="rounded-2xl bg-surface-container-low p-6 text-on-surface-variant">
                Comienza con un interés: por ejemplo, terrenos en Valdivia dentro de tu presupuesto.
              </p>
            )}
            {items.map((item) => (
              <section
                key={item.id}
                className="space-y-4 rounded-2xl border border-outline-variant/40 bg-surface-container-low p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-headline text-lg font-semibold">
                    {interestLabel(item.filters)}
                  </h2>
                  <span className="text-xs text-on-surface-variant">
                    {item.isActive ? 'Activo' : 'Pausado'}
                  </span>
                </div>
                <details className="text-sm">
                  <summary className="cursor-pointer text-on-surface-variant">
                    Ver características
                  </summary>
                  <div className="pt-4">
                    <InterestSummary filters={item.filters} />
                  </div>
                </details>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => setEditing(item)}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      void change(() => interestsService.setActive(item.id, !item.isActive))
                    }
                  >
                    {item.isActive ? 'Pausar' : 'Reactivar'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => setDeleting(item)}
                  >
                    Eliminar
                  </Button>
                </div>
              </section>
            ))}
          </>
        )}
        {error && (
          <div role="alert" className="space-y-2 text-sm text-error">
            <p>{error}</p>
            <Button variant="outline" onClick={() => void load()}>
              Reintentar
            </Button>
          </div>
        )}
      </div>
      <ConfirmDialog
        open={!!deleting}
        title="¿Eliminar este interés?"
        description="Dejará de generar coincidencias y avisos. Tus favoritos se conservan."
        confirmLabel="Eliminar"
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && void change(() => interestsService.remove(deleting.id))}
      />
    </div>
  )
}
