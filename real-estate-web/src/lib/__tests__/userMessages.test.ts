import { describe, it, expect } from 'vitest'
import { translateError, toUserMessage, rethrowUserError } from '@/lib/userMessages'

describe('translateError', () => {
  it('traduce credenciales incorrectas', () => {
    expect(translateError('Invalid login credentials')).toBe('Credenciales incorrectas')
  })

  it('traduce error de RLS/permission', () => {
    expect(translateError('new row violates row-level security policy')).toContain('permisos')
  })

  it('traduce unique violation', () => {
    expect(translateError('duplicate key value violates unique constraint "x"')).toContain(
      'Ya existe'
    )
  })

  it('traduce fallo de red', () => {
    expect(translateError('fetch failed')).toContain('No se pudo conectar')
  })

  it('traduce rate limit', () => {
    expect(translateError('over_email_send_rate_limit')).toContain('Demasiados intentos')
  })

  it('deja mensajes desconocidos intactos', () => {
    expect(translateError('algo raro')).toBe('algo raro')
  })

  it('devuelve fallback para vacío', () => {
    expect(translateError('')).toBe('Ocurrió un error')
  })
})

describe('toUserMessage', () => {
  it('maneja Error', () => {
    expect(toUserMessage(new Error('Invalid login credentials'))).toBe('Credenciales incorrectas')
  })

  it('maneja string', () => {
    expect(toUserMessage('fetch failed')).toContain('No se pudo conectar')
  })

  it('maneja objeto con message', () => {
    expect(toUserMessage({ message: 'timeout' })).toContain('tardó demasiado')
  })

  it('maneja null con fallback', () => {
    expect(toUserMessage(null)).toBe('Ocurrió un error inesperado')
  })
})

describe('rethrowUserError', () => {
  it('re-lanza un Error traducido', () => {
    expect(() => rethrowUserError({ message: 'permission denied for table profiles' })).toThrow(
      /permisos/
    )
  })
})
