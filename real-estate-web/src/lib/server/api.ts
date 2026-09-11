import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'

/**
 * Contrato uniforme de errores de API:
 *  - `code` estable (machine-readable);
 *  - `message` seguro para el usuario;
 *  - `traceId` para correlacionar con logs (la causa interna va solo en logs);
 *  - `status` HTTP correcto.
 */
export type ApiErrorKind =
  | 'UNAUTHORIZED'
  | 'INVALID_SESSION'
  | 'FORBIDDEN'
  | 'NOT_MEMBER'
  | 'LISTING_LIMIT_REACHED'
  | 'INVALID_BODY'
  | 'INVALID_JSON'
  | 'INTERNAL'

export interface ApiErrorSpec {
  status: number
  message: string
}

export const API_ERRORS: Record<ApiErrorKind, ApiErrorSpec> = {
  UNAUTHORIZED: { status: 401, message: 'No autorizado' },
  INVALID_SESSION: { status: 401, message: 'Sesión inválida' },
  FORBIDDEN: { status: 403, message: 'No tienes permiso para realizar esta acción' },
  NOT_MEMBER: { status: 403, message: 'No eres miembro de esta organización' },
  LISTING_LIMIT_REACHED: {
    status: 402,
    message: 'Alcanzaste el límite de publicaciones del plan gratis',
  },
  INVALID_BODY: { status: 400, message: 'Datos inválidos' },
  INVALID_JSON: { status: 400, message: 'JSON inválido' },
  INTERNAL: { status: 500, message: 'Error interno del servidor' },
}

export function apiError(kind: ApiErrorKind, requestId?: string): NextResponse {
  const traceId = requestId ?? randomUUID()
  const spec = API_ERRORS[kind]
  return NextResponse.json(
    { error: { code: kind, message: spec.message, traceId } },
    { status: spec.status }
  )
}

/** Variante con mensaje dinámico (p.ej. mensajes de validación), mismo contrato. */
export function apiErrorDetail(
  status: number,
  code: string,
  message: string,
  requestId?: string
): NextResponse {
  const traceId = requestId ?? randomUUID()
  return NextResponse.json({ error: { code, message, traceId } }, { status })
}

export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status })
}
