import { describe, expect, it } from 'vitest'
import {
  accessiblePublishStep,
  stepForPublishErrors,
  validatePublishStep,
  validatePublishLocation,
} from '@/lib/publishWizard'

const form = {
  title: 'Casa con jardín',
  description: '',
  street: '',
  commune: '',
  city: '',
  price: '',
  area: '',
  bedrooms: '',
  bathrooms: '',
  parkingSpots: '',
}

describe('Publishing stages', () => {
  it('allows guests only the first stage even when restoring a later draft', () => {
    expect(accessiblePublishStep(4, false)).toBe(1)
    expect(accessiblePublishStep(2, true)).toBe(2)
  })
  it('validates only the fields in the current stage', () => {
    expect(validatePublishStep(1, form, 0)).toEqual({})
    expect(Object.keys(validatePublishStep(2, form, 0))).toEqual(['commune'])
    expect(Object.keys(validatePublishStep(3, form, 0)).sort()).toEqual(['area', 'price'])
  })
  it('requires all stages and a photo before final publication', () => {
    expect(validatePublishStep(4, form, 0)).toMatchObject({
      commune: expect.any(String),
      area: expect.any(String),
      price: expect.any(String),
      images: expect.any(String),
    })
    expect(
      validatePublishStep(4, { ...form, commune: 'Ñuñoa', area: '120', price: '800000' }, 1)
    ).toEqual({})
  })
  it('returns to the earliest stage needing correction', () => {
    expect(stepForPublishErrors({ title: 'Falta', price: 'Falta' })).toBe(1)
    expect(stepForPublishErrors({ street: 'Ubica el pin', images: 'Falta' })).toBe(2)
    expect(stepForPublishErrors({ price: 'Falta', images: 'Falta' })).toBe(3)
    expect(stepForPublishErrors({ images: 'Falta' })).toBe(4)
    expect(stepForPublishErrors({ description: 'Demasiado larga' })).toBe(4)
    expect(
      validatePublishStep(
        3,
        { ...form, area: '120', price: '850000', description: 'x'.repeat(2001) },
        0
      )
    ).toEqual({})
  })
})

describe('Confirmed publishing location', () => {
  it('accepts only a confirmed valid pin and routes location errors to stage 2', () => {
    const pin = { lat: -33.45, lng: -70.65 }
    expect(validatePublishLocation(pin, true)).toEqual({})
    for (const errors of [
      validatePublishLocation(pin, false),
      validatePublishLocation(null, true),
      validatePublishLocation({ lat: NaN, lng: -70 }, true),
      validatePublishLocation({ lat: 0, lng: 0 }, true),
    ]) {
      expect(errors.location).toBeTruthy()
      expect(stepForPublishErrors(errors)).toBe(2)
    }
  })
})
