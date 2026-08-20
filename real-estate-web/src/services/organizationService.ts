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
    const { data, error } = await getSupabase()
      .from('organization_members')
      .select('user_id, role, profiles(name, email)')
      .eq('org_id', orgId)
      .eq('status', 'active')
    if (error) throw new Error(error.message)
    return (data ?? []).map((m: any) => ({
      id: m.user_id,
      name: m.profiles?.name ?? '—',
      email: m.profiles?.email ?? '',
      role: m.role,
    }))
  },
}
