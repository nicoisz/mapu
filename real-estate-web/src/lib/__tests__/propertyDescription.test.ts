import { afterEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/property-description/route'
import { basicPropertyDescription, descriptionInputSchema } from '../propertyDescription'

vi.mock('@/lib/supabase', () => ({
  getSupabase: () => ({
    auth: { getUser: async () => ({ data: { user: { id: crypto.randomUUID() } }, error: null }) },
  }),
}))
afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})
const input = {
  type: 'house',
  operation: 'rent',
  commune: 'Ñuñoa',
  area: '120',
  price: '850000',
  bedrooms: '3',
  bathrooms: '',
  parkingSpots: '0',
  negotiable: true,
}
const request = (authenticated = true) =>
  new NextRequest('http://localhost/api/property-description', {
    method: 'POST',
    headers: authenticated ? { Authorization: 'Bearer test' } : {},
    body: JSON.stringify(input),
  })

it('creates a factual fallback, omits absent features and rejects unauthenticated generation', async () => {
  vi.stubEnv('GEMINI_API_KEY', '')
  expect((await POST(request(false))).status).toBe(401)
  const result = await (await POST(request())).json()
  expect(result.source).toBe('data')
  expect(result.description).toContain('120 m²')
  expect(result.description).toContain('3 dormitorios')
  expect(result.description).not.toContain('baños')
  expect(result.description).toBe(basicPropertyDescription(descriptionInputSchema.parse(input)))
})

it('uses the server key for AI and falls back when the provider fails', async () => {
  vi.stubEnv('GEMINI_API_KEY', 'server-only-key')
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: 'Descripción de prueba.' }] } }],
        })
      )
    )
    .mockResolvedValueOnce(new Response('', { status: 429 }))
  vi.stubGlobal('fetch', fetchMock)
  expect(await (await POST(request())).json()).toEqual({
    description: 'Descripción de prueba.',
    source: 'ai',
  })
  expect(fetchMock.mock.calls[0][1].headers['x-goog-api-key']).toBe('server-only-key')
  expect((await (await POST(request())).json()).source).toBe('data')
})
