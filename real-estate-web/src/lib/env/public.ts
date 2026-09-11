/**
 * Configuración pública de Supabase (segura para cliente y servidor).
 * Falla con mensaje claro al usarla si faltan variables; nunca imprime valores.
 */
export interface PublicSupabaseConfig {
  url: string
  anonKey: string
}

export function getPublicSupabaseConfig(): PublicSupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY
  if (!url || !anonKey) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_KEY. Cópialas desde .env.example'
    )
  }
  return { url, anonKey }
}
