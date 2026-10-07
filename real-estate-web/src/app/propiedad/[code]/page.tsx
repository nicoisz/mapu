import { notFound, redirect } from 'next/navigation'
import { Metadata } from 'next'
import { PropertyDetail } from '@/components/property/PropertyDetail'
import { propertyService } from '@/services/propertyService'

interface Props {
  params: Promise<{ code: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  const property = await propertyService.getById(code)
  if (!property) return { title: 'Propiedad no encontrada' }
  const mainImage = property.media.images.find((img) => img.isMain) ?? property.media.images[0]
  return {
    title: `${property.title} | LUKY PROPIEDADES`,
    description: property.description.slice(0, 160),
    openGraph: {
      title: property.title,
      description: property.description.slice(0, 160),
      images: mainImage ? [{ url: mainImage.url }] : undefined,
    },
  }
}

export default async function PropertyPage({ params }: Props) {
  const { code } = await params
  const property = await propertyService.getById(code)
  if (!property) notFound()

  // La URL pública canónica usa el código en mayúsculas. Enlaces legacy por
  // uuid o códigos en minúsculas redirigen para no exponer el id ni duplicar.
  if (code !== property.code) redirect(`/propiedad/${property.code}`)

  return (
    <div className="h-full overflow-y-auto bg-background">
      <PropertyDetail property={property} />
    </div>
  )
}
