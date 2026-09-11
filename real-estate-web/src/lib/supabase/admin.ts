import 'server-only'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getServerSupabaseConfig } from '@/lib/env/server'
import type { Database } from '@/types/database.generated'

let admin: SupabaseClient<Database> | null = null

/**
 * Cliente server-only con service_role (omite RLS). Sin persistencia, refresco,
 * detección de sesión ni comportamiento de browser. Úsalo SOLO en server
 * (API routes / server components). La autorización se re-valida en el endpoint.
 */
export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (!admin) {
    const { url, serviceRoleKey } = getServerSupabaseConfig()
    admin = createClient<Database>(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
  }
  return admin
}
