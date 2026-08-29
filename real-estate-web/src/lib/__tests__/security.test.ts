import { describe, it, expect } from 'vitest'
import { safeRedirectPath } from '@/lib/redirect'
import { adminAccessStatus, canAccessAdmin } from '@/lib/access'
import { PlatformRole } from '@/types/enums'
import { User } from '@/types/user'

const user = (platformRole: PlatformRole): User => ({ platformRole } as User)

describe('safeRedirectPath', () => {
  it('devuelve / para null o vacío', () => {
    expect(safeRedirectPath(null)).toBe('/')
    expect(safeRedirectPath('')).toBe('/')
  })

  it('conserva rutas internas absolutas', () => {
    expect(safeRedirectPath('/admin')).toBe('/admin')
    expect(safeRedirectPath('/admin/usuarios')).toBe('/admin/usuarios')
    expect(safeRedirectPath('/dashboard?tab=x')).toBe('/dashboard?tab=x')
  })

  it('rechaza protocolo-relative //', () => {
    expect(safeRedirectPath('//evil.com')).toBe('/')
    expect(safeRedirectPath('//evil.com/steal')).toBe('/')
  })

  it('rechaza esquemas http/https/javascript', () => {
    expect(safeRedirectPath('http://evil.com')).toBe('/')
    expect(safeRedirectPath('https://evil.com')).toBe('/')
    expect(safeRedirectPath('javascript:alert(1)')).toBe('/')
  })

  it('rechaza backslash y control chars', () => {
    expect(safeRedirectPath('/\\evil.com')).toBe('/')
    expect(safeRedirectPath('\\evil.com')).toBe('/')
  })

  it('rechaza protocolo-relative codificado (bypass %2f%2f)', () => {
    expect(safeRedirectPath('/%2f%2fevil.com')).toBe('/')
    expect(safeRedirectPath('/%5c%5cevil.com')).toBe('/')
    expect(safeRedirectPath('%2f%2fevil.com')).toBe('/')
  })

  it('rechaza decode inválido', () => {
    expect(safeRedirectPath('/%zz')).toBe('/')
  })
})

describe('adminAccessStatus', () => {
  const superadmin = user(PlatformRole.SUPERADMIN)
  const normal = user(PlatformRole.USER)

  it('loading mientras carga la sesión', () => {
    expect(adminAccessStatus({ isLoading: true, user: null })).toBe('loading')
    expect(adminAccessStatus({ isLoading: true, user: normal })).toBe('loading')
  })

  it('redirect cuando no hay sesión', () => {
    expect(adminAccessStatus({ isLoading: false, user: null })).toBe('redirect')
  })

  it('blocked para usuario autenticado sin rol', () => {
    expect(adminAccessStatus({ isLoading: false, user: normal })).toBe('blocked')
  })

  it('allow solo para superadmin', () => {
    expect(adminAccessStatus({ isLoading: false, user: superadmin })).toBe('allow')
  })
})

describe('canAccessAdmin', () => {
  it('solo superadmin', () => {
    expect(canAccessAdmin(user(PlatformRole.SUPERADMIN))).toBe(true)
    expect(canAccessAdmin(user(PlatformRole.USER))).toBe(false)
    expect(canAccessAdmin(null)).toBe(false)
  })
})
