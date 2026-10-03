'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { safeRedirectPath } from '@/lib/redirect'

const DEFAULT_DESTINATION = '/buscar'

export function LoginForm() {
  const router = useRouter()
  const { login, loginWithSocial, isLoading, error } = useAuthContext()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [next, setNext] = useState('/')
  useEffect(() => {
    setNext(safeRedirectPath(new URLSearchParams(window.location.search).get('next')))
  }, [])

  // Vuelve a ?next (p.ej. /admin) si vino de ahí; si no, al mapa /buscar.
  const destination = next && next !== '/' ? next : DEFAULT_DESTINATION

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = await login(email, password)
    if (result.success) router.push(destination)
  }

  async function handleSocial(provider: 'google' | 'apple' | 'facebook') {
    // signInWithOAuth navega al proveedor y vuelve con la sesión; AuthContext
    // la detecta via onAuthStateChange. No navegar aquí: un push() tras iniciar
    // el flujo puede cancelar la redirección OAuth.
    await loginWithSocial(provider)
  }

  return (
    <div className="auth-login-form w-full">
      <div className="mb-8">
        <h1 className="font-display text-[2.5rem] leading-[1.06] tracking-tight text-on-surface sm:text-[3.25rem]">
          Tu próximo paso empieza aquí.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-on-surface-variant">
          {next === '/publicar'
            ? 'Tu borrador está guardado. Ingresa para continuar con la siguiente etapa.'
            : 'Ingresa a tu cuenta para buscar, guardar y publicar en MapU.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div
            role="alert"
            className="bg-error/10 border border-error/40 rounded-lg p-3 text-error text-sm"
          >
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

        <Input
          label="Contraseña"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          leftIcon={<Lock size={14} />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="text-on-surface-variant hover:text-on-surface"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          }
          autoComplete="current-password"
        />

        <Button type="submit" fullWidth size="lg" loading={isLoading}>
          Iniciar sesión
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-on-surface-variant">o continúa con</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => handleSocial('google')}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 border border-outline-variant/60 rounded-lg py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0">
            <path
              fill="#4285F4"
              d="M21.6 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.4a4.6 4.6 0 0 1-2 3v2.5h3.3c1.9-1.8 2.9-4.3 2.9-7.4Z"
            />
            <path
              fill="#34A853"
              d="M12 22c2.7 0 5-1 6.7-2.4l-3.3-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.2H3v2.6A10 10 0 0 0 12 22Z"
            />
            <path
              fill="#FBBC05"
              d="M6.4 13.9A6 6 0 0 1 6 12c0-.7.1-1.3.4-1.9V7.5H3a10 10 0 0 0 0 9l3.4-2.6Z"
            />
            <path
              fill="#EA4335"
              d="M12 6c1.5 0 2.8.5 3.8 1.5l2.8-2.8A9.6 9.6 0 0 0 12 2a10 10 0 0 0-9 5.5l3.4 2.6A6 6 0 0 1 12 6Z"
            />
          </svg>
          <span className="sr-only">Continuar con </span>Google
        </button>
        <button
          onClick={() => handleSocial('facebook')}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 border border-outline-variant/60 rounded-lg py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="#1877F2">
            <path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7v-3.5h3.1V9.3c0-3.1 1.9-4.8 4.7-4.8 1.4 0 2.8.2 2.8.2v3.1H16c-1.5 0-1.9.9-1.9 1.9V12h3.3l-.5 3.5h-2.8v8.4A12 12 0 0 0 24 12Z" />
          </svg>
          <span className="sr-only">Continuar con </span>Facebook
        </button>
      </div>

      <p className="text-center text-sm text-on-surface-variant mt-6">
        ¿No tienes cuenta?{' '}
        <Link
          href={next && next !== '/' ? `/register?next=${encodeURIComponent(next)}` : '/register'}
          className="text-primary font-medium hover:underline"
        >
          Regístrate gratis
        </Link>
      </p>
    </div>
  )
}
