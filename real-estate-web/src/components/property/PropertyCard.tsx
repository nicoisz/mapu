'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Bath, Bed, Heart, MapPin, Move } from 'lucide-react'
import { Property } from '@/types/property'
import { useFavoritesContext } from '@/contexts/FavoritesContext'
import { Badge } from '@/components/ui/Badge'
import { cn, formatArea, getDisplayPrice } from '@/lib/utils'
import { OPERATION_LABELS, PROPERTY_TYPE_LABELS } from '@/constants'
import { PropertyOperation } from '@/types/enums'
import { OrgBadge } from '@/components/property/OrgBadge'

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
  const mainImage = property.media.images.find((img) => img.isMain) ?? property.media.images[0]
  const isRent = property.operation === PropertyOperation.RENT

  return (
    <div
      className={cn(
        'bg-surface-container-low rounded-2xl overflow-hidden group transition-all duration-300',
        isSelected
          ? 'ring-2 ring-primary border border-primary/50'
          : 'border border-outline-variant/25 hover:-translate-y-1.5 hover:shadow-elevated',
        compact ? 'flex gap-3 items-stretch' : '',
        onClick ? 'cursor-pointer' : ''
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          'relative overflow-hidden shrink-0',
          compact ? 'w-32 self-stretch min-h-[9rem]' : 'h-60'
        )}
      >
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
        {!compact && (
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent pointer-events-none" />
        )}
        <div className="absolute top-2.5 left-2.5 flex gap-1">
          <Badge variant={isRent ? 'rent' : 'sale'} size="sm">
            {OPERATION_LABELS[property.operation]}
          </Badge>
          {property.listing.isPremium && (
            <Badge variant="premium" size="sm">
              ★ Destacado
            </Badge>
          )}
        </div>
        {property.organizationId && (
          <OrgBadge
            organizationId={property.organizationId}
            className="absolute top-2.5 left-1/2 -translate-x-1/2"
          />
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggle(property)
          }}
          className={cn(
            'absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-all',
            fav ? 'bg-primary text-on-primary' : 'bg-black/35 text-white hover:bg-black/55'
          )}
          aria-label={fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          <Heart
            size={15}
            fill={fav ? 'currentColor' : 'none'}
            className={fav ? 'animate-[heartPop_0.35s_cubic-bezier(0.34,1.56,0.64,1)]' : ''}
          />
        </button>
      </div>

      <div className={cn('min-w-0', compact ? 'p-3 flex-1 flex flex-col' : 'p-5')}>
        <div className="flex items-baseline justify-between gap-2">
          <div className="min-w-0">
            <span
              className={cn(
                'font-headline font-bold text-on-surface tracking-tight',
                compact ? 'text-lg' : 'text-2xl'
              )}
            >
              {amount}
            </span>
            {suffix && <span className="text-on-surface-variant text-sm">{suffix}</span>}
          </div>
          {!compact && (
            <span className="text-[10px] uppercase tracking-[0.18em] text-on-surface-variant font-semibold shrink-0">
              {PROPERTY_TYPE_LABELS[property.type]}
            </span>
          )}
        </div>

        <h3
          className={cn(
            'font-medium text-on-surface leading-tight mt-1.5',
            compact ? 'text-sm line-clamp-1' : 'text-base line-clamp-2'
          )}
        >
          {property.title}
        </h3>

        <div className="flex items-center gap-1 mt-1.5 text-on-surface-variant">
          <MapPin size={12} className="shrink-0" />
          <span className={cn('text-xs', compact ? 'truncate' : '')}>
            {property.location.address.commune ?? property.location.address.city}
          </span>
        </div>

        {compact ? (
          <div className="mt-auto pt-3">
            <div className="flex items-center gap-3.5 text-xs text-on-surface-variant">
              {property.features.bedrooms !== undefined && (
                <span className="flex items-center gap-1">
                  <Bed size={13} />
                  {property.features.bedrooms}
                </span>
              )}
              {property.features.bathrooms !== undefined && (
                <span className="flex items-center gap-1">
                  <Bath size={13} />
                  {property.features.bathrooms}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Move size={13} />
                {formatArea(property.features.area)}
              </span>
            </div>
            <Link
              href={`/propiedad/${property.id}`}
              onClick={(e) => e.stopPropagation()}
              className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-primary text-on-primary text-sm font-semibold py-2 px-3 hover:brightness-110 transition-all"
            >
              Ver detalle <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-5 mt-4 pt-3.5 border-t border-outline-variant/30 text-xs text-on-surface-variant">
            {property.features.bedrooms !== undefined && (
              <span className="flex items-center gap-1.5">
                <Bed size={13} />
                {property.features.bedrooms}
              </span>
            )}
            {property.features.bathrooms !== undefined && (
              <span className="flex items-center gap-1.5">
                <Bath size={13} />
                {property.features.bathrooms}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Move size={13} />
              {formatArea(property.features.area)}
            </span>
            <Link
              href={`/propiedad/${property.id}`}
              onClick={(e) => e.stopPropagation()}
              className="ml-auto inline-flex items-center gap-1 rounded-md bg-primary text-on-primary text-xs font-semibold px-3 py-1.5 hover:brightness-110 transition-all"
            >
              Ver detalle <ArrowRight size={12} />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

/** Loading placeholder matching PropertyCard's layout. */
export function PropertyCardSkeleton({ compact }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        'bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/25',
        compact ? 'flex gap-3' : ''
      )}
    >
      <div className={cn('skeleton shrink-0', compact ? 'w-28 h-24' : 'h-60')} />
      <div className={cn(compact ? 'p-3 flex-1' : 'p-5', 'space-y-3')}>
        <div className="skeleton h-6 w-28 rounded-md" />
        <div className="skeleton h-4 w-3/4 rounded-md" />
        <div className="skeleton h-3 w-1/2 rounded-md" />
      </div>
    </div>
  )
}
