import { FREE_PLAN_LISTINGS_LIMIT } from '@/constants'

/**
 * ¿Tiene plan premium o trial activo? Si es premium/trial queda exento del
 * límite de publicaciones del plan gratis.
 */
export function isPremiumAccount(
  subscriptionType: string | null | undefined,
  trialExpiresAt: string | null | undefined,
  now: Date = new Date()
): boolean {
  if (subscriptionType === 'premium') return true
  return !!trialExpiresAt && new Date(trialExpiresAt).getTime() > now.getTime()
}

/**
 * ¿Alcanzó el límite de publicaciones activas? Solo aplica al plan gratis;
 * premium/trial nunca alcanza el límite.
 */
export function hasReachedListingLimit(
  activeCount: number,
  isPremium: boolean,
  limit: number = FREE_PLAN_LISTINGS_LIMIT
): boolean {
  if (isPremium) return false
  return activeCount >= limit
}
