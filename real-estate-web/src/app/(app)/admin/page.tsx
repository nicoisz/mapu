'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bug, Building2, ChevronRight, TrendingUp, Users } from 'lucide-react'
import { adminService } from '@/services/adminService'
import { StatCard } from '@/components/ui/StatCard'

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
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Usuarios" value={stats?.users} />
        <StatCard label="Propiedades totales" value={stats?.properties} />
        <StatCard label="Propiedades activas" value={stats?.active} />
        <StatCard label="Ingresos (CLP)" value={revenue ?? undefined} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {quickLinks.map(({ href, label, desc, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-4 rounded-2xl border border-outline-variant/50 bg-surface-container-low p-4 shadow-sm shadow-black/[0.02] transition-colors hover:border-primary/50"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-on-surface text-sm">{label}</p>
              <p className="text-xs text-on-surface-variant">{desc}</p>
            </div>
            <ChevronRight size={16} className="text-on-surface-variant/50 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </div>
  )
}
