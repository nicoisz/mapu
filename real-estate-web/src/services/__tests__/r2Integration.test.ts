import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { getPlatformProxy } from 'wrangler'
import { NextRequest } from 'next/server'
import { POST, DELETE } from '@/app/api/property-images/route'
import { GET } from '@/app/api/property-images/[...key]/route'

const state = vi.hoisted(() => ({ bucket: null as CloudflareEnv['PROPERTY_IMAGES'] | null }))
vi.mock('@/lib/supabase', () => ({
  getSupabase: () => ({
    auth: {
      getUser: async () => ({
        data: { user: { id: '12345678-1234-4234-8234-123456789abc' } },
        error: null,
      }),
    },
  }),
}))
vi.mock('@/lib/server/propertyImageBucket', async (original) => ({
  ...(await original<typeof import('@/lib/server/propertyImageBucket')>()),
  propertyImageBucket: async () => state.bucket!,
}))
let dispose: (() => Promise<void>) | undefined

beforeAll(async () => {
  const platform = await getPlatformProxy<CloudflareEnv>({
    configPath: 'wrangler.jsonc',
    persist: false,
  })
  state.bucket = platform.env.PROPERTY_IMAGES
  dispose = platform.dispose
}, 30_000)
afterAll(async () => {
  await dispose?.()
})

it('round-trips upload, public streaming, conditional read and deletion through real local R2', async () => {
  const bytes = Buffer.from('UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA', 'base64')
  const body = new FormData()
  body.append('file', new File([bytes], 'foto.webp', { type: 'image/webp' }))
  const upload = await POST(
    new NextRequest('http://localhost/api/property-images', {
      method: 'POST',
      headers: { Authorization: 'Bearer test' },
      body,
    })
  )
  expect(upload.status).toBe(201)
  const image = await upload.json()
  const context = { params: Promise.resolve({ key: image.id.slice(3).split('/') }) }
  const read = await GET(new NextRequest(image.url), context)
  expect(read.status).toBe(200)
  expect(Buffer.from(await read.arrayBuffer())).toEqual(bytes)
  expect(read.headers.get('content-type')).toBe('image/webp')
  const conditional = await GET(
    new NextRequest(image.url, { headers: { 'if-none-match': read.headers.get('etag')! } }),
    context
  )
  expect(conditional.status).toBe(304)
  const deletion = await DELETE(
    new NextRequest('http://localhost/api/property-images', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer test' },
      body: JSON.stringify({ ids: [image.id] }),
    })
  )
  expect(deletion.status).toBe(200)
  expect((await GET(new NextRequest(image.url), context)).status).toBe(404)
}, 30_000)
