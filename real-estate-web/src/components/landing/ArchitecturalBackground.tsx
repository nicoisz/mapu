/** Original house plans, placed in the margins and animated by the landing. */
export function ArchitecturalBackground({
  variant,
}: {
  variant: 'courtyard' | 'villa' | 'duplex'
}) {
  return (
    <div aria-hidden="true" className={`blueprint-background blueprint-background--${variant}`}>
      <div
        className="blueprint-drift"
        data-parallax-travel={{ courtyard: 280, villa: 360, duplex: 320 }[variant]}
      />
    </div>
  )
}
