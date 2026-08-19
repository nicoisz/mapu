'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { PropertyCard, PropertyCardSkeleton } from '@/components/property/PropertyCard'
import { useFavoritesContext } from '@/contexts/FavoritesContext'
import { favoritesService } from '@/services/favoritesService'
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
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-background">
        <Heart size={56} className="text-on-surface-variant/40 mb-4" />
        <h2 className="font-headline text-xl font-bold text-on-surface">Sin favoritos aún</h2>
        <p className="text-on-surface-variant text-sm mt-2 max-w-xs">
          Guarda propiedades tocando el corazón y aparecerán aquí.
        </p>
        <Link
          href="/buscar"
          className="mt-6 bg-primary text-on-primary px-6 py-2.5 rounded-xl text-sm font-semibold hover:brightness-110 transition-all"
        >
          Explorar propiedades
        </Link>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="relative bg-surface-container-low border-b border-outline-variant/40 px-4 pt-7 pb-5 overflow-hidden">
        <div className="absolute -right-16 -top-16 w-56 h-56 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Heart size={20} className="text-primary fill-primary" />
            <h1 className="font-headline text-2xl font-bold text-on-surface">Mis favoritos</h1>
          </div>
          <p className="text-on-surface-variant text-sm">
            {count} propiedad{count !== 1 ? 'es' : ''} guardada{count !== 1 ? 's' : ''}
          </p>

          {stats.totalCount > 0 && stats.averagePrice > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 max-w-md">
              <div className="bg-surface-container rounded-xl p-3 border border-outline-variant/40">
                <p className="text-xs text-on-surface-variant">Precio promedio</p>
                <p className="font-bold text-sm mt-0.5 text-on-surface">
                  {formatPrice(Math.round(stats.averagePrice), Currency.CLP)}
                </p>
              </div>
              <div className="bg-surface-container rounded-xl p-3 border border-outline-variant/40">
                <p className="text-xs text-on-surface-variant">Tipos guardados</p>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {Object.entries(stats.byType).map(([type, n]) => (
                    <span key={type} className="text-xs font-medium text-on-surface">
                      {PROPERTY_TYPE_LABELS[type]} ({n})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }, (_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  )
}
