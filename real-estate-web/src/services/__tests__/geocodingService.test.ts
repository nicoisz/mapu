import { expect, it, vi } from 'vitest'

it('serializes pin lookups, identifies the commune instead of province, and retries missing addresses', async () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-03T12:00:00Z'))
  vi.resetModules()
  const address = {
    display_name: 'Camino rural, Ñuñoa, Chile',
    address: {
      road: 'Camino rural',
      municipality: 'Comuna de nunoa',
      county: 'Provincia de Santiago',
      city: 'Santiago',
      country_code: 'cl',
    },
  }
  const fetchMock = vi
    .fn()
    .mockImplementation(async () => new Response(JSON.stringify(address), { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  try {
    const { reverseGeocode } = await import('../geocodingService')
    const first = reverseGeocode(-33.45, -70.65)
    const second = reverseGeocode(-33.46, -70.64)
    await vi.advanceTimersByTimeAsync(0)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const url = new URL(fetchMock.mock.calls[0][0])
    expect(url.pathname).toBe('/reverse')
    expect(url.searchParams.get('lat')).toBe('-33.45')
    await vi.advanceTimersByTimeAsync(1099)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const [result] = await Promise.all([first, second])
    expect(result).toMatchObject({
      latitude: -33.45,
      longitude: -70.65,
      commune: 'Ñuñoa',
      region: expect.stringContaining('Metropolitana'),
      street: 'Camino rural',
    })
    expect(result?.number).toBeUndefined()
    expect(await reverseGeocode(0, 0)).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    fetchMock.mockImplementationOnce(async () => new Response('{}', { status: 503 }))
    const failure = reverseGeocode(-33.47, -70.63)
    await vi.advanceTimersByTimeAsync(1100)
    expect(await failure).toBeNull()
    const retry = reverseGeocode(-33.47, -70.63)
    await vi.advanceTimersByTimeAsync(1100)
    expect(await retry).toMatchObject({ commune: 'Ñuñoa' })
    expect(fetchMock).toHaveBeenCalledTimes(4)
    fetchMock.mockImplementationOnce(
      async () =>
        new Response(JSON.stringify({ address: { municipality: 'Ñuñoa', country_code: 'ar' } }))
    )
    const outside = reverseGeocode(-33.48, -70.62)
    await vi.advanceTimersByTimeAsync(1100)
    expect(await outside).toBeNull()
  } finally {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  }
})
