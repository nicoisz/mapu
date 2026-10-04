'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Check,
  ChevronDown,
  Compass,
  Pause,
  Pencil,
  Play,
  Plus,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useInterestMatches } from '@/contexts/InterestMatchesContext'
import { interestsService } from '@/services/interestsService'
import { interestTypeLabel } from '@/lib/interests'
import type { InterestFilters, PropertyInterest } from '@/types/interests'
import { InterestQuiz } from '@/components/interests/InterestQuiz'
import { InterestSummary } from '@/components/interests/InterestSummary'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import styles from '@/components/interests/interests.module.css'

export default function InterestsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuthContext()
  const { refresh } = useInterestMatches()
  const [items, setItems] = useState<PropertyInterest[]>([])
  const [editing, setEditing] = useState<PropertyInterest | 'new' | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<PropertyInterest | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
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
    setSaved(true)
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
  const showQuiz = !loading && !error && (!!editing || !items.length)
  if (isLoading)
    return (
      <p className="p-8" role="status">
        Cargando…
      </p>
    )
  if (!user)
    return (
      <div className="mx-auto max-w-lg space-y-5 p-8">
        <h1 className="font-headline text-2xl font-bold">Encuentra lo que va contigo</h1>
        <p className="text-on-surface-variant">
          Inicia sesión para guardar tus preferencias y encontrar propiedades para ti.
        </p>
        <Link
          href="/login"
          className={`${styles.action} inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-on-primary`}
        >
          Iniciar sesión <ArrowRight size={18} />
        </Link>
      </div>
    )
  return (
    <div className="h-full overflow-y-auto bg-background pb-24">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
        <header className={`${styles.enter} mb-8 flex flex-wrap items-end justify-between gap-5`}>
          <div className="max-w-xl">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-accent">
              <SlidersHorizontal size={17} /> Tu búsqueda, a tu manera
            </div>
            <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
              Mis intereses
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-on-surface-variant sm:text-base">
              {showQuiz && !items.length
                ? 'Empecemos por lo que buscas. Una pregunta a la vez, sin llenar un formulario interminable.'
                : 'Distintas búsquedas, un lugar para organizarlas. Ajusta lo que importa y descubre propiedades que van contigo.'}
            </p>
          </div>
          {!loading && items.length > 0 && !editing && (
            <Button
              className={`${styles.action} rounded-xl px-5 py-3`}
              onClick={() => {
                setSaved(false)
                setEditing('new')
              }}
            >
              <Plus size={18} /> Crear interés
            </Button>
          )}
        </header>
        {loading && (
          <div role="status" aria-label="Cargando intereses" className="space-y-4">
            <div className="h-2 w-32 rounded-full bg-primary/20" />
            <div className="h-64 rounded-3xl border border-outline-variant/30 bg-surface-container-low" />
            <p className="text-sm text-on-surface-variant">Preparando tus intereses…</p>
          </div>
        )}
        {showQuiz && (
          <InterestQuiz
            key={editing && editing !== 'new' ? editing.id : 'new'}
            initial={editing && editing !== 'new' ? editing.filters : undefined}
            onSave={save}
            onCancel={items.length ? () => setEditing(null) : undefined}
          />
        )}
        {!loading && !editing && items.length > 0 && (
          <div className="space-y-5">
            {saved && (
              <p
                role="status"
                className={`${styles.enter} flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-3 text-sm text-primary`}
              >
                <Check size={17} /> Interés guardado. Ya puedes explorar tus coincidencias.
              </p>
            )}
            <Button
              variant="ghost"
              onClick={() => router.push('/para-ti')}
              className={`${styles.results} ${styles.action} group flex w-full items-center justify-start gap-4 rounded-2xl border border-secondary/40 bg-secondary/10 p-5 text-left hover:bg-secondary/20 sm:p-6`}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-on-secondary">
                <Compass size={24} />
              </span>
              <span className="flex-1">
                <span className="block font-headline text-lg font-semibold text-on-surface">
                  Ver propiedades para ti
                </span>
                <span className="mt-1 block text-sm text-on-surface-variant">
                  Descubre coincidencias con tus intereses.
                </span>
              </span>
              <ArrowRight size={22} className="shrink-0 text-primary" />
            </Button>
            <div className="flex items-center justify-between pt-4">
              <h2 className="font-headline text-lg font-semibold">Tus búsquedas</h2>
              <span className="text-sm text-on-surface-variant">
                {items.filter((i) => i.isActive).length} activas · {items.length} guardadas
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {items.map((item, index) => (
                <section
                  key={item.id}
                  className={`${styles.card} ${styles.enter} flex flex-col rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5 sm:p-6`}
                  style={{ animationDelay: `${Math.min(index, 5) * 45}ms` }}
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-on-surface-variant">
                      {item.filters.operation === 'sale' ? 'Para comprar' : 'Para arrendar'}
                    </span>
                    <span
                      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${item.isActive ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant'}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${item.isActive ? 'bg-primary' : 'bg-on-surface-variant'}`}
                      />
                      {item.isActive ? 'Activo' : 'Pausado'}
                    </span>
                  </div>
                  <h3 className="font-headline text-xl font-semibold leading-tight tracking-tight">
                    {item.filters.types.map(interestTypeLabel).join(' · ')}
                  </h3>
                  <p className="mt-2 text-sm text-on-surface-variant">
                    {item.filters.communes.join(', ') || 'Sin preferencia de ubicación'}
                  </p>
                  <p className="mt-4 font-semibold tabular-nums">
                    {item.filters.maxPrice
                      ? `Hasta ${item.filters.maxPrice.toLocaleString('es-CL')} ${item.filters.currency}${item.filters.operation === 'rent' ? ' / mes' : ''}`
                      : 'Presupuesto abierto'}
                  </p>
                  <button
                    type="button"
                    className="mt-4 flex w-full items-center justify-between gap-2 rounded-lg py-2 text-left text-sm text-on-surface-variant hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                    aria-expanded={expanded === item.id}
                    aria-controls={`interest-${item.id}`}
                    onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                  >
                    Ver características{' '}
                    <ChevronDown
                      size={16}
                      className={styles.chevron}
                      style={{ transform: expanded === item.id ? 'rotate(180deg)' : undefined }}
                    />
                  </button>
                  <div
                    id={`interest-${item.id}`}
                    className={styles.disclosure}
                    data-open={expanded === item.id}
                    aria-hidden={expanded !== item.id}
                    inert={expanded !== item.id}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="pb-5 pt-3">
                        <InterestSummary filters={item.filters} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-auto flex flex-wrap items-center gap-1 border-t border-outline-variant/30 pt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className={styles.action}
                      disabled={busy}
                      onClick={() => {
                        setSaved(false)
                        setEditing(item)
                      }}
                    >
                      <Pencil size={14} /> Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={styles.action}
                      disabled={busy}
                      onClick={() =>
                        void change(() => interestsService.setActive(item.id, !item.isActive))
                      }
                    >
                      {item.isActive ? <Pause size={14} /> : <Play size={14} />}
                      {item.isActive ? 'Pausar' : 'Reactivar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto"
                      disabled={busy}
                      aria-label={`Eliminar interés ${index + 1}`}
                      onClick={() => setDeleting(item)}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="mt-5 space-y-3 rounded-2xl border border-error/20 bg-error/5 p-5 text-sm"
          >
            <p className="text-error">{error}</p>
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
