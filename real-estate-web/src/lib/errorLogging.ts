import { getSupabase } from '@/lib/supabase'

/**
 * Captura de errores client-side para el log del admin.
 *
 * Registra window.onerror + unhandledrejection (vía initErrorLogging) y
 * expone captureError() para usarlo desde error.tsx / catch blocks.
 * Los errores se acumulan en un buffer y se insertan en lote a la tabla
 * `error_logs` (RLS: insert cualquiera, lectura solo superadmin).
 *
 * Nunca debe romper la app: si no hay credenciales, DB o red, se descarta.
 */

let initialized = false
let timer: ReturnType<typeof setTimeout> | null = null
let queue: Array<Record<string, unknown>> = []
let currentUser: { id?: string; email?: string; name?: string } | null = null

/** El AuthProvider mantiene aquí el usuario actual para etiquetar los errores. */
export function setErrorLogUser(user: { id?: string; email?: string; name?: string } | null): void {
  currentUser = user
}

function flush(): void {
  if (queue.length === 0) return
  const batch = queue
  queue = []
  timer = null
  try {
    getSupabase()
      .from('error_logs')
      .insert(batch)
      .then(
        () => {},
        () => {}
      )
  } catch {
    // Sin credenciales Supabase u otro fallo: no propagar.
  }
}

function scheduleFlush(delay = 2500): void {
  if (timer) return
  timer = setTimeout(flush, delay)
}

export interface CapturePayload {
  message?: string
  stack?: string
  route?: string
  context?: Record<string, unknown>
}

export function captureError(payload: CapturePayload): void {
  if (typeof window === 'undefined') return
  const row: Record<string, unknown> = {
    user_id: currentUser?.id ?? null,
    email: currentUser?.email ?? null,
    name: currentUser?.name ?? null,
    route: payload.route ?? window.location.pathname,
    message: payload.message ?? null,
    stack: payload.stack ? String(payload.stack).slice(0, 20000) : null,
    context: {
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...payload.context,
    },
  }
  queue.push(row)
  scheduleFlush()
}

/** Registra los handlers globales una sola vez. */
export function initErrorLogging(): void {
  if (initialized || typeof window === 'undefined') return
  initialized = true

  window.addEventListener('error', (event) => {
    captureError({
      message: event.message || 'Error global no capturado',
      stack: event.error?.stack,
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason as { message?: string; stack?: string } | undefined
    captureError({
      message: reason?.message || 'Promesa rechazada sin manejar',
      stack: reason?.stack,
    })
  })

  // Al ocultar la pestaña se vacía el buffer para no perder errores
  // justo antes de una navegación o cierre.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush()
  })
}
