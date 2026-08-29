'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BadgeCheck,
  Check,
  CreditCard,
  Lock,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { cn } from '@/lib/utils'
import { PlatformRole, SubscriptionType } from '@/types/enums'

type PlanId = 'free' | 'premium' | 'business'
type Step = 'plan' | 'checkout' | 'success'

interface Plan {
  id: PlanId
  name: string
  price: number
  tagline: string
  features: string[]
  highlighted?: boolean
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Gratuito',
    price: 0,
    tagline: 'Para empezar a publicar',
    features: [
      '3 publicaciones activas',
      'Perfil público básico',
      'Estadísticas básicas',
      'Soporte por email',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 9900,
    tagline: 'Para vendedores activos',
    features: [
      'Publicaciones ilimitadas',
      'Destacado y marcado Premium',
      'Métricas completas',
      'Favoritos ilimitados',
      'Soporte prioritario',
    ],
    highlighted: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: 19900,
    tagline: 'Para corredoras y empresas',
    features: [
      'Todo lo de Premium',
      'Perfil de empresa verificado',
      'Gestión de equipo (hasta 10)',
      'Métricas por agente',
      'Soporte dedicado',
    ],
  },
]

interface SavedCard {
  id: string
  brand: string
  last4: string
  holder: string
  exp: string
  default?: boolean
}

const CARDS_KEY = 'mapu:saved-cards'

const fmt = (n: number) => `$${n.toLocaleString('es-CL')}`

function CardInput({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-on-surface-variant">{label}</label>
      <input
        {...props}
        className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  )
}

export default function MejorarPage() {
  const router = useRouter()
  const { user, isAuthenticated, hasSubscription } = useAuthContext()
  const [step, setStep] = useState<Step>('plan')
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('premium')
  const [cards, setCards] = useState<SavedCard[]>([])
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [showAddCard, setShowAddCard] = useState(false)
  const [cardForm, setCardForm] = useState({ holder: '', number: '', exp: '', cvc: '' })
  const [cardError, setCardError] = useState<string | null>(null)

  // Cargar tarjetas guardadas (front-only, localStorage).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CARDS_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as SavedCard[]
        setCards(parsed)
        setSelectedCard(parsed.find((c) => c.default)?.id ?? parsed[0]?.id ?? null)
      }
    } catch {
      /* ignore */
    }
  }, [])

  if (!isAuthenticated || !user) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background p-8">
        <EmptyState
          icon={<Lock size={22} />}
          title="Inicia sesión"
          description="Necesitas una cuenta para gestionar tu plan."
          action={
            <Link href="/login" className="block">
              <Button>Iniciar sesión</Button>
            </Link>
          }
        />
      </div>
    )
  }

  // Modo prueba: el flujo de cambio de plan solo lo ve el superadmin.
  if (user.platformRole !== PlatformRole.SUPERADMIN) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background p-8">
        <EmptyState
          icon={<Lock size={22} />}
          title="En desarrollo"
          description="El cambio de plan está en modo prueba y solo está disponible para el administrador."
          action={
            <Link href="/dashboard" className="block">
              <Button>Volver al panel</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const currentPlan: PlanId = hasSubscription(SubscriptionType.PREMIUM)
    ? 'premium'
    : 'free'

  function saveCards(next: SavedCard[]) {
    setCards(next)
    try {
      localStorage.setItem(CARDS_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }

  function persistCard() {
    setCardError(null)
    const digits = cardForm.number.replace(/\D/g, '')
    const exp = cardForm.exp.trim()
    if (digits.length < 12) return setCardError('El número de tarjeta es inválido.')
    if (!cardForm.holder.trim()) return setCardError('Ingresa el nombre del titular.')
    if (!/^\d{2}\s*\/\s*\d{2}$/.test(exp)) return setCardError('Fecha de expiración inválida (MM/AA).')
    if (cardForm.cvc.replace(/\D/g, '').length < 3) return setCardError('CVC inválido.')

    const brands: [RegExp, string][] = [
      [/^4/, 'Visa'],
      [/^5[1-5]/, 'Mastercard'],
      [/^3[47]/, 'Amex'],
    ]
    const brand = brands.find(([re]) => re.test(digits))?.[1] ?? 'Tarjeta'
    const next: SavedCard[] = [
      ...cards.map((c) => ({ ...c, default: false })),
      {
        id: `card_${crypto.randomUUID()}`,
        brand,
        last4: digits.slice(-4),
        holder: cardForm.holder.trim(),
        exp,
        default: true,
      },
    ]
    saveCards(next)
    setSelectedCard(next[next.length - 1].id)
    setCardForm({ holder: '', number: '', exp: '', cvc: '' })
    setShowAddCard(false)
  }

  function removeCard(id: string) {
    const next = cards.filter((c) => c.id !== id).map((c) => ({ ...c, default: false }))
    if (next.length > 0) next[0].default = true
    saveCards(next)
    setSelectedCard(next[0]?.id ?? null)
  }

  function startCheckout(planId: PlanId) {
    setSelectedPlan(planId)
    setStep('checkout')
  }

  const activePlan = PLANS.find((p) => p.id === selectedPlan)!
  const paidCard = cards.find((c) => c.id === selectedCard)

  return (
    <div className="h-full overflow-y-auto bg-background pb-16">
      <PageHeader
        icon={<Sparkles size={20} />}
        title="Tu plan"
        description="Elige el plan que mejor se adapte a tu actividad."
      />

      <div className="mx-auto w-full max-w-4xl space-y-8 px-6 py-6">
        {step === 'plan' && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {PLANS.map((plan) => {
                const isCurrent = plan.id === currentPlan
                const isSelected = plan.id === selectedPlan
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={cn(
                      'flex flex-col rounded-2xl border bg-surface-container-low p-6 text-left transition-all hover:border-primary/50',
                      plan.highlighted
                        ? 'border-primary/60 shadow-soft'
                        : 'border-outline-variant/50',
                      isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-surface'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'text-sm font-semibold',
                          plan.highlighted ? 'text-primary' : 'text-on-surface'
                        )}
                      >
                        {plan.name}
                      </span>
                      {isCurrent && (
                        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                          Actual
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="font-headline text-3xl font-bold text-on-surface">
                        {plan.price === 0 ? 'Gratis' : fmt(plan.price)}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-sm text-on-surface-variant">/mes</span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-on-surface-variant">{plan.tagline}</p>
                    <ul className="mt-5 space-y-2">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-on-surface">
                          <Check size={14} className="shrink-0 text-accent" /> {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                )
              })}
            </div>

            <div className="flex justify-end">
              <Button size="lg" onClick={() => startCheckout(selectedPlan)}>
                {selectedPlan === 'free'
                  ? 'Mantener plan gratuito'
                  : `Continuar con ${PLANS.find((p) => p.id === selectedPlan)!.name}`}
              </Button>
            </div>
          </>
        )}

        {step === 'checkout' && (
          <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-5">
            {/* Resumen */}
            <Card className="md:col-span-2">
              <CardContent className="space-y-4 p-6">
                <p className="text-sm font-semibold text-on-surface">{activePlan.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="font-headline text-4xl font-bold text-on-surface">
                    {activePlan.price === 0 ? 'Gratis' : fmt(activePlan.price)}
                  </span>
                  {activePlan.price > 0 && (
                    <span className="text-on-surface-variant">/mes</span>
                  )}
                </div>
                <ul className="space-y-2">
                  {activePlan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-on-surface">
                      <Check size={14} className="shrink-0 text-accent" /> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setStep('plan')}
                  className="text-sm text-on-surface-variant hover:text-on-surface"
                >
                  ← Cambiar plan
                </button>
              </CardContent>
            </Card>

            {/* Pago */}
            <Card className="md:col-span-3">
              <CardContent className="space-y-5 p-6">
                <div className="flex items-center gap-2">
                  <CreditCard size={18} className="text-on-surface-variant" />
                  <h2 className="font-headline font-semibold text-on-surface">Método de pago</h2>
                </div>

                {cards.length > 0 && (
                  <div className="space-y-2">
                    {cards.map((card) => (
                      <div
                        key={card.id}
                        onClick={() => setSelectedCard(card.id)}
                        className={cn(
                          'flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors',
                          selectedCard === card.id
                            ? 'border-primary/60 bg-primary/5'
                            : 'border-outline-variant/50 hover:border-outline'
                        )}
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container-high text-xs font-bold text-on-surface-variant">
                          {card.brand.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-on-surface">
                            {card.brand} •••• {card.last4}
                          </p>
                          <p className="text-xs text-on-surface-variant">
                            {card.holder} · vence {card.exp}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeCard(card.id)
                          }}
                          className="rounded-lg p-1.5 text-on-surface-variant hover:text-error"
                          title="Eliminar tarjeta"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setShowAddCard((v) => !v)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-outline-variant/70 py-3 text-sm font-medium text-on-surface-variant transition-colors hover:border-primary/60 hover:text-primary"
                >
                  <Plus size={16} /> {cards.length > 0 ? 'Agregar otra tarjeta' : 'Agregar tarjeta'}
                </button>

                {showAddCard && (
                  <div className="space-y-3 rounded-xl border border-outline-variant/50 bg-surface-container-low p-4">
                    <CardInput
                      label="Nombre del titular"
                      placeholder="Como aparece en la tarjeta"
                      value={cardForm.holder}
                      onChange={(e) => setCardForm({ ...cardForm, holder: e.target.value })}
                    />
                    <CardInput
                      label="Número de tarjeta"
                      placeholder="1234 5678 9012 3456"
                      inputMode="numeric"
                      value={cardForm.number}
                      onChange={(e) => setCardForm({ ...cardForm, number: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <CardInput
                        label="Expiración"
                        placeholder="MM/AA"
                        value={cardForm.exp}
                        onChange={(e) => setCardForm({ ...cardForm, exp: e.target.value })}
                      />
                      <CardInput
                        label="CVC"
                        placeholder="•••"
                        inputMode="numeric"
                        type="password"
                        value={cardForm.cvc}
                        onChange={(e) => setCardForm({ ...cardForm, cvc: e.target.value })}
                      />
                    </div>
                    {cardError && <p className="text-xs text-error">{cardError}</p>}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setShowAddCard(false)}>
                        Cancelar
                      </Button>
                      <Button size="sm" onClick={persistCard}>
                        Guardar tarjeta
                      </Button>
                    </div>
                  </div>
                )}

                {cards.length > 0 && (
                  <div className="border-t border-outline-variant/40 pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-on-surface-variant">Plan {activePlan.name} (30 días)</span>
                      <span className="font-semibold text-on-surface">{fmt(activePlan.price)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between border-t border-outline-variant/40 pt-3">
                      <span className="font-semibold text-on-surface">Total</span>
                      <span className="font-bold text-primary">{fmt(activePlan.price)}</span>
                    </div>
                  </div>
                )}

                <Button
                  fullWidth
                  size="lg"
                  disabled={cards.length === 0 || !selectedCard}
                  onClick={() => setStep('success')}
                >
                  <Lock size={16} /> Pagar {fmt(activePlan.price)} /mes
                </Button>
                <p className="flex items-center justify-center gap-1 text-xs text-on-surface-variant">
                  <ShieldCheck size={13} className="shrink-0" />
                  Pago seguro simulado · demo sin cargo real
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'success' && (
          <Card className="mx-auto max-w-md">
            <EmptyState
              icon={<BadgeCheck size={28} />}
              title={`¡Plan ${activePlan.name} activado!`}
              description={
                paidCard
                  ? `Se cobrará ${fmt(activePlan.price)}/mes a tu ${paidCard.brand} •••• ${paidCard.last4}.`
                  : `Tu plan ${activePlan.name} está activo.`
              }
              action={
                <div className="flex gap-3">
                  <Button onClick={() => router.push('/dashboard')}>Ir al panel</Button>
                  <Button variant="outline" onClick={() => router.push('/perfil')}>
                    Ver mi perfil
                  </Button>
                </div>
              }
            />
          </Card>
        )}
      </div>
    </div>
  )
}
