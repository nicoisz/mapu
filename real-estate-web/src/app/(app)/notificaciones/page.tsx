'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, Heart, MessageCircle } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { notificationsService, ActivityItem } from '@/services/notificationsService'
import { cn, formatDate } from '@/lib/utils'

export default function NotificacionesPage() {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    // Se lee y se marca como visto en la misma visita: el badge refleja
    // "desde la última vez que entraste acá".
    notificationsService.getActivity().then((activity) => {
      if (!active) return
      setItems(activity)
      setLoading(false)
      void notificationsService.markSeen()
    })
    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return (
      <div className="h-full overflow-y-auto bg-background">
        <PageHeader title="Notificaciones" icon={<Bell size={22} />} />
        <div className="mx-auto max-w-3xl space-y-3 px-4 pb-16 md:px-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background p-8">
        <EmptyState
          icon={<Bell size={22} />}
          title="Sin novedades"
          description="Cuando alguien guarde o escriba por una de tus propiedades, aparecerá acá."
          action={
            <Link href="/dashboard" className="block">
              <Button>Ver mis propiedades</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-background pb-16">
      <PageHeader
        title="Notificaciones"
        description="Actividad sobre las propiedades que publicaste"
        icon={<Bell size={22} />}
      />
      <div className="mx-auto max-w-3xl space-y-2 px-4 md:px-6">
        {items.map((item, i) => {
          const isMessage = item.kind === 'message'
          const Icon = isMessage ? MessageCircle : Heart
          return (
            <Link
              key={`${item.kind}-${item.propertyId}-${item.createdAt}-${i}`}
              href={`/propiedad/${item.propertyId}`}
              className={cn(
                'flex gap-3 rounded-2xl border p-4 transition-all hover:shadow-soft',
                item.isNew
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-outline-variant/25 bg-surface-container-low'
              )}
            >
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                  isMessage ? 'bg-accent/15 text-accent' : 'bg-primary/15 text-primary'
                )}
              >
                <Icon size={16} fill={isMessage ? 'none' : 'currentColor'} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-on-surface">
                  {isMessage ? (
                    <>
                      <span className="font-medium">{item.actorName}</span> te escribió por{' '}
                      <span className="font-medium">{item.title}</span>
                    </>
                  ) : (
                    <>
                      Alguien guardó <span className="font-medium">{item.title}</span> en sus
                      favoritos
                    </>
                  )}
                </p>
                {item.body && (
                  <p className="mt-1 line-clamp-2 text-sm text-on-surface-variant">{item.body}</p>
                )}
                <p className="mt-1 text-xs text-on-surface-variant">{formatDate(item.createdAt)}</p>
              </div>
              {item.isNew && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
