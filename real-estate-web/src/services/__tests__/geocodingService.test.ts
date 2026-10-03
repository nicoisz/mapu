import { expect, it, vi } from 'vitest'

it('serializes simultaneous address searches and includes the selected Chilean context', async () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-03T12:00:00Z'))
  vi.resetModules()
  const fetchMock = vi
    .fn()
    .mockImplementation(
      async () =>
        new Response(
          JSON.stringify([{ lat: '-33.45', lon: '-70.65', display_name: 'Dirección de prueba' }]),
          { status: 200 }
        )
    )
  vi.stubGlobal('fetch', fetchMock)
  try {
    const { searchAddress } = await import('../geocodingService')
    const first = searchAddress('Calle 123', {
      commune: 'Ñuñoa',
      city: 'Santiago',
      region: 'Metropolitana',
    })
    const second = searchAddress('Camino rural')
    await vi.advanceTimersByTimeAsync(0)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const url = new URL(fetchMock.mock.calls[0][0])
    expect(url.searchParams.get('q')).toBe('Calle 123, Ñuñoa, Santiago, Metropolitana, Chile')
    expect(url.searchParams.get('countrycodes')).toBe('cl')
    await vi.advanceTimersByTimeAsync(1099)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect((await Promise.all([first, second]))[0][0].latitude).toBe(-33.45)
  } finally {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  }
})
