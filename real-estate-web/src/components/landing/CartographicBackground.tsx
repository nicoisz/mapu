/** Each section names its territory explicitly; patterns are never tiled. */
export function CartographicBackground({
  variant,
}: {
  variant: 'urban' | 'terrain' | 'rural' | 'neighborhood' | 'coastal'
}) {
  return (
    <div
      aria-hidden="true"
      className={`cartographic-background cartographic-background--${variant}`}
    >
      <div className="cartographic-drift" />
    </div>
  )
}
