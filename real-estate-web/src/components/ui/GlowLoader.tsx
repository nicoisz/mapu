import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface GlowLoaderProps {
  children?: ReactNode
  label?: string
  className?: string
  /** Fills the parent (centered flex column) for page-level loadings. */
  fill?: boolean
}

/**
 * Liquid glow border with a light traveling clockwise around the edge
 * (a comet tail — not a snake). Reusable for loadings/creations.
 *
 * No children → shows a glowing dot + optional label, centered.
 * With children → wraps them in the glowing frame (e.g. a loading card).
 */
export function GlowLoader({ children, label, className, fill }: GlowLoaderProps) {
  const centered = (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="glow-loader-dot" />
      {label && <span className="glow-loader-label">{label}</span>}
    </div>
  )

  return (
    <div
      className={cn('glow-loader', fill ? 'w-full h-full' : 'w-fit', className)}
      role="status"
      aria-live="polite"
    >
      <div className="glow-loader-border" aria-hidden />
      <div className="glow-loader-liquid" aria-hidden />
      <div className="glow-loader-body">{children ?? centered}</div>
    </div>
  )
}

/** Thin horizontal progress line with the rotating glow, fixed to the top. */
export function RouteProgress({ active }: { active: boolean }) {
  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 h-[3px] z-[100] overflow-hidden transition-opacity duration-300',
        active ? 'opacity-100' : 'opacity-0'
      )}
      aria-hidden
    >
      <div className="glow-loader-border !inset-[-120%]" />
    </div>
  )
}
