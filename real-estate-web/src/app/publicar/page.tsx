'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Check, ImagePlus, Lock, Star, X } from 'lucide-react'
import {
  publishSchema,
  PUBLISH_STEPS,
  validatePublishStep,
  validatePublishLocation,
  stepForPublishErrors,
  accessiblePublishStep,
  type PublishStep,
  type PublishFieldErrors,
} from '@/lib/publishWizard'
import { useAuthContext } from '@/contexts/AuthContext'
import { propertyService } from '@/services/propertyService'
import {
  uploadPropertyImages,
  validateImageFile,
  deletePropertyImages,
} from '@/services/storageService'
import { compressImage } from '@/lib/imageCompression'
import {
  searchAddress,
  reverseGeocode,
  GeocodeSuggestion,
  ReverseGeocodeResult,
} from '@/services/geocodingService'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { loadPublishDraft, savePublishDraft, clearPublishDraft } from '@/lib/publishDraft'
import { Input } from '@/components/ui/Input'
import { PublishAuthPrompt } from '@/components/auth/PublishAuthPrompt'
import { LocationPicker } from '@/components/map/LocationPicker'
import { GlowLoader } from '@/components/ui/GlowLoader'
import {
  REGIONS,
  communesForRegion,
  localitiesForCommune,
  regionForCommune,
  titleCase,
} from '@/data/chileanLocations'
import { formatPriceShort } from '@/lib/utils'
import { OPERATION_LABELS, PROPERTY_TYPE_LABELS, DEFAULT_MAP_CENTER } from '@/constants'

import { ContactMethod, Currency, PropertyOperation, PropertyType } from '@/types/enums'
import type { Property, PropertyImage } from '@/types/property'

const TYPES = [
  PropertyType.HOUSE,
  PropertyType.APARTMENT,
  PropertyType.LAND,
  PropertyType.OFFICE,
  PropertyType.COMMERCIAL,
  PropertyType.WAREHOUSE,
]
const DEFAULT_REGION = REGIONS.find((r) => r.includes('Metropolitana')) ?? REGIONS[0]
const MAX_IMAGES = 10

type FieldErrors = PublishFieldErrors

interface PendingImage {
  file: File | null
  previewUrl: string
  /** Storage path of an existing image (edit mode); null for new uploads. */
  existingPath?: string
}

function Section({
  step,
  title,
  desc,
  children,
}: {
  step?: number
  title: string
  desc?: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-surface-container-low rounded-2xl border border-outline-variant/40 p-5 md:p-6 transition-shadow hover:shadow-soft">
      <div className="flex items-center gap-3 mb-4">
        {step !== undefined && (
          <span className="w-9 h-9 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
            {step}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="font-headline font-semibold text-lg text-on-surface leading-tight">
            {title}
          </h2>
          {desc && <p className="text-sm text-on-surface-variant mt-0.5">{desc}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

const labelCls = 'block text-sm font-medium text-on-surface-variant mb-1.5'
const selectCls =
  'w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary'
const errorCls = 'text-error text-xs mt-1'

export default function PublicarPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    hasRemainingListings,
    refreshUser,
  } = useAuthContext()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [operation, setOperation] = useState<PropertyOperation>(PropertyOperation.SALE)
  const [type, setType] = useState<PropertyType>(PropertyType.HOUSE)
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    street: '',
    commune: '',
    city: '',
    region: DEFAULT_REGION,
    area: '',
    bedrooms: '',
    bathrooms: '',
    parkingSpots: '',
    negotiable: false,
  })
  const [images, setImages] = useState<PendingImage[]>([])
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [authPrompt, setAuthPrompt] = useState(false)
  const [publishedId, setPublishedId] = useState<string | null>(null)
  const [draftLoaded, setDraftLoaded] = useState(false)
  const [step, setStep] = useState<PublishStep>(1)
  const [advancing, setAdvancing] = useState(false)
  const pageScrollRef = useRef<HTMLDivElement>(null)
  const currentStep = accessiblePublishStep(step, !!user && isAuthenticated)
  const submitLockRef = useRef(false)
  const imagesRef = useRef(images)
  imagesRef.current = images
  const canPublish = !isAuthenticated || hasRemainingListings()
  const isEditing = !!editId
  const originalPathsRef = useRef<string[]>([])
  // Idempotency key: se genera una vez por intento de publicación y se reutiliza
  // en reintentos del MISMO submit para que un doble clic/retry no duplique.
  const clientRequestIdRef = useRef<string | null>(null)
  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))

  // ── Ubicación: geocoder + pin ───────────────────────────────────
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([])
  const [locationConfirmed, setLocationConfirmed] = useState(false)
  const [locationBusy, setLocationBusy] = useState(false)
  const [locationMessage, setLocationMessage] = useState<string | null>(null)
  const [suggestedAddress, setSuggestedAddress] = useState<ReverseGeocodeResult | null>(null)
  const locationRequest = useRef(0)

  useEffect(() => {
    if (editId) {
      setDraftLoaded(true)
      return
    }
    let active = true
    loadPublishDraft()
      .then((draft) => {
        if (!active || !draft) return
        setForm(draft.form)
        setOperation(draft.operation)
        setType(draft.type)
        setCoords(draft.coords)
        setLocationConfirmed(draft.locationConfirmed)
        setImages(draft.files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) })))
        clientRequestIdRef.current = draft.clientRequestId
        setStep(draft.step)
      })
      .catch(() => {
        if (active) setSubmitError('No pudimos recuperar el borrador guardado en este navegador.')
      })
      .finally(() => {
        if (active) setDraftLoaded(true)
      })
    return () => {
      active = false
    }
  }, [editId])

  useEffect(() => {
    pageScrollRef.current?.scrollTo({ top: 0 })
  }, [currentStep])

  async function persistStep(next: PublishStep, location = coords) {
    if (editId) return
    const clientRequestId = (clientRequestIdRef.current ??= crypto.randomUUID())
    await savePublishDraft({
      version: 1,
      savedAt: Date.now(),
      clientRequestId,
      operation,
      type,
      form,
      coords: location,
      locationConfirmed,
      files: images.flatMap((image) => (image.file ? [image.file] : [])),
      step: next,
    })
  }

  async function continueStep() {
    if (authLoading || !draftLoaded || submitLockRef.current) return
    const validation = validatePublishStep(currentStep, form, images.length)
    setErrors(validation)
    if (Object.keys(validation).length) return
    submitLockRef.current = true
    setAdvancing(true)
    setSubmitError(null)
    try {
      if (currentStep === 2) {
        const locationErrors = validatePublishLocation(coords, locationConfirmed)
        if (locationErrors.location) {
          setErrors(locationErrors)
          return
        }
      }
      const next = Math.min(4, currentStep + 1) as PublishStep
      await persistStep(next)
      if (!user || !isAuthenticated) {
        setAuthPrompt(true)
        return
      }
      setStep(next)
    } catch {
      setSubmitError('No pudimos guardar esta etapa. Inténtalo de nuevo para conservar tus datos.')
    } finally {
      submitLockRef.current = false
      setAdvancing(false)
    }
  }

  function invalidateLocation() {
    locationRequest.current++
    setLocationConfirmed(false)
    setLocationBusy(false)
    setSuggestions([])
    setSuggestedAddress(null)
    setLocationMessage(null)
    setErrors((previous) => ({ ...previous, location: undefined }))
  }

  function handleStreetChange(value: string) {
    set('street', value)
    invalidateLocation()
    setCoords(null)
  }

  function handleMapPick(lat: number, lng: number) {
    invalidateLocation()
    setCoords({ lat, lng })
  }

  async function searchLocation() {
    const query = form.street.trim() || form.commune
    if (!query) return
    invalidateLocation()
    const request = locationRequest.current
    setLocationBusy(true)
    try {
      const results = await searchAddress(query, {
        commune: form.commune,
        city: form.city,
        region: form.region,
      })
      if (request !== locationRequest.current) return
      setSuggestions(results)
      if (!results.length)
        setLocationMessage(
          'Sin resultados. Puedes seleccionar la propiedad directamente en el mapa.'
        )
    } catch {
      if (request === locationRequest.current)
        setLocationMessage('No pudimos buscar la dirección. Puedes ubicar el pin manualmente.')
    } finally {
      if (request === locationRequest.current) setLocationBusy(false)
    }
  }

  async function suggestPinAddress() {
    if (!coords) return
    const request = ++locationRequest.current
    setLocationBusy(true)
    setLocationMessage(null)
    try {
      const result = await reverseGeocode(coords.lat, coords.lng)
      if (request !== locationRequest.current) return
      setSuggestedAddress(result)
      if (!result)
        setLocationMessage(
          'No encontramos una dirección para este pin. Escribe una dirección o referencia.'
        )
    } catch {
      if (request === locationRequest.current)
        setLocationMessage(
          'No pudimos consultar la dirección del pin. Puedes escribirla manualmente.'
        )
    } finally {
      if (request === locationRequest.current) setLocationBusy(false)
    }
  }

  function useSuggestedAddress() {
    if (!suggestedAddress) return
    const suggestion = suggestedAddress
    const region = suggestion.commune ? regionForCommune(suggestion.commune) : undefined
    const commune = region ? suggestion.commune! : form.commune
    const city =
      suggestion.city && localitiesForCommune(commune).includes(suggestion.city)
        ? suggestion.city
        : commune === form.commune
          ? form.city
          : ''
    setForm((previous) => ({
      ...previous,
      street: [suggestion.street, suggestion.number].filter(Boolean).join(' ') || previous.street,
      region: region ?? previous.region,
      commune,
      city,
    }))
    invalidateLocation()
  }
  // Edit mode: load the property and prefill the form + existing images.
  useEffect(() => {
    if (!editId || !user) return
    let active = true
    propertyService
      .getById(editId)
      .then((property) => {
        if (!active) return
        if (!property || property.ownerId !== user.id) {
          setNotFound(true)
          return
        }
        setOperation(property.operation)
        setType(property.type)
        setForm({
          title: property.title,
          description: property.description,
          price: String(
            property.operation === PropertyOperation.RENT
              ? (property.pricing.monthlyRent ?? property.pricing.price)
              : property.pricing.price
          ),
          street: property.location.address.street,
          commune: property.location.address.commune ?? '',
          city: property.location.address.city,
          region: REGIONS.includes(property.location.address.region)
            ? property.location.address.region
            : DEFAULT_REGION,
          area: String(property.features.area),
          bedrooms: property.features.bedrooms != null ? String(property.features.bedrooms) : '',
          bathrooms: property.features.bathrooms != null ? String(property.features.bathrooms) : '',
          parkingSpots:
            property.features.parkingSpots != null ? String(property.features.parkingSpots) : '',
          negotiable: property.pricing.isNegotiable,
        })
        setCoords({ lat: property.location.latitude, lng: property.location.longitude })
        setImages(
          property.media.images.map((img) => ({
            file: null,
            previewUrl: img.url,
            existingPath: img.id,
          }))
        )
        originalPathsRef.current = property.media.images.map((img) => img.id)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [editId, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Object URLs leak unless revoked.
  useEffect(
    () => () => {
      imagesRef.current.forEach((img) => URL.revokeObjectURL(img.previewUrl))
    },
    []
  ) // eslint-disable-line react-hooks/exhaustive-deps

  if (notFound) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-background">
        <Lock size={48} className="text-on-surface-variant/40 mb-4" />
        <h2 className="font-headline text-xl font-bold text-on-surface">Propiedad no encontrada</h2>
        <p className="text-on-surface-variant text-sm mt-2">No existe o no es tuya.</p>
        <Link
          href="/dashboard"
          className="mt-6 bg-primary text-on-primary px-6 py-2.5 rounded-xl text-sm font-semibold hover:brightness-110 transition-all"
        >
          Volver al panel
        </Link>
      </div>
    )
  }

  if (editId && (!isAuthenticated || !user)) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-background">
        <Lock size={48} className="text-on-surface-variant/40 mb-4" />
        <h2 className="font-headline text-xl font-bold text-on-surface">
          Inicia sesión para publicar
        </h2>
        <p className="text-on-surface-variant text-sm mt-2">
          Necesitas una cuenta para crear una publicación.
        </p>
        <Link
          href={`/login?next=${encodeURIComponent(`/publicar?edit=${editId}`)}`}
          className="mt-6 bg-primary text-on-primary px-6 py-2.5 rounded-xl text-sm font-semibold hover:brightness-110 transition-all"
        >
          Iniciar sesión
        </Link>
      </div>
    )
  }

  async function addFiles(list: FileList | null) {
    if (!list) return
    const errorsFound: string[] = []
    // Compresión client-side antes de subir (reduce ancho de banda/storage).
    for (const file of Array.from(list)) {
      const problem = validateImageFile(file)
      if (problem) {
        errorsFound.push(problem)
        continue
      }
      const processed = await compressImage(file)
      setImages((prev) => {
        const next = [...prev, { file: processed, previewUrl: URL.createObjectURL(processed) }]
        // Revoke previews of files dropped past the limit.
        next.slice(MAX_IMAGES).forEach((img) => URL.revokeObjectURL(img.previewUrl))
        return next.slice(0, MAX_IMAGES)
      })
    }
    setErrors((e) => ({ ...e, images: errorsFound.length ? errorsFound.join(' · ') : undefined }))
  }

  function removeImage(index: number) {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  function makeMain(index: number) {
    setImages((prev) => [prev[index], ...prev.filter((_, i) => i !== index)])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (currentStep < 4) {
      await continueStep()
      return
    }
    if (!user || !isAuthenticated) {
      setStep(1)
      setAuthPrompt(true)
      return
    }
    if ((!canPublish && !isEditing) || submitting || submitLockRef.current || !draftLoaded) return
    setSubmitError(null)

    const parsed = publishSchema.safeParse(form)
    const newErrors: FieldErrors = {}
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof FieldErrors
        if (!newErrors[key]) newErrors[key] = issue.message
      })
    }
    if (images.length === 0) newErrors.images = 'Agrega al menos una foto'
    Object.assign(newErrors, validatePublishLocation(coords, locationConfirmed))
    setErrors(newErrors)
    if (!parsed.success || Object.keys(newErrors).length) {
      setStep(stepForPublishErrors(newErrors))
      return
    }

    setSubmitting(true)
    submitLockRef.current = true
    let uploaded: PropertyImage[] = []
    try {
      await persistStep(4)
      const located = { latitude: coords!.lat, longitude: coords!.lng }
      // New files get uploaded; existing ones keep their storage path.
      const newFiles = images.filter((i) => i.file).map((i) => i.file as File)
      if (newFiles.length) uploaded = await uploadPropertyImages(user.id, newFiles)
      let uploadIdx = 0
      const finalImages: PropertyImage[] = images.map((img, i) =>
        img.existingPath
          ? { id: img.existingPath, url: img.previewUrl, order: i, isMain: i === 0 }
          : {
              id: uploaded[uploadIdx].id,
              url: uploaded[uploadIdx++].url,
              order: i,
              isMain: i === 0,
            }
      )

      const v = parsed.data
      const isRent = operation === PropertyOperation.RENT
      const data: Partial<Property> = {
        title: v.title,
        description: v.description,
        type,
        operation,
        location: {
          latitude: located.latitude,
          longitude: located.longitude,
          address: {
            street: v.street,
            city: v.city || v.commune,
            commune: v.commune || undefined,
            region: form.region as Property['location']['address']['region'],
            country: 'Chile',
          },
          displayAddress: [v.street, v.commune, v.city].filter(Boolean).join(', '),
        },
        pricing: {
          price: v.price,
          currency: Currency.CLP,
          monthlyRent: isRent ? v.price : undefined,
          isNegotiable: form.negotiable,
        },
        features: {
          area: v.area,
          bedrooms: v.bedrooms,
          bathrooms: v.bathrooms,
          parkingSpots: v.parkingSpots,
        },
        media: { images: finalImages },
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

      if (editId) {
        const updated = await propertyService.updateProperty(editId, data)
        if (!updated) throw new Error('No se pudo actualizar la propiedad')
        // Purge images the user removed from the existing set.
        const keptPaths = new Set(finalImages.map((img) => img.id))
        const removed = originalPathsRef.current.filter((p) => !keptPaths.has(p))
        if (removed.length) {
          void deletePropertyImages(
            removed.map((p) => ({ id: p, url: p, order: 0, isMain: false }))
          ).catch(() => {})
        }
      } else {
        // Create vía ruta server-side (valida JWT + org + cuota en el servidor).
        const clientRequestId = (clientRequestIdRef.current ??= crypto.randomUUID())
        const created = await propertyService.createPropertyServer(
          data,
          user.organizationId,
          clientRequestId
        )
        if (!created.id)
          throw new Error('No recibimos la confirmación de la publicación. Inténtalo nuevamente.')
        await clearPublishDraft().catch(() => {})
        clientRequestIdRef.current = null
        setPublishedId(created.id)
      }
      void refreshUser()
      if (editId) router.push('/dashboard')
    } catch (err) {
      // Roll back orphaned uploads when the insert/update fails.
      if (uploaded.length) void deletePropertyImages(uploaded).catch(() => {})
      setSubmitError(err instanceof Error ? err.message : 'No se pudo publicar la propiedad')
    } finally {
      setSubmitting(false)
      submitLockRef.current = false
    }
  }

  return (
    <div ref={pageScrollRef} className="h-full overflow-y-auto bg-background">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 pb-44 lg:pb-8">
        <Link
          href={isAuthenticated ? '/dashboard' : '/'}
          className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm mb-5"
        >
          <ArrowLeft size={18} /> {isAuthenticated ? 'Volver al panel' : 'Volver al inicio'}
        </Link>

        <div className="mb-7">
          <h1 className="font-headline text-3xl md:text-4xl font-bold text-on-surface tracking-tight">
            {isEditing ? 'Edita tu propiedad' : 'Publica tu propiedad'}
          </h1>
          <p className="text-on-surface-variant mt-1.5">
            {isEditing
              ? 'Actualiza los datos y guarda los cambios.'
              : 'Empieza con lo básico. Tu publicación será visible solo después de completar todas las etapas.'}
          </p>
          <p aria-live="polite" className="mt-4 text-sm font-semibold text-primary">
            Etapa {currentStep} de 4 · {PUBLISH_STEPS[currentStep - 1]}
          </p>
          <ol aria-label="Etapas de publicación" className="mt-3 flex gap-2">
            {PUBLISH_STEPS.map((label, index) => (
              <li
                key={label}
                aria-current={index + 1 === currentStep ? 'step' : undefined}
                className={
                  'h-1.5 flex-1 rounded-full ' +
                  (index + 1 <= currentStep ? 'bg-primary' : 'bg-primary/15')
                }
              >
                <span className="sr-only">{label}</span>
              </li>
            ))}
          </ol>
        </div>

        {!canPublish && !isEditing && (
          <div className="mb-5 flex items-start gap-3 bg-error-container/40 border border-error/40 rounded-xl p-3 text-sm">
            <Lock size={16} className="text-error shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-on-surface">Alcanzaste el límite del plan gratuito</p>
              <p className="text-on-surface-variant text-xs mt-0.5">
                Actualiza a Premium para publicar sin límites.
              </p>
            </div>
          </div>
        )}

        <form id="publicar-form" onSubmit={handleSubmit} className="space-y-5">
          {currentStep === 1 && (
            <>
              <Section step={1} title="Lo básico" desc="Define qué estás publicando">
                {/* Operation */}
                <div>
                  <span className={labelCls}>Operación</span>
                  <div className="flex gap-2">
                    {[PropertyOperation.SALE, PropertyOperation.RENT].map((op) => (
                      <button
                        key={op}
                        type="button"
                        onClick={() => setOperation(op)}
                        className={`flex-1 py-2.5 text-sm font-medium rounded-lg border transition-all ${operation === op ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant/60 text-on-surface-variant hover:border-primary'}`}
                      >
                        {OPERATION_LABELS[op]}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Type */}
                <div>
                  <label className={labelCls} htmlFor="type">
                    Tipo de propiedad
                  </label>
                  <select
                    id="type"
                    value={type}
                    onChange={(e) => setType(e.target.value as PropertyType)}
                    className={selectCls}
                  >
                    {TYPES.map((t) => (
                      <option key={t} value={t}>
                        {PROPERTY_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Input
                    label="Título"
                    placeholder="Ej: Casa luminosa con jardín en Ñuñoa"
                    value={form.title}
                    onChange={(e) => set('title', e.target.value)}
                    required
                  />
                  {errors.title && <p className={errorCls}>{errors.title}</p>}
                </div>
              </Section>
            </>
          )}
          {currentStep === 2 && user && (
            <>
              <Section step={2} title="Ubicación">
                <div>
                  <label className={labelCls} htmlFor="region">
                    Región
                  </label>
                  <select
                    id="region"
                    value={form.region}
                    onChange={(e) => {
                      set('region', e.target.value)
                      set('commune', '')
                      set('city', '')
                      invalidateLocation()
                      setCoords(null)
                    }}
                    className={selectCls}
                  >
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls} htmlFor="commune">
                    Comuna
                  </label>
                  <select
                    id="commune"
                    value={form.commune}
                    onChange={(e) => {
                      set('commune', e.target.value)
                      set('city', '')
                      invalidateLocation()
                      setCoords(null)
                    }}
                    className={selectCls}
                  >
                    <option value="">Selecciona una comuna</option>
                    {communesForRegion(form.region).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls} htmlFor="city">
                    Ciudad / Localidad
                  </label>
                  <select
                    id="city"
                    value={form.city}
                    onChange={(e) => {
                      set('city', e.target.value)
                      invalidateLocation()
                      setCoords(null)
                    }}
                    className={selectCls}
                  >
                    <option value="">Selecciona una ciudad</option>
                    {localitiesForCommune(form.commune).map((c) => (
                      <option key={c} value={c}>
                        {titleCase(c)}
                      </option>
                    ))}
                  </select>
                  {errors.commune && <p className={errorCls}>{errors.commune}</p>}
                </div>

                {/* Address geocoder */}
                <div className="relative">
                  <label className={labelCls} htmlFor="street">
                    Calle y número / referencia
                  </label>
                  <Input
                    id="street"
                    placeholder="Calle y número, o referencia para parcelas"
                    value={form.street}
                    onChange={(e) => handleStreetChange(e.target.value)}
                  />
                  {suggestions.length > 0 && (
                    <ul className="absolute z-20 mt-1 w-full bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-elevated max-h-56 overflow-y-auto">
                      {suggestions.map((s) => (
                        <li key={s.label}>
                          <button
                            type="button"
                            onClick={() => handleMapPick(s.latitude, s.longitude)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-surface-container-highest"
                          >
                            {s.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={searchLocation}
                  loading={locationBusy}
                  disabled={!form.street.trim() && !form.commune}
                >
                  Buscar dirección
                </Button>
                {locationMessage && (
                  <p role="status" className="text-sm text-on-surface-variant">
                    {locationMessage}
                  </p>
                )}
                <div>
                  <h3 className={labelCls}>Ubicación exacta en el mapa</h3>
                  <p className="mb-3 text-sm text-on-surface-variant">
                    Haz clic sobre tu propiedad o arrastra el pin hasta su entrada. También puedes
                    moverlo con las flechas del teclado.
                  </p>
                  <LocationPicker
                    latitude={coords?.lat ?? DEFAULT_MAP_CENTER.latitude}
                    longitude={coords?.lng ?? DEFAULT_MAP_CENTER.longitude}
                    selected={!!coords}
                    onChange={handleMapPick}
                  />
                  {coords && (
                    <div className="mt-3 space-y-3">
                      <p className="text-xs text-on-surface-variant">
                        Latitud {coords.lat.toFixed(6)} · Longitud {coords.lng.toFixed(6)}
                      </p>
                      <button
                        type="button"
                        disabled={locationBusy}
                        onClick={suggestPinAddress}
                        className="text-sm font-medium text-accent underline underline-offset-4 disabled:opacity-50"
                      >
                        Sugerir dirección de este punto
                      </button>
                      {suggestedAddress && (
                        <div className="rounded-lg bg-surface-container p-3 text-sm">
                          <p>{suggestedAddress.label}</p>
                          <p className="mt-1 text-xs text-on-surface-variant">
                            Dirección aproximada. Revisa calle y número antes de usarla.
                          </p>
                          <button
                            type="button"
                            onClick={useSuggestedAddress}
                            className="mt-2 font-semibold text-accent underline underline-offset-4"
                          >
                            Usar dirección sugerida
                          </button>
                        </div>
                      )}
                      <label className="flex items-start gap-2 rounded-lg border border-outline-variant p-3 text-sm text-on-surface">
                        <input
                          type="checkbox"
                          checked={locationConfirmed}
                          onChange={(event) => {
                            setLocationConfirmed(event.target.checked)
                            setErrors((previous) => ({ ...previous, location: undefined }))
                          }}
                          className="mt-0.5 h-4 w-4 accent-[rgb(var(--primary))]"
                        />
                        Aquí está mi propiedad. Este es el punto que se mostrará en el mapa.
                      </label>
                    </div>
                  )}
                  {errors.location && (
                    <p role="alert" className={errorCls}>
                      {errors.location}
                    </p>
                  )}
                </div>
              </Section>
            </>
          )}
          {currentStep === 3 && user && (
            <>
              <Section step={3} title="Detalles y precio">
                <div>
                  <label className={labelCls} htmlFor="desc">
                    Descripción
                  </label>
                  <textarea
                    id="desc"
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    rows={4}
                    placeholder="Describe la propiedad, su entorno y lo que la hace especial..."
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {errors.description && <p className={errorCls}>{errors.description}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="Superficie (m²)"
                      type="number"
                      min="0"
                      placeholder="120"
                      value={form.area}
                      onChange={(e) => set('area', e.target.value)}
                      required
                    />
                    {errors.area && <p className={errorCls}>{errors.area}</p>}
                  </div>
                  <Input
                    label="Estacionamientos"
                    type="number"
                    min="0"
                    placeholder="2"
                    value={form.parkingSpots}
                    onChange={(e) => set('parkingSpots', e.target.value)}
                  />
                  <Input
                    label="Dormitorios"
                    type="number"
                    min="0"
                    placeholder="3"
                    value={form.bedrooms}
                    onChange={(e) => set('bedrooms', e.target.value)}
                  />
                  <Input
                    label="Baños"
                    type="number"
                    min="0"
                    placeholder="2"
                    value={form.bathrooms}
                    onChange={(e) => set('bathrooms', e.target.value)}
                  />
                </div>
                <div>
                  <Input
                    label={
                      operation === PropertyOperation.RENT
                        ? 'Arriendo mensual (CLP)'
                        : 'Precio (CLP)'
                    }
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.price}
                    onChange={(e) => set('price', e.target.value)}
                    required
                  />
                  {errors.price && <p className={errorCls}>{errors.price}</p>}
                </div>
                <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.negotiable}
                    onChange={(e) => set('negotiable', e.target.checked)}
                    className="w-4 h-4 accent-[rgb(var(--primary))]"
                  />
                  Precio negociable
                </label>
              </Section>
            </>
          )}
          {currentStep === 4 && user && (
            <>
              <Section
                step={4}
                title="Fotos y revisión"
                desc={`Sube hasta ${MAX_IMAGES} fotos (JPG, PNG o WebP). La primera es la principal.`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    addFiles(e.target.files)
                    e.target.value = ''
                  }}
                />

                {images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {images.map((img, i) => (
                      <div
                        key={img.previewUrl}
                        className="relative group aspect-square rounded-xl overflow-hidden border border-outline-variant/40"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.previewUrl}
                          alt={`Foto ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {i === 0 ? (
                          <span className="absolute bottom-1 left-1 bg-primary text-on-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Star size={9} /> Principal
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => makeMain(i)}
                            className="absolute bottom-1 left-1 bg-black/55 text-white text-[10px] px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Hacer principal
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          aria-label={`Quitar foto ${i + 1}`}
                          className="absolute top-1 right-1 bg-black/55 text-white rounded-full p-1 hover:bg-error transition-colors"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {images.length < MAX_IMAGES && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-outline-variant/60 rounded-xl py-8 text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
                  >
                    <ImagePlus size={22} />
                    <span className="text-sm font-medium">
                      {images.length ? 'Agregar más fotos' : 'Seleccionar fotos'}
                    </span>
                    <span className="text-xs">
                      {images.length}/{MAX_IMAGES}
                    </span>
                  </button>
                )}
                {errors.images && <p className={errorCls}>{errors.images}</p>}
                <div className="rounded-xl border border-outline-variant/40 p-4 space-y-2 text-sm text-on-surface">
                  <h3 className="font-semibold">Revisa tu publicación</h3>
                  <p>{form.title}</p>
                  <p className="text-on-surface-variant">
                    {OPERATION_LABELS[operation]} · {PROPERTY_TYPE_LABELS[type]} · {form.area} m²
                  </p>
                  <p>{[form.street, form.commune, form.city].filter(Boolean).join(', ')}</p>
                  <p className="font-semibold">
                    {formatPriceShort(Number(form.price), Currency.CLP)}
                  </p>
                  {form.description && (
                    <p className="text-on-surface-variant whitespace-pre-wrap">
                      {form.description}
                    </p>
                  )}
                  <p className="text-xs text-on-surface-variant">
                    Tu propiedad aparecerá en el mapa cuando confirmes la publicación.
                  </p>
                </div>
              </Section>
            </>
          )}
          {submitError && (
            <p role="alert" className="rounded-xl bg-error/10 p-3 text-sm text-error">
              {submitError}
            </p>
          )}
          <div className="fixed bottom-16 inset-x-0 z-40 flex items-center justify-between gap-3 border-t border-outline-variant/40 bg-background/95 p-4 lg:static lg:rounded-xl lg:border lg:mt-6">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="outline"
                disabled={submitting || advancing}
                onClick={() => {
                  setStep((currentStep - 1) as PublishStep)
                  setSubmitError(null)
                }}
              >
                Anterior
              </Button>
            ) : (
              <span className="text-sm text-on-surface-variant">Un paso a la vez</span>
            )}
            <Button
              type="submit"
              loading={submitting || advancing}
              disabled={
                !draftLoaded ||
                authLoading ||
                !!publishedId ||
                (currentStep === 4 && !canPublish && !isEditing)
              }
            >
              {currentStep < 4 ? 'Continuar' : isEditing ? 'Guardar cambios' : 'Publicar propiedad'}
            </Button>
          </div>
        </form>
      </div>

      <PublishAuthPrompt open={authPrompt} onOpenChange={setAuthPrompt} />
      <Dialog
        open={!!publishedId}
        onOpenChange={(open) => {
          if (!open) router.push('/dashboard')
        }}
      >
        <DialogContent>
          <DialogTitle>Publicación exitosa</DialogTitle>
          <DialogDescription className="mt-2">
            Tu propiedad ya está publicada. Puedes verla y compartirla.
          </DialogDescription>
          <Link
            className="mt-6 block rounded-xl bg-primary px-5 py-3 text-center font-semibold text-on-primary"
            href={publishedId ? '/propiedad/' + publishedId : '/dashboard'}
          >
            Ver mi publicación
          </Link>
        </DialogContent>
      </Dialog>

      {submitting && (
        <div className="fixed inset-0 z-50 bg-background/60 flex items-center justify-center p-6">
          <GlowLoader fill label="Publicando tu propiedad…" className="max-w-sm w-full h-auto" />
        </div>
      )}
    </div>
  )
}
