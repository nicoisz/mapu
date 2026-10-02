import { describe, expect, it } from 'vitest'
import { validPublishDraft, type PublishDraft } from '@/lib/publishDraft'
import { PropertyOperation, PropertyType } from '@/types/enums'

const now = 1_800_000_000_000
function draft(): PublishDraft {
  return {
    version: 1,
    savedAt: now,
    clientRequestId: '12345678-1234-4234-8234-123456789abc',
    operation: PropertyOperation.RENT,
    type: PropertyType.HOUSE,
    form: {
      title: 'Casa con jardín',
      description: 'Mi descripción',
      price: '800000',
      street: 'Calle 12',
      commune: 'Ñuñoa',
      city: 'Santiago',
      region: 'Metropolitana',
      area: '120',
      bedrooms: '3',
      bathrooms: '2',
      parkingSpots: '1',
      negotiable: true,
    },
    coords: { lat: -33.45, lng: -70.65 },
    files: [new File(['photo'], 'casa.jpg', { type: 'image/jpeg' })],
    resumeSubmit: true,
  }
}

describe('Publishing draft validation', () => {
  it('preserves fields, ordered photo files, location and retry identity', () => {
    const input = draft()
    expect(validPublishDraft(input, now)).toEqual(input)
  })
  it('does not resume expired or future-dated drafts', () => {
    expect(validPublishDraft(draft(), now + 8 * 86400000)).toBeNull()
    expect(validPublishDraft({ ...draft(), savedAt: now + 1 }, now)).toBeNull()
  })
  it('rejects incomplete drafts and unusable photo data', () => {
    expect(validPublishDraft({ resumeSubmit: true }, now)).toBeNull()
    expect(validPublishDraft({ ...draft(), files: ['blob:expired'] }, now)).toBeNull()
  })
})
