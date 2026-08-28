import { describe, it, expect } from 'vitest'
import {
  computePriceZones,
  zonesToGeoJSON,
  easeOutElastic,
  scaleZoneGeometry,
  ZoneMode,
} from '@/lib/priceZones'
import { searchService } from '@/services/searchService'
import { Property } from '@/types/property'
import {
  PropertyOperation,
  PropertyStatus,
  PropertyType,
  ChileanRegion,
  Currency,
} from '@/types/enums'

function makeProperty(overrides: Partial<Property>): Property {
  return {
    id: 'p1',
    title: 'Test',
    description: 'x',
    type: PropertyType.HOUSE,
    operation: PropertyOperation.SALE,
    status: PropertyStatus.ACTIVE,
    ownerId: 'u1',
    location: {
      latitude: -33.4,
      longitude: -70.6,
      address: {
        street: 'Calle 1',
        city: 'Santiago',
        region: ChileanRegion.METROPOLITANA,
        country: 'Chile',
      },
    },
    pricing: { price: 100_000_000, currency: Currency.CLP, isNegotiable: false },
    features: { area: 100 },
    media: { images: [] },
    contact: { id: 'c1', name: 'Owner', preferredMethod: 'email' as never, isVerified: false },
    listing: {
      publishedAt: '2026-01-01',
      lastUpdated: '2026-01-01',
      views: 0,
      favorites: 0,
      inquiries: 0,
      isPremium: false,
      isHighlighted: false,
      isFeatured: false,
      completenessScore: 50,
      qualityScore: 50,
    },
    ...overrides,
  }
}

describe('computePriceZones', () => {
  it('devuelve buckets por terciles: económica, media, premium', () => {
    // 6 celdas: 2 baratas, 2 medias, 2 caras (misma celda = misma media)
    const props = [
      makeProperty({
        id: 'a1',
        pricing: { price: 50_000_000, currency: Currency.CLP, isNegotiable: false },
      }),
      makeProperty({
        id: 'a2',
        pricing: { price: 60_000_000, currency: Currency.CLP, isNegotiable: false },
      }),
      makeProperty({
        id: 'b1',
        pricing: { price: 100_000_000, currency: Currency.CLP, isNegotiable: false },
      }),
      makeProperty({
        id: 'b2',
        pricing: { price: 110_000_000, currency: Currency.CLP, isNegotiable: false },
      }),
      makeProperty({
        id: 'c1',
        pricing: { price: 300_000_000, currency: Currency.CLP, isNegotiable: false },
      }),
      makeProperty({
        id: 'c2',
        pricing: { price: 400_000_000, currency: Currency.CLP, isNegotiable: false },
      }),
    ]
    // Muevo cada par a una celda distinta (separadas en lat/lng)
    props[0].location.latitude = -33.4
    props[0].location.longitude = -70.6
    props[1].location.latitude = -33.4
    props[1].location.longitude = -70.6
    props[2].location.latitude = -33.45
    props[2].location.longitude = -70.6
    props[3].location.latitude = -33.45
    props[3].location.longitude = -70.6
    props[4].location.latitude = -33.5
    props[4].location.longitude = -70.6
    props[5].location.latitude = -33.5
    props[5].location.longitude = -70.6

    const { cells } = computePriceZones(props, 'sale')
    expect(cells).toHaveLength(3)
    const byMean = Object.fromEntries(cells.map((c) => [c.meanPrice, c.bucket]))
    expect(byMean[55_000_000]).toBe('economic')
    expect(byMean[105_000_000]).toBe('mid')
    expect(byMean[350_000_000]).toBe('premium')
  })

  it('usa monthly_rent para modo rent', () => {
    const props = [
      makeProperty({
        operation: PropertyOperation.RENT,
        pricing: {
          price: 100_000_000,
          monthlyRent: 500_000,
          currency: Currency.CLP,
          isNegotiable: false,
        },
      }),
      makeProperty({
        operation: PropertyOperation.RENT,
        pricing: {
          price: 200_000_000,
          monthlyRent: 1_500_000,
          currency: Currency.CLP,
          isNegotiable: false,
        },
      }),
    ]
    props[0].location.latitude = -33.4
    props[0].location.longitude = -70.6
    props[1].location.latitude = -33.45
    props[1].location.longitude = -70.6
    const { cells } = computePriceZones(props, 'rent')
    expect(cells).toHaveLength(2)
    expect(Math.min(...cells.map((c) => c.meanPrice))).toBe(500_000)
    expect(Math.max(...cells.map((c) => c.meanPrice))).toBe(1_500_000)
  })

  it('genera GeoJSON válido con polygons', () => {
    const props = [makeProperty({ id: 'x1' })]
    const { cells } = computePriceZones(props, 'sale')
    const fc = zonesToGeoJSON(cells)
    expect(fc.type).toBe('FeatureCollection')
    expect(fc.features[0].geometry.type).toBe('Polygon')
    const coords = (fc.features[0].geometry as GeoJSON.Polygon).coordinates[0]
    expect(coords.length).toBe(7) // 6 vértices + cierre
  })

  it('ubica el centro de la celda cerca de la propiedad (inversa correcta)', () => {
    // Santiago: la celda resultante debe quedar en lat ~-33, no cerca del ecuador.
    const p = makeProperty({
      id: 'scl',
      location: {
        latitude: -33.4489,
        longitude: -70.6693,
        address: {
          street: 'Av. Las Condes',
          city: 'Santiago',
          region: ChileanRegion.METROPOLITANA,
          country: 'Chile',
        },
      },
    })
    const { cells } = computePriceZones([p], 'sale')
    expect(cells).toHaveLength(1)
    const c = cells[0]
    expect(c.center.lat).toBeLessThan(-30)
    expect(c.center.lat).toBeGreaterThan(-45)
    expect(c.center.lng).toBeLessThan(-60)
    // Centro a menos de ~2 radios de la propiedad.
    const dLat = Math.abs(c.center.lat - p.location.latitude)
    const dLng = Math.abs(c.center.lng - p.location.longitude)
    expect(dLat).toBeLessThan(0.05)
    expect(dLng).toBeLessThan(0.05)
  })
})

describe('easeOutElastic', () => {
  it('comienza en 0 y termina en 1', () => {
    expect(easeOutElastic(0)).toBe(0)
    expect(easeOutElastic(1)).toBe(1)
  })
  it('overshoots por encima de 1 a mitad de curva', () => {
    expect(easeOutElastic(0.5)).toBeGreaterThan(1)
  })
})

describe('scaleZoneGeometry', () => {
  it('escala vértices alrededor del centro', () => {
    const verts: [number, number][] = [
      [1, 2],
      [3, 2],
      [2, 4],
    ]
    const center = { lat: 2, lng: 2 }
    const scaled = scaleZoneGeometry(verts, center, 2)
    expect(scaled[0]).toEqual([0, 2])
    expect(scaled[1]).toEqual([4, 2])
    expect(scaled[2]).toEqual([2, 6])
  })
})

describe('searchService.parseSearchText', () => {
  it('extrae tipo y operación de keywords', () => {
    const r = searchService.parseSearchText('casa en arriendo Providencia')
    expect(r.implicitFilters.type).toContain(PropertyType.HOUSE)
    expect(r.implicitFilters.operation).toBe(PropertyOperation.RENT)
  })

  it('extrae dormitorios del patrón 3d', () => {
    const r = searchService.parseSearchText('departamento 3d')
    expect(r.implicitFilters.bedrooms).toEqual({ min: 3 })
  })

  it('deja texto limpio sin las keywords consumidas', () => {
    const r = searchService.parseSearchText('casa venta Las Condes')
    expect(r.cleanText).toBe('las condes')
  })
})
