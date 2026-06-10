'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { APP_CONFIG } from '@/constants'

export function LoginForm() {
  const router = useRouter()
  const { login, loginWithSocial, isLoading, error } = useAuthContext()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = await login(email, password)
    if (result.success) router.push('/')
  }

  async function handleSocial(provider: 'google' | 'apple' | 'facebook') {
    const result = await loginWithSocial(provider)
    if (result.success) router.push('/')
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-on-surface">Bienvenido a {APP_CONFIG.name}</h1>
        <p className="text-on-surface-variant text-sm mt-1">Ingresa a tu cuenta para continuar</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-error/10 border border-error/40 rounded-lg p-3 text-error text-sm">{error}</div>
        )}

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="tu@email.cl"
          required
          leftIcon={<Mail size={14} />}
          autoComplete="email"
        />

        <Input
          label="Contraseña"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          leftIcon={<Lock size={14} />}
          rightIcon={
            <button type="button" onClick={() => setShowPassword(s => !s)} className="text-on-surface-variant hover:text-on-surface">
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

      <div className="space-y-2">
        <button
          onClick={() => handleSocial('google')}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 border border-outline-variant/60 rounded-lg py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
        >
          <span className="text-lg">G</span>
          Continuar con Google
        </button>
        <button
          onClick={() => handleSocial('facebook')}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-[#1877F2] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#166fe5] transition-colors disabled:opacity-50"
        >
          <span className="text-lg">f</span>
          Continuar con Facebook
        </button>
      </div>

      <p className="text-center text-sm text-on-surface-variant mt-6">
        ¿No tienes cuenta?{' '}
        <Link href="/register" className="text-primary font-medium hover:underline">Regístrate gratis</Link>
      </p>

      <div className="mt-4 p-3 bg-surface-container rounded-lg border border-outline-variant/40">
        <p className="text-xs text-on-surface-variant font-medium mb-1">Cuentas de prueba:</p>
        <div className="text-xs text-on-surface-variant space-y-0.5">
          <p>test@mapu.cl / test123</p>
          <p>carlos@inmobiliaria.cl / carlos123</p>
        </div>
      </div>
    </div>
  )
}
