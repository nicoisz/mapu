import { UpdatePasswordForm } from '@/components/auth/UpdatePasswordForm'

export const metadata = { title: 'Nueva contraseña | MapU Real Estate' }

export default function UpdatePasswordPage() {
  return (
    <div className="h-full flex items-center justify-center p-4 bg-surface overflow-y-auto">
      <div className="w-full max-w-sm bg-surface-container-low rounded-2xl shadow-sm border border-outline-variant/60 p-8">
        <UpdatePasswordForm />
      </div>
    </div>
  )
}
