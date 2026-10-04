import { describe, expect, it } from 'vitest'
import { hideInternalIds, publicName, redactDiagnostic } from '../diagnostics'

describe('diagnostics', () => {
  it('removes nested credentials while preserving useful context', () => {
    expect(
      redactDiagnostic({
        operation: 'save',
        payload: [{ authorization: 'Bearer secret', password: 'secret', status: 500 }],
      })
    ).toEqual({
      operation: 'save',
      payload: [{ authorization: '[redacted]', password: '[redacted]', status: 500 }],
    })
  })
  it('hides internal identifiers in routes and uses a human name fallback', () => {
    const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    expect(hideInternalIds(`/propiedad/${id}`)).toBe('/propiedad/[identificador interno]')
    expect(publicName(id)).toBe('Usuario')
    expect(publicName('María')).toBe('María')
  })
})
