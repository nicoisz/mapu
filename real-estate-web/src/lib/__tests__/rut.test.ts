import { describe, it, expect } from 'vitest'
import { formatRut, validateRut } from '@/lib/rut'

describe('formatRut', () => {
  it('formatea en vivo', () => {
    expect(formatRut('12345678K')).toBe('12.345.678-K')
    expect(formatRut('123456789')).toBe('12.345.678-9')
  })

  it('tolera puntos, guiones y espacios', () => {
    expect(formatRut('12.345.678-9')).toBe('12.345.678-9')
    expect(formatRut('12345678 k')).toBe('12.345.678-K')
  })

  it('maneja RUT corto (aún escribiendo)', () => {
    expect(formatRut('12')).toBe('12')
    expect(formatRut('123')).toBe('123')
  })
})

describe('validateRut', () => {
  it('acepta RUT válidos (con y sin formato)', () => {
    expect(validateRut('12.345.678-5')).toBe(true)
    expect(validateRut('123456785')).toBe(true)
    expect(validateRut('7.607.401-1')).toBe(true)
    expect(validateRut('11.111.111-1')).toBe(true)
  })

  it('acepta dígito K', () => {
    expect(validateRut('12.225.318-K')).toBe(true)
  })

  it('rechaza RUT inválidos', () => {
    expect(validateRut('12.345.678-9')).toBe(false)
    expect(validateRut('1.111.111-1')).toBe(false)
    expect(validateRut('abc')).toBe(false)
    expect(validateRut('')).toBe(false)
  })
})
