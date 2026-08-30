'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { PropertyCard, PropertyCardSkeleton } from '@/components/property/PropertyCard'
import { useFavoritesContext } from '@/contexts/FavoritesContext'
import { favoritesService } from '@/services/favoritesService'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'
import { Currency } from '@/types/enums'
import { Property } from '@/types/property'
import { PROPERTY_TYPE_LABELS } from '@/constants'

export default function FavoritosPage() {
  const { favoriteIds, count } = useFavoritesContext()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    favoritesService
      .getFavoriteProperties(favoriteIds)
      .then((props) => {
        if (active) {
          setProperties(props)
          setLoading(false)
        }
      })
      .catch(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [favoriteIds])

  const stats = useMemo(() => favoritesService.computeStats(properties), [properties])

  if (count === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background p-8">
        <EmptyState
          icon={<Heart size={22} />}
          title="Sin favoritos aún"
          description="Guarda propiedades tocando el corazón y aparecerán aquí."
          action={
            <Link href="/buscar" className="block">
              <Button>Explorar propiedades</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-background pb-16">
      <PageHeader
        icon={<Heart size={20} />}
        title="Mis favoritos"
        description={`${count} propiedad${count !== 1 ? 'es' : ''} guardada${count !== 1 ? 's' : ''}`}
      />

      <div className="mx-auto w-full max-w-5xl px-6 py-6">
        {stats.totalCount > 0 && stats.averagePrice > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-4 max-w-md">
            <div className="rounded-2xl border border-outline-variant/50 bg-surface-container-low p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">
                Precio promedio
              </p>
              <p className="font-headline font-bold text-xl mt-1 text-on-surface">
                {formatPrice(Math.round(stats.averagePrice), Currency.CLP)}
              </p>
            </div>
            <div className="rounded-2xl border border-outline-variant/50 bg-surface-container-low p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">
                Tipos guardados
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {Object.entries(stats.byType).map(([type, n]) => (
                  <span key={type} className="text-sm font-medium text-on-surface">
                    {PROPERTY_TYPE_LABELS[type]} ({n})
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
