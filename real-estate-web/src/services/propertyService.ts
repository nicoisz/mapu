import { Property } from '@/types/property'
import { PropertyOperation, PropertyStatus } from '@/types/enums'
import { PropertySearchQuery } from '@/types/search'
import { LISTING_EXPIRATION_DAYS } from '@/constants'
import { getSupabase } from '@/lib/supabase'
import { rowToProperty, propertyToRow, PropertyRow } from '@/lib/propertyMapper'

const ROW_COLUMNS = '*'

export const propertyService = {
  async getAll(): Promise<Property[]> {
    const { data, error } = await getSupabase()
      .from('properties')
      .select(ROW_COLUMNS)
      .eq('status', PropertyStatus.ACTIVE)
      .order('published_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data as PropertyRow[]).map(rowToProperty)
  },

  async getFeatured(limit = 3): Promise<Property[]> {
    const { data, error } = await getSupabase()
      .from('properties')
      .select(ROW_COLUMNS)
      .eq('status', PropertyStatus.ACTIVE)
      .or('is_featured.eq.true,is_premium.eq.true')
      .order('published_at', { ascending: false })
      .limit(limit)
    if (error) throw new Error(error.message)
    return (data as PropertyRow[]).map(rowToProperty)
  },

  async getById(id: string): Promise<Property | null> {
    const { data, error } = await getSupabase()
      .from('properties')
      .select(ROW_COLUMNS)
      .eq('id', id)
      .maybeSingle()
    // Invalid uuid or missing row → treat as not found.
    if (error || !data) return null
    return rowToProperty(data as PropertyRow)
  },

  async getByIds(ids: string[]): Promise<Property[]> {
    if (!ids.length) return []
    const { data, error } = await getSupabase().from('properties').select(ROW_COLUMNS).in('id', ids)
    if (error) throw new Error(error.message)
    return (data as PropertyRow[]).map(rowToProperty)
  },

  async getUserProperties(userId: string): Promise<Property[]> {
    const { data, error } = await getSupabase()
      .from('properties')
      .select(ROW_COLUMNS)
      .eq('owner_id', userId)
      .order('published_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data as PropertyRow[]).map(rowToProperty)
  },

  async searchProperties(query: PropertySearchQuery): Promise<Property[]> {
    let q = getSupabase().from('properties').select(ROW_COLUMNS).eq('status', PropertyStatus.ACTIVE)

    const f = query.filters
    if (f?.operation) q = q.eq('operation', f.operation)
    if (f?.type?.length) q = q.in('type', f.type)
    // Rent listings price on monthly_rent; sales on price. Filter the column
    // that matches the operation so ranges behave (rent vs sale scales differ).
    const priceColumn = f?.operation === PropertyOperation.RENT ? 'monthly_rent' : 'price'
    if (f?.priceRange?.min) q = q.gte(priceColumn, f.priceRange.min)
    if (f?.priceRange?.max) q = q.lte(priceColumn, f.priceRange.max)
    if (f?.areaRange?.min) q = q.gte('area', f.areaRange.min)
    if (f?.areaRange?.max) q = q.lte('area', f.areaRange.max)
    if (f?.bedrooms?.min) q = q.gte('bedrooms', f.bedrooms.min)

    if (query.query?.trim()) {
      // Sanitize: commas/parens are PostgREST or() syntax.
      const term = query.query.trim().replace(/[,()]/g, ' ').replace(/\s+/g, ' ')
      q = q.or(`title.ilike.%${term}%,description.ilike.%${term}%,address_commune.ilike.%${term}%,address_city.ilike.%${term}%`)
    }

    if (query.sortBy === 'price') q = q.order('price', { ascending: query.sortOrder !== 'desc' })
    else if (query.sortBy === 'area') q = q.order('area', { ascending: query.sortOrder !== 'desc' })
    else q = q.order('published_at', { ascending: query.sortOrder === 'asc' })

    const offset = query.offset ?? 0
    if (query.limit) q = q.range(offset, offset + query.limit - 1)

    const { data, error } = await q
    if (error) throw new Error(error.message)
    return (data as PropertyRow[]).map(rowToProperty)
  },

  async createProperty(userId: string, data: Partial<Property>): Promise<Property> {
    const expiresAt = new Date(Date.now() + LISTING_EXPIRATION_DAYS * 86_400_000).toISOString()
    const row = { ...propertyToRow(data, userId), status: PropertyStatus.ACTIVE, expires_at: expiresAt }
    const { data: inserted, error } = await getSupabase().from('properties').insert(row).select(ROW_COLUMNS).single()
    if (error) throw new Error(error.message)
    return rowToProperty(inserted as PropertyRow)
  },

  async updateProperty(id: string, updates: Partial<Property>): Promise<Property | null> {
    const row = { ...propertyToRow(updates), updated_at: new Date().toISOString() }
    const { data, error } = await getSupabase().from('properties').update(row).eq('id', id).select(ROW_COLUMNS).maybeSingle()
    if (error || !data) return null
    return rowToProperty(data as PropertyRow)
  },

  async deleteProperty(id: string): Promise<boolean> {
    const { error, count } = await getSupabase().from('properties').delete({ count: 'exact' }).eq('id', id)
    return !error && (count ?? 0) > 0
  },

  async renewProperty(id: string): Promise<Property | null> {
    const expiresAt = new Date(Date.now() + LISTING_EXPIRATION_DAYS * 86_400_000).toISOString()
    const { data, error } = await getSupabase()
      .from('properties')
      .update({ status: PropertyStatus.ACTIVE, expires_at: expiresAt, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(ROW_COLUMNS)
      .maybeSingle()
    if (error || !data) return null
    return rowToProperty(data as PropertyRow)
  },

  /** Fire-and-forget view log (the mobile schema tracks views per row). */
  registerView(id: string): void {
    void getSupabase().from('property_views').insert({ property_id: id }).then(() => {})
  },

  /** Count of ACTIVE listings a user has (free-plan limit checks). */
  async countActiveListings(userId: string): Promise<number> {
    const { count, error } = await getSupabase()
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', userId)
      .eq('status', PropertyStatus.ACTIVE)
    if (error) return 0
    return count ?? 0
  },
}
