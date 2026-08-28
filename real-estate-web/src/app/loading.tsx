import { GlowLoader } from '@/components/ui/GlowLoader'

export default function Loading() {
  return (
    <div className="h-full min-h-[60vh] flex items-center justify-center bg-background">
      <GlowLoader fill label="Cargando…" />
    </div>
  )
}
