export default function Loading() {
  return (
    <div className="h-full min-h-[60vh] flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 text-on-surface-variant">
        <div className="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Cargando…</span>
      </div>
    </div>
  )
}
