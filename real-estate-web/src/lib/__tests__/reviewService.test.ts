import { describe, it, expect, vi, beforeEach } from 'vitest'

// La política de reviews es WITH CHECK (auth.uid() = author_id AND status =
// 'published'). Omitir author_id no da un error de columna nula: da 403, que
// en la UI aparece como "No tienes permisos para realizar esta acción". Este
// test existe para que no se vuelva a caer del payload.
const insert = vi.fn((_payload: Record<string, unknown>) => Promise.resolve({ error: null }))
vi.mock('@/lib/supabase', () => ({ getSupabase: () => ({ from: () => ({ insert }) }) }))

const { reviewService } = await import('@/services/reviewService')

beforeEach(() => insert.mockClear())

describe('reviewService.create', () => {
  it('manda author_id en el insert', async () => {
    await reviewService.create({
      authorId: 'user-1',
      subjectId: 'owner-1',
      rating: 5,
      comment: 'Muy buena atención, respondió rápido.',
    })
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ author_id: 'user-1' }))
  })

  it('no fija status: el default de la tabla ya es published', async () => {
    await reviewService.create({
      authorId: 'user-1',
      subjectId: 'owner-1',
      rating: 4,
      comment: 'Todo bien con la visita.',
    })
    expect(insert.mock.calls[0][0]).not.toHaveProperty('status')
  })
})
