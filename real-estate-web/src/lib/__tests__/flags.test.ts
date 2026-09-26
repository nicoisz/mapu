import { describe, it, expect, afterEach, vi } from 'vitest'

/** Los flags se evalúan al cargar el módulo, así que cada caso reimporta. */
async function loadFlags(env: Record<string, string | undefined>) {
  vi.resetModules()
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  return (await import('@/lib/flags')).flags
}

const ALL = [
  'NEXT_PUBLIC_FEATURE_CONTEXTO',
  'NEXT_PUBLIC_FEATURE_MIS_LUGARES',
  'NEXT_PUBLIC_FEATURE_VALOR',
]

afterEach(() => {
  for (const key of ALL) delete process.env[key]
  vi.resetModules()
})

describe('flags', () => {
  it('están apagados cuando no hay variables definidas', async () => {
    const flags = await loadFlags(Object.fromEntries(ALL.map((k) => [k, undefined])))
    expect(flags.contexto).toBe(false)
    expect(flags.misLugares).toBe(false)
    expect(flags.valor).toBe(false)
  })

  it('se encienden con "true" o "1"', async () => {
    const flags = await loadFlags({
      NEXT_PUBLIC_FEATURE_CONTEXTO: 'true',
      NEXT_PUBLIC_FEATURE_MIS_LUGARES: '1',
    })
    expect(flags.contexto).toBe(true)
    expect(flags.misLugares).toBe(true)
  })

  it('ignora cualquier otro valor (no enciende por accidente)', async () => {
    const flags = await loadFlags({
      NEXT_PUBLIC_FEATURE_CONTEXTO: 'false',
      NEXT_PUBLIC_FEATURE_MIS_LUGARES: 'yes',
      NEXT_PUBLIC_FEATURE_VALOR: '',
    })
    expect(flags.contexto).toBe(false)
    expect(flags.misLugares).toBe(false)
    expect(flags.valor).toBe(false)
  })
})
