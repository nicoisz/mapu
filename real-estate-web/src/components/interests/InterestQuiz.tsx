'use client'

import { useState } from 'react'
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
  'w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-on-surface focus-visible:outline-accent'

export function InterestQuiz({
  initial,
  onSave,
  onCancel,
}: {
  initial?: InterestFilters
  onSave: (f: InterestFilters) => Promise<void>
  onCancel: () => void
}) {
  const [filters, setFilters] = useState<InterestFilters>(() =>
    initial ? structuredClone(initial) : defaultInterestFilters()
  )
  const [step, setStep] = useState(0)
  const [region, setRegion] = useState<keyof typeof regions>('Región de Los Ríos')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
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
      <label className="flex items-center gap-2 text-sm text-on-surface-variant">
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
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
      className="space-y-6 rounded-2xl border border-outline-variant/50 bg-surface-container-low p-5 sm:p-8"
      aria-label="Quiz de intereses"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          Pregunta {step + 1} de {steps.length}
        </p>
        <progress
          className="mt-3 h-1.5 w-full accent-accent"
          value={step + 1}
          max={steps.length}
          aria-label="Progreso del interés"
        />
        <h2 className="mt-5 font-headline text-2xl font-bold text-on-surface">{questions[key]}</h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          {key === 'review'
            ? 'Puedes volver para cambiar respuestas. Guardamos únicamente al confirmar.'
            : key === 'operation'
              ? 'Te mostraremos propiedades de esta operación.'
              : 'Selecciona preferencias. Marca indispensable solo lo que no puede faltar.'}
        </p>
      </div>
      <div className="space-y-4">
        {key === 'operation' && (
          <div className="grid grid-cols-2 gap-3">
            {[
              ['sale', 'Comprar'],
              ['rent', 'Arrendar'],
            ].map(([value, label]) => (
              <label key={value} className={`${inputClass} flex items-center gap-3`}>
                <input
                  type="radio"
                  name="operation"
                  value={value}
                  checked={filters.operation === value}
                  onChange={() => update({ operation: value as PropertyOperation })}
                />
                {label}
              </label>
            ))}
          </div>
        )}
        {key === 'types' && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.values(PropertyType).map((type) => (
                <label key={type} className={`${inputClass} flex items-center gap-3`}>
                  <input
                    type="checkbox"
                    checked={filters.types.includes(type)}
                    onChange={() => toggle('types', type)}
                  />
                  {interestTypeLabel(type)}
                </label>
              ))}
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
                className={`${inputClass} flex flex-wrap items-center justify-between gap-3`}
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
        <Button
          type="button"
          variant="ghost"
          disabled={busy}
          onClick={() => (step ? setStep((s) => s - 1) : onCancel())}
        >
          {step ? 'Volver' : 'Cancelar'}
        </Button>
        <div className="flex gap-2">
          {!['operation', 'types', 'review'].includes(key) && (
            <Button type="button" variant="ghost" disabled={busy} onClick={skip}>
              Sin preferencia
            </Button>
          )}
          <Button type="submit" loading={busy} disabled={key === 'types' && !filters.types.length}>
            {key === 'review' ? 'Guardar interés' : 'Continuar'}
          </Button>
        </div>
      </div>
    </form>
  )
}
