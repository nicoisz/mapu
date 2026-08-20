'use client'

import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { reviewService, Review } from '@/services/reviewService'
import { useAuthContext } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'

function Stars({ value, onChange }: { value: number; onChange?: (n: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          disabled={!onChange}
          className={cn(
            !onChange && 'cursor-default',
            onChange && 'hover:scale-110 transition-transform'
          )}
          aria-label={`${n} estrellas`}
        >
          <Star size={16} className={n <= value ? 'fill-primary text-primary' : 'text-outline'} />
        </button>
      ))}
    </div>
  )
}

/** List + create reviews for a subject. Optional property context. */
export function Reviews({
  subjectId,
  organizationId,
  propertyId,
}: {
  subjectId: string
  organizationId?: string
  propertyId?: string
}) {
  const { user, isAuthenticated } = useAuthContext()
  const [reviews, setReviews] = useState<Review[]>([])
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [canReview, setCanReview] = useState(true)

  const load = () => {
    reviewService
      .listForSubject(subjectId)
      .then(setReviews)
      .catch(() => {})
  }

  useEffect(() => {
    load()
    if (user && user.id !== subjectId) {
      reviewService
        .canReview(user.id, subjectId, propertyId)
        .then(setCanReview)
        .catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, user?.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || rating === 0 || comment.trim().length < 10) return
    setSubmitting(true)
    try {
      await reviewService.create({
        subjectId,
        rating,
        comment,
        propertyId,
        organizationId,
      })
      setComment('')
      setRating(0)
      setCanReview(false)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al publicar reseña')
    } finally {
      setSubmitting(false)
    }
  }

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-headline font-semibold text-on-surface">Reseñas</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Stars value={Math.round(avg)} />
            <span className="text-sm font-bold text-on-surface">{avg.toFixed(1)}</span>
            <span className="text-xs text-on-surface-variant">({reviews.length})</span>
          </div>
        )}
      </div>

      {isAuthenticated && user && user.id !== subjectId && canReview && (
        <form
          onSubmit={handleSubmit}
          className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-4 space-y-3"
        >
          <div className="flex items-center gap-3">
            <Stars value={rating} onChange={setRating} />
            {rating > 0 && <span className="text-xs text-on-surface-variant">{rating}/5</span>}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Cuéntanos tu experiencia (mín. 10 caracteres)…"
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {error && <p className="text-error text-xs">{error}</p>}
          <Button
            type="submit"
            size="sm"
            loading={submitting}
            disabled={rating === 0 || comment.trim().length < 10}
          >
            Publicar reseña
          </Button>
        </form>
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-on-surface-variant">Sin reseñas aún.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                    {(r.author_name ?? '?').charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-on-surface">
                      {r.author_name ?? 'Usuario'}
                    </p>
                    <Stars value={r.rating} />
                  </div>
                </div>
                <span className="text-xs text-on-surface-variant">{formatDate(r.created_at)}</span>
              </div>
              {r.property_title && (
                <p className="text-xs text-on-surface-variant mt-2 italic">«{r.property_title}»</p>
              )}
              <p className="text-sm text-on-surface mt-2 leading-relaxed">{r.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
