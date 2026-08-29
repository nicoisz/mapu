'use client'

import { useState } from 'react'
import Link from 'next/link'
import { KeyRound, Mail } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    // redirectTo debe estar dentro de las Redirect URLs de Supabase.
    const redirectTo = `${window.location.origin}/auth/update-password`
    const { error: err } = await getSupabase().auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    })
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="text-center">
        <KeyRound size={40} className="mx-auto mb-4 text-primary" />
        <h1 className="text-xl font-bold text-on-surface">Revisa tu correo</h1>
        <p className="text-on-surface-variant text-sm mt-2">
          Te enviamos un enlace para restablecer tu contraseña a <strong>{email}</strong>.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-primary font-medium text-sm hover:underline"
        >
          Volver a iniciar sesión
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-on-surface">Recuperar contraseña</h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Ingresa tu correo y te enviamos las instrucciones.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-error/10 border border-error/40 rounded-lg p-3 text-error text-sm">
            {error}
          </div>
        )}
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.cl"
          required
          leftIcon={<Mail size={14} />}
          autoComplete="email"
        />
        <Button type="submit" fullWidth size="lg" loading={loading}>
          Enviar enlace
        </Button>
      </form>

      <p className="text-center text-sm text-on-surface-variant mt-6">
        ¿Recordaste tu contraseña?{' '}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  )
}
