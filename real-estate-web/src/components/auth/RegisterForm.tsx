'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Lock, Mail, User } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { UserType } from '@/types/enums'

const USER_TYPE_OPTIONS = [
  { value: UserType.INDIVIDUAL, label: 'Particular', desc: 'Vendedor o comprador particular' },
  { value: UserType.AGENT, label: 'Corredor', desc: 'Agente inmobiliario' },
  { value: UserType.COMPANY, label: 'Empresa', desc: 'Inmobiliaria o empresa' },
]

export function RegisterForm() {
  const router = useRouter()
  const { register, isLoading, error } = useAuthContext()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userType, setUserType] = useState<UserType>(UserType.INDIVIDUAL)
  const [info, setInfo] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = await register({ name, email, password, userType })
    if (!result.success) return
    // With email confirmation enabled there is no session yet: show the notice.
    if (result.info && !result.user) setInfo(result.info)
    else router.push('/')
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-on-surface">Crear cuenta</h1>
        <p className="text-on-surface-variant text-sm mt-1">Gratis, sin tarjeta de crédito</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-error/10 border border-error/40 rounded-lg p-3 text-error text-sm">
            {error}
          </div>
        )}
        {info && (
          <div className="bg-primary/10 border border-primary/40 rounded-lg p-3 text-on-surface text-sm">
            {info}
          </div>
        )}

        <Input
          label="Nombre completo"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Juan Pérez"
          required
          leftIcon={<User size={14} />}
          autoComplete="name"
        />

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
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 6 caracteres"
          required
          minLength={6}
          leftIcon={<Lock size={14} />}
          autoComplete="new-password"
        />

        <div>
          <p className="text-sm font-medium text-on-surface mb-2">Tipo de cuenta</p>
          <div className="grid grid-cols-3 gap-2">
            {USER_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setUserType(opt.value)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  userType === opt.value
                    ? 'border-primary bg-primary-50 text-primary'
                    : 'border-outline-variant/60 text-on-surface hover:border-outline'
                }`}
              >
                <p className="font-medium text-sm">{opt.label}</p>
                <p className="text-xs text-on-surface-variant mt-0.5 leading-tight">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" fullWidth size="lg" loading={isLoading}>
          Crear cuenta gratis
        </Button>

        <p className="text-xs text-on-surface-variant text-center">
          Al registrarte aceptas nuestros{' '}
          <a href="#" className="text-primary hover:underline">
            Términos de servicio
          </a>{' '}
          y{' '}
          <a href="#" className="text-primary hover:underline">
            Política de privacidad
          </a>
        </p>
      </form>

      <p className="text-center text-sm text-on-surface-variant mt-6">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </div>
  )
}
