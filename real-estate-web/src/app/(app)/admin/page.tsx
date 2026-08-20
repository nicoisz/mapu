'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bug, Building2, TrendingUp, Users } from 'lucide-react'
import { adminService } from '@/services/adminService'

function StatCard({ label, value, suffix }: { label: string; value?: number; suffix?: string }) {
  return (
    <div className="bg-surface-container-low rounded-xl p-4 text-center border border-outline-variant/40">
      <div className="font-headline font-bold text-2xl text-primary">
        {value !== undefined ? `${value.toLocaleString('es-CL')}${suffix ?? ''}` : '…'}
      </div>
      <div className="text-xs text-on-surface-variant mt-0.5">{label}</div>
    </div>
  )
}

export default function AdminPanelPage() {
  const [stats, setStats] = useState<{
    users: number
    properties: number
    active: number
  } | null>(null)
  const [revenue, setRevenue] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    adminService
      .getStats()
      .then((s) => active && setStats(s))
      .catch(() => {})
    adminService
      .getRevenue()
      .then((r) => active && setRevenue(r.totalRevenue))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const quickLinks = [
    { href: '/admin/usuarios', label: 'Usuarios', desc: 'Cuentas, roles y verificaciones', icon: Users },
    { href: '/admin/empresas', label: 'Empresas', desc: 'Inmobiliarias y corredoras', icon: Building2 },
    { href: '/admin/ingresos', label: 'Ingresos', desc: 'Pagos y ventas', icon: TrendingUp },
    { href: '/admin/errores', label: 'Log de errores', desc: 'Errores client-side de la app', icon: Bug },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Usuarios" value={stats?.users} />
        <StatCard label="Propiedades totales" value={stats?.properties} />
        <StatCard label="Propiedades activas" value={stats?.active} />
        <StatCard label="Ingresos (CLP)" value={revenue ?? undefined} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {quickLinks.map(({ href, label, desc, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 bg-surface-container-low rounded-xl border border-outline-variant/40 p-4 hover:border-primary/50 transition-colors"
          >
            <Icon size={20} className="text-primary shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-on-surface text-sm">{label}</p>
              <p className="text-xs text-on-surface-variant">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
