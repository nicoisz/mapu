import { afterEach, expect, it, vi } from 'vitest'
import { uploadPropertyImages, deletePropertyImages } from '../storageService'

const mocks = vi.hoisted(() => ({
  remove: vi.fn().mockResolvedValue({ error: null }),
  compress: vi.fn(async (file: File) => file),
}))
const uid = '12345678-1234-4234-8234-123456789abc'
vi.mock('@/lib/supabase', () => ({
  PROPERTY_IMAGES_BUCKET: 'property-images',
  getSupabase: () => ({
    auth: {
      getSession: async () => ({
        data: {
          session: { access_token: 'test', user: { id: '12345678-1234-4234-8234-123456789abc' } },
        },
      }),
    },
    storage: { from: () => ({ remove: mocks.remove }) },
  }),
}))
vi.mock('@/lib/imageCompression', () => ({ compressImage: mocks.compress }))
afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

it('rolls back earlier R2 uploads if a later photo fails', async () => {
  const id = `r2:${uid}/photo.webp`
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ id, url: 'https://mapu.test/photo.webp' }))
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'No disponible' }), { status: 503 })
    )
    .mockResolvedValueOnce(new Response('{}'))
  vi.stubGlobal('fetch', fetchMock)
  const file = new File(['photo'], 'foto.webp', { type: 'image/webp' })
  await expect(uploadPropertyImages(uid, [file, file])).rejects.toThrow('No disponible')
  expect(fetchMock.mock.calls[2][1].method).toBe('DELETE')
  expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toEqual({ ids: [id] })
})

it('routes legacy deletion to Supabase and new deletion to R2', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response('{}'))
  vi.stubGlobal('fetch', fetchMock)
  await deletePropertyImages([
    { id: `${uid}/legacy.jpg`, url: 'legacy', order: 0, isMain: true },
    { id: `r2:${uid}/new.webp`, url: 'new', order: 1, isMain: false },
  ])
  expect(mocks.remove).toHaveBeenCalledWith([`${uid}/legacy.jpg`])
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ ids: [`r2:${uid}/new.webp`] })
})
