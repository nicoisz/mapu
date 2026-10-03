import { afterEach, expect, it, vi } from 'vitest'
import { compressImage, MAX_OPTIMIZED_IMAGE_BYTES } from '../imageCompression'

afterEach(() => vi.unstubAllGlobals())

it('resizes large originals and reduces oversized encodings without uploading the original', async () => {
  const close = vi.fn()
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn().mockResolvedValue({ width: 6000, height: 4000, close })
  )
  const dimensions: number[] = []
  let encodings = 0
  vi.stubGlobal('document', {
    createElement: () => {
      const canvas = {
        width: 0,
        height: 0,
        getContext: () => ({ drawImage: vi.fn() }),
        toBlob: (callback: (blob: Blob) => void, type: string) => {
          dimensions.push(canvas.width)
          callback(new Blob([new Uint8Array(++encodings === 1 ? 700_000 : 200_000)], { type }))
        },
      }
      return canvas
    },
  })
  const file = new File([new Uint8Array(9_000_000)], 'casa.jpg', { type: 'image/jpeg' })
  const result = await compressImage(file)
  expect(result.name).toBe('casa.webp')
  expect(result.type).toBe('image/webp')
  expect(result.size).toBeLessThanOrEqual(MAX_OPTIMIZED_IMAGE_BYTES)
  expect(dimensions).toEqual([1600, 1280])
  expect(close).toHaveBeenCalledOnce()
})

it('reports corrupt images instead of returning an unoptimized original', async () => {
  vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('decode')))
  await expect(
    compressImage(new File(['broken'], 'rota.jpg', { type: 'image/jpeg' }))
  ).rejects.toThrow('no pudimos optimizar')
})
