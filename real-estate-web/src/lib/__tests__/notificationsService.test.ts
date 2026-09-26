import { describe, it, expect, vi, beforeEach } from 'vitest'

// El riesgo real de este service es el mapeo snake_case -> camelCase contra las
// columnas que devuelve owner_activity(). Un rename en el SQL rompe la UI en
// silencio (undefined en vez de error), así que eso es lo que se prueba.
const rpc = vi.fn()
vi.mock('@/lib/supabase', () => ({ getSupabase: () => ({ rpc }) }))

const { notificationsService } = await import('@/services/notificationsService')

beforeEach(() => rpc.mockReset())

describe('getActivity', () => {
  it('mapea las columnas de owner_activity()', async () => {
    rpc.mockResolvedValue({
      data: [
        {
          kind: 'message',
          property_id: 'p1',
          title: 'Casa en Valdivia',
          actor_name: 'Nico',
          body: 'Sigue disponible?',
          created_at: '2026-09-26T12:00:00Z',
          is_new: true,
        },
      ],
      error: null,
    })

    const [item] = await notificationsService.getActivity()
    expect(item).toEqual({
      kind: 'message',
      propertyId: 'p1',
      title: 'Casa en Valdivia',
      actorName: 'Nico',
      body: 'Sigue disponible?',
      createdAt: '2026-09-26T12:00:00Z',
      isNew: true,
    })
  })

  it('un like llega sin autor ni cuerpo', async () => {
    rpc.mockResolvedValue({
      data: [
        {
          kind: 'like',
          property_id: 'p1',
          title: 'Casa',
          actor_name: null,
          body: null,
          created_at: '2026-09-26T12:00:00Z',
          is_new: false,
        },
      ],
      error: null,
    })

    const [item] = await notificationsService.getActivity()
    expect(item.actorName).toBeNull()
    expect(item.isNew).toBe(false)
  })

  it('devuelve lista vacía si el RPC falla, no revienta el menú', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'boom' } })
    expect(await notificationsService.getActivity()).toEqual([])
  })
})

describe('getUnreadCount', () => {
  it('devuelve 0 ante error', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'boom' } })
    expect(await notificationsService.getUnreadCount()).toBe(0)
  })

  it('devuelve el conteo', async () => {
    rpc.mockResolvedValue({ data: 3, error: null })
    expect(await notificationsService.getUnreadCount()).toBe(3)
  })
})
