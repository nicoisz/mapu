import type { MetadataRoute } from 'next'
import { APP_CONFIG } from '@/constants'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_CONFIG.name,
    short_name: APP_CONFIG.shortName,
    description: APP_CONFIG.description,
    lang: 'es',
    start_url: '/',
    display: 'standalone',
    background_color: '#f1f6f4',
    theme_color: '#335e4a',
    icons: [
      { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
