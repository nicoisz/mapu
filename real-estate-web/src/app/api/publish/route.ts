import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin'
import { propertyToRow } from '@/lib/propertyMapper'
import { PropertyStatus } from '@/types/enums'
import { Property } from '@/types/property'
import { FREE_PLAN_LISTINGS_LIMIT, LISTING_EXPIRATION_DAYS } from '@/constants'
import { activeExpiryFilter } from '@/services/propertyService'
import { hasReachedListingLimit, isPremiumAccount } from '@/lib/listingQuota'

/**
 * POST /api/publish
 * Publica una propiedad de forma server-side. Server-only: usa la key
 * service_role (omite RLS) y re-valida la autorización en el propio endpoint:
 *   · verifica el JWT del usuario (Authorization: Bearer <token>),
 *   · si viene organization_id, comprueba que el usuario es miembro activo,
 *   · valida los invariantes críticos con zod,
 *   · impone la cuota del plan gratis (FREE_PLAN_LISTINGS_LIMIT) salvo premium/trial,
 *   · es idempotente vía client_request_id (doble clic/retry no duplica).
 */

const imageSchema = z.object({
  id: z.string(),
  url: z.string(),
  order: z.number().optional(),
  isMain: z.boolean().optional(),
})

// Invariantes críticos. El body completo es un Partial<Property> (el cliente lo
// tipa así); estos campos son los que no pueden relajarse.
const publishSchema = z.object({
  title: z.string().trim().min(8, 'El título debe tener al menos 8 caracteres'),
  description: z.string().trim().max(2000, 'Máximo 2000 caracteres').optional(),
  type: z.enum(['house', 'apartment', 'land', 'office', 'commercial', 'warehouse']),
  operation: z.enum(['sale', 'rent']),
  location: z.object({ latitude: z.number(), longitude: z.number() }),
  pricing: z.object({ price: z.number().positive('El precio debe ser mayor a 0') }),
  features: z.object({ area: z.number().positive('La superficie debe ser mayor a 0') }),
  media: z.object({ images: z.array(imageSchema).min(1, 'Agrega al menos una foto') }),
  clientRequestId: z.string().uuid().nullable().optional(),
})

/** Payload que el cliente (publicar/page.tsx) manda: un Partial<Property> + org + idempotency. */
type PublishPayload = Partial<Property> & {
  organizationId?: string | null
  clientRequestId?: string | null
}

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

  // Frontera JSON: `body` llega como unknown; el cliente envía un Partial<Property>
  // y los invariantes críticos ya se validaron arriba.
  const d = body as PublishPayload
  const organizationId = d.organizationId ?? undefined

  // Si publica bajo una org, verificar que es miembro activo.
  if (organizationId) {
    const { data: member, error: memberError } = await admin
      .from('organization_members')
      .select('id')
      .eq('org_id', organizationId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()
    if (memberError || !member) {
      return NextResponse.json({ error: 'No eres miembro de esta organización' }, { status: 403 })
    }
  }

  // Cuota del plan gratis (R-01). Fail-closed: un error de DB no permite publicar.
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('subscription_type, trial_expires_at')
    .eq('id', userId)
    .maybeSingle()
  if (profileError) {
    return NextResponse.json({ error: 'No se pudo verificar tu cuenta' }, { status: 500 })
  }
  const premium = isPremiumAccount(profile?.subscription_type, profile?.trial_expires_at)
  if (!premium) {
    const { count, error: countError } = await admin
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', userId)
      .eq('status', PropertyStatus.ACTIVE)
      .or(activeExpiryFilter())
    if (countError) {
      return NextResponse.json(
        { error: 'No se pudo verificar el límite de publicaciones' },
        { status: 500 }
      )
    }
    if (hasReachedListingLimit(count ?? 0, false)) {
      return NextResponse.json(
        { error: 'Alcanzaste el límite de publicaciones del plan gratis' },
        { status: 402 }
      )
    }
  }

  const expiresAt = new Date(Date.now() + LISTING_EXPIRATION_DAYS * 86_400_000).toISOString()
  const row = {
    ...propertyToRow(d, userId, organizationId),
    status: PropertyStatus.ACTIVE,
    expires_at: expiresAt,
    client_request_id: d.clientRequestId ?? null,
  }

  const { data: inserted, error } = await admin.from('properties').insert(row).select('id').single()
  if (error) {
    // Idempotencia (R-02): doble clic/retry con el mismo client_request_id → ya existe.
    if (d.clientRequestId && error.code === '23505') {
      const { data: existing } = await admin
        .from('properties')
        .select('id')
        .eq('client_request_id', d.clientRequestId)
        .maybeSingle()
      if (existing) return NextResponse.json({ id: existing.id }, { status: 200 })
    }
    return NextResponse.json({ error: 'No se pudo guardar la propiedad' }, { status: 500 })
  }

  return NextResponse.json({ id: inserted.id }, { status: 201 })
}
