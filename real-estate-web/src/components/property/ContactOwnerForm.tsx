'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuthContext } from '@/contexts/AuthContext'
import { notificationsService } from '@/services/notificationsService'

/**
 * Mensaje al dueño desde la ficha. Solo para usuarios registrados: el visitante
 * anónimo tiene WhatsApp y teléfono justo arriba, así que exigir cuenta acá no
 * le quita alcance y evita dejar un endpoint de inserción abierto al spam.
 */
export function ContactOwnerForm({ propertyId, ownerId }: { propertyId: string; ownerId: string }) {
  const { user, isAuthenticated } = useAuthContext()
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef<string | null>(null)

  // Escribirse a uno mismo no tiene sentido y ensuciaría sus notificaciones.
  if (user?.id === ownerId) return null

  if (!isAuthenticated) {
    return (
      <div className="mt-4 border-t border-outline-variant/60 pt-4">
        <p className="text-sm text-on-surface-variant">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Inicia sesión
          </Link>{' '}
          para enviar un mensaje, o usa WhatsApp.
        </p>
      </div>
    )
  }

  if (sent) {
    return (
      <div className="mt-4 border-t border-outline-variant/60 pt-4">
        <p className="text-sm text-on-surface">Mensaje enviado. El dueño lo verá en su cuenta.</p>
        <Link
          href={`/mensajes?propiedad=${propertyId}`}
          className="mt-2 inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary"
        >
          <Send size={14} /> Ver conversación
        </Link>
      </div>
    )
  }

  async function handleSend() {
    const text = body.trim()
    if (!text) {
      setError('Escribe un mensaje primero')
      return
    }
    if (!user) return
    setSending(true)
    setError(null)
    try {
      await notificationsService.sendMessage(
        propertyId,
        user.id,
        text,
        (requestId.current ??= crypto.randomUUID())
      )
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el mensaje')
      setSending(false)
    }
  }

  return (
    <div className="mt-4 border-t border-outline-variant/60 pt-4">
      <label htmlFor="mensaje" className="mb-2 block text-sm font-medium text-on-surface">
        Enviar un mensaje
      </label>
      <textarea
        id="mensaje"
        value={body}
        onChange={(e) => {
          setBody(e.target.value)
          requestId.current = null
          if (error) setError(null)
        }}
        maxLength={2000}
        disabled={sending}
        rows={3}
        placeholder="Hola, me interesa esta propiedad. ¿Sigue disponible?"
        className="w-full resize-none rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
      />
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
      <Button
        fullWidth
        size="sm"
        className="mt-2"
        disabled={sending}
        onClick={() => void handleSend()}
      >
        <Send size={15} />
        {sending ? 'Enviando…' : 'Enviar mensaje'}
      </Button>
    </div>
  )
}
