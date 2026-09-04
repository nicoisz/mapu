/**
 * Compresión de imágenes client-side antes de subirlas.
 *
 * Como el hosting (Workers/Cloudflare) no corre Sharp y next.config usa
 * `images.unoptimized: true`, se redimensiona/re-encoda en el navegador para
 * reducir ancho de banda y costo de storage.
 *
 * - Redimensiona a `maxDimension` px en el lado mayor (mantiene ratio).
 * - Re-encoda a WebP (fallback JPEG si el navegador no lo soporta).
 * - Respeta la orientación EXIF de las fotos de celular.
 */

export interface ImageCompressionOptions {
  maxDimension?: number
  quality?: number
}

const DEFAULT_MAX_DIMENSION = 1600
const DEFAULT_QUALITY = 0.8

/**
 * Comprime un File de imagen y devuelve un File nuevo listo para subir.
 * Si no se puede procesar (falla de API, imagen inválida) devuelve el archivo
 * original para no bloquear el upload.
 */
export async function compressImage(file: File, opts: ImageCompressionOptions = {}): Promise<File> {
  const maxDimension = opts.maxDimension ?? DEFAULT_MAX_DIMENSION
  const quality = opts.quality ?? DEFAULT_QUALITY

  try {
    const bitmap = await decodeImage(file)
    const scaled = scaleToFit(bitmap, maxDimension)
    const blob = await encodeToBlob(scaled, quality)
    bitmap.close?.()

    if (!blob || blob.size >= file.size) {
      // Ya es pequeño o no ganamos nada: usar el original.
      return file
    }

    const ext = blob.type.includes('webp') ? 'webp' : 'jpg'
    const base = file.name.replace(/\.[^.]+$/, '') || 'imagen'
    const name = `${base}.${ext}`
    return new File([blob], name, { type: blob.type, lastModified: file.lastModified })
  } catch {
    return file
  }
}

/** Decodifica el File a un ImageBitmap respetando orientación EXIF. */
async function decodeImage(file: File): Promise<ImageBitmap> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(file, {
        imageOrientation: 'from-image',
      } as ImageBitmapOptions)
      return bmp
    } catch {
      /* fall through al <img> */
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('no canvas 2d')
    ctx.drawImage(img, 0, 0)
    const bmp = await createImageBitmap(canvas)
    return bmp
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Redimensiona manteniendo el ratio; lado mayor <= maxDimension. */
function scaleToFit(bitmap: ImageBitmap, maxDimension: number): HTMLCanvasElement {
  const { width, height } = bitmap
  const scale = Math.min(1, maxDimension / Math.max(width, height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width * scale))
  canvas.height = Math.max(1, Math.round(height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('no canvas 2d')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return canvas
}

/** Re-encoda el canvas a WebP (fallback JPEG). */
async function encodeToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  const isWebpSupported = canvas.toDataURL('image/webp', 0.1).startsWith('data:image/webp')
  const type = isWebpSupported ? 'image/webp' : 'image/jpeg'
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality)
  })
}
