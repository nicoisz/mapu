import { LoginForm } from '@/components/auth/LoginForm'

export const metadata = { title: 'Iniciar sesión | MapU Real Estate' }

export default function LoginPage() {
  return (
    <div className="h-full flex items-center justify-center p-4 bg-surface overflow-y-auto">
      <div className="w-full max-w-sm bg-surface-container-low rounded-2xl shadow-sm border border-outline-variant/60 p-8">
        <LoginForm />
      </div>
    </div>
  )
}
