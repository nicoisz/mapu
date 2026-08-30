import { getSupabase } from '@/lib/supabase'
import { rowToProperty, PropertyRow } from '@/lib/propertyMapper'
import { Property } from '@/types/property'

export interface OrgInfo {
  id: string
  name: string
  logo_url: string | null
  type: string
  is_verified: boolean
  rating: number | null
}

// Module cache: the same org appears on many cards; one fetch per id.
const orgCache = new Map<string, OrgInfo>()

export const organizationService = {
  async getById(orgId: string): Promise<OrgInfo | null> {
    const cached = orgCache.get(orgId)
    if (cached) return cached
    const { data, error } = await getSupabase()
      .from('organizations')
      .select('id, name, logo_url, type, is_verified, rating')
      .eq('id', orgId)
      .maybeSingle()
    if (error || !data) return null
    orgCache.set(orgId, data as OrgInfo)
    return data as OrgInfo
  },

  /** All properties published under the org (team dashboard). */
  async getOrgProperties(orgId: string): Promise<Property[]> {
    const { data, error } = await getSupabase()
      .from('properties')
      .select('*')
      .eq('organization_id', orgId)
      .order('published_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data as PropertyRow[]).map(rowToProperty)
  },

  /** Members of the org with their role (team management view). */
  async getOrgMembers(
    orgId: string
  ): Promise<{ id: string; name: string; email: string; role: string }[]> {
    // security-004: email se entrega vía RPC solo a quien gestiona la org.
    const { data, error } = await getSupabase().rpc('get_org_members', { org_id: orgId })
    if (error) throw new Error(error.message)
    const rows = (data ?? []) as {
      user_id: string
      name: string | null
      email: string | null
      role: string
    }[]
    return rows.map((row) => ({
      id: row.user_id,
      name: row.name ?? '—',
      email: row.email ?? '',
      role: row.role,
    }))
  },

  /**
   * Busca un usuario por email para invitarlo a la org. Lo respalda un RPC
   * SECURITY DEFINER que solo deja buscar a superadmins y admins de org.
   */
  async findUserByEmail(
    email: string
  ): Promise<{ id: string; name: string; email: string } | null> {
    const { data, error } = await getSupabase().rpc('find_user_for_org', {
      search_email: email.trim(),
    })
    if (error || !data?.length) return null
    return data[0] as { id: string; name: string; email: string }
  },

  /**
   * Agrega/quita miembro y ajusta su rol. La jerarquía (owner>admin>agent,
   * protección del dueño) la impone el RPC SECURITY DEFINER set_member_role.
   */
  async setMemberRole(
    orgId: string,
    userId: string,
    role: 'owner' | 'admin' | 'agent' | null
  ): Promise<void> {
    const { error } = await getSupabase().rpc('set_member_role', {
      org_id: orgId,
      target_user_id: userId,
      new_role: role,
    })
    if (error) throw new Error(error.message)
  },
}
