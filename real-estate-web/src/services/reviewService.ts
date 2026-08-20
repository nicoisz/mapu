import { getSupabase } from '@/lib/supabase'

export interface Review {
  id: string
  author_id: string
  subject_id: string
  organization_id: string | null
  property_id: string | null
  rating: number
  comment: string
  created_at: string
  author_name?: string
  property_title?: string
}

export const reviewService = {
  async listForSubject(subjectId: string): Promise<Review[]> {
    const { data, error } = await getSupabase()
      .from('reviews')
      .select('*, profiles!reviews_author_id_fkey(name), properties(title)')
      .eq('subject_id', subjectId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []).map((r: any) => ({
      id: r.id,
      author_id: r.author_id,
      subject_id: r.subject_id,
      organization_id: r.organization_id,
      property_id: r.property_id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      author_name: r.profiles?.name,
      property_title: r.properties?.title,
    }))
  },

  async create(input: {
    subjectId: string
    rating: number
    comment: string
    propertyId?: string
    organizationId?: string
  }): Promise<void> {
    const { error } = await getSupabase()
      .from('reviews')
      .insert({
        subject_id: input.subjectId,
        organization_id: input.organizationId ?? null,
        property_id: input.propertyId ?? null,
        rating: input.rating,
        comment: input.comment,
      })
    if (error) throw new Error(error.message)
  },

  async canReview(authorId: string, subjectId: string, propertyId?: string): Promise<boolean> {
    const { data, error } = await getSupabase()
      .from('reviews')
      .select('id')
      .eq('author_id', authorId)
      .eq('subject_id', subjectId)
      .eq('property_id', propertyId ?? null)
      .maybeSingle()
    if (error) return false
    return !data
  },

  async listAll(): Promise<Review[]> {
    const { data, error } = await getSupabase()
      .from('reviews')
      .select('*, profiles!reviews_author_id_fkey(name), properties(title)')
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw new Error(error.message)
    return (data ?? []).map((r: any) => ({
      id: r.id,
      author_id: r.author_id,
      subject_id: r.subject_id,
      organization_id: r.organization_id,
      property_id: r.property_id,
      rating: r.rating,
      comment: r.comment,
      status: r.status,
      created_at: r.created_at,
      author_name: r.profiles?.name,
      property_title: r.properties?.title,
    }))
  },

  async setStatus(id: string, status: 'published' | 'flagged' | 'removed'): Promise<void> {
    const { error } = await getSupabase().from('reviews').update({ status }).eq('id', id)
    if (error) throw new Error(error.message)
  },
}
