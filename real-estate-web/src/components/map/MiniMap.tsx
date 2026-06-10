import dynamic from 'next/dynamic'

const MiniMapInner = dynamic(() => import('./MiniMapInner'), { ssr: false })

interface MiniMapProps {
  latitude: number
  longitude: number
  label?: string
}

export function MiniMap({ latitude, longitude, label }: MiniMapProps) {
  return (
    <div className="w-full h-48 rounded-xl overflow-hidden border border-outline-variant/60">
      <MiniMapInner latitude={latitude} longitude={longitude} label={label} />
    </div>
  )
}
