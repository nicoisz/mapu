'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, Bath, Bed, Building, Calendar, ChevronLeft, ChevronRight,
  Eye, Heart, Mail, MapPin, MessageCircle, Move, Phone, Share2, Shield, Star
} from 'lucide-react'
import { Property } from '@/types/property'
import { useFavoritesContext } from '@/contexts/FavoritesContext'
import { propertyService } from '@/services/propertyService'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { MiniMap } from '@/components/map/MiniMap'
import { contactService } from '@/services/contactService'
import { shareService } from '@/services/shareService'
import { cn, formatArea, formatDate, getDisplayPrice } from '@/lib/utils'
import { OPERATION_LABELS, PROPERTY_TYPE_LABELS } from '@/constants'
import { PropertyOperation } from '@/types/enums'

interface PropertyDetailProps {
  property: Property
}

const AMENITY_MAP: { key: keyof Property['features']; label: string }[] = [
  { key: 'hasPool', label: 'Piscina' },
  { key: 'hasGym', label: 'Gimnasio' },
  { key: 'hasSecurity', label: 'Seguridad 24h' },
  { key: 'hasElevator', label: 'Ascensor' },
  { key: 'hasGarden', label: 'Jardín' },
  { key: 'hasBalcony', label: 'Balcón' },
  { key: 'hasTerrace', label: 'Terraza' },
  { key: 'hasFireplace', label: 'Chimenea' },
  { key: 'hasAirConditioning', label: 'Aire acondicionado' },
  { key: 'hasHeating', label: 'Calefacción' },
  { key: 'hasInternet', label: 'Internet' },
  { key: 'petFriendly', label: 'Mascotas permitidas' },
  { key: 'furnished', label: 'Amoblado' },
  { key: 'newConstruction', label: 'Nueva construcción' },
]

export function PropertyDetail({ property }: PropertyDetailProps) {
  const [currentImageIdx, setCurrentImageIdx] = useState(0)
  const { isFavorite, toggle } = useFavoritesContext()
  const fav = isFavorite(property.id)
  const { amount, suffix } = getDisplayPrice(property)
  const images = property.media.images
  const isRent = property.operation === PropertyOperation.RENT
  const amenities = AMENITY_MAP.filter(a => property.features[a.key])

  // Register the view once per client mount (server renders no longer count).
  useEffect(() => {
    propertyService.registerView(property.id)
  }, [property.id])

  function prevImage() { setCurrentImageIdx(i => (i === 0 ? images.length - 1 : i - 1)) }
  function nextImage() { setCurrentImageIdx(i => (i === images.length - 1 ? 0 : i + 1)) }

  async function handleShare() {
    await shareService.shareProperty(property)
  }

  function handleContact() {
    contactService.contactProperty(property)
  }

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="flex items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors">
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Volver al mapa</span>
        </Link>
        <div className="flex gap-2">
          <button
            onClick={() => toggle(property)}
            className={cn('p-2 rounded-lg border transition-all', fav ? 'border-accent text-accent bg-error/10' : 'border-outline-variant/60 text-on-surface-variant hover:border-accent hover:text-accent')}
          >
            <Heart size={18} fill={fav ? 'currentColor' : 'none'} className={fav ? 'animate-[heartPop_0.35s_cubic-bezier(0.34,1.56,0.64,1)]' : ''} />
          </button>
          <button onClick={handleShare} className="p-2 rounded-lg border border-outline-variant/60 text-on-surface-variant hover:border-primary hover:text-primary transition-all">
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* Image carousel */}
      <div className="relative h-80 md:h-[480px] bg-surface-container-high overflow-hidden md:rounded-2xl md:mx-4">
        {images.length > 0 ? (
          <>
            <Image
              src={images[currentImageIdx].url}
              alt={property.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 896px"
              priority
            />
            {images.length > 1 && (
              <>
                <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors">
                  <ChevronRight size={20} />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIdx(i)}
                      className={cn('w-2 h-2 rounded-full transition-all', i === currentImageIdx ? 'bg-white w-4' : 'bg-white/50')}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant">Sin imágenes</div>
        )}

        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant={isRent ? 'rent' : 'sale'}>{OPERATION_LABELS[property.operation]}</Badge>
          {property.listing.isPremium && <Badge variant="premium">⭐ Destacado</Badge>}
        </div>
      </div>

      <div className="p-4 md:p-6 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-1">
              <Building size={14} />
              <span>{PROPERTY_TYPE_LABELS[property.type]}</span>
              <span className="text-on-surface-variant/40">•</span>
              <MapPin size={14} />
              <span>{property.location.displayAddress ?? property.location.address.city}</span>
            </div>
            <h1 className="text-2xl font-bold text-on-surface">{property.title}</h1>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-headline text-4xl font-bold text-on-surface tracking-tight">{amount}</span>
              {suffix && <span className="text-on-surface-variant">{suffix}</span>}
              {property.pricing.isNegotiable && <span className="ml-2 text-sm text-on-surface-variant font-medium">• Negociable</span>}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-sm text-on-surface-variant">
            <span className="flex items-center gap-1"><Eye size={14} />{property.listing.views.toLocaleString()} vistas</span>
            <span className="flex items-center gap-1"><Heart size={14} />{property.listing.favorites} favoritos</span>
            <span className="flex items-center gap-1"><Calendar size={14} />Publicado {formatDate(property.listing.publishedAt)}</span>
          </div>

          {/* Features grid */}
          <div>
            <h2 className="font-semibold text-on-surface mb-3">Características</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {property.features.bedrooms !== undefined && (
                <div className="bg-surface-container rounded-xl p-3 text-center">
                  <Bed size={22} className="mx-auto text-primary mb-1" />
                  <div className="font-bold text-on-surface">{property.features.bedrooms}</div>
                  <div className="text-xs text-on-surface-variant">Dormitorio{property.features.bedrooms !== 1 ? 's' : ''}</div>
                </div>
              )}
              {property.features.bathrooms !== undefined && (
                <div className="bg-surface-container rounded-xl p-3 text-center">
                  <Bath size={22} className="mx-auto text-primary mb-1" />
                  <div className="font-bold text-on-surface">{property.features.bathrooms}</div>
                  <div className="text-xs text-on-surface-variant">Baño{property.features.bathrooms !== 1 ? 's' : ''}</div>
                </div>
              )}
              <div className="bg-surface-container rounded-xl p-3 text-center">
                <Move size={22} className="mx-auto text-primary mb-1" />
                <div className="font-bold text-on-surface">{property.features.area}</div>
                <div className="text-xs text-on-surface-variant">m² totales</div>
              </div>
              {property.features.parkingSpots !== undefined && (
                <div className="bg-surface-container rounded-xl p-3 text-center">
                  <span className="text-xl block mb-1">🅿️</span>
                  <div className="font-bold text-on-surface">{property.features.parkingSpots}</div>
                  <div className="text-xs text-on-surface-variant">Estacionamiento{property.features.parkingSpots !== 1 ? 's' : ''}</div>
                </div>
              )}
            </div>
          </div>

          {/* Additional info */}
          {(property.features.yearBuilt || property.features.floors) && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              {property.features.yearBuilt && (
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="text-on-surface-variant">Año:</span>
                  <span className="font-medium">{property.features.yearBuilt}</span>
                </div>
              )}
              {property.features.floors && (
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="text-on-surface-variant">Pisos:</span>
                  <span className="font-medium">{property.features.floors}</span>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <h2 className="font-semibold text-on-surface mb-2">Descripción</h2>
            <p className="text-on-surface-variant leading-relaxed text-sm">{property.description}</p>
          </div>

          {/* Amenities */}
          {amenities.length > 0 && (
            <div>
              <h2 className="font-semibold text-on-surface mb-3">Amenidades</h2>
              <div className="flex flex-wrap gap-2">
                {amenities.map(a => (
                  <span key={a.key} className="flex items-center gap-1 bg-secondary/10 text-secondary text-sm px-3 py-1 rounded-full font-medium">
                    ✓ {a.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {property.tags && property.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {property.tags.map(tag => (
                <Badge key={tag} variant="gray" size="sm">#{tag}</Badge>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: contact + map — sticky beside the content on desktop,
            stacked at the bottom on mobile */}
        <div className="space-y-4 md:sticky md:top-4 self-start">
          <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-4">
            <h2 className="font-semibold text-on-surface mb-3">Contactar</h2>

            <div className="flex items-center gap-3 mb-4">
              {property.contact.avatar ? (
                <img src={property.contact.avatar} alt={property.contact.name} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">
                  {property.contact.name.charAt(0)}
                </div>
              )}
              <div>
                <div className="flex items-center gap-1">
                  <p className="font-medium text-on-surface text-sm">{property.contact.name}</p>
                  {property.contact.isVerified && (
                    <Shield size={13} className="text-secondary" aria-label="Verificado" />
                  )}
                </div>
                {property.contact.responseTime && (
                  <p className="text-xs text-on-surface-variant">{property.contact.responseTime}</p>
                )}
                {property.contact.isVerified && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <Star size={11} className="text-primary fill-primary" />
                    <span className="text-xs text-on-surface-variant">Agente verificado</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {property.contact.whatsapp && (
                <Button fullWidth size="sm" variant="secondary" onClick={() => contactService.contactViaWhatsApp(property.contact)}>
                  <MessageCircle size={15} />
                  WhatsApp
                </Button>
              )}
              {property.contact.phone && (
                <Button fullWidth size="sm" variant="outline" onClick={() => contactService.contactViaPhone(property.contact)}>
                  <Phone size={15} />
                  Llamar
                </Button>
              )}
              {property.contact.email && (
                <Button fullWidth size="sm" variant="ghost" onClick={() => contactService.contactViaEmail(property.contact)}>
                  <Mail size={15} />
                  Email
                </Button>
              )}
            </div>

            {property.pricing.pricePerSquareMeter && (
              <div className="mt-4 pt-4 border-t border-outline-variant/60 text-sm text-on-surface-variant">
                <div className="flex justify-between">
                  <span>Precio por m²</span>
                  <span className="font-medium text-on-surface">
                    ${property.pricing.pricePerSquareMeter.toLocaleString('es-CL')} CLP
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Location map */}
          <div className="bg-surface-container-low border border-outline-variant/60 rounded-xl p-4">
            <h2 className="font-semibold text-on-surface mb-3">Ubicación</h2>
            <MiniMap latitude={property.location.latitude} longitude={property.location.longitude} />
            <p className="text-sm text-on-surface-variant mt-3 flex items-start gap-1.5">
              <MapPin size={14} className="shrink-0 mt-0.5" />
              <span>{property.location.displayAddress ?? `${property.location.address.street} ${property.location.address.number ?? ''}, ${property.location.address.city}`}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-16 md:hidden left-0 right-0 p-3 bg-surface-container-low/95 backdrop-blur-md border-t border-outline-variant/60 shadow-xl flex items-center gap-3">
        <div className="min-w-0">
          <p className="font-headline font-bold text-on-surface text-lg leading-tight truncate">{amount}{suffix && <span className="text-on-surface-variant text-xs font-normal">{suffix}</span>}</p>
          <p className="text-[10px] uppercase tracking-wider text-on-surface-variant">{OPERATION_LABELS[property.operation]}</p>
        </div>
        <Button size="lg" onClick={handleContact} className="flex-1">
          <Phone size={18} />
          Contactar
        </Button>
      </div>
    </div>
  )
}
