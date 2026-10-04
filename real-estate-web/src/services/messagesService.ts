import { getSupabase } from '@/lib/supabase'
import { captureError } from '@/lib/errorLogging'

export interface Conversation {
  property_id: string
  title: string
  counterparty_id: string
  counterparty_name: string
  last_body: string
  last_at: string
  unread: number
}
export interface ConversationMessage {
  id: string
  body: string
  created_at: string
  is_mine: boolean
  sender_name: string
}
function fail(operation: string, error: { message: string; code?: string }): never {
  captureError({
    message: 'Error de mensajería',
    context: { operation, code: error.code, cause: error.message },
  })
  throw new Error('No pudimos completar esta acción. Intenta nuevamente.')
}
export const messagesService = {
  async list(page = 0): Promise<Conversation[]> {
    const { data, error } = await getSupabase().rpc('list_conversations', {
      page_offset: page * 20,
    })
    if (error) fail('list_conversations', error)
    return (data ?? []) as Conversation[]
  },
  async getMessages(
    property: string,
    counterparty: string,
    before?: string
  ): Promise<{
    items: ConversationMessage[]
    seenBefore: string
    hasMore: boolean
    cursor: string | undefined
  }> {
    const { data, error } = await getSupabase().rpc('conversation_messages', {
      property,
      counterparty,
      before_message: before ?? null,
    })
    if (error) fail('conversation_messages', error)
    const result = data as { items: ConversationMessage[]; seen_before: string }
    return {
      items: [...result.items].reverse(),
      seenBefore: result.seen_before,
      hasMore: result.items.length === 50,
      cursor: result.items.at(-1)?.id,
    }
  },
  async send(
    property: string,
    counterparty: string | null,
    body: string,
    requestId: string,
    userId: string
  ): Promise<void> {
    const { error } = await getSupabase().rpc('send_conversation_message', {
      property,
      counterparty,
      message_body: body.trim(),
      request_id: requestId,
      expected_sender: userId,
    })
    if (error) fail('send_conversation_message', error)
    window.dispatchEvent(new Event('mapu:messages-changed'))
  },
  async markSeen(property: string, counterparty: string, seenBefore: string): Promise<void> {
    const { error } = await getSupabase().rpc('mark_conversation_seen', {
      property,
      counterparty,
      seen_before: seenBefore,
    })
    if (error) fail('mark_conversation_seen', error)
    window.dispatchEvent(new Event('mapu:messages-changed'))
  },
  async unreadCount(): Promise<number> {
    const { data, error } = await getSupabase().rpc('inbox_unread_count')
    if (error) fail('inbox_unread_count', error)
    return data ?? 0
  },
}
