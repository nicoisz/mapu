'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  House,
  KeyRound,
  MapPin,
  ShieldCheck,
  Trees,
  Wallet,
  BriefcaseBusiness,
  Store,
  Warehouse,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { InterestSummary } from './InterestSummary'
import {
  cleanInterestFilters,
  defaultInterestFilters,
  hasHousingTypes,
  INTEREST_FEATURES,
  interestTypeLabel,
} from '@/lib/interests'
import { Currency, PropertyOperation, PropertyType } from '@/types/enums'
import type { InterestFilters } from '@/types/interests'
import regions from '@/data/chile-regiones-comunas.json'
import styles from './interests.module.css'

const typeIcons = {
  house: House,
  apartment: Building2,
  land: Trees,
  office: BriefcaseBusiness,
  commercial: Store,
  warehouse: Warehouse,
}

const questions: Record<string, string> = {
  operation: '¿Quieres comprar o arrendar?',
  types: '¿Qué propiedades te interesan?',
  communes: '¿En qué comunas buscarías?',
  maxPrice: '¿Cuál es tu presupuesto máximo?',
  minArea: '¿Qué superficie mínima necesitas?',
  minBedrooms: '¿Cuántos dormitorios necesitas como mínimo?',
  minBathrooms: '¿Cuántos baños necesitas como mínimo?',
  features: '¿Qué características te interesan?',
  review: 'Así quedó tu interés',
}
const inputClass =
  'w-full rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-4 py-3 text-on-surface transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2'

export function InterestQuiz({
  initial,
  onSave,
  onCancel,
}: {
  initial?: InterestFilters
  onSave: (f: InterestFilters) => Promise<void>
  onCancel?: () => void
}) {
  const [filters, setFilters] = useState<InterestFilters>(() =>
    initial ? structuredClone(initial) : defaultInterestFilters()
  )
  const [step, setStep] = useState(0)
  const [region, setRegion] = useState<keyof typeof regions>('Región de Los Ríos')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  const steps = [
    'operation',
    'types',
    'communes',
    'maxPrice',
    'minArea',
    ...(hasHousingTypes(filters) ? ['minBedrooms', 'minBathrooms'] : []),
    'features',
    'review',
  ]
  const key = steps[step]
  useEffect(() => {
    if (step > 0) heading.current?.focus()
  }, [step])
  const update = (patch: Partial<InterestFilters>) =>
    setFilters((f) => cleanInterestFilters({ ...f, ...patch }))
  const toggle = (
    field: 'types' | 'communes' | 'alternativeCommunes' | 'features' | 'required',
    value: string
  ) => {
    const values: string[] = filters[field]
    update({
      [field]: values.includes(value) ? values.filter((v) => v !== value) : [...values, value],
    })
  }
  const mandatory = (criterion: string, enabled: boolean) =>
    enabled && (
      <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-surface-container-low px-3 py-2 text-sm text-on-surface-variant">
        <input
          type="checkbox"
          checked={filters.required.includes(criterion)}
          onChange={() => toggle('required', criterion)}
        />{' '}
        Indispensable
      </label>
    )
  async function submit() {
    if (key !== 'review') {
      setStep((s) => s + 1)
      return
    }
    setBusy(true)
    setError('')
    try {
      await onSave(cleanInterestFilters(filters))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos guardar el interés.')
    } finally {
      setBusy(false)
    }
  }
  const skip = () => {
    if (key === 'communes') update({ communes: [], alternativeCommunes: [] })
    else if (key === 'features') update({ features: [] })
    else update({ [key]: undefined })
    setStep((s) => s + 1)
  }
  return (
    <div className={`${styles.enter} grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]`}>
      <aside className="hidden space-y-6 rounded-2xl bg-secondary/10 p-6 lg:block">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/20 text-accent">
          <House size={23} />
        </span>
        <div>
          <h2 className="font-headline text-xl font-semibold leading-tight">
            Un lugar que va contigo.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
            Cada respuesta nos ayuda a acercarte a lo que estás buscando.
          </p>
        </div>
        <div className="space-y-4 border-t border-primary/10 pt-5">
          <div className="flex items-start gap-3">
            <House size={17} className="mt-0.5 shrink-0 text-accent" />
            <div>
              <p className="text-xs text-on-surface-variant">Tu propiedad</p>
              <p className="mt-1 text-sm font-medium">
                {filters.types.length
                  ? filters.types.map(interestTypeLabel).join(' · ')
                  : 'Aún por descubrir'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin size={17} className="mt-0.5 shrink-0 text-accent" />
            <div>
              <p className="text-xs text-on-surface-variant">Tu ubicación</p>
              <p className="mt-1 text-sm font-medium">
                {filters.communes.join(', ') || 'Tú eliges dónde'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Wallet size={17} className="mt-0.5 shrink-0 text-accent" />
            <div>
              <p className="text-xs text-on-surface-variant">Tu presupuesto</p>
              <p className="mt-1 text-sm font-medium tabular-nums">
                {filters.maxPrice
                  ? `${filters.maxPrice.toLocaleString('es-CL')} ${filters.currency}`
                  : 'Sin definir todavía'}
              </p>
            </div>
          </div>
        </div>
        <p className="flex items-start gap-2 border-t border-primary/10 pt-5 text-xs leading-relaxed text-on-surface-variant">
          <ShieldCheck size={16} className="shrink-0 text-accent" />
          Tus intereses son privados. Puedes cambiarlos cuando quieras.
        </p>
      </aside>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
        className={`${styles.quiz} min-w-0 space-y-6 rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-5 sm:p-8`}
        aria-label="Quiz de intereses"
      >
        <div>
          <div className="flex items-center justify-between gap-2 text-xs font-medium text-on-surface-variant">
            <span>{initial ? 'Editar búsqueda' : 'Tu nuevo interés'}</span>
            <span className="tabular-nums">
              {step + 1} / {steps.length}
            </span>
          </div>
          <div
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-container"
            role="progressbar"
            aria-valuenow={step + 1}
            aria-valuemin={0}
            aria-valuemax={steps.length}
            aria-label="Progreso del interés"
          >
            <div
              className={`${styles.progress} h-full rounded-full bg-secondary`}
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>
          <h2
            ref={heading}
            tabIndex={-1}
            className="mt-7 font-headline text-2xl font-bold tracking-tight text-on-surface outline-none sm:text-3xl"
          >
            {questions[key]}
          </h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            {key === 'review'
              ? 'Puedes volver para cambiar respuestas. Guardamos únicamente al confirmar.'
              : key === 'operation'
                ? 'Elige cómo quieres encontrar tu próximo lugar.'
                : key === 'types'
                  ? 'Puedes elegir más de un tipo de propiedad.'
                  : 'Puedes ser flexible. Marca indispensable solo lo que no puede faltar.'}
          </p>
        </div>
        <div key={key} className={`${styles.enter} space-y-4`}>
          {key === 'operation' && (
            <div className="grid grid-cols-2 gap-3">
              {[
                ['sale', 'Comprar'],
                ['rent', 'Arrendar'],
              ].map(([value, label]) => (
                <label
                  key={value}
                  className={`${styles.option} flex min-h-40 flex-col items-start justify-between gap-4 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5`}
                >
                  <span className="flex w-full items-center justify-between text-accent">
                    {value === 'sale' ? (
                      <House size={30} strokeWidth={1.5} />
                    ) : (
                      <KeyRound size={30} strokeWidth={1.5} />
                    )}
                    <input
                      type="radio"
                      name="operation"
                      value={value}
                      checked={filters.operation === value}
                      onChange={() => update({ operation: value as PropertyOperation })}
                    />
                  </span>
                  <span>
                    <span className="block text-lg font-semibold">{label}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-on-surface-variant">
                      {value === 'sale'
                        ? 'Un lugar para hacer tuyo'
                        : 'Un espacio para tu próxima etapa'}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}
          {key === 'types' && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.values(PropertyType).map((type) => {
                  const Icon = typeIcons[type]
                  return (
                    <label
                      key={type}
                      className={`${styles.option} ${inputClass} flex items-center gap-3`}
                    >
                      <Icon size={22} strokeWidth={1.5} className="shrink-0 text-accent" />
                      <span className="flex-1 text-sm font-medium">{interestTypeLabel(type)}</span>
                      <input
                        type="checkbox"
                        checked={filters.types.includes(type)}
                        onChange={() => toggle('types', type)}
                      />
                    </label>
                  )
                })}
              </div>
              {mandatory('types', filters.types.length > 0)}
            </>
          )}
          {key === 'communes' && (
            <>
              <label className="block text-sm">
                Región
                <select
                  className={`${inputClass} mt-2`}
                  aria-label="Región"
                  value={region}
                  onChange={(e) => setRegion(e.target.value as keyof typeof regions)}
                >
                  {Object.keys(regions).map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
              <p className="text-xs text-on-surface-variant">
                Principales: coincidencia completa. Alternativas: ubicación flexible. Puedes elegir
                comunas de varias regiones.
              </p>
              <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-outline-variant/50 p-3">
                {regions[region].map((commune) => (
                  <div
                    key={commune}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/30 py-2 last:border-0"
                  >
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={filters.communes.includes(commune)}
                        onChange={() => toggle('communes', commune)}
                      />
                      {commune}
                    </label>
                    <label className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <input
                        type="checkbox"
                        aria-label={`${commune} como alternativa`}
                        disabled={
                          !filters.communes.length ||
                          filters.communes.includes(commune) ||
                          filters.required.includes('communes')
                        }
                        checked={filters.alternativeCommunes.includes(commune)}
                        onChange={() => toggle('alternativeCommunes', commune)}
                      />
                      Alternativa
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-sm text-on-surface-variant">
                Principales: {filters.communes.join(', ') || 'Sin preferencia'}
                {filters.alternativeCommunes.length
                  ? ` · Alternativas: ${filters.alternativeCommunes.join(', ')}`
                  : ''}
              </p>
              {mandatory('communes', filters.communes.length > 0)}
            </>
          )}
          {key === 'maxPrice' && (
            <>
              <label className="block text-sm">
                {filters.operation === 'rent' ? 'Arriendo mensual máximo' : 'Precio máximo'}
                <input
                  className={`${inputClass} mt-2`}
                  type="number"
                  min="1"
                  max="1000000000000"
                  step="1"
                  value={filters.maxPrice ?? ''}
                  onChange={(e) =>
                    update({ maxPrice: e.target.value ? Number(e.target.value) : undefined })
                  }
                />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="text-sm">
                  Moneda
                  <select
                    className={`${inputClass} mt-2`}
                    aria-label="Moneda"
                    value={filters.currency}
                    onChange={(e) => update({ currency: e.target.value as Currency })}
                  >
                    <option>CLP</option>
                    <option>USD</option>
                  </select>
                </label>
                <label className="text-sm">
                  Flexibilidad
                  <select
                    className={`${inputClass} mt-2`}
                    aria-label="Flexibilidad"
                    value={filters.required.includes('maxPrice') ? 0 : filters.budgetFlexibility}
                    disabled={filters.required.includes('maxPrice')}
                    onChange={(e) =>
                      update({
                        budgetFlexibility: Number(
                          e.target.value
                        ) as InterestFilters['budgetFlexibility'],
                      })
                    }
                  >
                    {[0, 10, 20, 30].map((n) => (
                      <option key={n} value={n}>
                        {n ? `Hasta ${n}% más` : 'Sin exceder'}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {filters.maxPrice && (
                <p className="text-sm text-on-surface-variant">
                  Máximo permitido:{' '}
                  {(
                    filters.maxPrice *
                    (1 +
                      (filters.required.includes('maxPrice') ? 0 : filters.budgetFlexibility) / 100)
                  ).toLocaleString('es-CL')}{' '}
                  {filters.currency}. No convertimos entre monedas.
                </p>
              )}
              {mandatory('maxPrice', !!filters.maxPrice)}
            </>
          )}
          {['minArea', 'minBedrooms', 'minBathrooms'].includes(key) && (
            <>
              <label className="block text-sm">
                {key === 'minArea'
                  ? 'Superficie en m²'
                  : key === 'minBedrooms'
                    ? 'Dormitorios mínimos'
                    : 'Baños mínimos'}
                <input
                  className={`${inputClass} mt-2`}
                  type="number"
                  min="1"
                  max={key === 'minArea' ? 1000000 : 100}
                  step={key === 'minArea' ? 'any' : 1}
                  value={filters[key as 'minArea'] ?? ''}
                  onChange={(e) =>
                    update({ [key]: e.target.value ? Number(e.target.value) : undefined })
                  }
                />
              </label>
              {mandatory(key, !!filters[key as 'minArea'])}
            </>
          )}
          {key === 'features' && (
            <div className="space-y-3">
              {Object.entries(INTEREST_FEATURES).map(([feature, label]) => (
                <div
                  key={feature}
                  className={`${styles.option} ${inputClass} flex flex-wrap items-center justify-between gap-3`}
                >
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={filters.features.includes(feature)}
                      onChange={() => toggle('features', feature)}
                    />
                    {label}
                  </label>
                  {mandatory(feature, filters.features.includes(feature))}
                </div>
              ))}
            </div>
          )}
          {key === 'review' && <InterestSummary filters={filters} />}
        </div>
        {error && (
          <p role="alert" className="text-sm text-error">
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/40 pt-5">
          {(step > 0 || onCancel) && (
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              className={styles.action}
              onClick={() => (step ? setStep((s) => s - 1) : onCancel?.())}
            >
              <ArrowLeft size={16} />
              {step ? 'Volver' : 'Cancelar'}
            </Button>
          )}
          <div className="ml-auto flex flex-wrap justify-end gap-2">
            {!['operation', 'types', 'review'].includes(key) && (
              <Button type="button" variant="ghost" disabled={busy} onClick={skip}>
                Sin preferencia
              </Button>
            )}
            <Button
              className={`${styles.action} rounded-xl px-5 py-3`}
              type="submit"
              loading={busy}
              disabled={key === 'types' && !filters.types.length}
            >
              {key === 'review' ? 'Guardar interés' : 'Continuar'}
              {key === 'review' ? <Check size={17} /> : <ArrowRight size={17} />}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
