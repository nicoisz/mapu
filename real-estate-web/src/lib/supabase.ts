import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { captureError } from './errorLogging'

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
  if (!client)
    client = createClient(url, key, {
      global: {
        fetch: async (input, init) => {
          const endpoint =
            typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
          const isLogging = endpoint.includes('/rpc/capture_error_log')
          try {
            const response = await fetch(input, init)
            if (!response.ok && !isLogging && typeof window !== 'undefined') {
              captureError({
                message: `Error de servicio (${response.status})`,
                context: {
                  endpoint: new URL(endpoint).pathname,
                  status: response.status,
                  method: init?.method ?? 'GET',
                },
              })
            }
            return response
          } catch (error) {
            if (!isLogging && typeof window !== 'undefined')
              captureError({
                message: 'No se pudo conectar con el servicio',
                context: {
                  endpoint: new URL(endpoint).pathname,
                  cause: error instanceof Error ? error.message : String(error),
                },
              })
            throw error
          }
        },
      },
    })
  return client
}

/** Public bucket where property photos are stored (see supabase/schema.sql). */
export const PROPERTY_IMAGES_BUCKET = 'property-images'
