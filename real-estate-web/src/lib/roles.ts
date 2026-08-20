import { PlatformRole } from '@/types/enums'
import { User } from '@/types/user'

/**
 * Roles de la app (jerarquía de permisos de navegación y datos).
 *
 *   superadmin  — dueño de la plataforma: ve TODO el sistema.
 *   org_owner   — dueño de una empresa/corredora: gestiona miembros y ve
 *                 métricas de toda su org.
 *   org_admin   — admin de la org: igual que el dueño, sin ownership.
 *   org_agent   — agente/corredor: solo sus propiedades + ver su empresa.
 *   user        — usuario común: solo promociona sus propiedades.
 */
export type AppRole = 'superadmin' | 'org_owner' | 'org_admin' | 'org_agent' | 'user'

export function getAppRole(user: User | null): AppRole {
  if (!user) return 'user'
  if (user.platformRole === PlatformRole.SUPERADMIN) return 'superadmin'
  if (user.organizationId) {
    if (user.organizationRole === 'owner') return 'org_owner'
    if (user.organizationRole === 'admin') return 'org_admin'
    if (user.organizationRole === 'agent') return 'org_agent'
  }
  return 'user'
}

export function isSuperadmin(user: User | null): boolean {
  return user?.platformRole === PlatformRole.SUPERADMIN
}

/** Owner o admin de la org: puede gestionar miembros/propiedades y ve métricas org. */
export function canManageOrg(user: User | null): boolean {
  const role = getAppRole(user)
  return role === 'org_owner' || role === 'org_admin'
}

/** Miembro activo de una empresa (cualquier rol). */
export function isOrgMember(user: User | null): boolean {
  return !!user?.organizationId
}

/** Alcance de las métricas que cada rol puede ver (RLS del lado DB lo respalda). */
export type MetricsScope = 'self' | 'org' | 'global'

export function metricsScopeFor(user: User | null): MetricsScope {
  if (isSuperadmin(user)) return 'global'
  if (canManageOrg(user)) return 'org'
  return 'self'
}
