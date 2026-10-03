import dynamic from 'next/dynamic'

const LocationPickerInner = dynamic(() => import('./LocationPickerInner'), { ssr: false })

interface LocationPickerProps {
  latitude: number
  longitude: number
  /** Called with the picked coordinate (drag o click). */
  onChange: (lat: number, lng: number) => void
  selected?: boolean
}

export function LocationPicker({
  latitude,
  longitude,
  onChange,
  selected = true,
}: LocationPickerProps) {
  return (
    <div className="w-full h-80 sm:h-96 rounded-xl overflow-hidden border border-outline-variant/60">
      <LocationPickerInner
        latitude={latitude}
        longitude={longitude}
        onChange={onChange}
        selected={selected}
      />
    </div>
  )
}
