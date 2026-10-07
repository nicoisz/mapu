import { notFound, redirect } from 'next/navigation'
import { Metadata } from 'next'
import { PropertyDetail } from '@/components/property/PropertyDetail'
import { propertyService } from '@/services/propertyService'
import { OPERATION_LABELS } from '@/constants'
import { PropertyOperation } from '@/types/enums'

interface Props {
  params: Promise<{ code: string }>
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  const property = await propertyService.getById(code)
  if (!property) return { title: 'Propiedad no encontrada' }
  const mainImage = property.media.images.find((img) => img.isMain) ?? property.media.images[0]
  const place =
    property.location.address.commune ??
    property.location.address.city ??
    property.location.address.region
  const title = `${property.title} · ${OPERATION_LABELS[property.operation]} en ${place}, ${property.location.address.region}`
  const description = `Código ${property.code}. ${property.description.slice(0, 140)}`
  return {
    // El template del layout agrega «| LUKY PROPIEDADES».
    title,
    description,
    alternates: { canonical: `/propiedad/${property.code}` },
    openGraph: {
      title,
      description,
      images: mainImage ? [{ url: mainImage.url }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: mainImage ? [mainImage.url] : undefined,
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

  const price =
    property.operation === PropertyOperation.RENT
      ? (property.pricing.monthlyRent ?? property.pricing.price)
      : property.pricing.price
  const listingJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: property.description.slice(0, 300),
    url: `${SITE_URL}/propiedad/${property.code}`,
    identifier: property.code,
    image: property.media.images.slice(0, 4).map((img) => img.url),
    address: {
      '@type': 'PostalAddress',
      addressLocality:
        property.location.address.commune ?? property.location.address.city ?? undefined,
      addressRegion: property.location.address.region,
      addressCountry: 'CL',
    },
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: property.pricing.currency,
      availability: 'https://schema.org/InStock',
    },
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listingJsonLd) }}
      />
      <PropertyDetail property={property} />
    </div>
  )
}
