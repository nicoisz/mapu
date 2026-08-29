import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/** Superficie base del sistema. Un solo token visual reutilizado en todo el
 *  área autenticada: fondo de superficie, borde hairline y radio generoso. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-outline-variant/50 bg-surface-container-low',
        'shadow-sm shadow-black/[0.02]',
        className
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1 p-5 pb-0', className)} {...props} />
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('font-headline text-base font-semibold text-on-surface', className)}
      {...props}
    />
  )
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-on-surface-variant', className)} {...props} />
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)} {...props} />
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-5 pb-5 pt-0 [.p-5_&]:pt-5',
        className
      )}
      {...props}
    />
  )
}
