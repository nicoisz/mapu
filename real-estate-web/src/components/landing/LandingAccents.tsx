import { cn } from '@/lib/utils'

export function LandingAccents({
  variant = 'orbit',
  className,
}: {
  variant?: 'orbit' | 'route' | 'contour'
  className?: string
}) {
  return (
    <div aria-hidden className={cn('landing-accents', 'landing-accents-' + variant, className)}>
      <div className="ambient-orbit">
        <svg viewBox="0 0 600 600" fill="none" className="h-full w-full">
          {variant === 'orbit' ? (
            <>
              <circle className="ambient-drawing" cx="300" cy="300" r="218" pathLength="1" />
              <circle className="ambient-drawing" cx="300" cy="300" r="272" pathLength="1" />
              <circle className="ambient-node" cx="518" cy="300" r="6" />
              <circle className="ambient-node" cx="300" cy="28" r="4" />
            </>
          ) : variant === 'route' ? (
            <>
              <path
                className="ambient-drawing"
                d="M40 560V400C40 300 230 390 230 260S460 250 460 100V40"
                pathLength="1"
              />
              <circle className="ambient-node" cx="40" cy="400" r="5" />
              <circle className="ambient-node" cx="230" cy="260" r="5" />
              <circle className="ambient-node" cx="460" cy="100" r="5" />
              <circle className="ambient-drawing" cx="460" cy="100" r="26" pathLength="1" />
            </>
          ) : (
            <>
              {[0, 1, 2].map((index) => (
                <ellipse
                  key={index}
                  className="ambient-drawing"
                  cx="300"
                  cy="300"
                  rx={130 + index * 65}
                  ry={210 + index * 30}
                  transform={'rotate(-30 300 300)'}
                  pathLength="1"
                />
              ))}
            </>
          )}
        </svg>
      </div>
    </div>
  )
}
