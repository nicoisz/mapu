import { getSupabase } from '@/lib/supabase'

/**
 * Notificaciones del dueño de una propiedad.
 *
 * No hay tabla de notificaciones: el feed se deriva al leer desde `favorites`
 * y `messages` (ver la migración `20260926120000_notifications.sql`). Se
 * consulta al entrar al módulo o recargar; no hay push ni polling.
 */

export type ActivityKind = 'like' | 'message'

export interface ActivityItem {
  kind: ActivityKind
  propertyId: string
  title: string
  /** Quién escribió. Null en los likes: `favorites` es privado. */
  actorName: string | null
  body: string | null
  createdAt: string
  isNew: boolean
}

interface ActivityRow {
  kind: ActivityKind
  property_id: string
  title: string
  actor_name: string | null
  body: string | null
  created_at: string
  is_new: boolean
}

export const notificationsService = {
  async getActivity(): Promise<ActivityItem[]> {
    const { data, error } = await getSupabase().rpc('owner_activity')
    if (error) return []
    return (data as ActivityRow[]).map((r) => ({
      kind: r.kind,
      propertyId: r.property_id,
      title: r.title,
      actorName: r.actor_name,
      body: r.body,
      createdAt: r.created_at,
      isNew: r.is_new,
    }))
  },

  async getUnreadCount(): Promise<number> {
    const { data, error } = await getSupabase().rpc('owner_unread_count')
    if (error) return 0
    return (data as number) ?? 0
  },

  async markSeen(): Promise<void> {
    await getSupabase().rpc('mark_notifications_seen')
  },

  /** Mensaje al dueño. Solo usuarios registrados; el anónimo usa WhatsApp. */
  async sendMessage(propertyId: string, senderId: string, body: string): Promise<void> {
    const { error } = await getSupabase()
      .from('messages')
      .insert({ property_id: propertyId, sender_id: senderId, body: body.trim() })
    if (error) throw new Error('No se pudo enviar el mensaje')
  },
}
