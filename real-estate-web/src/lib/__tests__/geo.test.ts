import { describe, it, expect } from 'vitest'
import { isInsideChile, isSamePoint, CHILE_BOUNDS } from '@/lib/geo'
import { DEFAULT_MAP_CENTER } from '@/constants'

describe('isInsideChile', () => {
  it('acepta ciudades del continente', () => {
    expect(isInsideChile(-33.4489, -70.6693)).toBe(true) // Santiago
    expect(isInsideChile(-39.8142, -73.2459)).toBe(true) // Valdivia
    expect(isInsideChile(-18.4783, -70.3126)).toBe(true) // Arica
    expect(isInsideChile(-53.1625, -70.9081)).toBe(true) // Punta Arenas
  })

  it('acepta el territorio insular', () => {
    expect(isInsideChile(-27.1127, -109.3497)).toBe(true) // Isla de Pascua
    expect(isInsideChile(-33.6389, -78.8306)).toBe(true) // Juan Fernández
  })

  it('rechaza el (0,0) y coordenadas de otros países', () => {
    expect(isInsideChile(0, 0)).toBe(false)
    expect(isInsideChile(-34.6037, -58.3816)).toBe(false) // Buenos Aires
    expect(isInsideChile(-12.0464, -77.0428)).toBe(false) // Lima
    expect(isInsideChile(40.7128, -74.006)).toBe(false) // Nueva York
  })

  it('rechaza valores no finitos', () => {
    expect(isInsideChile(NaN, -70)).toBe(false)
    expect(isInsideChile(-33, Infinity)).toBe(false)
  })

  it('incluye los bordes de la caja', () => {
    expect(isInsideChile(CHILE_BOUNDS.minLat, CHILE_BOUNDS.minLng)).toBe(true)
    expect(isInsideChile(CHILE_BOUNDS.maxLat, CHILE_BOUNDS.maxLng)).toBe(true)
  })
})

describe('isSamePoint', () => {
  it('detecta el centro por defecto', () => {
    expect(
      isSamePoint(DEFAULT_MAP_CENTER.latitude, DEFAULT_MAP_CENTER.longitude, DEFAULT_MAP_CENTER)
    ).toBe(true)
  })

  it('tolera ruido de redondeo pero no una cuadra de diferencia', () => {
    expect(
      isSamePoint(
        DEFAULT_MAP_CENTER.latitude + 0.00001,
        DEFAULT_MAP_CENTER.longitude,
        DEFAULT_MAP_CENTER
      )
    ).toBe(true)
    expect(
      isSamePoint(
        DEFAULT_MAP_CENTER.latitude + 0.002,
        DEFAULT_MAP_CENTER.longitude,
        DEFAULT_MAP_CENTER
      )
    ).toBe(false)
  })
})
