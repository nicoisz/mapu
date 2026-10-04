'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useInterestMatches } from '@/contexts/InterestMatchesContext'
import { interestsService } from '@/services/interestsService'
import type { InterestMatch } from '@/types/interests'
import { interestLabel } from '@/lib/interests'
import { PropertyCard } from '@/components/property/PropertyCard'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'

export default function ForYouPage() {
  const { user, isLoading } = useAuthContext()
  const { refresh } = useInterestMatches()
  const [items, setItems] = useState<InterestMatch[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hasInterests, setHasInterests] = useState<boolean | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [retry, setRetry] = useState(0)
  const load = useCallback(
    async (active: () => boolean) => {
      if (!user?.id) return
      setLoading(true)
      setError('')
      setNotice('')
      try {
        const [result, interests] = await Promise.all([
          interestsService.getMatches(page),
          interestsService.list(),
        ])
        if (!active()) return
        setItems(result.items)
        setHasMore(result.hasMore)
        setHasInterests(interests.some((i) => i.isActive))
        if (page === 0) {
          try {
            await interestsService.markSeen(result.seenBefore)
            await refresh()
          } catch {
            if (active())
              setNotice(
                'Las propiedades están disponibles, pero no pudimos marcar las novedades como vistas.'
              )
          }
        }
      } catch (e) {
        if (active()) setError((e as Error).message)
      } finally {
        if (active()) setLoading(false)
      }
    },
    [user?.id, page, refresh]
  )
  useEffect(() => {
    let active = true
    void load(() => active)
    return () => {
      active = false
    }
  }, [load, retry])
  if (isLoading) return <p className="p-8">Cargando…</p>
  if (!user)
    return (
      <div className="p-8">
        <p>Inicia sesión para ver propiedades para ti.</p>
        <Link href="/login" className="mt-4 inline-block underline">
          Iniciar sesión
        </Link>
      </div>
    )
  return (
    <div className="h-full overflow-y-auto bg-background pb-24">
      <PageHeader
        title="Propiedades para ti"
        icon={<Sparkles size={22} />}
        description="Más del 30% de coincidencia con tus intereses, ordenadas de mayor a menor. El porcentaje refleja preferencias, no una probabilidad de compra."
      />
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6">
        <Link href="/intereses" className="inline-block text-sm font-medium text-accent underline">
          Ajustar mis intereses
        </Link>
        {loading ? (
          <p role="status">Buscando coincidencias…</p>
        ) : error ? (
          <div role="alert">
            <p className="text-error">{error}</p>
            <Button className="mt-3" onClick={() => setRetry((n) => n + 1)}>
              Reintentar
            </Button>
          </div>
        ) : (
          <>
            {notice && (
              <p role="alert" className="text-sm text-on-surface-variant">
                {notice}
              </p>
            )}
            {!items.length && (
              <div className="rounded-2xl bg-surface-container-low p-6">
                <p>
                  {!hasInterests
                    ? 'Crea o reactiva un interés para encontrar propiedades para ti.'
                    : page
                      ? 'No hay más propiedades en esta página.'
                      : 'Todavía no hay propiedades que superen el 30% de coincidencia. Puedes ampliar tus preferencias.'}
                </p>
                <Link href="/intereses" className="mt-3 inline-block text-accent underline">
                  Mis intereses
                </Link>
              </div>
            )}
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <PropertyCard
                  key={item.property.id}
                  property={item.property}
                  match={{
                    score: item.score,
                    interestLabel: interestLabel(item.filters),
                    reasons: item.reasons,
                    isNew: item.isNew,
                  }}
                />
              ))}
            </div>
            {(page > 0 || hasMore) && (
              <div className="flex items-center justify-center gap-4">
                <Button variant="outline" disabled={!page} onClick={() => setPage((p) => p - 1)}>
                  Anterior
                </Button>
                <span className="text-sm">Página {page + 1}</span>
                <Button variant="outline" disabled={!hasMore} onClick={() => setPage((p) => p + 1)}>
                  Siguiente
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
