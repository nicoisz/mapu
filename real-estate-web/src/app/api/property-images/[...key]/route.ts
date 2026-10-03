import { NextRequest } from 'next/server'
import { propertyImageBucket, R2_IMAGE_KEY } from '@/lib/server/propertyImageBucket'

export async function GET(req: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.join('/')
  if (!R2_IMAGE_KEY.test(key)) return new Response(null, { status: 404 })
  try {
    const bucket = await propertyImageBucket()
    const object = await bucket.get(key)
    if (!object) return new Response(null, { status: 404 })
    const headers = new Headers()
    headers.set(
      'Content-Type',
      object.httpMetadata?.contentType ?? (key.endsWith('.jpg') ? 'image/jpeg' : 'image/webp')
    )
    headers.set('ETag', object.httpEtag)
    headers.set('X-Content-Type-Options', 'nosniff')
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    if (req.headers.get('if-none-match') === object.httpEtag)
      return new Response(null, { status: 304, headers })
    // Workers y DOM declaran variantes distintas del mismo stream web.
    return new Response(object.body as unknown as ReadableStream<Uint8Array>, { headers })
  } catch {
    return new Response(null, { status: 503 })
  }
}
