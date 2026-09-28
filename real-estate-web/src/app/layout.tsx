import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { Navbar } from '@/components/layout/Navbar'
import { APP_CONFIG } from '@/constants'

export const metadata: Metadata = {
  title: APP_CONFIG.name,
  description: APP_CONFIG.description,
}

// Respeta la elección guardada; si no hay, manda el sistema operativo.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark');}catch(e){}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* Titulares: Archivo (Omnibus-Type) expandido. Cuerpo: fuente del sistema. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,500..800&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="flex flex-col h-screen bg-background text-on-surface">
        <Providers>
          <Navbar />
          <main className="flex-1 min-h-0 pt-16">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
