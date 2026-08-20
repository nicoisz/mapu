import { getSupabase } from '@/lib/supabase'
import { PlatformRole } from '@/types/enums'
import { PropertyRow } from '@/lib/propertyMapper'

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
    // organizations se suma cuando la tabla exista (F0.3).
    const [u, p, a] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('properties').select('id', { count: 'exact', head: true }),
      supabase
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
    ])
    return {
      users: u.count ?? 0,
      properties: p.count ?? 0,
      active: a.count ?? 0,
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

  /** Todas las propiedades (superadmin), opcionalmente por status/título. */
  async listProperties(status?: string, search?: string): Promise<PropertyRow[]> {
    let q = getSupabase()
      .from('properties')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(200)
    if (status && status !== 'all') q = q.eq('status', status)
    if (search?.trim()) q = q.ilike('title', `%${search.trim()}%`)
    const { data, error } = await q
    if (error) throw new Error(error.message)
    return (data ?? []) as PropertyRow[]
  },

  /** Organizaciones con conteo de miembros (superadmin). */
  async listOrganizations(search?: string): Promise<OrganizationRow[]> {
    let q = getSupabase()
      .from('organizations')
      .select('*, organization_members(count)')
      .order('created_at', { ascending: false })
      .limit(200)
    if (search?.trim()) q = q.ilike('name', `%${search.trim()}%`)
    const { data, error } = await q
    if (error) throw new Error(error.message)
    return (data ?? []) as OrganizationRow[]
  },

  /** Crea organización con su dueño como miembro owner. */
  async createOrganization(input: {
    name: string
    type: 'brokerage' | 'company'
    ownerId: string
    licenseNumber?: string
    rut?: string
  }): Promise<void> {
    const supabase = getSupabase()
    const { data: org, error } = await supabase
      .from('organizations')
      .insert({
        name: input.name,
        type: input.type,
        license_number: input.licenseNumber ?? null,
        rut: input.rut ?? null,
        created_by: input.ownerId,
      })
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({ org_id: org.id, user_id: input.ownerId, role: 'owner', status: 'active' })
    if (memberError) throw new Error(memberError.message)
  },

  /** Añade/quita un miembro y ajusta su rol. */
  async setMemberRole(
    orgId: string,
    userId: string,
    role: 'owner' | 'admin' | 'agent' | null
  ): Promise<void> {
    const supabase = getSupabase()
    const { error } =
      role === null
        ? await supabase
            .from('organization_members')
            .delete()
            .eq('org_id', orgId)
            .eq('user_id', userId)
        : await supabase
            .from('organization_members')
            .upsert({ org_id: orgId, user_id: userId, role, status: 'active' })
    if (error) throw new Error(error.message)
  },
}

/** Fila de organizations con members_count (de la relación embed). */
export interface OrganizationRow {
  id: string
  type: string
  name: string
  logo_url: string | null
  is_verified: boolean
  created_at: string
  created_by: string
  organization_members: { count: number }[]
}
