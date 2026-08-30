import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin'
import { propertyToRow } from '@/lib/propertyMapper'
import { PropertyStatus } from '@/types/enums'
import { LISTING_EXPIRATION_DAYS } from '@/constants'

/**
 * POST /api/publish
 * Publica una propiedad de forma server-side. Server-only: usa la key
 * service_role (omite RLS) y re-valida la autorización en el propio endpoint:
 *   · verifica el JWT del usuario (Authorization: Bearer <token>),
 *   · si viene organization_id, comprueba que el usuario es miembro activo,
 *   · valida los invariantes críticos con zod.
 *
 * Defensa en profundidad: aunque RLS ya impone owner_id = auth.uid(), este
 * endpoint garantiza que el insert se hace siempre con el dueño correcto y
 * valida el payload fuera del cliente.
 */

const imageSchema = z.object({ id: z.string(), url: z.string(), order: z.number().optional(), isMain: z.boolean().optional() })

const publishSchema = z.object({
  title: z.string().trim().min(8, 'El título debe tener al menos 8 caracteres'),
  description: z.string().trim().max(2000, 'Máximo 2000 caracteres').optional(),
  type: z.enum(['house', 'apartment', 'land', 'office', 'commercial', 'warehouse']),
  operation: z.enum(['sale', 'rent']),
  location: z.object({ latitude: z.number(), longitude: z.number() }).passthrough(),
  pricing: z
    .object({ price: z.number().positive('El precio debe ser mayor a 0') })
    .passthrough(),
  features: z
    .object({ area: z.number().positive('La superficie debe ser mayor a 0') })
    .passthrough(),
  media: z.object({ images: z.array(imageSchema).min(1, 'Agrega al menos una foto') }).passthrough(),
  contact: z.object({ id: z.string() }).passthrough(),
  tags: z.array(z.string()).optional(),
  organizationId: z.string().uuid().nullable().optional(),
})

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = getSupabaseAdmin()
  const { data: user, error: authError } = await admin.auth.getUser(token)
  if (authError || !user.user) {
    return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })
  }
  const userId = user.user.id

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = publishSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return NextResponse.json({ error: first?.message ?? 'Datos inválidos' }, { status: 400 })
  }
  const d = parsed.data

  // Si publica bajo una org, verificar que es miembro activo.
  if (d.organizationId) {
    const { data: member, error: memberError } = await admin
      .from('organization_members')
      .select('id')
      .eq('org_id', d.organizationId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()
    if (memberError || !member) {
      return NextResponse.json({ error: 'No eres miembro de esta organización' }, { status: 403 })
    }
  }

  const expiresAt = new Date(Date.now() + LISTING_EXPIRATION_DAYS * 86_400_000).toISOString()
  const row = {
    ...propertyToRow(d as never, userId, d.organizationId ?? undefined),
    status: PropertyStatus.ACTIVE,
    expires_at: expiresAt,
  }

  const { data: inserted, error } = await admin
    .from('properties')
    .insert(row)
    .select('id')
    .single()
  if (error) {
    return NextResponse.json({ error: 'No se pudo guardar la propiedad' }, { status: 500 })
  }

  return NextResponse.json({ id: inserted.id }, { status: 201 })
}
