import { describe, it, expect } from 'vitest'
import { computePriceZones } from '@/lib/priceZones'
import { Currency, PropertyOperation, PropertyType, PropertyStatus } from '@/types/enums'
import { Property } from '@/types/property'

/** Propiedad mínima: solo lo que `computePriceZones` mira. */
function property(overrides: {
  lat: number
  lng: number
  price: number
  operation: PropertyOperation
  currency?: Currency
  monthlyRent?: number
}): Property {
  const { lat, lng, price, operation, currency = Currency.CLP, monthlyRent } = overrides
  return {
    id: `${lat}:${lng}:${price}`,
    title: 'Propiedad de prueba',
    description: '',
    type: PropertyType.APARTMENT,
    operation,
    status: PropertyStatus.ACTIVE,
    location: { latitude: lat, longitude: lng, address: {} },
    pricing: { price, currency, monthlyRent },
    features: { area: 50 },
    media: { images: [] },
  } as unknown as Property
}

const SANTIAGO = { lat: -33.4489, lng: -70.6693 }

describe('computePriceZones — operación', () => {
  it('ignora las propiedades de la otra operación', () => {
    const properties = [
      property({ ...SANTIAGO, price: 100_000_000, operation: PropertyOperation.SALE }),
      property({
        lat: SANTIAGO.lat,
        lng: SANTIAGO.lng,
        price: 100_000_000,
        operation: PropertyOperation.RENT,
        monthlyRent: 500_000,
      }),
    ]

    const rent = computePriceZones(properties, 'rent')
    expect(rent.cells).toHaveLength(1)
    expect(rent.cells[0].count).toBe(1)
    // Sin el filtro, el precio de venta entraba como fallback y el promedio
    // de arriendos se iba a 50 millones.
    expect(rent.cells[0].meanPrice).toBe(500_000)

    const sale = computePriceZones(properties, 'sale')
    expect(sale.cells[0].count).toBe(1)
    expect(sale.cells[0].meanPrice).toBe(100_000_000)
  })

  it('devuelve vacío cuando no hay propiedades de esa operación', () => {
    const properties = [property({ ...SANTIAGO, price: 1, operation: PropertyOperation.SALE })]
    expect(computePriceZones(properties, 'rent').cells).toHaveLength(0)
  })
})

describe('computePriceZones — moneda', () => {
  it('agrega solo la moneda dominante y la reporta en la leyenda', () => {
    const properties = [
      property({ ...SANTIAGO, price: 100_000_000, operation: PropertyOperation.SALE }),
      property({ ...SANTIAGO, price: 200_000_000, operation: PropertyOperation.SALE }),
      property({
        ...SANTIAGO,
        price: 300_000,
        operation: PropertyOperation.SALE,
        currency: Currency.USD,
      }),
    ]

    const { cells, legend } = computePriceZones(properties, 'sale')
    expect(legend.currency).toBe(Currency.CLP)
    expect(cells[0].count).toBe(2)
    // Si la propiedad en USD entrara, el promedio caería a ~100 millones.
    expect(cells[0].meanPrice).toBe(150_000_000)
  })

  it('usa la moneda mayoritaria cuando no es CLP', () => {
    const properties = [
      property({
        ...SANTIAGO,
        price: 300_000,
        operation: PropertyOperation.SALE,
        currency: Currency.USD,
      }),
      property({
        ...SANTIAGO,
        price: 500_000,
        operation: PropertyOperation.SALE,
        currency: Currency.USD,
      }),
      property({ ...SANTIAGO, price: 100_000_000, operation: PropertyOperation.SALE }),
    ]

    const { cells, legend } = computePriceZones(properties, 'sale')
    expect(legend.currency).toBe(Currency.USD)
    expect(cells[0].count).toBe(2)
  })
})

describe('computePriceZones — terciles', () => {
  it('reparte los sectores en económica, media y premium', () => {
    // Celdas separadas ~2 km para que caigan en hexágonos distintos.
    const properties = [
      property({ lat: -33.44, lng: -70.66, price: 50_000_000, operation: PropertyOperation.SALE }),
      property({ lat: -33.46, lng: -70.68, price: 150_000_000, operation: PropertyOperation.SALE }),
      property({ lat: -33.48, lng: -70.7, price: 400_000_000, operation: PropertyOperation.SALE }),
    ]

    const { cells, legend } = computePriceZones(properties, 'sale')
    expect(cells).toHaveLength(3)
    expect(cells.map((c) => c.bucket).sort()).toEqual(['economic', 'mid', 'premium'])
    expect(legend.ranges.economic).toEqual([50_000_000, 50_000_000])
    expect(legend.ranges.premium).toEqual([400_000_000, 400_000_000])
  })
})
