/** Decorative linework only; its wrapper is animated by the landing's GSAP context. */
export function CartographicBackground({ variant = 'urban' }: { variant?: 'urban' | 'coastal' }) {
  return (
    <div
      aria-hidden="true"
      className={`cartographic-background cartographic-background--${variant}`}
    >
      <div className="cartographic-drift" />
    </div>
  )
}
