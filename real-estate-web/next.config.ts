import type { NextConfig } from 'next'
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants'

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : '*.supabase.co'

const nextConfig: NextConfig = {
  images: {
    // ponytail: Workers no corre sharp. Cambiar a loader de Cloudflare Images si pesa el ancho de banda.
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'randomuser.me' },
    ],
  },
}

export default function config(phase: string) {
  if (phase === PHASE_DEVELOPMENT_SERVER) void initOpenNextCloudflareForDev()
  return nextConfig
}
