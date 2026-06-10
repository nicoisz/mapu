import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { PropertyDetail } from '@/components/property/PropertyDetail'
import { mockProperties } from '@/data'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const property = mockProperties.find(p => p.id === id)
  if (!property) return { title: 'Propiedad no encontrada' }
  return {
    title: `${property.title} | MapU Real Estate`,
    description: property.description.slice(0, 160),
  }
}

export default async function PropertyPage({ params }: Props) {
  const { id } = await params
  const property = mockProperties.find(p => p.id === id)
  if (!property) notFound()

  return (
    <div className="h-full overflow-y-auto bg-background">
      <PropertyDetail property={property} />
    </div>
  )
}
