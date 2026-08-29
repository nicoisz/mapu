import { describe, it, expect } from 'vitest'
import { canManageRole } from '@/lib/roles'

describe('canManageRole', () => {
  it('owner gestiona admin y agent', () => {
    expect(canManageRole('owner', 'admin')).toBe(true)
    expect(canManageRole('owner', 'agent')).toBe(true)
  })

  it('owner no se gestiona a sí mismo', () => {
    expect(canManageRole('owner', 'owner')).toBe(false)
  })

  it('admin gestiona solo agent', () => {
    expect(canManageRole('admin', 'agent')).toBe(true)
    expect(canManageRole('admin', 'admin')).toBe(false)
    expect(canManageRole('admin', 'owner')).toBe(false)
  })

  it('agent no gestiona a nadie', () => {
    expect(canManageRole('agent', 'agent')).toBe(false)
    expect(canManageRole('agent', 'admin')).toBe(false)
    expect(canManageRole('agent', 'owner')).toBe(false)
  })

  it('sin rol no gestiona nada', () => {
    expect(canManageRole(undefined, 'agent')).toBe(false)
  })
})
