/**
 * Mensajes de error de cara al usuario (español).
 *
 * Convierte errores crudos (Supabase/PostgREST/red) en mensajes legibles.
 * Úsalo en services/catches para que el usuario nunca vea texto técnico.
 * Si el mensaje no coincide con ningún patrón conocido se devuelve tal cual.
 */

const RULES: Array<{ re: RegExp; message: string }> = [
  // Auth
  { re: /invalid login credentials/i, message: 'Credenciales incorrectas' },
  { re: /email not confirmed/i, message: 'Debes confirmar tu correo antes de iniciar sesión' },
  { re: /already registered/i, message: 'Ya existe una cuenta con ese email' },
  {
    re: /password should be at least/i,
    message: 'Contraseña demasiado corta (mínimo 6 caracteres)',
  },
  {
    re: /jwt.*expired|token.*expired|invalid api key|apikey.*invalid/i,
    message: 'Tu sesión expiró, vuelve a iniciar sesión',
  },
  {
    re: /rate limit|too many requests|over_email_send_rate_limit/i,
    message: 'Demasiados intentos, espera un momento',
  },

  // PostgREST / DB
  {
    re: /row.?level security policy|permission denied for table|permission denied for function/i,
    message: 'No tienes permisos para realizar esta acción',
  },
  { re: /new row violates row.?level security/i, message: 'No tienes permisos para guardar esto' },
  {
    re: /duplicate key value violates unique constraint|conflicts with the unique constraint/i,
    message: 'Ya existe un registro con esos datos',
  },
  { re: /invalid input syntax for type uuid/i, message: 'Identificador inválido' },
  {
    re: /relation .* does not exist|could not find the function/i,
    message: 'El servicio no está configurado',
  },
  {
    re: /database connection limit|too many clients|connection.*refused|server.*(down|unavailable)/i,
    message: 'El servicio está saturado, inténtalo de nuevo',
  },
  { re: /no rows/i, message: 'No se encontró el registro' },
  {
    re: /foreign key violation|violates foreign key/i,
    message: 'Registro en uso por otra parte del sistema',
  },
  { re: /storage object already exists/i, message: 'Ya existe un archivo con ese nombre' },

  // Red
  {
    re: /fetch failed|failed to fetch|networkerror|load failed|abort/i,
    message: 'No se pudo conectar con el servidor. Revisa tu conexión',
  },
  { re: /timeout|timed out/i, message: 'La operación tardó demasiado, inténtalo de nuevo' },

  // Parse
  { re: /unexpected token .* in json/i, message: 'El servidor devolvió una respuesta inválida' },
]

/** Traduce un mensaje de error crudo a español. */
export function translateError(message: string): string {
  if (!message) return 'Ocurrió un error'
  for (const { re, message: es } of RULES) {
    if (re.test(message)) return es
  }
  return message
}

/** Extrae el mensaje de un Error/desconocido y lo traduce. */
export function toUserMessage(err: unknown, fallback = 'Ocurrió un error inesperado'): string {
  if (err instanceof Error) return translateError(err.message)
  if (typeof err === 'string') return translateError(err)
  if (err && typeof err === 'object' && 'message' in err) {
    return translateError(String((err as { message: unknown }).message))
  }
  return fallback
}

/**
 * Envuelve el error crudo de PostgREST (que los services lanzan con
 * `new Error(error.message)`) y lo re-lanza ya traducido. Mantiene el stack.
 */
export function rethrowUserError(err: unknown): never {
  throw new Error(toUserMessage(err))
}
