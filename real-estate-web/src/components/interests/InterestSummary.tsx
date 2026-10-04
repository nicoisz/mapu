import { INTEREST_CRITERIA, interestLabel } from '@/lib/interests'
import type { InterestFilters } from '@/types/interests'

export function InterestSummary({ filters: f }: { filters: InterestFilters }) {
  const entries: [string, string][] = [
    ['types', interestLabel(f)],
    ...(f.communes.length
      ? ([
          [
            'communes',
            `${f.communes.join(', ')}${f.alternativeCommunes.length ? ` · Alternativas: ${f.alternativeCommunes.join(', ')}` : ''}`,
          ],
        ] as [string, string][])
      : []),
    ...(f.maxPrice
      ? ([
          [
            'maxPrice',
            `${f.maxPrice.toLocaleString('es-CL')} ${f.currency}${f.required.includes('maxPrice') ? '' : ` · Flexibilidad: ${f.budgetFlexibility}% (máximo ${(f.maxPrice * (1 + f.budgetFlexibility / 100)).toLocaleString('es-CL')} ${f.currency})`}`,
          ],
        ] as [string, string][])
      : []),
    ...(['minArea', 'minBedrooms', 'minBathrooms'] as const)
      .filter((k) => f[k])
      .map((k) => [k, `${f[k]}${k === 'minArea' ? ' m²' : ''}`] as [string, string]),
    ...f.features.map((k) => [k, INTEREST_CRITERIA[k]] as [string, string]),
  ]
  return (
    <dl className="space-y-3 text-sm">
      {entries.map(([key, text]) => (
        <div key={key}>
          <dt className="font-medium text-on-surface">
            {INTEREST_CRITERIA[key]}
            {f.required.includes(key) ? ' · Indispensable' : ' · Preferencia'}
          </dt>
          <dd className="mt-1 text-on-surface-variant">{text}</dd>
        </div>
      ))}
    </dl>
  )
}
