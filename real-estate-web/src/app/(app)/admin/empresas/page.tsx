'use client'

import { useEffect, useState } from 'react'
import { Building, Plus, X } from 'lucide-react'
import { adminService, AdminUserRow, OrganizationRow } from '@/services/adminService'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { SearchInput } from '@/components/ui/SearchInput'
import { EmptyState } from '@/components/ui/EmptyState'

export default function AdminCompaniesPage() {
  const [orgs, setOrgs] = useState<OrganizationRow[]>([])
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              load(e.target.value)
            }}
            placeholder="Buscar empresa…"
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
        <Card>
          <EmptyState
            icon={<Building size={22} />}
            title="Sin empresas"
            description="Crea la primera empresa de la plataforma."
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {orgs.map((org) => (
            <Card key={org.id} className="p-4">
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
            </Card>
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
