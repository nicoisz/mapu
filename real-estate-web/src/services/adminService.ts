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
    // security-004: los datos completos se leen vía RPC de superadmin (los
    // grants por columna no exponen email/telefono al cliente).
    const { data, error } = await getSupabase().rpc('admin_list_users', {
      search_term: search?.trim() ?? '',
    })
    if (error) throw new Error(error.message)
    return (data ?? []) as AdminUserRow[]
  },

  /** Cambia el rol de plataforma (user/superadmin). */
  async setPlatformRole(userId: string, role: PlatformRole): Promise<void> {
    const { error } = await getSupabase().rpc('admin_set_platform_role', {
      target_user_id: userId,
      new_role: role,
    })
    if (error) throw new Error(error.message)
  },

  /** Marca email/licencia como verificado. */
  async toggleVerified(
    userId: string,
    field: 'is_email_verified' | 'is_phone_verified',
    value: boolean
  ): Promise<void> {
    const { error } = await getSupabase().rpc('admin_toggle_verified', {
      target_user_id: userId,
      field,
      value,
    })
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

  /** Añade/quita un miembro y ajusta su rol (via RPC jerárquico). */
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

  /** Log de errores client-side (solo superadmin puede leer por RLS). */
  async listErrorLogs(search?: string, limit = 200): Promise<ErrorLogRow[]> {
    let q = getSupabase()
      .from('error_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (search?.trim()) {
      const term = search.trim()
      q = q.or(`message.ilike.%${term}%,email.ilike.%${term}%,route.ilike.%${term}%`)
    }
    const { data, error } = await q
    if (error) throw new Error(error.message)
    return (data ?? []) as ErrorLogRow[]
  },

  /** Ingresos desde payments + propiedades vendidas/arrendadas. */
  async getRevenue(): Promise<RevenueSnapshot> {
    const supabase = getSupabase()
    const [payments, sold, rented] = await Promise.all([
      supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(500),
      supabase
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'sold'),
      supabase
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'rented'),
    ])
    if (payments.error) throw new Error(payments.error.message)

    const rows = (payments.data ?? []) as PaymentRow[]
    const paid = rows.filter((r) => r.status === 'paid')
    const totalRevenue = paid.reduce((sum, r) => sum + (r.amount || 0), 0)

    const byPlanMap = new Map<string, { plan: string; total: number; count: number }>()
    const byMonthMap = new Map<string, number>()
    for (const p of paid) {
      const entry = byPlanMap.get(p.plan) ?? { plan: p.plan, total: 0, count: 0 }
      entry.total += p.amount || 0
      entry.count += 1
      byPlanMap.set(p.plan, entry)

      const month = new Date(p.created_at).toLocaleDateString('es-CL', {
        month: 'short',
        year: '2-digit',
      })
      byMonthMap.set(month, (byMonthMap.get(month) ?? 0) + (p.amount || 0))
    }

    return {
      totalRevenue,
      paidCount: paid.length,
      pendingCount: rows.length - paid.length,
      byPlan: Array.from(byPlanMap.values()).sort((a, b) => b.total - a.total),
      byMonth: Array.from(byMonthMap.entries()).map(([month, total]) => ({ month, total })),
      recent: rows.slice(0, 20),
      soldProperties: sold.count ?? 0,
      rentedProperties: rented.count ?? 0,
    }
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

/** Fila de error_logs (captura client-side). */
export interface ErrorLogRow {
  id: string
  user_id: string | null
  email: string | null
  name: string | null
  route: string | null
  message: string | null
  stack: string | null
  context: Record<string, unknown>
  created_at: string
}

/** Fila de payments. */
export interface PaymentRow {
  id: string
  user_id: string
  plan: string
  amount: number
  currency: string
  status: string
  mp_preference_id: string | null
  mp_payment_id: string | null
  created_at: string
}

/** Resumen de ingresos para el panel admin. */
export interface RevenueSnapshot {
  totalRevenue: number
  paidCount: number
  pendingCount: number
  byPlan: { plan: string; total: number; count: number }[]
  byMonth: { month: string; total: number }[]
  recent: PaymentRow[]
  soldProperties: number
  rentedProperties: number
}
