import { z } from 'zod'

export type PublishStep = 1 | 2 | 3 | 4
export const PUBLISH_STEPS = [
  'Lo básico',
  'Ubicación',
  'Detalles y precio',
  'Fotos y revisión',
] as const

export const publishSchema = z.object({
  title: z.string().trim().min(8, 'El título debe tener al menos 8 caracteres'),
  description: z.string().trim().max(2000, 'Máximo 2000 caracteres'),
  price: z.coerce.number().positive('Ingresa un precio mayor a 0'),
  area: z.coerce.number().positive('Ingresa la superficie en m²'),
  street: z.string().trim(),
  commune: z.string().trim().min(2, 'Ingresa la comuna'),
  city: z.string().trim(),
  bedrooms: z.coerce.number().int().min(0).optional(),
  bathrooms: z.coerce.number().int().min(0).optional(),
  parkingSpots: z.coerce.number().int().min(0).optional(),
})

export type PublishFieldErrors = Partial<
  Record<keyof z.infer<typeof publishSchema> | 'images', string>
>
const schemas = [
  publishSchema.pick({ title: true }),
  publishSchema.pick({ street: true, commune: true, city: true }),
  publishSchema.pick({
    description: true,
    price: true,
    area: true,
    bedrooms: true,
    bathrooms: true,
    parkingSpots: true,
  }),
  publishSchema,
] as const

export function validatePublishStep(
  step: PublishStep,
  form: unknown,
  photoCount: number
): PublishFieldErrors {
  const parsed = schemas[step - 1].safeParse(form)
  const errors: PublishFieldErrors = {}
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof PublishFieldErrors
      errors[key] ??= issue.message
    }
  }
  if (step === 4 && photoCount === 0) errors.images = 'Agrega al menos una foto'
  return errors
}

export function stepForPublishErrors(errors: PublishFieldErrors): PublishStep {
  if (errors.title) return 1
  if (errors.street || errors.commune || errors.city) return 2
  if (Object.keys(errors).some((key) => key !== 'images')) return 3
  return 4
}

export function accessiblePublishStep(step: PublishStep, authenticated: boolean): PublishStep {
  return authenticated ? step : 1
}
