'use client'

import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { reviewService, Review } from '@/services/reviewService'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    reviewService
      .listAll()
      .then(setReviews)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  async function moderate(r: Review, status: 'published' | 'flagged' | 'removed') {
    try {
      await reviewService.setStatus(r.id, status)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    }
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-error text-sm">{error}</p>}
      {loading ? (
        <div className="text-center py-8 text-on-surface-variant text-sm">Cargando reseñas…</div>
      ) : reviews.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Star size={22} />}
            title="Sin reseñas"
            description="Las reseñas de la plataforma aparecerán aquí."
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {reviews.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-on-surface-variant">
                    {r.author_name ?? r.author_id}
                  </span>
                  <span className="text-on-surface-variant/40">→</span>
                  <span className="text-xs font-medium text-on-surface-variant">
                    {r.subject_id}
                  </span>
                  <span className="flex gap-0.5 ml-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={11}
                        className={n <= r.rating ? 'fill-primary text-primary' : 'text-outline'}
                      />
                    ))}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => moderate(r, 'published')}
                    className="text-xs text-accent hover:underline"
                  >
                    Publicar
                  </button>
                  <button
                    onClick={() => moderate(r, 'flagged')}
                    className="text-xs text-on-surface-variant hover:underline"
                  >
                    Flag
                  </button>
                  <button
                    onClick={() => moderate(r, 'removed')}
                    className="text-xs text-error hover:underline"
                  >
                    Quitar
                  </button>
                </div>
              </div>
              {r.property_title && (
                <p className="text-xs text-on-surface-variant mt-1 italic">«{r.property_title}»</p>
              )}
              <p className="text-sm text-on-surface mt-1">{r.comment}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
