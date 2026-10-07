/* eslint-disable @next/next/no-page-custom-font -- App Router root layout loads these global fonts on every route; pages/_document does not apply. */
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'
import { Navbar } from '@/components/layout/Navbar'
import { APP_CONFIG } from '@/constants'

export const metadata: Metadata = {
  title: APP_CONFIG.name,
  description: APP_CONFIG.description,
  applicationName: APP_CONFIG.name,
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#d9e4df' },
    { media: '(prefers-color-scheme: dark)', color: '#14241c' },
  ],
}

// Preferencia del dispositivo; claro por defecto.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* Titulares: Forum. Párrafos: Instrument Serif. Controles: Inter. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Forum&family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="flex flex-col h-[100dvh] bg-background text-on-surface">
        <Providers>
          <Navbar />
          <main className="flex-1 min-h-0 pt-16">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
