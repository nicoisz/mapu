'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Lock, Mail, Phone, Search, Shield, ShieldCheck, Users } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { adminService, AdminUserRow } from '@/services/adminService'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PlatformRole } from '@/types/enums'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

type Tab = 'resumen' | 'usuarios'

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'resumen', label: 'Resumen', icon: Shield },
  { id: 'usuarios', label: 'Usuarios', icon: Users },
]

function StatCard({ label, value }: { label: string; value?: number }) {
  return (
    <div className="bg-surface-container-low rounded-xl p-4 text-center border border-outline-variant/40">
      <div className="font-headline font-bold text-2xl text-primary">{value ?? '…'}</div>
      <div className="text-xs text-on-surface-variant mt-0.5">{label}</div>
    </div>
  )
}

function ResumenTab() {
  const [stats, setStats] = useState<{
    users: number
    properties: number
    active: number
    organizations: number
  } | null>(null)

  useEffect(() => {
    let active = true
    adminService
      .getStats()
      .then((s) => active && setStats(s))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard label="Usuarios" value={stats?.users} />
      <StatCard label="Propiedades totales" value={stats?.properties} />
      <StatCard label="Propiedades activas" value={stats?.active} />
      <StatCard label="Empresas" value={stats?.organizations} />
    </div>
  )
}

function UsersTab() {
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = (term = search) => {
    setLoading(true)
    adminService
      .listUsers(term)
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const results = useMemo(() => {
    const t = search.trim().toLowerCase()
    if (!t) return users
    return users.filter(
      (u) => u.email.toLowerCase().includes(t) || u.name.toLowerCase().includes(t)
    )
  }, [users, search])

  async function toggleRole(user: AdminUserRow) {
    setBusyId(user.id)
    const next =
      user.platform_role === PlatformRole.SUPERADMIN ? PlatformRole.USER : PlatformRole.SUPERADMIN
    try {
      await adminService.setPlatformRole(user.id, next)
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, platform_role: next } : u)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cambiar rol')
    } finally {
      setBusyId(null)
    }
  }

  async function toggleVerified(
    user: AdminUserRow,
    field: 'is_email_verified' | 'is_phone_verified'
  ) {
    setBusyId(user.id)
    try {
      await adminService.toggleVerified(user.id, field, !user[field])
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, [field]: !u[field] } : u)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al verificar')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-surface-container-lowest rounded-lg border border-outline-variant/60 px-3 py-2">
          <Search size={16} className="text-on-surface-variant shrink-0" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              load(e.target.value)
            }}
            placeholder="Buscar por email o nombre…"
            className="flex-1 bg-transparent text-sm focus:outline-none text-on-surface placeholder:text-on-surface-variant/60"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => load('')}>
          Limpiar
        </Button>
      </div>

      {error && <p className="text-error text-sm">{error}</p>}

      {loading && users.length === 0 ? (
        <div className="text-center py-8 text-on-surface-variant text-sm">Cargando usuarios…</div>
      ) : results.length === 0 ? (
        <div className="text-center py-8 text-on-surface-variant text-sm">Sin resultados</div>
      ) : (
        <div className="space-y-2">
          {results.map((u) => (
            <div
              key={u.id}
              className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-on-surface text-sm">{u.name}</p>
                    <Badge
                      variant={u.platform_role === PlatformRole.SUPERADMIN ? 'premium' : 'gray'}
                      size="sm"
                    >
                      {u.platform_role === PlatformRole.SUPERADMIN ? '★ Superadmin' : u.user_type}
                    </Badge>
                    {u.company_name && (
                      <span className="text-xs text-on-surface-variant">· {u.company_name}</span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5 truncate">{u.email}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Registrado {formatDate(u.created_at)} · {u.total_listings ?? 0} publicaciones
                  </p>
                  {u.license_number && (
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Licencia: {u.license_number}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Button
                    variant={u.platform_role === PlatformRole.SUPERADMIN ? 'outline' : 'secondary'}
                    size="sm"
                    loading={busyId === u.id}
                    onClick={() => toggleRole(u)}
                  >
                    {u.platform_role === PlatformRole.SUPERADMIN
                      ? 'Quitar superadmin'
                      : 'Hacer superadmin'}
                  </Button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleVerified(u, 'is_email_verified')}
                      title={u.is_email_verified ? 'Email verificado' : 'Verificar email'}
                      className={cn(
                        'p-1.5 rounded-lg border transition-colors',
                        u.is_email_verified
                          ? 'border-accent text-accent'
                          : 'border-outline-variant/60 text-on-surface-variant hover:text-primary'
                      )}
                    >
                      <Mail size={14} />
                    </button>
                    <button
                      onClick={() => toggleVerified(u, 'is_phone_verified')}
                      title={u.is_phone_verified ? 'Teléfono verificado' : 'Verificar teléfono'}
                      className={cn(
                        'p-1.5 rounded-lg border transition-colors',
                        u.is_phone_verified
                          ? 'border-accent text-accent'
                          : 'border-outline-variant/60 text-on-surface-variant hover:text-primary'
                      )}
                    >
                      <Phone size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminPage() {
  const { user, isAuthenticated, isLoading } = useAuthContext()
  const [tab, setTab] = useState<Tab>('resumen')
  const isAdmin = user?.platformRole === PlatformRole.SUPERADMIN

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
      <div className="relative bg-surface-container-low border-b border-outline-variant/40 px-4 pt-7 pb-4 overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={20} className="text-primary" />
            <h1 className="font-headline text-2xl font-bold text-on-surface">
              Panel de administración
            </h1>
          </div>
          <p className="text-on-surface-variant text-sm">
            Superadministrador · gestión global del sistema.
          </p>
        </div>

        <div className="relative flex gap-1 mt-4 bg-surface-container rounded-lg p-1 w-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all',
                tab === id
                  ? 'bg-surface-container-highest shadow-soft text-primary font-medium'
                  : 'text-on-surface-variant hover:text-on-surface'
              )}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto">
        {tab === 'resumen' ? <ResumenTab /> : <UsersTab />}
      </div>
    </div>
  )
}
