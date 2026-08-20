import { getSupabase } from '@/lib/supabase'
import { PlatformRole } from '@/types/enums'

/** Fila mínima de profiles para el panel admin. */
export interface AdminUserRow {
  id: string
  email: string
  name: string
  user_type: string
  platform_role: string
  company_name: string | null
  license_number: string | null
  is_email_verified: boolean | null
  is_phone_verified: boolean | null
  created_at: string
  total_listings: number | null
}

/** Panel de superadmin — RLS de la DB garantiza que solo un superadmin
 *  (platform_role = 'superadmin') puede leer/escribir aquí. */
export const adminService = {
  async getStats() {
    const supabase = getSupabase()
    const [u, p, a, orgs] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('properties').select('id', { count: 'exact', head: true }),
      supabase
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
      supabase.from('organizations').select('id', { count: 'exact', head: true }),
    ])
    return {
      users: u.count ?? 0,
      properties: p.count ?? 0,
      active: a.count ?? 0,
      organizations: orgs.count ?? 0,
    }
  },

  async listUsers(search?: string): Promise<AdminUserRow[]> {
    let q = getSupabase()
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    if (search?.trim()) {
      const term = search.trim()
      q = q.or(`email.ilike.%${term}%,name.ilike.%${term}%`)
    }
    const { data, error } = await q
    if (error) throw new Error(error.message)
    return (data ?? []) as AdminUserRow[]
  },

  /** Cambia el rol de plataforma (user/superadmin). */
  async setPlatformRole(userId: string, role: PlatformRole): Promise<void> {
    const { error } = await getSupabase()
      .from('profiles')
      .update({ platform_role: role })
      .eq('id', userId)
    if (error) throw new Error(error.message)
  },

  /** Marca email/licencia como verificado. */
  async toggleVerified(
    userId: string,
    field: 'is_email_verified' | 'is_phone_verified',
    value: boolean
  ): Promise<void> {
    const { error } = await getSupabase()
      .from('profiles')
      .update({ [field]: value })
      .eq('id', userId)
    if (error) throw new Error(error.message)
  },
}
