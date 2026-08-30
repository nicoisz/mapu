import { describe, it, expect } from 'vitest'
import { rowToProperty, propertyToRow, PropertyRow } from '@/lib/propertyMapper'

const baseRow = (over: Partial<PropertyRow> = {}): PropertyRow => ({
  id: 'p1',
  owner_id: 'u1',
  organization_id: null,
  title: 'Casa en Ñuñoa',
  description: '',
  type: 'house',
  operation: 'sale',
  status: 'active',
  latitude: -33.45,
  longitude: -70.6,
  address_street: 'Av. Irarrázaval',
  address_number: '1234',
  address_commune: 'Ñuñoa',
  address_city: 'Santiago',
  address_region: 'Metropolitana',
  price: 200000000,
  currency: 'CLP',
  area: 120,
  bedrooms: 3,
  images: [],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...over,
} as PropertyRow)

describe('parseImages', () => {
  it('tolera array de strings (esquema móvil)', () => {
    const row = baseRow({ images: ['https://x/img1.jpg', 'https://x/img2.jpg'] })
    const images = rowToProperty(row).media.images
    expect(images).toHaveLength(2)
    expect(images[0].url).toBe('https://x/img1.jpg')
    expect(images[0].isMain).toBe(true)
    expect(images[1].isMain).toBe(false)
  })

  it('tolera array de objetos (web)', () => {
    const row = baseRow({
      images: [{ id: 'a/b.jpg', url: 'https://x/b.jpg', order: 1, isMain: false }],
    })
    const images = rowToProperty(row).media.images
    expect(images).toHaveLength(1)
    expect(images[0].id).toBe('a/b.jpg')
    expect(images[0].order).toBe(1)
  })

  it('descarta entradas sin url', () => {
    const row = baseRow({ images: [{ id: 'x', url: '' }] })
    expect(rowToProperty(row).media.images).toHaveLength(0)
  })
})

describe('rowToProperty', () => {
  it('compone la dirección completa', () => {
    const p = rowToProperty(baseRow())
    expect(p.location.displayAddress).toContain('Av. Irarrázaval 1234')
    expect(p.location.displayAddress).toContain('Ñuñoa')
  })

  it('redondea price a number', () => {
    expect(rowToProperty(baseRow()).pricing.price).toBe(200000000)
  })

  it('usa published_at si existe', () => {
    const p = rowToProperty(baseRow({ published_at: '2026-02-01T00:00:00Z' }))
    expect(p.listing.publishedAt).toBe('2026-02-01T00:00:00Z')
  })
})

describe('propertyToRow', () => {
  it('asigna owner al publicar', () => {
    const row = propertyToRow({ title: 'X' }, 'u9')
    expect(row.owner_id).toBe('u9')
  })

  it('no setea owner_id si no se pasa', () => {
    const row = propertyToRow({ title: 'X' })
    expect(row.owner_id).toBeUndefined()
  })
})
