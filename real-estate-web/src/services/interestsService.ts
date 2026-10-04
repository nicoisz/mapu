import { getSupabase } from '@/lib/supabase'
import { propertyService } from '@/services/propertyService'
import type {
  InterestFilters,
  InterestMatch,
  MatchReason,
  PropertyDemand,
  PropertyInterest,
} from '@/types/interests'

interface InterestRow {
  id: string
  filters: InterestFilters
  is_active: boolean
}
interface MatchRow {
  property_id: string
  interest_id: string
  filters: InterestFilters
  score: number
  reasons: MatchReason[]
  is_new: boolean
}
const toInterest = (r: InterestRow): PropertyInterest => ({
  id: r.id,
  filters: r.filters,
  isActive: r.is_active,
})
const failure = () => new Error('No pudimos cargar tus intereses. Intenta nuevamente.')

export const interestsService = {
  async list(): Promise<PropertyInterest[]> {
    const { data, error } = await getSupabase()
      .from('property_interests')
      .select('id, filters, is_active')
      .order('created_at', { ascending: false })
    if (error) throw failure()
    return (data as InterestRow[]).map(toInterest)
  },
  async save(id: string | null, filters: InterestFilters): Promise<PropertyInterest> {
    const table = getSupabase().from('property_interests')
    const query = id ? table.update({ filters }).eq('id', id) : table.insert({ filters })
    const { data, error } = await query.select('id, filters, is_active').single()
    if (error)
      throw new Error('No pudimos guardar el interés. Revisa tus respuestas e intenta nuevamente.')
    return toInterest(data as InterestRow)
  },
  async setActive(id: string, active: boolean): Promise<void> {
    const { error, data } = await getSupabase()
      .from('property_interests')
      .update({ is_active: active })
      .eq('id', id)
      .select('id')
      .single()
    if (error || !data) throw failure()
  },
  async remove(id: string): Promise<void> {
    const { error, data } = await getSupabase()
      .from('property_interests')
      .delete()
      .eq('id', id)
      .select('id')
      .single()
    if (error || !data) throw failure()
  },
  async getMatches(
    page: number
  ): Promise<{ items: InterestMatch[]; seenBefore: string; hasMore: boolean }> {
    const { data, error } = await getSupabase().rpc('get_interest_matches', {
      page_size: 20,
      page_offset: page * 20,
    })
    if (error) throw failure()
    const result = data as { items: MatchRow[]; seen_before: string }
    const properties = result.items.length
      ? await propertyService.getByIds(result.items.map((r) => r.property_id))
      : []
    const byId = new Map(properties.map((p) => [p.id, p]))
    const items: InterestMatch[] = result.items.flatMap((r) => {
      const property = byId.get(r.property_id)
      return property
        ? [
            {
              property,
              interestId: r.interest_id,
              filters: r.filters,
              score: r.score,
              reasons: r.reasons,
              isNew: r.is_new,
            },
          ]
        : []
    })
    return { items, seenBefore: result.seen_before, hasMore: result.items.length === 20 }
  },
  async getNewCount(): Promise<number> {
    const { data, error } = await getSupabase().rpc('get_interest_match_count')
    if (error) throw failure()
    return data as number
  },
  async markSeen(seenBefore: string): Promise<void> {
    const { error } = await getSupabase().rpc('mark_interest_matches_seen', {
      seen_before: seenBefore,
    })
    if (error) throw failure()
  },
  async getOwnedDemand(propertyIds: string[]): Promise<PropertyDemand[]> {
    // One bounded query per batch, even for owners with many listings.
    const results: PropertyDemand[] = []
    for (let start = 0; start < propertyIds.length; start += 100) {
      const { data, error } = await getSupabase().rpc('get_owned_property_demand', {
        property_ids: propertyIds.slice(start, start + 100),
      })
      if (error) throw failure()
      for (const r of data as {
        property_id: string
        users: number
        exact_users: number
        partial_users: number
      }[]) {
        results.push({
          propertyId: r.property_id,
          users: r.users,
          exactUsers: r.exact_users,
          partialUsers: r.partial_users,
        })
      }
    }
    return results
  },
}
