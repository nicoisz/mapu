import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'sale' | 'rent' | 'premium' | 'success' | 'warning' | 'error' | 'gray'
  size?: 'sm' | 'md'
}

export function Badge({ className, variant = 'default', size = 'md', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full backdrop-blur-sm',
        {
          'bg-primary text-on-primary': variant === 'default',
          'bg-secondary-container text-on-secondary-container': variant === 'sale',
          'bg-accent text-on-tertiary': variant === 'rent',
          'bg-primary-container text-on-primary-container': variant === 'premium',
          'bg-tertiary-container text-on-tertiary-container': variant === 'success',
          'bg-secondary text-on-secondary': variant === 'warning',
          'bg-error-container text-on-error-container': variant === 'error',
          'bg-surface-container-highest text-on-surface-variant': variant === 'gray',
          'px-2 py-0.5 text-xs': size === 'sm',
          'px-2.5 py-1 text-sm': size === 'md',
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
