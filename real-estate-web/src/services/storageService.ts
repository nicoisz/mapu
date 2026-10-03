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
 * Uploads property photos to the public bucket under the user's folder
 * (RLS only allows writing inside your own uid/ prefix). Returns the
 * PropertyImage list ready to store on the property row.
 */
export async function uploadPropertyImages(
  userId: string,
  files: File[]
): Promise<PropertyImage[]> {
  const supabase = getSupabase()
  const optimized: File[] = []
  for (const file of files) {
    const error = validateImageFile(file)
    if (error) throw new Error(error)
    optimized.push(await compressImage(file))
  }
  const uploads = optimized.map(async (file, i) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${userId}/${crypto.randomUUID()}.${ext}`
    const { error } = await supabase.storage.from(PROPERTY_IMAGES_BUCKET).upload(path, file, {
      cacheControl: '31536000',
      contentType: file.type,
    })
    if (error) throw new Error(`No se pudo subir ${file.name}: ${translateError(error.message)}`)
    const { data } = supabase.storage.from(PROPERTY_IMAGES_BUCKET).getPublicUrl(path)
    return { id: path, url: data.publicUrl, order: i, isMain: i === 0 } satisfies PropertyImage
  })
  return Promise.all(uploads)
}

/** Deletes previously uploaded files (paths = image.id from uploads). Used to
 *  roll back orphaned uploads when creating the property row fails. */
export async function deletePropertyImages(images: PropertyImage[]): Promise<void> {
  const paths = images.map((img) => img.id).filter(Boolean)
  if (!paths.length) return
  await getSupabase().storage.from(PROPERTY_IMAGES_BUCKET).remove(paths)
}
