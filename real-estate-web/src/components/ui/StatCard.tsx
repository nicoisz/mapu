import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string
  value?: number | string
  /** Sufijo en línea con el valor, p.ej. " /mes". */
  suffix?: string
  icon?: React.ReactNode
  /** Texto corto opcional debajo del valor (tendencia, detalle). */
  hint?: string
}

/** Tarjeta de métrica alineada a la izquierda: label corto, valor grande y
 *  énfasis tipográfico. El icono opcional va en un tile tonal discreto. */
export function StatCard({ label, value, suffix, icon, hint, className, ...props }: StatCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-2xl border border-outline-variant/50 bg-surface-container-low p-5 shadow-sm shadow-black/[0.02]',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">
          {label}
        </p>
        {icon && <span className="text-on-surface-variant/60">{icon}</span>}
      </div>
      <p className="font-headline text-3xl font-bold tracking-tight text-on-surface">
        {value !== undefined ? (
          <>
            {typeof value === 'number' ? value.toLocaleString('es-CL') : value}
            {suffix && (
              <span className="ml-0.5 text-base font-semibold text-on-surface-variant">
                {suffix}
              </span>
            )}
          </>
        ) : (
          <span className="animate-pulse text-on-surface-variant">···</span>
        )}
      </p>
      {hint && <p className="text-xs text-on-surface-variant">{hint}</p>}
    </div>
  )
}
