import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getPublicSupabaseConfig } from '@/lib/env/public'
import type { Database } from '@/types/database.generated'

/**
 * Cliente server para lecturas anónimas (server components). Sin persistencia,
 * sin refresco de token, sin detección de sesión en URL. Se crea por llamada
 * (no singleton) para no compartir estado entre requests.
 */
export function getSupabaseServerPublic(): SupabaseClient<Database> {
  const { url, anonKey } = getPublicSupabaseConfig()
  return createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
