import { afterEach, expect, it, vi } from 'vitest'

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ getSupabase: () => ({ rpc }) }))

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.resetModules()
  rpc.mockReset()
})

it('stops a failed logging batch and retries only after the cooldown', async () => {
  vi.useFakeTimers()
  vi.stubGlobal('window', { location: { pathname: '/perfil', origin: 'https://mapu.test' } })
  vi.stubGlobal('navigator', { userAgent: 'test' })
  rpc.mockResolvedValue({ error: { code: 'PGRST202', message: 'Missing function' } })
  const { captureError } = await import('../errorLogging')
  captureError({ message: 'First error' })
  captureError({ message: 'Second error' })
  await vi.advanceTimersByTimeAsync(2500)
  expect(rpc).toHaveBeenCalledTimes(1)
  captureError({ message: 'During cooldown' })
  await vi.advanceTimersByTimeAsync(60_000)
  expect(rpc).toHaveBeenCalledTimes(1)
  rpc.mockResolvedValue({ error: null })
  captureError({ message: 'Recovered' })
  await vi.advanceTimersByTimeAsync(2500)
  expect(rpc).toHaveBeenCalledTimes(2)
  expect(rpc.mock.calls[1][1].log_message).toBe('Recovered')
})
