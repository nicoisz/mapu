'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Bath, Bed, Heart, MapPin, Move } from 'lucide-react'
import { Property } from '@/types/property'
import { useFavoritesContext } from '@/contexts/FavoritesContext'
import { Badge } from '@/components/ui/Badge'
import { cn, formatArea, getDisplayPrice } from '@/lib/utils'
import { OPERATION_LABELS, PROPERTY_TYPE_LABELS } from '@/constants'
import { PropertyOperation } from '@/types/enums'

interface PropertyCardProps {
  property: Property
  isSelected?: boolean
  compact?: boolean
  onClick?: () => void
}

export function PropertyCard({ property, isSelected, compact, onClick }: PropertyCardProps) {
  const { isFavorite, toggle } = useFavoritesContext()
  const fav = isFavorite(property.id)
  const { amount, suffix } = getDisplayPrice(property)
  const mainImage = property.media.images.find(img => img.isMain) ?? property.media.images[0]
  const isRent = property.operation === PropertyOperation.RENT

  return (
    <div
      className={cn(
        'bg-surface-container rounded-2xl overflow-hidden border transition-all duration-300 group warm-glow',
        isSelected ? 'border-primary ring-1 ring-primary' : 'border-outline-variant/40',
        compact ? 'flex gap-3' : ''
      )}
      onClick={onClick}
    >
      <div className={cn('relative overflow-hidden shrink-0', compact ? 'w-28 h-24' : 'h-52')}>
        {mainImage ? (
          <Image
            src={mainImage.url}
            alt={property.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 400px"
          />
        ) : (
          <div className="w-full h-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant text-sm">
            Sin imagen
          </div>
        )}
        <div className="absolute top-2.5 left-2.5 flex gap-1">
          <Badge variant={isRent ? 'rent' : 'sale'} size="sm">
            {OPERATION_LABELS[property.operation]}
          </Badge>
          {property.listing.isPremium && <Badge variant="premium" size="sm">★ Destacado</Badge>}
        </div>
        <button
          onClick={e => { e.stopPropagation(); toggle(property) }}
          className={cn(
            'absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-all',
            fav ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest/60 text-on-surface hover:text-primary'
          )}
          aria-label={fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          <Heart size={15} fill={fav ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className={cn(compact ? 'p-3 flex-1 min-w-0' : 'p-4')}>
        <p className="text-xs uppercase tracking-wider text-on-surface-variant font-medium">
          {PROPERTY_TYPE_LABELS[property.type]}
        </p>

        <div className="mt-1">
          <span className="font-headline font-bold text-primary text-lg">{amount}</span>
          {suffix && <span className="text-on-surface-variant text-sm">{suffix}</span>}
        </div>

        <h3 className={cn('font-medium text-on-surface leading-tight mt-1', compact ? 'text-sm line-clamp-1' : 'text-base line-clamp-2')}>
          {property.title}
        </h3>

        <div className="flex items-center gap-1 mt-1.5 text-on-surface-variant">
          <MapPin size={12} className="shrink-0" />
          <span className={cn('text-xs', compact ? 'truncate' : '')}>
            {property.location.address.commune ?? property.location.address.city}
          </span>
        </div>

        {!compact && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-outline-variant/40 text-xs text-on-surface-variant">
            {property.features.bedrooms !== undefined && (
              <span className="flex items-center gap-1.5"><Bed size={13} />{property.features.bedrooms}</span>
            )}
            {property.features.bathrooms !== undefined && (
              <span className="flex items-center gap-1.5"><Bath size={13} />{property.features.bathrooms}</span>
            )}
            <span className="flex items-center gap-1.5"><Move size={13} />{formatArea(property.features.area)}</span>
          </div>
        )}

        {!compact && (
          <Link
            href={`/propiedad/${property.id}`}
            onClick={e => e.stopPropagation()}
            className="mt-3 block text-center text-sm font-semibold text-primary border border-primary/60 rounded-lg py-2 hover:bg-primary hover:text-on-primary transition-colors"
          >
            Ver detalle
          </Link>
        )}
      </div>
    </div>
  )
}
