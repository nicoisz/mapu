import { MetadataRoute } from 'next'
import { propertyService } from '@/services/propertyService'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = ['', '/buscar', '/mapa', '/login', '/register'].map(
    (path) => ({
      url: `${BASE_URL}${path}`,
      changeFrequency: 'daily',
      priority: path === '' ? 1 : 0.8,
    })
  )

  // Property pages — tolerate the DB being unreachable at build time.
  try {
    const properties = await propertyService.getAll()
    const propertyRoutes: MetadataRoute.Sitemap = properties.map((p) => ({
      url: `${BASE_URL}/propiedad/${p.id}`,
      lastModified: p.listing.lastUpdated,
      changeFrequency: 'weekly',
      priority: 0.6,
    }))
    return [...staticRoutes, ...propertyRoutes]
  } catch {
    return staticRoutes
  }
}
