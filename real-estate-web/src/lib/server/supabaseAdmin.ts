import { createClient, SupabaseClient } from '@supabase/supabase-js'

let admin: SupabaseClient | null = null

/**
 * Cliente server-only con la key `service_role` (omite RLS). Úsalo SOLO dentro
 * de API routes / server components, nunca en el cliente. La autorización de
 * cada acción se re-valida en el propio endpoint (JWT del usuario + ownership).
 */
export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (server-only)')
  }
  if (!admin) admin = createClient(url, key, { auth: { autoRefreshToken: false } })
  return admin
}
