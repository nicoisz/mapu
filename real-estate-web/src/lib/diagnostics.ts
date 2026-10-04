/** Keep diagnostics useful without persisting credentials or showing database identifiers. */
export function redactDiagnostic(value: unknown, depth = 0): unknown {
  if (depth > 8) return '[truncated]'
  if (Array.isArray(value)) return value.slice(0, 50).map((v) => redactDiagnostic(v, depth + 1))
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .slice(0, 50)
        .map(([key, v]) => [
          key,
          /password|authorization|cookie|token|secret|api.?key/i.test(key)
            ? '[redacted]'
            : redactDiagnostic(v, depth + 1),
        ])
    )
  return typeof value === 'string' ? value.slice(0, 5000) : value
}
export function hideInternalIds(value: string): string {
  return value.replace(/\b[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}\b/gi, '[identificador interno]')
}
export function publicName(value: string | null | undefined, fallback = 'Usuario'): string {
  return value?.trim() && !/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(value.trim())
    ? value
    : fallback
}
