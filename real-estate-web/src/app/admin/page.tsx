'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Lock, Shield } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { getSupabase } from '@/lib/supabase'

export default function AdminPage() {
  const { user, isAuthenticated, isLoading } = useAuthContext()
  const [stats, setStats] = useState<{
    users: number
    properties: number
    active: number
  } | null>(null)

  const isAdmin = user?.platformRole === 'superadmin'

  useEffect(() => {
    if (!isAdmin) return
    let active = true
    const supabase = getSupabase()
    Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('properties').select('id', { count: 'exact', head: true }),
      supabase
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
    ])
      .then(([u, p, a]) => {
        if (!active) return
        setStats({ users: u.count ?? 0, properties: p.count ?? 0, active: a.count ?? 0 })
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [isAdmin])

  if (isLoading)
    return (
      <div className="h-full flex items-center justify-center text-on-surface-variant text-sm">
        Cargando…
      </div>
    )

  if (!isAuthenticated || !user || !isAdmin) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-background">
        <Lock size={48} className="text-on-surface-variant/40 mb-4" />
        <h2 className="font-headline text-xl font-bold text-on-surface">Acceso restringido</h2>
        <p className="text-on-surface-variant text-sm mt-2">
          Solo superadministradores pueden entrar aquí.
        </p>
        <Link
          href="/"
          className="mt-6 bg-primary text-on-primary px-6 py-2.5 rounded-xl text-sm font-semibold hover:brightness-110 transition-all"
        >
          Volver al inicio
        </Link>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="relative bg-surface-container-low border-b border-outline-variant/40 px-4 pt-7 pb-5 overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={20} className="text-primary" />
            <h1 className="font-headline text-2xl font-bold text-on-surface">
              Panel de administración
            </h1>
          </div>
          <p className="text-on-surface-variant text-sm">
            Superadministrador · métricas globales del sistema.
          </p>
        </div>
      </div>

      <div className="p-4 max-w-3xl mx-auto">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Usuarios', value: stats?.users },
            { label: 'Propiedades totales', value: stats?.properties },
            { label: 'Propiedades activas', value: stats?.active },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-surface-container-low rounded-xl p-4 text-center border border-outline-variant/40"
            >
              <div className="font-headline font-bold text-2xl text-primary">{s.value ?? '…'}</div>
              <div className="text-xs text-on-surface-variant mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <p className="text-xs text-on-surface-variant mt-4">
          Acceso limitado a superadministradores. La gestión de usuarios y verificación de licencias
          se ejecuta desde Supabase por ahora.
        </p>
      </div>
    </div>
  )
}
