import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_KEY

let client: SupabaseClient | null = null

/**
 * Shared Supabase client (lazy singleton). Safe on both server and browser:
 * the publishable key is public by design and RLS enforces permissions.
 */
export function getSupabase(): SupabaseClient {
  if (!url || !key) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_KEY. Copia .env.example a .env.local y completa las credenciales.'
    )
  }
  if (!client) client = createClient(url, key)
  return client
}

/** Public bucket where property photos are stored (see supabase/schema.sql). */
export const PROPERTY_IMAGES_BUCKET = 'property-images'
