/**
 * Utilidades para RUT chileno (formato y validación de dígito verificador).
 */

/** Formatea un RUT en vivo: 12345678K → "12.345.678-K". */
export function formatRut(input: string): string {
  const v = input.toUpperCase().replace(/[^0-9K]/g, '')
  if (!v) return ''
  let body = ''
  let dv = ''
  for (const ch of v) {
    if (ch === 'K') dv = 'K'
    else body += ch
  }
  if (dv) {
    body = body.slice(0, 8)
  } else if (body.length > 8) {
    dv = body.slice(8, 9)
    body = body.slice(0, 8)
  }
  return body ? `${fmtBody(body)}${dv ? '-' + dv : ''}` : v
}

/** Puntos cada 3 dígitos desde la derecha. */
function fmtBody(body: string): string {
  return body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/**
 * Valida un RUT chileno (dígito verificador mod-11).
 * Acepta "12345678-9", "12.345.678-9", "12345678K", etc.
 */
export function validateRut(input: string): boolean {
  const m = input.toUpperCase().replace(/[^0-9K]/g, '')
  const match = /^(\d{7,8})([0-9K])$/.exec(m)
  if (!match) return false
  const body = parseInt(match[1], 10)
  const dv = match[2]
  let sum = 0
  let mult = 2
  for (let n = body; n > 0; n = Math.floor(n / 10)) {
    sum += (n % 10) * mult
    mult = mult === 7 ? 2 : mult + 1
  }
  const calc = 11 - (sum % 11)
  const expected = calc === 11 ? '0' : calc === 10 ? 'K' : String(calc)
  return expected === dv
}
