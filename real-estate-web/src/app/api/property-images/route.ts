import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabase } from '@/lib/supabase'
import { MAX_OPTIMIZED_IMAGE_BYTES } from '@/lib/imageCompression'
import { propertyImageBucket, R2_IMAGE_KEY } from '@/lib/server/propertyImageBucket'

async function authenticatedUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1]
  if (!token) return null
  const { data, error } = await getSupabase().auth.getUser(token)
  return error ? null : data.user
}

export async function POST(req: NextRequest) {
  const user = await authenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Inicia sesión para subir fotos.' }, { status: 401 })
  // El navegador ya comprime. Este límite protege la API de peticiones manipuladas.
  const maxBody = MAX_OPTIMIZED_IMAGE_BYTES + 64 * 1024
  if (!req.body || Number(req.headers.get('content-length')) > maxBody)
    return NextResponse.json({ error: 'No se pudo procesar la foto.' }, { status: 413 })
  let file: FormDataEntryValue | null
  try {
    const reader = req.body.getReader()
    const chunks: Uint8Array[] = []
    let size = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maxBody) {
        await reader.cancel()
        return NextResponse.json({ error: 'No se pudo procesar la foto.' }, { status: 413 })
      }
      chunks.push(value)
    }
    const body = new Uint8Array(size)
    let offset = 0
    for (const chunk of chunks) {
      body.set(chunk, offset)
      offset += chunk.length
    }
    const form = await new Response(body, {
      headers: { 'Content-Type': req.headers.get('content-type') ?? '' },
    }).formData()
    if (form.getAll('file').length !== 1)
      return NextResponse.json({ error: 'Sube una foto a la vez.' }, { status: 400 })
    file = form.get('file')
  } catch {
    return NextResponse.json({ error: 'Foto inválida.' }, { status: 400 })
  }
  if (
    !(file instanceof File) ||
    !file.size ||
    file.size > MAX_OPTIMIZED_IMAGE_BYTES ||
    !['image/webp', 'image/jpeg'].includes(file.type)
  )
    return NextResponse.json({ error: 'Foto inválida.' }, { status: 400 })
  const bytes = new Uint8Array(await file.arrayBuffer())
  const webp =
    file.type === 'image/webp' &&
    new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' &&
    new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP'
  const jpeg =
    file.type === 'image/jpeg' && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (!webp && !jpeg) return NextResponse.json({ error: 'Foto inválida.' }, { status: 400 })
  const key = `${user.id}/${crypto.randomUUID()}.${webp ? 'webp' : 'jpg'}`
  try {
    const bucket = await propertyImageBucket()
    await bucket.put(key, bytes, {
      httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' },
    })
    return NextResponse.json(
      { id: `r2:${key}`, url: `${req.nextUrl.origin}/api/property-images/${key}` },
      { status: 201 }
    )
  } catch {
    return NextResponse.json(
      { error: 'No se pudo guardar la foto. Inténtalo de nuevo.' },
      { status: 503 }
    )
  }
}

const deletionSchema = z.object({ ids: z.array(z.string().max(100)).min(1).max(10) })

export async function DELETE(req: NextRequest) {
  const user = await authenticatedUser(req)
  if (!user)
    return NextResponse.json({ error: 'Inicia sesión para borrar fotos.' }, { status: 401 })
  let parsed
  try {
    parsed = deletionSchema.safeParse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 })
  }
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 })
  const keys = parsed.data.ids.map((id) => (id.startsWith('r2:') ? id.slice(3) : ''))
  if (keys.some((key) => !R2_IMAGE_KEY.test(key) || !key.startsWith(`${user.id}/`)))
    return NextResponse.json({ error: 'No puedes borrar esas fotos.' }, { status: 403 })
  try {
    const bucket = await propertyImageBucket()
    await bucket.delete(keys)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'No se pudieron borrar las fotos.' }, { status: 503 })
  }
}
