import { getSupabase } from '@/lib/supabase'
import { Property } from '@/types/property'
import { User } from '@/types/user'
import { metricsScopeFor } from '@/lib/roles'
import { propertyService } from '@/services/propertyService'
import { organizationService } from '@/services/organizationService'
import { adminService } from '@/services/adminService'
import { rowToProperty } from '@/lib/propertyMapper'

export interface MetricsTotals {
  listings: number
  views: number
  favorites: number
  contacts: number
}

export function computeTotals(properties: Property[]): MetricsTotals {
  return {
    listings: properties.length,
    views: properties.reduce((sum, p) => sum + p.listing.views, 0),
    favorites: properties.reduce((sum, p) => sum + p.listing.favorites, 0),
    contacts: properties.reduce((sum, p) => sum + p.listing.inquiries, 0),
  }
}

export interface MemberMetrics {
  userId: string
  name: string
  listings: number
  views: number
  favorites: number
  contacts: number
}

/**
 * Métricas role-aware. El scope (self | org | global) lo decide el rol del
 * usuario y la RLS de la DB lo hace cumplir: un usuario jamás puede pedir
 * métricas de propiedades que no le corresponden.
 */
export const metricsService = {
  scopeFor(user: User | null) {
    return metricsScopeFor(user)
  },

  async getScopeProperties(user: User): Promise<Property[]> {
    const scope = metricsScopeFor(user)
    if (scope === 'global')
      return (await adminService.listProperties('all')).map(rowToProperty)
    if (scope === 'org' && user.organizationId)
      return organizationService.getOrgProperties(user.organizationId)
    return propertyService.getUserProperties(user.id)
  },

  /** Serie temporal de visitas (últimos N días) según el scope del rol. */
  async getViewsSeries(user: User, days = 30): Promise<{ day: string; count: number }[]> {
    const scope = metricsScopeFor(user)
    if (scope === 'global') {
      const { data, error } = await getSupabase().rpc('get_global_views', { days })
      return error ? [] : ((data ?? []) as { day: string; count: number }[])
    }
    if (scope === 'org' && user.organizationId) {
      const { data, error } = await getSupabase().rpc('get_org_views', {
        org_id: user.organizationId,
        days,
      })
      return error ? [] : ((data ?? []) as { day: string; count: number }[])
    }
    return propertyService.getViewsSeries(user.id, days)
  },

  /** Desglose por miembro/agente (solo para dueño/admin de la org). */
  async getMemberBreakdown(user: User): Promise<MemberMetrics[]> {
    const orgId = user.organizationId
    if (!orgId) return []
    const props = await organizationService.getOrgProperties(orgId)

    const byOwner = new Map<string, Property[]>()
    for (const p of props) {
      const list = byOwner.get(p.ownerId) ?? []
      list.push(p)
      byOwner.set(p.ownerId, list)
    }

    const ownerIds = [...byOwner.keys()]
    const names = new Map<string, string>()
    if (ownerIds.length) {
      const { data } = await getSupabase()
        .from('profiles')
        .select('id, name')
        .in('id', ownerIds)
      for (const row of (data ?? []) as { id: string; name: string }[]) names.set(row.id, row.name)
    }

    return [...byOwner.entries()]
      .map(([userId, list]) => ({ userId, name: names.get(userId) ?? '—', ...computeTotals(list) }))
      .sort((a, b) => b.views - a.views)
  },
}
