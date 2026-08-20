'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Lock,
  Mail,
  Phone,
  Search,
  Shield,
  ShieldCheck,
  Users,
  Building2,
  Plus,
  X,
  Eye,
  Building,
  Star,
} from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { reviewService, Review } from '@/services/reviewService'
import { adminService, AdminUserRow, OrganizationRow } from '@/services/adminService'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PlatformRole } from '@/types/enums'
import { PropertyCard } from '@/components/property/PropertyCard'
import { propertyService } from '@/services/propertyService'
import { rowToProperty } from '@/lib/propertyMapper'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Property } from '@/types/property'
import { STATUS_LABELS } from '@/constants'
import { Input } from '@/components/ui/Input'

type Tab = 'resumen' | 'usuarios' | 'propiedades' | 'empresas' | 'resenas'

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'resumen', label: 'Resumen', icon: Shield },
  { id: 'usuarios', label: 'Usuarios', icon: Users },
  { id: 'propiedades', label: 'Propiedades', icon: Building2 },
  { id: 'empresas', label: 'Empresas', icon: Building },
  { id: 'resenas', label: 'Reseñas', icon: Star },
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <StatCard label="Usuarios" value={stats?.users} />
      <StatCard label="Propiedades totales" value={stats?.properties} />
      <StatCard label="Propiedades activas" value={stats?.active} />
    </div>
  )
}

function UsersTab() {
  const router = useRouter()
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
                    <button
                      onClick={() => router.push(`/dashboard?as=${u.id}`)}
                      title="Ver como este usuario"
                      className="p-1.5 rounded-lg border border-outline-variant/60 text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
                    >
                      <Eye size={14} />
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

function PropertiesTab() {
  const [rows, setRows] = useState<Property[]>([])
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = (s = status, term = search) => {
    setLoading(true)
    adminService
      .listProperties(s, term)
      .then((data) => setRows(data.map(rowToProperty)))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete(property: Property) {
    if (
      !window.confirm(
        `¿Eliminar definitivamente "${property.title}"? Esta acción no se puede deshacer.`
      )
    )
      return
    setBusyId(property.id)
    try {
      await propertyService.deleteProperty(property.id)
      setRows((prev) => prev.filter((p) => p.id !== property.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar')
    } finally {
      setBusyId(null)
    }
  }

  async function handleRenew(property: Property) {
    setBusyId(property.id)
    try {
      const renewed = await propertyService.renewProperty(property.id)
      if (renewed) setRows((prev) => prev.map((p) => (p.id === property.id ? renewed : p)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al renovar')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 flex items-center gap-2 bg-surface-container-lowest rounded-lg border border-outline-variant/60 px-3 py-2">
          <Search size={16} className="text-on-surface-variant shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(status, search)}
            placeholder="Buscar por título…"
            className="flex-1 bg-transparent text-sm focus:outline-none text-on-surface placeholder:text-on-surface-variant/60"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            load(e.target.value, search)
          }}
          className="bg-surface-container-lowest border border-outline-variant/60 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none"
        >
          <option value="all">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-error text-sm">{error}</p>}

      {loading ? (
        <div className="text-center py-8 text-on-surface-variant text-sm">
          Cargando propiedades…
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-8 text-on-surface-variant text-sm">Sin resultados</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rows.map((property) => (
            <div key={property.id} className="space-y-2">
              <PropertyCard property={property} />
              <div className="flex gap-3 justify-end">
                <Link
                  href={`/publicar?edit=${property.id}`}
                  className="text-xs text-accent hover:text-primary font-medium"
                >
                  Editar
                </Link>
                <button
                  onClick={() => handleRenew(property)}
                  disabled={busyId === property.id}
                  className="text-xs text-accent hover:text-primary font-medium disabled:opacity-50"
                >
                  Renovar
                </button>
                <button
                  onClick={() => handleDelete(property)}
                  disabled={busyId === property.id}
                  className="text-xs text-error hover:text-error/80 font-medium disabled:opacity-50"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CompaniesTab() {
  const [orgs, setOrgs] = useState<OrganizationRow[]>([])
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  // Modal form
  const [form, setForm] = useState({
    name: '',
    type: 'company',
    ownerId: '',
    licenseNumber: '',
    rut: '',
  })

  const load = (term = search) => {
    setLoading(true)
    adminService
      .listOrganizations(term)
      .then(setOrgs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.ownerId) return
    try {
      await adminService.createOrganization({
        name: form.name.trim(),
        type: form.type as 'brokerage' | 'company',
        ownerId: form.ownerId,
        licenseNumber: form.licenseNumber || undefined,
        rut: form.rut || undefined,
      })
      setShowCreate(false)
      setForm({ name: '', type: 'company', ownerId: '', licenseNumber: '', rut: '' })
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al crear empresa')
    }
  }

  async function handleAddMember(orgId: string) {
    if (!expanded) return
    const userId = (document.getElementById(`member-${orgId}`) as HTMLInputElement)?.value
    if (!userId) return
    try {
      await adminService.setMemberRole(orgId, userId, 'agent')
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al añadir miembro')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 flex items-center gap-2 bg-surface-container-lowest rounded-lg border border-outline-variant/60 px-3 py-2">
          <Search size={16} className="text-on-surface-variant shrink-0" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              load(e.target.value)
            }}
            placeholder="Buscar empresa…"
            className="flex-1 bg-transparent text-sm focus:outline-none text-on-surface placeholder:text-on-surface-variant/60"
          />
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> Crear empresa
        </Button>
      </div>

      {error && <p className="text-error text-sm">{error}</p>}

      {loading ? (
        <div className="text-center py-8 text-on-surface-variant text-sm">Cargando empresas…</div>
      ) : orgs.length === 0 ? (
        <div className="text-center py-8 text-on-surface-variant text-sm">Sin empresas</div>
      ) : (
        <div className="space-y-2">
          {orgs.map((org) => (
            <div
              key={org.id}
              className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-4"
            >
              <button
                className="w-full flex items-center justify-between gap-3 text-left"
                onClick={() => setExpanded(expanded === org.id ? null : org.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                    <Building size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-on-surface text-sm truncate">{org.name}</p>
                    <p className="text-xs text-on-surface-variant">
                      {org.type === 'company' ? 'Empresa' : 'Corredora'} ·{' '}
                      {org.organization_members[0]?.count ?? 0} miembros
                      {org.is_verified && ' · ✓ verificada'}
                    </p>
                  </div>
                </div>
                <span className="text-on-surface-variant text-xs">
                  {expanded === org.id ? '−' : '+'}
                </span>
              </button>

              {expanded === org.id && (
                <div className="mt-3 pt-3 border-t border-outline-variant/40 space-y-3">
                  <div className="flex gap-2">
                    <select
                      id={`member-${org.id}`}
                      className="flex-1 bg-surface-container-lowest border border-outline-variant/60 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    >
                      <option value="">Selecciona usuario (email)…</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.email}
                        </option>
                      ))}
                    </select>
                    <Button size="sm" variant="outline" onClick={() => handleAddMember(org.id)}>
                      Añadir
                    </Button>
                  </div>
                  {users.length === 0 && (
                    <button
                      onClick={() => adminService.listUsers('').then(setUsers)}
                      className="text-xs text-accent hover:underline"
                    >
                      Cargar lista de usuarios
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCreate}
            className="bg-surface-container-low w-full max-w-sm rounded-2xl border border-outline-variant/40 p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-semibold text-on-surface">Crear empresa</h3>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                aria-label="Cerrar"
                className="p-1.5 hover:bg-surface-container-high rounded-lg text-on-surface-variant"
              >
                <X size={18} />
              </button>
            </div>

            <Input
              label="Nombre"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1.5">
                Tipo
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm focus:outline-none"
              >
                <option value="company">Empresa / Inmobiliaria</option>
                <option value="brokerage">Corredora</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1.5">
                Dueño (selecciona usuario)
              </label>
              <select
                value={form.ownerId}
                onChange={(e) => setForm({ ...form, ownerId: e.target.value })}
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm focus:outline-none"
                required
              >
                <option value="">Selecciona…</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Licencia (corredora)"
              value={form.licenseNumber}
              onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
            />
            <Input
              label="RUT (empresa)"
              value={form.rut}
              onChange={(e) => setForm({ ...form, rut: e.target.value })}
            />

            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowCreate(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                Crear
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function ReviewsTab() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    reviewService
      .listAll()
      .then(setReviews)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  async function moderate(r: Review, status: 'published' | 'flagged' | 'removed') {
    try {
      await reviewService.setStatus(r.id, status)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    }
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-error text-sm">{error}</p>}
      {loading ? (
        <div className="text-center py-8 text-on-surface-variant text-sm">Cargando reseñas…</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 text-on-surface-variant text-sm">Sin reseñas</div>
      ) : (
        <div className="space-y-2">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="bg-surface-container-low rounded-xl border border-outline-variant/40 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-on-surface-variant">
                    {r.author_name ?? r.author_id}
                  </span>
                  <span className="text-on-surface-variant/40">→</span>
                  <span className="text-xs font-medium text-on-surface-variant">
                    {r.subject_id}
                  </span>
                  <span className="flex gap-0.5 ml-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={11}
                        className={n <= r.rating ? 'fill-primary text-primary' : 'text-outline'}
                      />
                    ))}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => moderate(r, 'published')}
                    className="text-xs text-accent hover:underline"
                  >
                    Publicar
                  </button>
                  <button
                    onClick={() => moderate(r, 'flagged')}
                    className="text-xs text-on-surface-variant hover:underline"
                  >
                    Flag
                  </button>
                  <button
                    onClick={() => moderate(r, 'removed')}
                    className="text-xs text-error hover:underline"
                  >
                    Quitar
                  </button>
                </div>
              </div>
              {r.property_title && (
                <p className="text-xs text-on-surface-variant mt-1 italic">«{r.property_title}»</p>
              )}
              <p className="text-sm text-on-surface mt-1">{r.comment}</p>
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
        {tab === 'resumen' ? (
          <ResumenTab />
        ) : tab === 'usuarios' ? (
          <UsersTab />
        ) : tab === 'propiedades' ? (
          <PropertiesTab />
        ) : tab === 'empresas' ? (
          <CompaniesTab />
        ) : (
          <ReviewsTab />
        )}
      </div>
    </div>
  )
}
