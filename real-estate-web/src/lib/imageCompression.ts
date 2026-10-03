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
export const MAX_OPTIMIZED_IMAGE_BYTES = 500 * 1024

/**
 * Comprime un File de imagen y devuelve un File nuevo listo para subir.
 * Rechaza imágenes que no se pueden optimizar; nunca sube originales pesados.
 */
export async function compressImage(file: File, opts: ImageCompressionOptions = {}): Promise<File> {
  const maxDimension = opts.maxDimension ?? DEFAULT_MAX_DIMENSION
  const quality = opts.quality ?? DEFAULT_QUALITY

  try {
    const bitmap = await decodeImage(file)
    try {
      if (
        file.type === 'image/webp' &&
        file.size <= MAX_OPTIMIZED_IMAGE_BYTES &&
        Math.max(bitmap.width, bitmap.height) <= Math.min(maxDimension, DEFAULT_MAX_DIMENSION)
      )
        return file
      if (bitmap.width * bitmap.height > 80_000_000) throw new Error('Imagen demasiado grande')
      let dimension = Math.min(maxDimension, DEFAULT_MAX_DIMENSION)
      for (let attempt = 0; attempt < 8; attempt++) {
        const scaled = scaleToFit(bitmap, dimension)
        const blob = await encodeToBlob(scaled, attempt === 0 ? quality : 0.72)
        if (blob && blob.size <= MAX_OPTIMIZED_IMAGE_BYTES) {
          const ext = blob.type.includes('webp') ? 'webp' : 'jpg'
          const base = file.name.replace(/\.[^.]+$/, '') || 'imagen'
          return new File([blob], `${base}.${ext}`, {
            type: blob.type,
            lastModified: file.lastModified,
          })
        }
        dimension = Math.max(480, Math.round(dimension * 0.8))
      }
      throw new Error('No se pudo reducir la imagen')
    } finally {
      if ('close' in bitmap) bitmap.close()
    }
  } catch {
    throw new Error(
      `${file.name}: no pudimos optimizar la foto. Prueba con otra imagen JPG, PNG o WebP.`
    )
  }
}

/** Decodifica el File a un ImageBitmap respetando orientación EXIF. */
async function decodeImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
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
    img.width = img.naturalWidth
    img.height = img.naturalHeight
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Redimensiona manteniendo el ratio; lado mayor <= maxDimension. */
function scaleToFit(
  bitmap: ImageBitmap | HTMLImageElement,
  maxDimension: number
): HTMLCanvasElement {
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
  const encode = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))
  const webp = await encode('image/webp')
  return webp?.type === 'image/webp' ? webp : encode('image/jpeg')
}
