import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getPublicSupabaseConfig } from '@/lib/env/public'
import type { Database } from '@/types/database.generated'

let browser: SupabaseClient<Database> | null = null

/**
 * Cliente para componentes del navegador (Client Components). Persiste sesión
 * en localStorage y refresca el token. No usar en el servidor.
 */
export function getSupabaseBrowser(): SupabaseClient<Database> {
  if (!browser) {
    const { url, anonKey } = getPublicSupabaseConfig()
    browser = createClient<Database>(url, anonKey)
  }
  return browser
}

/** Bucket público donde se guardan las fotos de propiedades. */
export const PROPERTY_IMAGES_BUCKET = 'property-images'
