import Image from 'next/image'
import { cn } from '@/lib/utils'

export function BrandLogo({
  compact = false,
  className,
}: {
  compact?: boolean
  className?: string
}) {
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-2.5', className)}>
      <Image
        src="/luky%20logo.svg"
        alt=""
        width={40}
        height={40}
        className={cn(
          'object-contain object-center dark:brightness-[1.8]',
          compact ? 'h-8 w-8' : 'h-10 w-10'
        )}
      />
      <span className="flex flex-col text-on-surface">
        <span
          className={cn(
            'font-headline leading-none tracking-[0.08em]',
            compact ? 'text-xl' : 'text-2xl'
          )}
        >
          LUKY
        </span>
        {!compact && (
          <span className="mt-1 hidden font-sans text-[9px] font-medium tracking-[0.2em] sm:block">
            PROPIEDADES
          </span>
        )}
      </span>
    </span>
  )
}
