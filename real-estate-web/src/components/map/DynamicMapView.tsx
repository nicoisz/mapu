import dynamic from 'next/dynamic'

const DynamicMapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-3 text-on-surface-variant">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin border-[3px]" />
        <span className="text-sm">Cargando mapa...</span>
      </div>
    </div>
  ),
})

export default DynamicMapView
