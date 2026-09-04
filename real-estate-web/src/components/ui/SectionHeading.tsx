import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface SectionHeadingProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  count?: number
  /** Subtítulo opcional bajo el título. */
  description?: string
  /** Acciones alineadas a la derecha (links "Ver todo", botones…). */
  actions?: React.ReactNode
}

/** Título de sección con marcador de cantidad opcional y acciones a la derecha. */
export function SectionHeading({
  title,
  count,
  description,
  actions,
  className,
  ...props
}: SectionHeadingProps) {
  return (
    <div className={cn('flex items-center justify-between gap-3', className)} {...props}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="font-headline text-sm font-semibold uppercase tracking-wide text-on-surface">
            {title}
          </h2>
          {count !== undefined && (
            <span className="rounded-full bg-surface-container-highest px-2 py-0.5 text-xs font-semibold text-on-surface-variant">
              {count}
            </span>
          )}
        </div>
        {description && <p className="mt-0.5 text-xs text-on-surface-variant">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
