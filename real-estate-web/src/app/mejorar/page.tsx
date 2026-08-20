'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  CreditCard,
  Lock,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { paymentService, PREMIUM_PRICE } from '@/services/paymentService'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { SubscriptionType } from '@/types/enums'

type Step = 'plan' | 'checkout' | 'success'

const FORMATTED_PRICE = `$${PREMIUM_PRICE.toLocaleString('es-CL')}`

const FEATURES = [
  'Publicaciones ilimitadas',
  'Página pública de tu perfil',
  'Destacados y marcado como Premium',
  'Métricas completas de tus avisos',
  'Soporte prioritario',
]

function StepIndicator({ current }: { current: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: 'plan', label: 'Plan' },
    { id: 'checkout', label: 'Pago' },
    { id: 'success', label: 'Confirmación' },
  ]
  const idx = steps.findIndex((s) => s.id === current)
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center gap-2">
          <div
            className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
              i <= idx
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-variant'
            )}
          >
            {i < idx ? <Check size={14} /> : i + 1}
          </div>
          <span
            className={cn(
              'text-xs font-medium',
              i <= idx ? 'text-on-surface' : 'text-on-surface-variant'
            )}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <div className={cn('w-8 h-px', i < idx ? 'bg-primary' : 'bg-outline-variant/60')} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function MejorarPage() {
  const router = useRouter()
  const { user, isAuthenticated, hasSubscription, refreshUser } = useAuthContext()
  const [step, setStep] = useState<Step>('plan')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isAuthenticated || !user) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-background">
        <Lock size={48} className="text-on-surface-variant/40 mb-4" />
        <h2 className="font-headline text-xl font-bold text-on-surface">Inicia sesión</h2>
        <p className="text-on-surface-variant text-sm mt-2">
          Necesitas una cuenta para mejorar tu plan.
        </p>
        <Link
          href="/login"
          className="mt-6 bg-primary text-on-primary px-6 py-2.5 rounded-xl text-sm font-semibold hover:brightness-110 transition-all"
        >
          Iniciar sesión
        </Link>
      </div>
    )
  }

  if (hasSubscription(SubscriptionType.PREMIUM)) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-background">
        <BadgeCheck size={48} className="text-accent mb-4" />
        <h2 className="font-headline text-xl font-bold text-on-surface">Ya eres Premium</h2>
        <p className="text-on-surface-variant text-sm mt-2">Disfruta de todas las ventajas.</p>
        <Link
          href="/dashboard"
          className="mt-6 bg-primary text-on-primary px-6 py-2.5 rounded-xl text-sm font-semibold hover:brightness-110 transition-all"
        >
          Ir al panel
        </Link>
      </div>
    )
  }

  async function startCheckout() {
    if (!user) return
    setError(null)
    setProcessing(true)
    try {
      await paymentService.createPreference(user.id)
      setStep('checkout')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al iniciar el pago')
    } finally {
      setProcessing(false)
    }
  }

  async function confirmPayment() {
    if (!user) return
    setError(null)
    setProcessing(true)
    try {
      await paymentService.confirmPremium(user.id)
      await refreshUser()
      setStep('success')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al confirmar')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm mb-4"
        >
          <ArrowLeft size={18} /> Volver
        </Link>

        <StepIndicator current={step} />

        {step === 'plan' && (
          <>
            <div className="text-center mb-6">
              <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 text-primary mb-3">
                <Star size={28} className="fill-primary" />
              </span>
              <h1 className="font-headline text-3xl font-bold text-on-surface">MapU Premium</h1>
              <p className="text-on-surface-variant mt-1">
                Todo lo que necesitas para vender más rápido.
              </p>
            </div>

            <div className="bg-surface-container-low rounded-2xl border border-primary/40 p-6 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-[60px]" />
              <div className="flex items-baseline gap-1">
                <span className="font-headline text-4xl font-bold text-on-surface">
                  {FORMATTED_PRICE}
                </span>
                <span className="text-on-surface-variant">/mes</span>
              </div>
              <ul className="mt-4 space-y-2">
                {FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-on-surface">
                    <Check size={15} className="text-accent shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>

            {error && <p className="text-error text-sm mt-3">{error}</p>}

            <Button
              fullWidth
              size="lg"
              className="mt-5"
              loading={processing}
              onClick={startCheckout}
            >
              <Sparkles size={18} /> Continuar al pago
            </Button>
          </>
        )}

        {step === 'checkout' && (
          <>
            <div className="bg-surface-container-low rounded-2xl border border-outline-variant/40 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-on-surface-variant" />
                <h2 className="font-headline font-semibold text-on-surface">Checkout</h2>
              </div>

              {/* Mercado Pago branding placeholder */}
              <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#009EE3] flex items-center justify-center text-white font-bold text-xs">
                  MP
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface">Mercado Pago</p>
                  <p className="text-xs text-on-surface-variant">Pago seguro · tarjetas y más</p>
                </div>
                <span className="ml-auto text-xs text-on-surface-variant font-medium">
                  {FORMATTED_PRICE}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-on-surface-variant">Plan Premium (30 días)</span>
                <span className="font-semibold text-on-surface">{FORMATTED_PRICE}</span>
              </div>
              <div className="flex items-center justify-between text-sm border-t border-outline-variant/40 pt-3">
                <span className="font-semibold text-on-surface">Total</span>
                <span className="font-bold text-primary">{FORMATTED_PRICE}</span>
              </div>

              {error && <p className="text-error text-sm">{error}</p>}

              <Button fullWidth size="lg" loading={processing} onClick={confirmPayment}>
                <Lock size={16} /> Pagar {FORMATTED_PRICE}
              </Button>
              <button
                onClick={() => setStep('plan')}
                className="w-full text-sm text-on-surface-variant hover:text-on-surface py-1"
              >
                Volver
              </button>

              <p className="text-xs text-on-surface-variant flex items-center gap-1">
                <ShieldCheck size={13} className="shrink-0" />
                Integración con Mercado Pago pendiente: este checkout es una simulación del flujo.
              </p>
            </div>
          </>
        )}

        {step === 'success' && (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-accent/15 flex items-center justify-center mb-4">
              <BadgeCheck size={32} className="text-accent" />
            </div>
            <h1 className="font-headline text-2xl font-bold text-on-surface">¡Eres Premium!</h1>
            <p className="text-on-surface-variant text-sm mt-2 max-w-sm mx-auto">
              Tu cuenta se actualizó. Publica sin límites y aprovecha las ventajas.
            </p>
            <div className="flex gap-3 mt-6 max-w-xs mx-auto">
              <Button fullWidth onClick={() => router.push('/dashboard')}>
                Ir al panel
              </Button>
            </div>
          </div>
        )}

        {step !== 'success' && (
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-6 mx-auto flex items-center gap-1 text-xs text-on-surface-variant hover:text-on-surface"
          >
            <X size={13} /> Cancelar y volver
          </button>
        )}
      </div>
    </div>
  )
}
