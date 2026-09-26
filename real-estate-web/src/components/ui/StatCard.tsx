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
  /**
   * Fondo con gradiente, para la métrica que manda en la vista.
   * Deliberadamente opt-in y limitado a dos tonos: si todas las tarjetas
   * llevan gradiente, ninguna destaca. Máximo 2–3 por pantalla.
   */
  tone?: 'a' | 'b'
}

/** Tarjeta de métrica alineada a la izquierda: label corto, valor grande y
 *  énfasis tipográfico. El icono opcional va en un tile tonal discreto. */
export function StatCard({
  label,
  value,
  suffix,
  icon,
  hint,
  tone,
  className,
  ...props
}: StatCardProps) {
  // Sobre gradiente el texto hereda `--grad-ink`; los tokens de superficie
  // (on-surface / on-surface-variant) flipan con el tema y ahí no aplican.
  const muted = tone ? 'opacity-70' : 'text-on-surface-variant'
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-2xl p-5 shadow-sm shadow-black/[0.02]',
        // Literal, no `grad-${tone}`: Tailwind purga las utilidades de
        // @layer utilities que no ve escritas completas en el código.
        tone === 'a' && 'grad-a',
        tone === 'b' && 'grad-b',
        !tone && 'border border-outline-variant/50 bg-surface-container-low',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <p className={cn('text-xs font-medium uppercase tracking-wide', muted)}>{label}</p>
        {icon && (
          <span className={cn(tone ? 'opacity-60' : 'text-on-surface-variant/60')}>{icon}</span>
        )}
      </div>
      <p
        className={cn(
          'font-headline text-3xl font-bold tracking-tight',
          !tone && 'text-on-surface'
        )}
      >
        {value !== undefined ? (
          <>
            {typeof value === 'number' ? value.toLocaleString('es-CL') : value}
            {suffix && (
              <span className={cn('ml-0.5 text-base font-semibold', muted)}>{suffix}</span>
            )}
          </>
        ) : (
          <span className={cn('animate-pulse', muted)}>···</span>
        )}
      </p>
      {hint && <p className={cn('text-xs', muted)}>{hint}</p>}
    </div>
  )
}
