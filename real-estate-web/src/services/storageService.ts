import { getSupabase, PROPERTY_IMAGES_BUCKET } from '@/lib/supabase'
import { translateError } from '@/lib/userMessages'
import { PropertyImage } from '@/types/property'
import { compressImage } from '@/lib/imageCompression'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type))
    return `${file.name}: formato no soportado (usa JPG, PNG, WebP o AVIF)`
  return null
}

/**
 * Optimizes and uploads photos through the authenticated R2 endpoint.
 */
export async function uploadPropertyImages(
  userId: string,
  files: File[]
): Promise<PropertyImage[]> {
  const { data } = await getSupabase().auth.getSession()
  const token = data.session?.access_token
  if (!token || data.session?.user.id !== userId) throw new Error('Inicia sesión para subir fotos')
  const optimized: File[] = []
  for (const file of files) {
    const error = validateImageFile(file)
    if (error) throw new Error(error)
    optimized.push(await compressImage(file))
  }
  const uploaded: PropertyImage[] = []
  try {
    for (const file of optimized) {
      const body = new FormData()
      body.append('file', file)
      const response = await fetch('/api/property-images', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      })
      const result = await response.json()
      if (!response.ok || typeof result.id !== 'string' || typeof result.url !== 'string')
        throw new Error(
          `No se pudo subir ${file.name}: ${translateError(result.error ?? 'Error de almacenamiento')}`
        )
      uploaded.push({
        id: result.id,
        url: result.url,
        order: uploaded.length,
        isMain: uploaded.length === 0,
      })
    }
    return uploaded
  } catch (error) {
    // Si falla una foto posterior, retirar también las anteriores de este lote.
    if (uploaded.length) await deletePropertyImages(uploaded).catch(() => {})
    throw error
  }
}

/** Deletes previously uploaded files (paths = image.id from uploads). Used to
 *  roll back orphaned uploads when creating the property row fails. */
export async function deletePropertyImages(images: PropertyImage[]): Promise<void> {
  const ids = images.map((img) => img.id).filter(Boolean)
  if (!ids.length) return
  const r2 = ids.filter((id) => id.startsWith('r2:'))
  const legacy = ids.filter((id) => !id.startsWith('r2:'))
  if (legacy.length) {
    const { error } = await getSupabase().storage.from(PROPERTY_IMAGES_BUCKET).remove(legacy)
    if (error) throw new Error(translateError(error.message))
  }
  if (r2.length) {
    const { data } = await getSupabase().auth.getSession()
    if (!data.session?.access_token) throw new Error('Inicia sesión para borrar fotos')
    const response = await fetch('/api/property-images', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${data.session.access_token}`,
      },
      body: JSON.stringify({ ids: r2 }),
    })
    if (!response.ok) throw new Error('No se pudieron borrar las fotos')
  }
}
