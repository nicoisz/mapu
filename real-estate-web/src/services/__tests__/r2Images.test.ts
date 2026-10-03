import { beforeEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST, DELETE } from '@/app/api/property-images/route'
import { GET } from '@/app/api/property-images/[...key]/route'

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), put: vi.fn(), get: vi.fn(), delete: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ getSupabase: () => ({ auth: { getUser: mocks.getUser } }) }))
vi.mock('@/lib/server/propertyImageBucket', async (original) => ({
  ...(await original<typeof import('@/lib/server/propertyImageBucket')>()),
  propertyImageBucket: async () => mocks,
}))
const uid = '12345678-1234-4234-8234-123456789abc'
const key = `${uid}/22345678-1234-4234-8234-123456789abc.webp`
const image = () =>
  new File([new Uint8Array([82, 73, 70, 70, 4, 0, 0, 0, 87, 69, 66, 80])], 'foto.webp', {
    type: 'image/webp',
  })
function upload(file = image(), token = 'valid') {
  const body = new FormData()
  body.append('file', file)
  return new NextRequest('http://localhost/api/property-images', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body,
  })
}
function deletion(ids: string[]) {
  return new NextRequest('http://localhost/api/property-images', {
    method: 'DELETE',
    headers: { Authorization: 'Bearer valid' },
    body: JSON.stringify({ ids }),
  })
}
beforeEach(() => {
  vi.clearAllMocks()
  mocks.getUser.mockResolvedValue({ data: { user: { id: uid } }, error: null })
  mocks.put.mockResolvedValue({})
  mocks.delete.mockResolvedValue(undefined)
})

it('requires authentication and generates upload keys from the verified user', async () => {
  expect((await POST(upload(image(), ''))).status).toBe(401)
  mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'invalid' } })
  expect((await POST(upload())).status).toBe(401)
  const response = await POST(upload())
  expect(response.status).toBe(201)
  const result = await response.json()
  expect(result.id).toMatch(new RegExp(`^r2:${uid}/[0-9a-f-]{36}\\.webp$`))
  expect(result.url).toBe(`http://localhost/api/property-images/${result.id.slice(3)}`)
  expect(mocks.put.mock.calls[0][2].httpMetadata.contentType).toBe('image/webp')
})

it('rejects forged file types and oversized uploads, including without content-length', async () => {
  expect(
    (await POST(upload(new File(['<html>'], 'fake.webp', { type: 'image/webp' })))).status
  ).toBe(400)
  expect((await POST(upload(new File(['data'], 'foto.png', { type: 'image/png' })))).status).toBe(
    400
  )
  expect(
    (
      await POST(
        new NextRequest('http://localhost/api/property-images', {
          method: 'POST',
          headers: { Authorization: 'Bearer valid' },
          body: new Uint8Array(700_000),
        })
      )
    ).status
  ).toBe(413)
  expect(mocks.put).not.toHaveBeenCalled()
})

it('deletes only the verified owner’s keys and rejects traversal and other owners', async () => {
  expect((await DELETE(deletion([`r2:${key}`]))).status).toBe(200)
  expect(mocks.delete).toHaveBeenCalledWith([key])
  mocks.delete.mockClear()
  expect(
    (await DELETE(deletion([`r2:${key.replace(uid, '32345678-1234-4234-8234-123456789abc')}`])))
      .status
  ).toBe(403)
  expect((await DELETE(deletion([`r2:${uid}/../foto.webp`]))).status).toBe(403)
  expect(mocks.delete).not.toHaveBeenCalled()
})

it('streams public photos with cache and ETag, returns 304 and handles missing files', async () => {
  const object = {
    body: new Blob(['photo']).stream(),
    httpEtag: '"photo"',
    writeHttpMetadata: (headers: Headers) => headers.set('Content-Type', 'image/webp'),
  }
  mocks.get.mockResolvedValue(object)
  const context = { params: Promise.resolve({ key: key.split('/') }) }
  const response = await GET(
    new NextRequest(`http://localhost/api/property-images/${key}`),
    context
  )
  expect(await response.text()).toBe('photo')
  expect(response.headers.get('cache-control')).toContain('immutable')
  expect(response.headers.get('content-type')).toBe('image/webp')
  expect(
    (
      await GET(
        new NextRequest(`http://localhost/api/property-images/${key}`, {
          headers: { 'if-none-match': '"photo"' },
        }),
        context
      )
    ).status
  ).toBe(304)
  mocks.get.mockResolvedValue(null)
  expect(
    (await GET(new NextRequest(`http://localhost/api/property-images/${key}`), context)).status
  ).toBe(404)
})

it('returns a recoverable failure when R2 is unavailable', async () => {
  mocks.put.mockRejectedValueOnce(new Error('offline'))
  expect((await POST(upload())).status).toBe(503)
})
