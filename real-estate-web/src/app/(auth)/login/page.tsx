import { LoginForm } from '@/components/auth/LoginForm'
import { AuthVisual } from '@/components/auth/AuthVisual'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = { title: 'Iniciar sesión | LUKY PROPIEDADES' }

export default function LoginPage() {
  return (
    <div data-auth-scroll className="h-full overflow-y-auto bg-background">
      <div data-auth-parallax className="auth-layout">
        <section className="auth-form-panel">
          <div className="w-full max-w-[420px] mx-auto">
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 text-sm text-on-surface-variant transition-colors hover:text-on-surface"
            >
              <ArrowLeft size={16} /> Volver al inicio
            </Link>
            <LoginForm />
          </div>
        </section>
        <AuthVisual />
      </div>
    </div>
  )
}
