'use client'
import Link from 'next/link'
import { useInterestMatches } from '@/contexts/InterestMatchesContext'

export function MatchNotice() {
  const { count } = useInterestMatches()
  return (
    <Link
      href="/para-ti"
      className="my-4 block rounded-2xl border border-accent/20 bg-accent/5 p-4 text-sm font-medium text-accent"
    >
      Propiedades para ti{count !== null && count > 0 ? ` · ${count} nuevas coincidencias` : ''}
      <span className="mt-1 block text-xs font-normal text-on-surface-variant">
        Ver propiedades compatibles con tus intereses.
      </span>
    </Link>
  )
}
