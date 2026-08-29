'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BarChart3, Building2, Eye, Heart, MessageSquare, Trash2, UserPlus } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { organizationService } from '@/services/organizationService'
import { PropertyCard } from '@/components/property/PropertyCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { EmptyState } from '@/components/ui/EmptyState'
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
      <div className="flex h-full flex-col items-center justify-center bg-background p-8">
        <EmptyState
          icon={<Building2 size={22} />}
          title="Sin organización"
          description="No perteneces a ninguna empresa. Contacta a tu administrador para ser agregado."
          action={
            <Link href="/dashboard" className="block">
              <Button>Volver al panel</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-background pb-16">
      <PageHeader
        icon={<Building2 size={20} />}
        title={org?.name ?? 'Mi empresa'}
        badge={
          org?.is_verified ? (
            <Badge variant="success" size="sm">
              ✓ Verificada
            </Badge>
          ) : undefined
        }
        description={
          `${org?.type === 'company' ? 'Empresa' : 'Corredora'} · ${members.length} miembros · tu rol: ${ROLE_LABELS[orgRole ?? ''] ?? orgRole ?? ''}`
        }
      />

      <div className="mx-auto w-full max-w-5xl space-y-8 px-6 py-6">
        {canManage && (
          <section className="space-y-4">
            <SectionHeading title="Equipo" count={members.length} />

            <form
              onSubmit={handleInvite}
              className="flex flex-col sm:flex-row gap-2 rounded-2xl border border-outline-variant/50 bg-surface-container-low p-3"
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
                <Card key={m.id} className="px-4 py-3">
                  <div className="flex items-center gap-3">
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
                </Card>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <SectionHeading
            title="Propiedades de la organización"
            count={properties.length}
            actions={
              <Link
                href="/metricas"
                className="flex items-center gap-1 text-xs font-medium text-accent hover:text-primary transition-colors"
              >
                <BarChart3 size={14} /> Ver métricas
              </Link>
            }
          />

          {properties.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                label="Vistas"
                value={properties.reduce((s, p) => s + p.listing.views, 0)}
                icon={<Eye size={16} />}
              />
              <StatCard
                label="Favoritos"
                value={properties.reduce((s, p) => s + p.listing.favorites, 0)}
                icon={<Heart size={16} />}
              />
              <StatCard
                label="Contactos"
                value={properties.reduce((s, p) => s + p.listing.inquiries, 0)}
                icon={<MessageSquare size={16} />}
              />
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-on-surface-variant text-sm">Cargando…</div>
          ) : properties.length === 0 ? (
            <Card>
              <EmptyState
                icon={<Building2 size={22} />}
                title="Aún sin publicaciones bajo esta empresa"
                description="Los agentes de tu organización pueden publicar propiedades desde su panel."
              />
            </Card>
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
