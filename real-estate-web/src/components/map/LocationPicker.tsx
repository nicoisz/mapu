import dynamic from 'next/dynamic'

const LocationPickerInner = dynamic(() => import('./LocationPickerInner'), { ssr: false })

interface LocationPickerProps {
  latitude: number
  longitude: number
  /** Called with the picked coordinate (drag o click). */
  onChange: (lat: number, lng: number) => void
}

export function LocationPicker({ latitude, longitude, onChange }: LocationPickerProps) {
  return (
    <div className="w-full h-52 rounded-xl overflow-hidden border border-outline-variant/60">
      <LocationPickerInner latitude={latitude} longitude={longitude} onChange={onChange} />
    </div>
  )
}
