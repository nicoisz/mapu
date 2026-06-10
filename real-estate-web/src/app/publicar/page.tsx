'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, ImagePlus, Lock } from 'lucide-react'
import { useAuthContext } from '@/contexts/AuthContext'
import { propertyService } from '@/services/propertyService'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { OPERATION_LABELS, PROPERTY_TYPE_LABELS, DEFAULT_MAP_CENTER } from '@/constants'
import {
  ChileanRegion, ContactMethod, Currency, PropertyOperation, PropertyType,
} from '@/types/enums'
import type { Property } from '@/types/property'

const TYPES = [PropertyType.HOUSE, PropertyType.APARTMENT, PropertyType.LAND, PropertyType.OFFICE, PropertyType.COMMERCIAL, PropertyType.WAREHOUSE]
const REGIONS = Object.values(ChileanRegion)

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface-container-low rounded-2xl border border-outline-variant/40 p-5 md:p-6">
      <h2 className="font-headline font-semibold text-lg text-on-surface">{title}</h2>
      {desc && <p className="text-sm text-on-surface-variant mt-0.5 mb-4">{desc}</p>}
      {!desc && <div className="mb-4" />}
      <div className="space-y-4">{children}</div>
    </section>
  )
}

const labelCls = 'block text-sm font-medium text-on-surface-variant mb-1.5'
const selectCls = 'w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary'

export default function PublicarPage() {
  const router = useRouter()
  const { user, isAuthenticated, hasRemainingListings } = useAuthContext()

  const [operation, setOperation] = useState<PropertyOperation>(PropertyOperation.SALE)
  const [type, setType] = useState<PropertyType>(PropertyType.HOUSE)
  const [form, setForm] = useState({
    title: '', description: '', price: '', street: '', commune: '', city: '',
    region: ChileanRegion.METROPOLITANA, area: '', bedrooms: '', bathrooms: '',
    parkingSpots: '', images: '', negotiable: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const set = (k: keyof typeof form, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

  if (!isAuthenticated || !user) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-background">
        <Lock size={48} className="text-on-surface-variant/40 mb-4" />
        <h2 className="font-headline text-xl font-bold text-on-surface">Inicia sesión para publicar</h2>
        <p className="text-on-surface-variant text-sm mt-2">Necesitas una cuenta para crear una publicación.</p>
        <Link href="/login" className="mt-6 bg-primary text-on-primary px-6 py-2.5 rounded-xl text-sm font-semibold hover:brightness-110 transition-all">Iniciar sesión</Link>
      </div>
    )
  }

  const canPublish = hasRemainingListings()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !canPublish) return
    setSubmitting(true)

    const priceNum = parseInt(form.price) || 0
    const isRent = operation === PropertyOperation.RENT
    const imageUrls = form.images.split(',').map(s => s.trim()).filter(Boolean)
    const images = (imageUrls.length ? imageUrls : ['/1.jpg']).map((url, i) => ({
      id: `img-${i}`, url, order: i, isMain: i === 0,
    }))

    const data: Partial<Property> = {
      title: form.title.trim(),
      description: form.description.trim(),
      type,
      operation,
      location: {
        latitude: DEFAULT_MAP_CENTER.latitude,
        longitude: DEFAULT_MAP_CENTER.longitude,
        address: {
          street: form.street.trim(),
          city: form.city.trim() || form.commune.trim(),
          commune: form.commune.trim() || undefined,
          region: form.region,
          country: 'Chile',
        },
        displayAddress: [form.street.trim(), form.commune.trim(), form.city.trim()].filter(Boolean).join(', '),
      },
      pricing: {
        price: priceNum,
        currency: Currency.CLP,
        monthlyRent: isRent ? priceNum : undefined,
        isNegotiable: form.negotiable,
      },
      features: {
        area: parseInt(form.area) || 0,
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : undefined,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : undefined,
        parkingSpots: form.parkingSpots ? parseInt(form.parkingSpots) : undefined,
      },
      media: { images },
      contact: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.contactInfo?.phone,
        preferredMethod: ContactMethod.EMAIL,
        avatar: user.avatar,
        isVerified: user.isEmailVerified ?? false,
      },
      tags: [],
    }

    propertyService.createProperty(user.id, data)
    router.push('/dashboard')
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm mb-4">
          <ArrowLeft size={18} /> Volver al panel
        </Link>

        <div className="mb-6">
          <h1 className="font-headline text-3xl font-bold text-on-surface">Publica tu propiedad</h1>
          <p className="text-on-surface-variant mt-1">Completa los datos y aparecerá en el catálogo al instante.</p>
        </div>

        {!canPublish && (
          <div className="mb-5 flex items-start gap-3 bg-error-container/40 border border-error/40 rounded-xl p-3 text-sm">
            <Lock size={16} className="text-error shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-on-surface">Alcanzaste el límite del plan gratuito</p>
              <p className="text-on-surface-variant text-xs mt-0.5">Actualiza a Premium para publicar sin límites.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Section title="Lo básico">
            {/* Operation */}
            <div>
              <span className={labelCls}>Operación</span>
              <div className="flex gap-2">
                {[PropertyOperation.SALE, PropertyOperation.RENT].map(op => (
                  <button
                    key={op} type="button" onClick={() => setOperation(op)}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-lg border transition-all ${operation === op ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant/60 text-on-surface-variant hover:border-primary'}`}
                  >
                    {OPERATION_LABELS[op]}
                  </button>
                ))}
              </div>
            </div>
            {/* Type */}
            <div>
              <label className={labelCls} htmlFor="type">Tipo de propiedad</label>
              <select id="type" value={type} onChange={e => setType(e.target.value as PropertyType)} className={selectCls}>
                {TYPES.map(t => <option key={t} value={t}>{PROPERTY_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <Input label="Título" placeholder="Ej: Casa luminosa con jardín en Ñuñoa" value={form.title} onChange={e => set('title', e.target.value)} required />
            <div>
              <label className={labelCls} htmlFor="desc">Descripción</label>
              <textarea
                id="desc" value={form.description} onChange={e => set('description', e.target.value)}
                rows={4} placeholder="Describe la propiedad, su entorno y lo que la hace especial..."
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </Section>

          <Section title="Ubicación">
            <Input label="Calle y número" placeholder="Av. Irarrázaval 1234" value={form.street} onChange={e => set('street', e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Comuna" placeholder="Ñuñoa" value={form.commune} onChange={e => set('commune', e.target.value)} />
              <Input label="Ciudad" placeholder="Santiago" value={form.city} onChange={e => set('city', e.target.value)} />
            </div>
            <div>
              <label className={labelCls} htmlFor="region">Región</label>
              <select id="region" value={form.region} onChange={e => set('region', e.target.value as ChileanRegion)} className={selectCls}>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </Section>

          <Section title="Características">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Superficie (m²)" type="number" min="0" placeholder="120" value={form.area} onChange={e => set('area', e.target.value)} required />
              <Input label="Estacionamientos" type="number" min="0" placeholder="2" value={form.parkingSpots} onChange={e => set('parkingSpots', e.target.value)} />
              <Input label="Dormitorios" type="number" min="0" placeholder="3" value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)} />
              <Input label="Baños" type="number" min="0" placeholder="2" value={form.bathrooms} onChange={e => set('bathrooms', e.target.value)} />
            </div>
          </Section>

          <Section title="Precio">
            <Input
              label={operation === PropertyOperation.RENT ? 'Arriendo mensual (CLP)' : 'Precio (CLP)'}
              type="number" min="0" placeholder="0" value={form.price} onChange={e => set('price', e.target.value)} required
            />
            <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer">
              <input type="checkbox" checked={form.negotiable} onChange={e => set('negotiable', e.target.checked)} className="w-4 h-4 accent-[rgb(var(--primary))]" />
              Precio negociable
            </label>
          </Section>

          <Section title="Fotos" desc="Pega las URLs de las imágenes separadas por comas. La primera será la principal.">
            <div className="relative">
              <ImagePlus size={16} className="absolute left-3 top-3 text-on-surface-variant" />
              <textarea
                value={form.images} onChange={e => set('images', e.target.value)}
                rows={2} placeholder="https://…/foto1.jpg, https://…/foto2.jpg"
                className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest pl-9 pr-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </Section>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" onClick={() => router.push('/dashboard')} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" loading={submitting} disabled={!canPublish} className="flex-1">
              <Check size={16} /> Publicar propiedad
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
