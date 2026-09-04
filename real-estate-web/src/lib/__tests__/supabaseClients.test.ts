import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn().mockReturnValue({}),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}))

import { getSupabaseServerUser } from '@/lib/supabase/server-user'
import { getPublicSupabaseConfig } from '@/lib/env/public'

interface ClientOptions {
  global?: { headers?: { Authorization?: string } }
  auth?: { persistSession?: boolean; autoRefreshToken?: boolean; detectSessionInUrl?: boolean }
}

describe('getSupabaseServerUser', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://xyz.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_KEY = 'anon-key'
    createClientMock.mockClear()
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_KEY
  })

  it('propaga el JWT en Authorization y desactiva persistencia/refresh/detección', () => {
    getSupabaseServerUser('test-jwt')
    const [url, key, options] = createClientMock.mock.calls[0] as [string, string, ClientOptions]

    expect(url).toBe('https://xyz.supabase.co')
    expect(key).toBe('anon-key')
    expect(options.global?.headers?.Authorization).toBe('Bearer test-jwt')
    expect(options.auth?.persistSession).toBe(false)
    expect(options.auth?.autoRefreshToken).toBe(false)
    expect(options.auth?.detectSessionInUrl).toBe(false)
  })
})

describe('getPublicSupabaseConfig', () => {
  it('falla de forma controlada cuando faltan variables (sin exponer valores)', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_KEY

    expect(() => getPublicSupabaseConfig()).toThrow('NEXT_PUBLIC_SUPABASE_URL')
    // El mensaje no debe incluir el valor de la variable.
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'super-secreto-url'
    try {
      getPublicSupabaseConfig()
    } catch (e) {
      expect((e as Error).message).not.toContain('super-secreto-url')
    }
  })
})
