import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Currency, PropertyOperation } from '@/types/enums'
import { Property } from '@/types/property'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number, currency: Currency): string {
  if (currency === Currency.CLP) {
    return `$${price.toLocaleString('es-CL')} CLP`
  }
  return `USD ${price.toLocaleString('en-US')}`
}

export function formatPriceShort(price: number, currency: Currency): string {
  if (currency === Currency.CLP) {
    if (price >= 1_000_000_000) return `$${(price / 1_000_000_000).toFixed(1)}MM`
    if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(0)}M`
    return `$${(price / 1_000).toFixed(0)}k`
  }
  if (price >= 1_000) return `$${(price / 1_000).toFixed(0)}k`
  return `$${price}`
}

export function getDisplayPrice(property: Property): { amount: string; suffix?: string } {
  const { pricing, operation } = property
  if (operation === PropertyOperation.RENT && pricing.monthlyRent) {
    return {
      amount: formatPrice(pricing.monthlyRent, pricing.currency),
      suffix: '/mes',
    }
  }
  return { amount: formatPrice(pricing.price, pricing.currency) }
}

export function getMapPinPrice(property: Property): string {
  const { pricing, operation } = property
  const price =
    operation === PropertyOperation.RENT ? (pricing.monthlyRent ?? pricing.price) : pricing.price
  return formatPriceShort(price, pricing.currency)
}

export function formatArea(area: number): string {
  return `${area.toLocaleString('es-CL')} m²`
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function getRemainingDays(expiresAt: string): number {
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000)
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const clean = phone.replace(/\D/g, '')
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
}

export function buildShareText(property: Property): string {
  const { pricing, operation } = property
  const price =
    operation === PropertyOperation.RENT ? (pricing.monthlyRent ?? pricing.price) : pricing.price
  const priceStr = formatPrice(price, pricing.currency)
  const suffix = operation === PropertyOperation.RENT ? '/mes' : ''
  return `${property.title}\n${priceStr}${suffix}\n${property.location.displayAddress ?? property.location.address.city}`
}
