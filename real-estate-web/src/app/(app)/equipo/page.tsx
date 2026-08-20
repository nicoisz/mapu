'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BarChart3, Building2, Lock, Trash2, UserPlus, Users } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { organizationService } from '@/services/organizationService'
import { PropertyCard } from '@/components/property/PropertyCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Property } from '@/types/property'
import { canManageOrg } from '@/lib/roles'

const ROLE_LABELS: Record<string, string> = {
  owner: 'Dueño',
  admin: 'Admin',
  agent: 'Agente',
}

export default function EquipoPage() {
  const { user, isAuthenticated, isLoading } = useAuthContext()
  const [org, setOrg] = useState<Awaited<ReturnType<typeof organizationService.getById>>>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [members, setMembers] = useState<
    { id: string; name: string; email: string; role: string }[]
  >([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'agent' | 'admin'>('agent')
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)

  const orgId = user?.organizationId
  const orgRole = user?.organizationRole
  const canManage = canManageOrg(user)

  const load = () => {
    if (!orgId) return
    setLoading(true)
    Promise.all([
      organizationService.getById(orgId),
      organizationService.getOrgProperties(orgId),
      organizationService.getOrgMembers(orgId),
    ])
      .then(([o, p, m]) => {
        setOrg(o)
        setProperties(p)
        setMembers(m)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [orgId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!orgId || !inviteEmail.trim()) return
    setInviteError(null)
    setInviteLoading(true)
    try {
      const found = await organizationService.findUserByEmail(inviteEmail)
      if (!found) {
        setInviteError('No se encontró ningún usuario con ese email.')
        return
      }
      await organizationService.setMemberRole(orgId, found.id, inviteRole)
      setInviteEmail('')
      load()
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Error al invitar')
    } finally {
      setInviteLoading(false)
    }
  }

  async function handleRoleChange(userId: string, role: 'owner' | 'admin' | 'agent' | null) {
    if (!orgId) return
    try {
      await organizationService.setMemberRole(orgId, userId, role)
      load()
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Error al actualizar rol')
    }
  }

  if (isLoading)
    return (
      <div className="h-full flex items-center justify-center text-on-surface-variant text-sm">
        Cargando…
      </div>
    )

  if (!isAuthenticated || !user || !orgId) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-background">
        <Lock size={48} className="text-on-surface-variant/40 mb-4" />
        <h2 className="font-headline text-xl font-bold text-on-surface">Sin organización</h2>
        <p className="text-on-surface-variant text-sm mt-2">
          No perteneces a ninguna empresa. Contacta a tu administrador para ser agregado.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 bg-primary text-on-primary px-6 py-2.5 rounded-xl text-sm font-semibold hover:brightness-110 transition-all"
        >
          Volver al panel
        </Link>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-background pb-20">
      <div className="relative bg-surface-container-low border-b border-outline-variant/40 px-4 pt-7 pb-5 overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="relative flex items-center gap-4">
          {org?.logo_url ? (
            <img
              src={org.logo_url}
              alt={org.name}
              className="w-14 h-14 rounded-xl object-cover border border-outline-variant/40"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
              <Building2 size={26} />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-headline text-2xl font-bold text-on-surface">
                {org?.name ?? 'Mi empresa'}
              </h1>
              {org?.is_verified && (
                <Badge variant="success" size="sm">
                  ✓ Verificada
                </Badge>
              )}
            </div>
            <p className="text-on-surface-variant text-sm mt-0.5">
              {org?.type === 'company' ? 'Empresa' : 'Corredora'} · {members.length} miembros · tu
              rol: <span className="font-medium text-on-surface">{ROLE_LABELS[orgRole ?? ''] ?? orgRole}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-5xl mx-auto space-y-6">
        {canManage && (
          <section>
            <h2 className="font-headline font-semibold text-on-surface mb-3 flex items-center gap-2">
              <Users size={16} className="text-on-surface-variant" /> Equipo
            </h2>

            <form
              onSubmit={handleInvite}
              className="flex flex-col sm:flex-row gap-2 mb-3 bg-surface-container-low rounded-xl border border-outline-variant/40 p-3"
            >
              <Input
                type="email"
                placeholder="Email del usuario a invitar…"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'agent' | 'admin')}
                className="bg-surface-container-lowest border border-outline-variant/60 rounded-lg px-3 py-2 text-sm focus:outline-none"
              >
                <option value="agent">Agente</option>
                <option value="admin">Admin</option>
              </select>
              <Button type="submit" size="sm" loading={inviteLoading}>
                <UserPlus size={14} /> Agregar
              </Button>
            </form>
            {inviteError && <p className="text-error text-sm mb-2">{inviteError}</p>}

            <div className="space-y-2">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 bg-surface-container-low rounded-xl border border-outline-variant/40 px-4 py-3"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                    {m.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-on-surface truncate">{m.name}</p>
                    <p className="text-xs text-on-surface-variant truncate">{m.email}</p>
                  </div>
                  {m.role === 'owner' ? (
                    <Badge variant="premium" size="sm">
                      Dueño
                    </Badge>
                  ) : (
                    <>
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.id, e.target.value as 'admin' | 'agent')}
                        className="bg-surface-container-lowest border border-outline-variant/60 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                      >
                        <option value="admin">Admin</option>
                        <option value="agent">Agente</option>
                      </select>
                      <button
                        onClick={() => handleRoleChange(m.id, null)}
                        title="Quitar de la empresa"
                        className="p-1.5 rounded-lg border border-outline-variant/60 text-error hover:border-error/60 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-headline font-semibold text-on-surface">
              Propiedades de la organización ({properties.length})
            </h2>
            <Link
              href="/metricas"
              className="flex items-center gap-1 text-xs font-medium text-accent hover:text-primary transition-colors"
            >
              <BarChart3 size={14} /> Ver métricas
            </Link>
          </div>
          {properties.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Vistas', value: properties.reduce((s, p) => s + p.listing.views, 0) },
                {
                  label: 'Favoritos',
                  value: properties.reduce((s, p) => s + p.listing.favorites, 0),
                },
                {
                  label: 'Contactos',
                  value: properties.reduce((s, p) => s + p.listing.inquiries, 0),
                },
              ].map((m) => (
                <div
                  key={m.label}
                  className="bg-surface-container-low rounded-xl p-3 text-center border border-outline-variant/40"
                >
                  <div className="font-headline font-bold text-lg text-primary">
                    {m.value.toLocaleString()}
                  </div>
                  <div className="text-xs text-on-surface-variant">{m.label}</div>
                </div>
              ))}
            </div>
          )}
          {loading ? (
            <div className="text-center py-8 text-on-surface-variant text-sm">Cargando…</div>
          ) : properties.length === 0 ? (
            <div className="text-center py-8 text-on-surface-variant text-sm">
              Aún sin publicaciones bajo esta empresa
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
