'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Building2, Lock, Users } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { organizationService } from '@/services/organizationService'
import { PropertyCard } from '@/components/property/PropertyCard'
import { Badge } from '@/components/ui/Badge'
import { Property } from '@/types/property'

export default function EquipoPage() {
  const { user, isAuthenticated, isLoading } = useAuthContext()
  const [org, setOrg] = useState<Awaited<ReturnType<typeof organizationService.getById>>>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [members, setMembers] = useState<
    { id: string; name: string; email: string; role: string }[]
  >([])
  const [loading, setLoading] = useState(true)

  const orgId = user?.organizationId
  const orgRole = user?.organizationRole
  const canManage = orgRole === 'owner' || orgRole === 'admin'

  useEffect(() => {
    if (!orgId) return
    let active = true
    Promise.all([
      organizationService.getById(orgId),
      organizationService.getOrgProperties(orgId),
      organizationService.getOrgMembers(orgId),
    ])
      .then(([o, p, m]) => {
        if (!active) return
        setOrg(o)
        setProperties(p)
        setMembers(m)
      })
      .catch(() => {})
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [orgId])

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
              rol: <span className="font-medium text-on-surface">{orgRole}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-5xl mx-auto space-y-6">
        {canManage && members.length > 0 && (
          <section>
            <h2 className="font-headline font-semibold text-on-surface mb-3 flex items-center gap-2">
              <Users size={16} className="text-on-surface-variant" /> Equipo
            </h2>
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
                  <Badge variant={m.role === 'owner' ? 'premium' : 'gray'} size="sm">
                    {m.role}
                  </Badge>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="font-headline font-semibold text-on-surface mb-3">
            Propiedades de la organización ({properties.length})
          </h2>
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
