import dynamic from 'next/dynamic'
import { ZoneCell } from '@/lib/priceZones'

const MiniMapInner = dynamic(() => import('./MiniMapInner').then((m) => m.default), {
  ssr: false,
})

interface MiniMapProps {
  latitude: number
  longitude: number
  label?: string
  /** Optional price-zone cells to paint under the pin (choropleth). */
  cells?: ZoneCell[]
  /** Cell id to outline once zones are rendered. */
  highlightId?: string
  /** Enable pan/zoom navigation + navigation controls. */
  interactive?: boolean
}

export function MiniMap({
  latitude,
  longitude,
  label,
  cells,
  highlightId,
  interactive,
}: MiniMapProps) {
  return (
    <div className="w-full h-48 rounded-xl overflow-hidden border border-outline-variant/60">
      <MiniMapInner
        latitude={latitude}
        longitude={longitude}
        label={label}
        cells={cells}
        highlightId={highlightId}
        interactive={interactive}
      />
    </div>
  )
}
