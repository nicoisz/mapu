import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

/** Estado vacío centrado y discreto: icono, título, descripción y CTA opcional. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 py-14 text-center',
        className
      )}
      {...props}
    >
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant/60">
          {icon}
        </div>
      )}
      <p className="text-base font-medium text-on-surface">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-on-surface-variant">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
