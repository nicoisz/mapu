import { getCloudflareContext } from '@opennextjs/cloudflare'

export const R2_IMAGE_KEY = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(webp|jpg)$/i

export async function propertyImageBucket() {
  const { env } = await getCloudflareContext({ async: true })
  if (!env.PROPERTY_IMAGES) throw new Error('Falta el binding PROPERTY_IMAGES de R2')
  return env.PROPERTY_IMAGES
}
