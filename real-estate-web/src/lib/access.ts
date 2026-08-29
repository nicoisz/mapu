import { PlatformRole } from '@/types/enums'
import { User } from '@/types/user'

export type AdminAccessStatus = 'loading' | 'redirect' | 'blocked' | 'allow'

/** Decisión del guard de /admin. El control de acceso real va en la DB (RLS);
 *  esto solo maneja UX (cargando, redirect a login, bloqueo, permitir). */
export function adminAccessStatus(params: {
  isLoading: boolean
  user: User | null
}): AdminAccessStatus {
  if (params.isLoading) return 'loading'
  if (!params.user) return 'redirect'
  if (params.user.platformRole !== PlatformRole.SUPERADMIN) return 'blocked'
  return 'allow'
}

export function canAccessAdmin(user: User | null): boolean {
  return user?.platformRole === PlatformRole.SUPERADMIN
}
