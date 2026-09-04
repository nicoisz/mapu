import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getPublicSupabaseConfig } from '@/lib/env/public'
import type { Database } from '@/types/database.generated'

/**
 * Cliente server request-scoped con el JWT del usuario. Propaga el token en el
 * header Authorization para que RLS resuelva el contexto del usuario. Sin
 * persistencia; se crea uno por request (no comparte estado auth).
 */
export function getSupabaseServerUser(accessToken: string): SupabaseClient<Database> {
  const { url, anonKey } = getPublicSupabaseConfig()
  return createClient<Database>(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
