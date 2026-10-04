'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, MessageCircle, RefreshCw, Send } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import {
  messagesService,
  type Conversation,
  type ConversationMessage,
} from '@/services/messagesService'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { publicName } from '@/lib/diagnostics'
import { cn } from '@/lib/utils'

export function MessageInbox({ initialPropertyId }: { initialPropertyId?: string }) {
  const { user, isLoading } = useAuthContext()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [threadLoading, setThreadLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [listError, setListError] = useState('')
  const [page, setPage] = useState(0)
  const [moreConversations, setMoreConversations] = useState(false)
  const [moreMessages, setMoreMessages] = useState(false)
  const [cursor, setCursor] = useState<string>()
  const requestId = useRef<string | null>(null)
  const threadVersion = useRef(0)
  const listVersion = useRef(0)
  const initialSelected = useRef(false)
  const end = useRef<HTMLDivElement>(null)
  const loadList = useCallback(
    async (appendPage = 0) => {
      if (!user?.id) return
      const version = ++listVersion.current
      setLoading(true)
      setListError('')
      try {
        const rows = await messagesService.list(appendPage)
        if (version !== listVersion.current) return
        setConversations((prev) =>
          appendPage
            ? [
                ...new Map(
                  [...prev, ...rows].map((c) => [`${c.property_id}:${c.counterparty_id}`, c])
                ).values(),
              ]
            : rows
        )
        setPage(appendPage)
        setMoreConversations(rows.length === 20)
        if (!initialSelected.current && initialPropertyId) {
          const match = rows.find((c) => c.property_id === initialPropertyId)
          if (match) {
            setSelected(match)
            initialSelected.current = true
          }
        }
      } catch (e) {
        if (version === listVersion.current) setListError((e as Error).message)
      } finally {
        if (version === listVersion.current) setLoading(false)
      }
    },
    [user?.id, initialPropertyId]
  )
  useEffect(() => {
    setSelected(null)
    setMessages([])
    setBody('')
    requestId.current = null
    initialSelected.current = false
    void loadList()
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps -- Request sequence, not a DOM ref.
      listVersion.current++
      // eslint-disable-next-line react-hooks/exhaustive-deps -- Invalidate outstanding responses for the previous account.
      threadVersion.current++
    }
  }, [loadList])
  const loadThread = useCallback(
    async (before?: string) => {
      if (!selected || !user?.id) return
      const version = ++threadVersion.current
      setThreadLoading(true)
      setError('')
      try {
        const result = await messagesService.getMessages(
          selected.property_id,
          selected.counterparty_id,
          before
        )
        if (version !== threadVersion.current) return
        setMessages((prev) =>
          before
            ? [...new Map([...result.items, ...prev].map((m) => [m.id, m])).values()]
            : result.items
        )
        setMoreMessages(result.hasMore)
        setCursor(result.cursor)
        if (!before) {
          await messagesService.markSeen(
            selected.property_id,
            selected.counterparty_id,
            result.seenBefore
          )
          if (version === threadVersion.current) {
            setConversations((prev) =>
              prev.map((c) =>
                c.property_id === selected.property_id &&
                c.counterparty_id === selected.counterparty_id
                  ? { ...c, unread: 0 }
                  : c
              )
            )
            setTimeout(() => end.current?.scrollIntoView({ block: 'nearest' }), 0)
          }
        }
      } catch (e) {
        if (version === threadVersion.current) setError((e as Error).message)
      } finally {
        if (version === threadVersion.current) setThreadLoading(false)
      }
    },
    [selected, user?.id]
  )
  useEffect(() => {
    setMessages([])
    setBody('')
    requestId.current = null
    void loadThread()
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps -- Invalidate outstanding responses for the previous conversation.
      threadVersion.current++
    }
  }, [loadThread])
  async function send() {
    if (!selected || !user || !body.trim() || sending) return
    const conversation = selected
    const text = body.trim()
    const id = (requestId.current ??= crypto.randomUUID())
    setSending(true)
    setError('')
    try {
      await messagesService.send(
        conversation.property_id,
        conversation.counterparty_id,
        text,
        id,
        user.id
      )
      setBody('')
      requestId.current = null
      await loadThread()
      await loadList()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSending(false)
    }
  }
  if (isLoading)
    return (
      <p className="p-6" role="status">
        Cargando…
      </p>
    )
  if (!user)
    return (
      <div className="p-6">
        <p>Inicia sesión para ver tus conversaciones.</p>
        <Link href="/login" className="mt-4 inline-block text-primary underline">
          Iniciar sesión
        </Link>
      </div>
    )
  return (
    <div className="flex h-full flex-col bg-background pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
      <PageHeader
        title="Mensajes"
        description="Consulta y responde conversaciones sobre propiedades."
        icon={<MessageCircle size={22} />}
        actions={
          <Button
            variant="outline"
            size="sm"
            disabled={loading || sending}
            onClick={() => {
              void loadList()
              if (selected) void loadThread()
            }}
          >
            <RefreshCw size={15} /> Actualizar
          </Button>
        }
      />
      <div className="grid min-h-0 flex-1 md:grid-cols-[300px_minmax(0,1fr)]">
        <aside
          className={cn(
            'min-h-0 overflow-y-auto border-r border-outline-variant/40 p-3',
            selected && 'hidden md:block'
          )}
          aria-label="Conversaciones"
        >
          {listError ? (
            <div role="alert" className="space-y-3 p-3">
              <p className="text-sm text-error">{listError}</p>
              <Button size="sm" onClick={() => void loadList()}>
                Reintentar
              </Button>
            </div>
          ) : loading && !conversations.length ? (
            <p role="status" className="p-4 text-sm">
              Cargando conversaciones…
            </p>
          ) : !conversations.length ? (
            <div className="p-4">
              <p className="font-semibold">Todavía no tienes mensajes</p>
              <p className="mt-2 text-sm text-on-surface-variant">
                Los mensajes que envíes y recibas desde una propiedad aparecerán aquí.
              </p>
            </div>
          ) : (
            conversations.map((c) => (
              <button
                key={`${c.property_id}:${c.counterparty_id}`}
                disabled={sending}
                onClick={() => setSelected(c)}
                className={cn(
                  'mb-2 w-full rounded-xl border border-outline-variant/30 p-4 text-left transition-colors hover:bg-secondary/10 focus-visible:outline-primary',
                  selected?.property_id === c.property_id &&
                    selected.counterparty_id === c.counterparty_id &&
                    'border-secondary/40 bg-secondary/10'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold">
                    {publicName(c.counterparty_name)}
                  </span>
                  {c.unread > 0 && (
                    <span className="rounded-full bg-accent px-2 text-xs text-white">
                      {c.unread}
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-xs text-on-surface-variant">{c.title}</p>
                <p className="mt-2 truncate text-sm">{c.last_body}</p>
                <p className="mt-2 text-xs text-on-surface-variant">
                  {new Date(c.last_at).toLocaleString('es-CL')}
                </p>
              </button>
            ))
          )}
          {moreConversations && (
            <Button
              variant="outline"
              size="sm"
              fullWidth
              disabled={loading}
              onClick={() => void loadList(page + 1)}
            >
              Cargar más conversaciones
            </Button>
          )}
        </aside>
        {selected ? (
          <section className="flex min-h-0 flex-col">
            <div className="flex items-center gap-3 border-b border-outline-variant/40 p-4">
              <button
                className="rounded-lg p-2 md:hidden"
                aria-label="Volver a conversaciones"
                disabled={sending}
                onClick={() => setSelected(null)}
              >
                <ArrowLeft size={20} />
              </button>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-semibold">{publicName(selected.counterparty_name)}</h2>
                <p className="truncate text-xs text-on-surface-variant">{selected.title}</p>
              </div>
              <Link
                href={`/propiedad/${selected.property_id}`}
                aria-label="Ver propiedad"
                className="rounded-lg p-2 text-primary"
              >
                <ArrowUpRight size={19} />
              </Link>
            </div>
            <div
              className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4"
              aria-label="Historial de mensajes"
              aria-busy={threadLoading}
            >
              {moreMessages && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={threadLoading}
                  onClick={() => void loadThread(cursor)}
                >
                  Cargar mensajes anteriores
                </Button>
              )}
              {threadLoading && !messages.length && (
                <p role="status" className="text-sm">
                  Cargando mensajes…
                </p>
              )}
              {messages.map((m) => (
                <div key={m.id} className={cn('flex', m.is_mine ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[88%] rounded-2xl p-3 text-sm sm:max-w-[75%]',
                      m.is_mine ? 'bg-secondary/15' : 'bg-surface-container-low'
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                      {m.body}
                    </p>
                    <p className="mt-2 text-[11px] text-on-surface-variant">
                      {m.is_mine ? 'Tú' : publicName(m.sender_name)} ·{' '}
                      {new Date(m.created_at).toLocaleString('es-CL')}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={end} />
            </div>
            {error && (
              <div
                role="alert"
                className="flex items-center justify-between gap-2 px-4 py-2 text-sm text-error"
              >
                <p>{error}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={sending}
                  onClick={() => void loadThread()}
                >
                  Reintentar
                </Button>
              </div>
            )}
            <form
              className="space-y-2 border-t border-outline-variant/40 bg-surface-container-lowest p-4"
              onSubmit={(e) => {
                e.preventDefault()
                void send()
              }}
            >
              <label htmlFor="reply-message" className="text-sm font-medium">
                Responder
              </label>
              <textarea
                id="reply-message"
                rows={2}
                maxLength={2000}
                required
                disabled={sending}
                value={body}
                onChange={(e) => {
                  setBody(e.target.value)
                  requestId.current = null
                }}
                placeholder="Escribe tu respuesta…"
                className="w-full resize-none rounded-xl border border-outline-variant/60 bg-surface px-3 py-2 text-sm focus-visible:outline-primary"
              />
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs tabular-nums text-on-surface-variant">
                  {body.length}/2000
                </span>
                <Button
                  type="submit"
                  size="sm"
                  loading={sending}
                  disabled={!body.trim() || threadLoading}
                >
                  <Send size={15} /> Enviar respuesta
                </Button>
              </div>
            </form>
          </section>
        ) : (
          <div className="hidden items-center justify-center p-8 text-center text-on-surface-variant md:flex">
            <div>
              <MessageCircle size={32} className="mx-auto mb-4 text-accent" />
              <p>Selecciona una conversación para leer y responder.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
