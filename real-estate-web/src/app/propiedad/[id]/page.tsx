import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { PropertyDetail } from '@/components/property/PropertyDetail'
import { propertyService } from '@/services/propertyService'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const property = await propertyService.getById(id)
  if (!property) return { title: 'Propiedad no encontrada' }
  const mainImage = property.media.images.find(img => img.isMain) ?? property.media.images[0]
  return {
    title: `${property.title} | MapU Real Estate`,
    description: property.description.slice(0, 160),
    openGraph: {
      title: property.title,
      description: property.description.slice(0, 160),
      images: mainImage ? [{ url: mainImage.url }] : undefined,
    },
  }
}

export default async function PropertyPage({ params }: Props) {
  const { id } = await params
  const property = await propertyService.getById(id)
  if (!property) notFound()

  return (
    <div className="h-full overflow-y-auto bg-background">
      <PropertyDetail property={property} />
    </div>
  )
}
