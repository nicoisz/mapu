import { z } from 'zod'
import { PROPERTY_TYPE_LABELS } from '@/constants'

export const descriptionInputSchema = z.object({
  type: z.enum(['house', 'apartment', 'land', 'office', 'commercial', 'warehouse']),
  operation: z.enum(['sale', 'rent']),
  commune: z.string().trim().min(2).max(100),
  area: z.coerce.number().positive().max(100_000_000),
  price: z.coerce.number().positive().max(1_000_000_000_000),
  bedrooms: z.string().regex(/^\d{0,3}$/),
  bathrooms: z.string().regex(/^\d{0,3}$/),
  parkingSpots: z.string().regex(/^\d{0,3}$/),
  negotiable: z.boolean(),
})

export function basicPropertyDescription(input: z.infer<typeof descriptionInputSchema>): string {
  const details = [
    input.bedrooms && `${input.bedrooms} dormitorios`,
    input.bathrooms && `${input.bathrooms} baños`,
    input.parkingSpots && `${input.parkingSpots} estacionamientos`,
  ].filter(Boolean)
  return `${PROPERTY_TYPE_LABELS[input.type]} en ${input.operation === 'rent' ? 'arriendo' : 'venta'} en ${input.commune}, con ${input.area} m².${details.length ? ` Cuenta con ${details.join(', ')}.` : ''}\n\n${input.operation === 'rent' ? 'Arriendo mensual' : 'Precio'}: $${new Intl.NumberFormat('es-CL').format(input.price)} CLP.${input.negotiable ? ' Precio negociable.' : ''}`
}
