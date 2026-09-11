import 'server-only'

/**
 * Configuración server-only de Supabase (service_role). Nunca importar desde
 * el cliente. Falla con mensaje claro; no imprime valores.
 */
export interface ServerSupabaseConfig {
  url: string
  serviceRoleKey: string
}

export function getServerSupabaseConfig(): ServerSupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (server-only). Configúralas en el entorno de deploy.'
    )
  }
  return { url, serviceRoleKey }
}
