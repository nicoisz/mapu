import { getSupabaseBrowser } from '@/lib/supabase/browser'

export const PREMIUM_PRICE = 9900

/**
 * F5 — UI/UX de pago Mercado Pago. La integración real (crear preferencia MP,
 * webhook) llega después; hoy este servicio simula el flujo y marca premium en
 * profiles cuando el checkout "confirma". Reemplazar createPreference() por la
 * edge function cuando existan credenciales.
 */
export const paymentService = {
  /** Crea la preferencia de pago. Simulado: devuelve un id local. */
  async createPreference(userId: string): Promise<{ preferenceId: string }> {
    const preferenceId = `pref_sim_${crypto.randomUUID()}`
    // Registro la intención de pago para el historial.
    await getSupabaseBrowser()
      .from('payments')
      .insert({
        user_id: userId,
        plan: 'premium',
        amount: PREMIUM_PRICE,
        status: 'pending',
        mp_preference_id: preferenceId,
      })
      .then(
        () => {},
        () => {}
      )
    return { preferenceId }
  },

  /** Marca la cuenta como premium (sin pago real — simulado). */
  async confirmPremium(userId: string): Promise<void> {
    const now = new Date().toISOString()
    const { error } = await getSupabaseBrowser()
      .from('profiles')
      .update({
        subscription_type: 'premium',
        subscription_started_at: now,
        subscription_expires_at: new Date(Date.now() + 30 * 86_400_000).toISOString(),
        updated_at: now,
      })
      .eq('id', userId)
    if (error) throw new Error(error.message)
  },
}
