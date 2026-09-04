import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  icon?: React.ReactNode
  /** Acciones alineadas a la derecha (botones, badges…). */
  actions?: React.ReactNode
  /** Badge corto junto al título (p.ej. el scope de métricas). */
  badge?: React.ReactNode
}

/** Encabezado de página consistente: ícono tonal, título display, subtítulo y
 *  acciones a la derecha. Sustituye los bloques duplicados por página. */
export function PageHeader({
  title,
  description,
  icon,
  actions,
  badge,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 border-b border-outline-variant/40 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:py-7',
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-4 min-w-0">
        {icon && (
          <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-headline text-2xl font-bold tracking-tight text-on-surface">
              {title}
            </h1>
            {badge}
          </div>
          {description && <p className="mt-1 text-sm text-on-surface-variant">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
