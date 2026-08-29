import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** Ancho máximo del contenido. */
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

/** Contenedor centrado con ancho máximo y padding consistente. */
export function Container({ size = 'lg', className, ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-6 py-6',
        {
          'max-w-2xl': size === 'sm',
          'max-w-3xl': size === 'md',
          'max-w-5xl': size === 'lg',
          'max-w-7xl': size === 'xl',
        },
        className
      )}
      {...props}
    />
  )
}
