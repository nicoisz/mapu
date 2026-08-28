'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Check, ImagePlus, Lock, Star, X } from 'lucide-react'
import { z } from 'zod'
import { useAuthContext } from '@/contexts/AuthContext'
import { propertyService } from '@/services/propertyService'
import {
  uploadPropertyImages,
  validateImageFile,
  deletePropertyImages,
} from '@/services/storageService'
import { geocodeAddress, searchAddress, reverseGeocode, GeocodeSuggestion } from '@/services/geocodingService'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MiniMap } from '@/components/map/MiniMap'
import { LocationPicker } from '@/components/map/LocationPicker'
import { REGIONS, communesForRegion, localitiesForCommune, titleCase } from '@/data/chileanLocations'
import { computePriceZones, findZone, getZoneColor, ZoneCell, ZoneMode } from '@/lib/priceZones'
import { formatPriceShort } from '@/lib/utils'
import { OPERATION_LABELS, PROPERTY_TYPE_LABELS, DEFAULT_MAP_CENTER } from '@/constants'
import {
  ContactMethod,
  Currency,
  PropertyOperation,
  PropertyType,
} from '@/types/enums'
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

const publishSchema = z.object({
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

type FieldErrors = Partial<Record<keyof z.infer<typeof publishSchema> | 'images', string>>

interface PendingImage {
  file: File | null
  previewUrl: string
  /** Storage path of an existing image (edit mode); null for new uploads. */
  existingPath?: string
}

function Section({
  title,
  desc,
  children,
}: {
  title: string
  desc?: string
  children: React.ReactNode
}) {
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
const selectCls =
  'w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary'
const errorCls = 'text-error text-xs mt-1'

export default function PublicarPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const { user, isAuthenticated, hasRemainingListings, refreshUser } = useAuthContext()
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
  const originalPathsRef = useRef<string[]>([])
  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))

  // ── Ubicación: geocoder + pin ───────────────────────────────────
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([])
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Aplica coordenadas y, vía reverse-geocoding, autocompleta dirección/comuna/ciudad.
  async function applyCoords(lat: number, lng: number) {
    setCoords({ lat, lng })
    setSuggestions([])
    const rev = await reverseGeocode(lat, lng)
    if (!rev) return
    setForm((f) => ({
      ...f,
      street: [rev.street, rev.number].filter(Boolean).join(' ') || f.street,
      commune: f.commune || rev.commune || f.commune,
      city: f.city || rev.city || f.city,
    }))
  }

  function handleStreetChange(value: string) {
    set('street', value)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    if (value.trim().length < 3) {
      setSuggestions([])
      return
    }
    searchTimerRef.current = setTimeout(() => {
      void searchAddress(value, { commune: form.commune }).then((res) => setSuggestions(res))
    }, 450)
  }

  function handleMapPick(lat: number, lng: number) {
    void applyCoords(lat, lng)
  }

  // ── Price-zone context for this listing ─────────────────────────
  // Fetch the active catalogue once so we can classify the entered address
  // into economic / mid / premium and warn the seller how their sector sits.
  const [allProps, setAllProps] = useState<Property[]>([])
  const [zoneInfo, setZoneInfo] = useState<{
    lat: number
    lng: number
    cell?: ZoneCell
    mode: ZoneMode
  } | null>(null)
  const [zoneLoading, setZoneLoading] = useState(false)
  const [zoneError, setZoneError] = useState(false)

  useEffect(() => {
    if (!user) return
    let active = true
    propertyService
      .getAll()
      .then((props) => active && setAllProps(props))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const zoneCells = useMemo(() => {
    const mode: ZoneMode = operation === PropertyOperation.RENT ? 'rent' : 'sale'
    return computePriceZones(allProps, mode).cells
  }, [allProps, operation])

  // Debounced live geocoding: as the user fills the address, resolve it to a
  // coordinate and classify the surrounding sector.
  useEffect(() => {
    if (!user || zoneLoading) return
    const hasAddress = form.street.trim() && (form.commune.trim() || form.city.trim())
    if (!hasAddress) {
      setZoneInfo(null)
      return
    }
    setZoneLoading(true)
    setZoneError(false)
    const t = setTimeout(() => {
      geocodeAddress({
        street: form.street,
        commune: form.commune,
        city: form.city,
        region: form.region,
      }).then((coords) => {
        if (!coords) {
          setZoneInfo(null)
          setZoneError(true)
        } else {
          setZoneInfo({
            lat: coords.latitude,
            lng: coords.longitude,
            cell: findZone(zoneCells, coords.latitude, coords.longitude),
            mode: operation === PropertyOperation.RENT ? 'rent' : 'sale',
          })
        }
        setZoneLoading(false)
      })
    }, 700)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.street, form.commune, form.city, form.region, operation])


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
          area: String(property.features.area),          bedrooms: property.features.bedrooms != null ? String(property.features.bedrooms) : '',
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
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl))
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

  if (!isAuthenticated || !user) {
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
          href="/login"
          className="mt-6 bg-primary text-on-primary px-6 py-2.5 rounded-xl text-sm font-semibold hover:brightness-110 transition-all"
        >
          Iniciar sesión
        </Link>
      </div>
    )
  }

  const canPublish = hasRemainingListings()
  const isEditing = !!editId

  function addFiles(list: FileList | null) {
    if (!list) return
    const errorsFound: string[] = []
    const accepted: PendingImage[] = []
    Array.from(list).forEach((file) => {
      const problem = validateImageFile(file)
      if (problem) errorsFound.push(problem)
      else accepted.push({ file, previewUrl: URL.createObjectURL(file) })
    })
    setImages((prev) => {
      const merged = [...prev, ...accepted]
      // Revoke previews of files dropped past the limit.
      merged.slice(MAX_IMAGES).forEach((img) => URL.revokeObjectURL(img.previewUrl))
      return merged.slice(0, MAX_IMAGES)
    })
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
    if (!user || !canPublish || submitting) return
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
    setErrors(newErrors)
    if (!parsed.success || images.length === 0) return

    setSubmitting(true)
    let uploaded: PropertyImage[] = []
    try {
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
      // Prefer the picked pin/geocoder coords; fall back to geocoding the
      // address, then to the Santiago center.
      const picked = coords
        ? { latitude: coords.lat, longitude: coords.lng }
        : await geocodeAddress({
            street: v.street,
            commune: v.commune,
            city: v.city,
            region: form.region,
          })
      const data: Partial<Property> = {
        title: v.title,
        description: v.description,
        type,
        operation,
        location: {
          latitude: picked?.latitude ?? DEFAULT_MAP_CENTER.latitude,
          longitude: picked?.longitude ?? DEFAULT_MAP_CENTER.longitude,
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
        await propertyService.createProperty(user.id, data, user.organizationId)
      }
      void refreshUser()
      router.push('/dashboard')
    } catch (err) {
      // Roll back orphaned uploads when the insert/update fails.
      if (uploaded.length) void deletePropertyImages(uploaded).catch(() => {})
      setSubmitError(err instanceof Error ? err.message : 'No se pudo publicar la propiedad')
      setSubmitting(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm mb-4"
        >
          <ArrowLeft size={18} /> Volver al panel
        </Link>

        <div className="mb-6">
          <h1 className="font-headline text-3xl font-bold text-on-surface">
            {isEditing ? 'Edita tu propiedad' : 'Publica tu propiedad'}
          </h1>
          <p className="text-on-surface-variant mt-1">
            {isEditing
              ? 'Actualiza los datos y guarda los cambios.'
              : 'Completa los datos y aparecerá en el catálogo al instante.'}
          </p>
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <Section title="Lo básico">
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
          </Section>

          <Section title="Ubicación">
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
                Calle y número
              </label>
              <Input
                id="street"
                placeholder="Escribe la dirección… (ej: Av. Irarrázaval 1234)"
                value={form.street}
                onChange={(e) => handleStreetChange(e.target.value)}
              />
              {suggestions.length > 0 && (
                <ul className="absolute z-20 mt-1 w-full bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-elevated max-h-56 overflow-y-auto">
                  {suggestions.map((s) => (
                    <li key={s.label}>
                      <button
                        type="button"
                        onClick={() => applyCoords(s.latitude, s.longitude)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-surface-container-highest"
                      >
                        {s.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Map with draggable pin */}
            {coords && (
              <div>
                <span className={labelCls}>Pin de ubicación</span>
                <LocationPicker
                  latitude={coords.lat}
                  longitude={coords.lng}
                  onChange={handleMapPick}
                />
                <p className="text-xs text-on-surface-variant mt-1.5">
                  Arrastra el pin para ajustar la ubicación exacta.
                </p>
              </div>
            )}

            {/* Sector price context */}
            <div>
              <span className={labelCls}>Contexto del sector</span>
              {!zoneInfo && !zoneLoading && (
                <p className="text-sm text-on-surface-variant bg-surface-container-highest/60 border border-outline-variant/40 rounded-lg px-3 py-2">
                  Ingresa una dirección para ver si el sector está por sobre o bajo la media de
                  precios.
                </p>
              )}
              {zoneLoading && (
                <p className="text-sm text-on-surface-variant bg-surface-container-highest/60 border border-outline-variant/40 rounded-lg px-3 py-2">
                  Buscando el sector…
                </p>
              )}
              {zoneError && !zoneLoading && (
                <p className="text-sm text-error/90 bg-error/10 border border-error/40 rounded-lg px-3 py-2">
                  No pudimos geolocalizar esa dirección. Revisa calle/comuna.
                </p>
              )}
              {zoneInfo && (
                <div className="space-y-3">
                  <div
                    className="rounded-lg px-3 py-2 text-sm border"
                    style={{
                      backgroundColor: zoneInfo.cell
                        ? getZoneColor(zoneInfo.cell.bucket)
                        : 'transparent',
                      borderColor: zoneInfo.cell ? 'transparent' : 'var(--outline-variant)',
                      color: zoneInfo.cell ? '#fff' : 'var(--on-surface-variant)',
                    }}
                  >
                    {zoneInfo.cell ? (
                      <>
                        <span className="font-bold">
                          Sector{' '}
                          {zoneInfo.cell.bucket === 'economic'
                            ? 'económico'
                            : zoneInfo.cell.bucket === 'mid'
                              ? 'de valor medio'
                              : 'premium'}
                        </span>{' '}
                        {zoneInfo.cell.bucket === 'premium' ? (
                          <span>· precio medio {formatPriceShort(zoneInfo.cell.meanPrice, Currency.CLP)} — por sobre la media del mercado.</span>
                        ) : zoneInfo.cell.bucket === 'economic' ? (
                          <span>· precio medio {formatPriceShort(zoneInfo.cell.meanPrice, Currency.CLP)} — por bajo la media del mercado.</span>
                        ) : (
                          <span>· precio medio {formatPriceShort(zoneInfo.cell.meanPrice, Currency.CLP)} — en línea con el mercado.</span>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="font-bold">Sector sin datos</span> · aún no hay
                        propiedades en esta zona para estimar su precio.
                      </>
                    )}
                  </div>
                  <MiniMap
                    latitude={zoneInfo.lat}
                    longitude={zoneInfo.lng}
                    cells={zoneCells}
                    highlightId={zoneInfo.cell?.id}
                  />
                </div>
              )}
            </div>
          </Section>

          <Section title="Características">
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
          </Section>

          <Section title="Precio">
            <div>
              <Input
                label={
                  operation === PropertyOperation.RENT ? 'Arriendo mensual (CLP)' : 'Precio (CLP)'
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

          <Section
            title="Fotos"
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
          </Section>

          {submitError && (
            <div className="bg-error/10 border border-error/40 rounded-xl p-3 text-error text-sm">
              {submitError}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={submitting}
              disabled={!canPublish && !isEditing}
              className="flex-1"
            >
              <Check size={16} />{' '}
              {submitting
                ? 'Subiendo fotos…'
                : isEditing
                  ? 'Guardar cambios'
                  : 'Publicar propiedad'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
