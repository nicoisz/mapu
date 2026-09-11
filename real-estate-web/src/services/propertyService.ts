import { Property } from '@/types/property'
import { PropertyOperation, PropertyStatus } from '@/types/enums'
import { PropertySearchQuery } from '@/types/search'
import { LISTING_EXPIRATION_DAYS, MAX_QUERY_RESULTS } from '@/constants'
import { getSupabaseBrowser } from '@/lib/supabase/browser'
import { rethrowUserError } from '@/lib/userMessages'
import { deletePropertyImages } from '@/services/storageService'
import { rowToProperty, propertyToRow, PropertyRow } from '@/lib/propertyMapper'
import { captureError } from '@/lib/errorLogging'
import { activeExpiryFilter } from '@/lib/propertyFilters'
import type { Database } from '@/types/database.generated'

const ROW_COLUMNS = '*'

export const propertyService = {
  async getAll(): Promise<Property[]> {
    const { data, error } = await getSupabaseBrowser()
      .from('properties')
      .select(ROW_COLUMNS)
      .eq('status', PropertyStatus.ACTIVE)
      .or(activeExpiryFilter())
      .order('published_at', { ascending: false })
      .limit(MAX_QUERY_RESULTS)
    if (error) rethrowUserError(error)
    return (data as PropertyRow[]).map(rowToProperty)
  },

  async getFeatured(limit = 3): Promise<Property[]> {
    const { data, error } = await getSupabaseBrowser()
      .from('properties')
      .select(ROW_COLUMNS)
      .eq('status', PropertyStatus.ACTIVE)
      .or(activeExpiryFilter())
      .or('is_featured.eq.true,is_premium.eq.true')
      .order('published_at', { ascending: false })
      .limit(limit)
    if (error) rethrowUserError(error)
    return (data as PropertyRow[]).map(rowToProperty)
  },

  async getById(id: string): Promise<Property | null> {
    const { data, error } = await getSupabaseBrowser()
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
    const { data, error } = await getSupabaseBrowser()
      .from('properties')
      .select(ROW_COLUMNS)
      .in('id', ids)
    if (error) rethrowUserError(error)
    return (data as PropertyRow[]).map(rowToProperty)
  },

  async getUserProperties(userId: string): Promise<Property[]> {
    const { data, error } = await getSupabaseBrowser()
      .from('properties')
      .select(ROW_COLUMNS)
      .eq('owner_id', userId)
      .order('published_at', { ascending: false })
    if (error) rethrowUserError(error)
    return (data as PropertyRow[]).map(rowToProperty)
  },

  async searchProperties(query: PropertySearchQuery): Promise<Property[]> {
    let q = getSupabaseBrowser()
      .from('properties')
      .select(ROW_COLUMNS)
      .eq('status', PropertyStatus.ACTIVE)
      .or(activeExpiryFilter())

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
      q = q.or(
        `title.ilike.%${term}%,description.ilike.%${term}%,address_commune.ilike.%${term}%,address_city.ilike.%${term}%`
      )
    }

    if (query.sortBy === 'price') q = q.order('price', { ascending: query.sortOrder !== 'desc' })
    else if (query.sortBy === 'area') q = q.order('area', { ascending: query.sortOrder !== 'desc' })
    else q = q.order('published_at', { ascending: query.sortOrder === 'asc' })

    const offset = query.offset ?? 0
    // Sin paginación explícita, acota para no cargar la DB completa.
    if (query.limit) q = q.range(offset, offset + query.limit - 1)
    else q = q.range(offset, offset + MAX_QUERY_RESULTS - 1)

    const { data, error } = await q
    if (error) rethrowUserError(error)
    return (data as PropertyRow[]).map(rowToProperty)
  },

  async createProperty(
    userId: string,
    data: Partial<Property>,
    organizationId?: string
  ): Promise<Property> {
    const expiresAt = new Date(Date.now() + LISTING_EXPIRATION_DAYS * 86_400_000).toISOString()
    const row = {
      ...propertyToRow(data, userId, organizationId),
      status: PropertyStatus.ACTIVE,
      expires_at: expiresAt,
    }
    const { data: inserted, error } = await getSupabaseBrowser()
      .from('properties')
      .insert(row as Database['public']['Tables']['properties']['Insert'])
      .select(ROW_COLUMNS)
      .single()
    if (error) rethrowUserError(error)
    return rowToProperty(inserted as PropertyRow)
  },

  /**
   * Publica una propiedad de forma server-side (POST /api/publish). La ruta
   * valida el JWT, re-chequea la membresía de la org y hace el insert con la
   * key service_role. El id del dueño lo impone el servidor, no el cliente.
   */
  async createPropertyServer(
    data: Partial<Property>,
    organizationId?: string,
    clientRequestId?: string
  ): Promise<{ id: string }> {
    const { data: sessionRes } = await getSupabaseBrowser().auth.getSession()
    const token = sessionRes.session?.access_token
    if (!token) throw new Error('No autenticado')

    const res = await fetch('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        ...data,
        organizationId: organizationId ?? null,
        clientRequestId: clientRequestId ?? null,
      }),
    })
    const json = (await res.json().catch(() => ({}))) as {
      error?: { code?: string; message?: string }
      id?: string
    }
    if (!res.ok) throw new Error(json.error?.message ?? 'No se pudo publicar la propiedad')
    return { id: json.id ?? '' }
  },

  async updateProperty(id: string, updates: Partial<Property>): Promise<Property | null> {
    const row = { ...propertyToRow(updates), updated_at: new Date().toISOString() }
    const { data, error } = await getSupabaseBrowser()
      .from('properties')
      .update(row)
      .eq('id', id)
      .select(ROW_COLUMNS)
      .maybeSingle()
    if (error || !data) return null
    return rowToProperty(data as PropertyRow)
  },

  async deleteProperty(id: string): Promise<boolean> {
    // Fetch the row first so we can also remove its storage files.
    const existing = await propertyService.getById(id)
    const { error, count } = await getSupabaseBrowser()
      .from('properties')
      .delete({ count: 'exact' })
      .eq('id', id)
    if (error || !(count ?? 0)) return false
    if (existing?.media.images.length) {
      void deletePropertyImages(existing.media.images).catch(() => {})
    }
    return true
  },

  async renewProperty(id: string): Promise<Property | null> {
    const expiresAt = new Date(Date.now() + LISTING_EXPIRATION_DAYS * 86_400_000).toISOString()
    const { data, error } = await getSupabaseBrowser()
      .from('properties')
      .update({
        status: PropertyStatus.ACTIVE,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(ROW_COLUMNS)
      .maybeSingle()
    if (error || !data) return null
    return rowToProperty(data as PropertyRow)
  },

  /**
   * Fire-and-forget view log. Must be called from a client effect (not during
   * a server render) so prefetches/builds don't inflate the counter. Uses the
   * increment_property_views RPC (SECURITY DEFINER, creado en security-014) que
   * incrementa properties.views y registra la fila en property_views.
   */
  registerView(id: string): void {
    if (typeof window === 'undefined') return
    const supabase = getSupabaseBrowser()
    void supabase.rpc('increment_property_views', { property_id: id }).then(
      () => {},
      (err) => {
        captureError({
          message: 'No se pudo registrar la vista de la propiedad',
          context: { propertyId: id, cause: err instanceof Error ? err.message : String(err) },
        })
      }
    )
  },

  /** Count of ACTIVE listings a user has (free-plan limit checks). Lanza error
   *  ante fallo de DB (no devuelve 0 silencioso, que aparentaría éxito). */
  async countActiveListings(userId: string): Promise<number> {
    const { count, error } = await getSupabaseBrowser()
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', userId)
      .eq('status', PropertyStatus.ACTIVE)
      .or(activeExpiryFilter())
    if (error) rethrowUserError(error)
    return count ?? 0
  },

  /** Vistas diarias del owner (serie temporal, últimos N días). */
  async getViewsSeries(ownerId: string, days = 30): Promise<{ day: string; count: number }[]> {
    const { data, error } = await getSupabaseBrowser().rpc('get_owner_views', {
      owner_id: ownerId,
      days,
    })
    if (error) return []
    return (data ?? []) as { day: string; count: number }[]
  },
}
