import { getSupabaseServerPublic } from '@/lib/supabase/server-public'
import { rowToProperty, PropertyRow } from '@/lib/propertyMapper'
import { Property } from '@/types/property'
import { PropertyStatus } from '@/types/enums'
import { MAX_QUERY_RESULTS } from '@/constants'
import { activeExpiryFilter } from '@/lib/propertyFilters'

/** Lecturas server-side (server components) de propiedades públicas. */

export async function getPropertyById(id: string): Promise<Property | null> {
  const { data, error } = await getSupabaseServerPublic()
    .from('properties')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error || !data) return null
  return rowToProperty(data as PropertyRow)
}

export async function getAllActiveProperties(): Promise<Property[]> {
  const { data, error } = await getSupabaseServerPublic()
    .from('properties')
    .select('*')
    .eq('status', PropertyStatus.ACTIVE)
    .or(activeExpiryFilter())
    .order('published_at', { ascending: false })
    .limit(MAX_QUERY_RESULTS)
  if (error) throw new Error(error.message)
  return (data as PropertyRow[]).map(rowToProperty)
}
