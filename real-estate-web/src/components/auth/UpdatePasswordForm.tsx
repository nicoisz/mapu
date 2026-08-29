'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { KeyRound, Lock } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function UpdatePasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [checking, setChecking] = useState(true)

  // supabase-js procesa el hash `#access_token=...&type=recovery` en la URL y
  // deja la sesión lista; solo confirmamos que existe antes de mostrar el form.
  useEffect(() => {
    let active = true
    getSupabase()
      .auth.getSession()
      .then(() => active && setChecking(false))
      .catch(() => active && setChecking(false))
    return () => {
      active = false
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setLoading(true)
    setError(null)
    const { error: err } = await getSupabase().auth.updateUser({ password })
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    setDone(true)
  }

  if (checking) {
    return (
      <div className="text-center text-on-surface-variant text-sm">
        <KeyRound size={32} className="mx-auto mb-3 text-primary animate-pulse" />
        Verificando enlace…
      </div>
    )
  }

  if (done) {
    return (
      <div className="text-center">
        <KeyRound size={40} className="mx-auto mb-4 text-primary" />
        <h1 className="text-xl font-bold text-on-surface">Contraseña actualizada</h1>
        <p className="text-on-surface-variant text-sm mt-2">
          Ya puedes iniciar sesión con tu nueva contraseña.
        </p>
        <Button fullWidth className="mt-6" onClick={() => router.push('/login')}>
          Ir a iniciar sesión
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-on-surface">Nueva contraseña</h1>
        <p className="text-on-surface-variant text-sm mt-1">Elige una clave segura.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-error/10 border border-error/40 rounded-lg p-3 text-error text-sm">
            {error}
          </div>
        )}
        <Input
          label="Nueva contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          leftIcon={<Lock size={14} />}
          autoComplete="new-password"
        />
        <Input
          label="Confirmar contraseña"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          required
          leftIcon={<Lock size={14} />}
          autoComplete="new-password"
        />
        <Button type="submit" fullWidth size="lg" loading={loading}>
          Guardar contraseña
        </Button>
      </form>

      <p className="text-center text-sm text-on-surface-variant mt-6">
        <Link href="/login" className="text-primary font-medium hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </div>
  )
}
