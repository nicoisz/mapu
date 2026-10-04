import { getSupabaseAdmin } from './supabaseAdmin'
import { redactDiagnostic } from '../diagnostics'

/** Best-effort server diagnostics. Actor identity is always read from the verified session. */
export async function captureServerError(
  message: string,
  route: string,
  userId: string | null,
  context: Record<string, unknown> = {}
) {
  try {
    const admin = getSupabaseAdmin()
    const actor = userId
      ? (await admin.from('profiles').select('email,name').eq('id', userId).maybeSingle()).data
      : null
    await admin.from('error_logs').insert({
      message,
      route,
      user_id: userId,
      email: actor?.email ?? null,
      name: actor?.name ?? null,
      context: redactDiagnostic(context),
    })
  } catch {
    /* Diagnostics must never replace the original response. */
  }
}
