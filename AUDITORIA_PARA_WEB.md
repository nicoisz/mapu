# Auditoría de Real Estate App — Base para Versión Web

> Documento de referencia para recrear la aplicación como webapp. Cubre tipos, interfaces, entidades, flujos de negocio, lógica y estructura.

---

## 1. Estructura de Directorios

```
src/
├── components/
│   ├── common/          # SearchBar, FilterModal, BottomSheet
│   ├── forms/           # Input, Button, SocialButton
│   ├── map/             # RealMapView, MapControls, MiniMap, PropertyPin
│   └── property/        # PropertyCard, PropertyList
├── contexts/            # AuthContext, AppStateContext
├── data/
│   ├── models/          # TypeScript types/interfaces
│   ├── api/             # API client stubs
│   └── mock/            # Generadores de datos mock
├── hooks/               # useAuth, useSearch, useMap, useMapPropertyList
├── navigation/          # AppNavigator, NavigationService, types
├── screens/
│   ├── auth/            # Login, Register
│   ├── home/            # HomeScreen (mapa principal)
│   ├── property/        # Detalle de propiedad
│   ├── dashboard/       # Admin de propiedades del usuario
│   ├── profile/         # Perfil de usuario
│   └── onboarding/      # Flujo de onboarding
├── services/            # Lógica de negocio
├── theme/               # Colores, tipografía, spacing
├── constants/           # Valores estáticos
└── utils/               # Funciones utilitarias
```

---

## 2. Enumeraciones

```typescript
// src/data/models/enums.ts

enum PropertyType {
  HOUSE       = 'house',
  APARTMENT   = 'apartment',
  LAND        = 'land',
  OFFICE      = 'office',
  COMMERCIAL  = 'commercial',
  WAREHOUSE   = 'warehouse',
}

enum PropertyOperation {
  SALE = 'sale',
  RENT = 'rent',
}

enum PropertyStatus {
  ACTIVE  = 'active',
  EXPIRED = 'expired',
  SOLD    = 'sold',
  RENTED  = 'rented',
}

enum Currency {
  CLP = 'CLP',
  USD = 'USD',
}

enum UserType {
  INDIVIDUAL = 'individual',
  AGENT      = 'agent',
  COMPANY    = 'company',
}

enum SubscriptionType {
  FREE    = 'free',
  PREMIUM = 'premium',
}

enum ContactMethod {
  PHONE    = 'phone',
  EMAIL    = 'email',
  WHATSAPP = 'whatsapp',
  SMS      = 'sms',
}

enum ChileanRegion {
  ARICA_PARINACOTA = 'Arica y Parinacota',
  TARAPACA         = 'Tarapacá',
  ANTOFAGASTA      = 'Antofagasta',
  ATACAMA          = 'Atacama',
  COQUIMBO         = 'Coquimbo',
  VALPARAISO       = 'Valparaíso',
  METROPOLITANA    = 'Metropolitana',
  OHIGGINS         = "O'Higgins",
  MAULE            = 'Maule',
  NUBLE            = 'Ñuble',
  BIOBIO           = 'Biobío',
  ARAUCANIA        = 'La Araucanía',
  LOS_RIOS         = 'Los Ríos',
  LOS_LAGOS        = 'Los Lagos',
  AYSEN            = 'Aysén',
  MAGALLANES       = 'Magallanes',
}
```

---

## 3. Interfaces y Tipos

### 3.1 Propiedad

```typescript
// src/data/models/property.ts

interface Address {
  street: string
  number?: string
  apartment?: string
  neighborhood?: string
  city: string
  commune?: string
  region: ChileanRegion
  postalCode?: string
  country: 'Chile'
}

interface PropertyLocation {
  latitude: number
  longitude: number
  address: Address
  displayAddress?: string
}

interface PriceHistoryEntry {
  price: number
  currency: Currency
  date: Date
  changeReason?: string
}

interface PropertyPricing {
  price: number
  currency: Currency
  pricePerSquareMeter?: number
  monthlyRent?: number          // solo para arriendo
  deposit?: number
  maintenanceFee?: number
  propertyTax?: number
  hoaFees?: number
  originalPrice?: number
  priceHistory?: PriceHistoryEntry[]
  isNegotiable: boolean
  minimumPrice?: number
}

interface PropertyFeatures {
  bedrooms?: number
  bathrooms?: number
  halfBathrooms?: number
  area: number                  // m² totales
  builtArea?: number
  lotSize?: number
  parkingSpots?: number
  floors?: number
  yearBuilt?: number
  hasGarden?: boolean
  hasPool?: boolean
  hasGym?: boolean
  hasSecurity?: boolean
  hasElevator?: boolean
  hasBalcony?: boolean
  hasTerrace?: boolean
  hasFireplace?: boolean
  hasAirConditioning?: boolean
  hasHeating?: boolean
  hasWater?: boolean
  hasElectricity?: boolean
  hasGas?: boolean
  hasInternet?: boolean
  petFriendly?: boolean
  furnished?: boolean
  newConstruction?: boolean
}

interface PropertyImage {
  id: string
  url: string
  thumbnailUrl?: string
  caption?: string
  order: number
  isMain: boolean
  room?: string
}

interface PropertyVideo {
  id: string
  url: string
  thumbnailUrl?: string
  duration?: number
}

interface PropertyMedia {
  images: PropertyImage[]
  videos?: PropertyVideo[]
  virtualTour?: string
  floorPlan?: string
}

interface PropertyListing {
  publishedAt: Date
  expiresAt?: Date
  lastUpdated: Date
  views: number
  favorites: number
  inquiries: number
  isPremium: boolean
  isHighlighted: boolean
  isFeatured: boolean
  completenessScore: number     // 0-100
  qualityScore: number          // 0-100
}

interface NearbyPlace {
  name: string
  type: string
  distance: number              // metros
  rating?: number
}

interface Property {
  id: string
  title: string
  description: string
  type: PropertyType
  operation: PropertyOperation
  status: PropertyStatus
  location: PropertyLocation
  pricing: PropertyPricing
  features: PropertyFeatures
  media: PropertyMedia
  ownerId: string
  contact: ContactInfo
  listing: PropertyListing
  tags?: string[]
  nearbyPlaces?: NearbyPlace[]
  propertyId?: string
  legalStatus?: string
  energyRating?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'
}
```

### 3.2 Usuario

```typescript
// src/data/models/user.ts

interface UserSubscription {
  type: SubscriptionType
  startDate: Date
  expiresAt?: Date
  isActive: boolean
  features: string[]
  listingsLimit?: number
  remainingListings?: number
}

interface NotificationPreferences {
  email: boolean
  push: boolean
  sms: boolean
  newProperties: boolean
  priceChanges: boolean
  messages: boolean
}

interface UserPreferences {
  language: 'es' | 'en'
  currency: 'CLP' | 'USD'
  notifications: NotificationPreferences
  searchRadius: number          // km
  mapType: 'standard' | 'satellite' | 'hybrid'
}

interface UserStats {
  totalListings: number
  activeListings: number
  soldProperties: number
  rentedProperties: number
  totalViews: number
  totalContacts: number
  averageResponseTime?: number  // minutos
  rating?: number               // 1-5
  reviewCount?: number
}

interface User {
  id: string
  email: string
  name: string
  avatar?: string
  userType: UserType
  subscription: UserSubscription
  preferences: UserPreferences
  stats: UserStats
  properties: string[]          // IDs de propiedades propias
  savedProperties: string[]     // IDs favoritos
  recentlyViewed: string[]      // IDs vistos recientemente
  contactInfo?: ContactInfo
  companyName?: string
  companyLogo?: string
  licenseNumber?: string
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
  isEmailVerified: boolean
  isPhoneVerified: boolean
  isIdentityVerified: boolean
}
```

### 3.3 Contacto

```typescript
// src/data/models/contact.ts

interface ContactInfo {
  id: string
  name: string
  email?: string
  phone?: string
  whatsapp?: string
  preferredMethod: ContactMethod
  avatar?: string
  isVerified: boolean
  responseTime?: string         // ej: "Responde en ~1 hora"
  languages?: string[]
}
```

### 3.4 Búsqueda y Filtros

```typescript
// src/data/models/search.ts

interface PriceRangeFilter {
  min?: number
  max?: number
  currency: Currency
}

interface AreaRangeFilter {
  min?: number
  max?: number
}

interface BedroomsFilter {
  min?: number
  max?: number
}

interface LocationFilter {
  center: { latitude: number; longitude: number }
  radius: number                // km
}

interface PropertySearchFilters {
  operation?: PropertyOperation
  type?: PropertyType[]
  priceRange?: PriceRangeFilter
  areaRange?: AreaRangeFilter
  bedrooms?: BedroomsFilter
  bathrooms?: BedroomsFilter
  features?: Partial<PropertyFeatures>
  location?: LocationFilter
  tags?: string[]
  isPremium?: boolean
  publishedAfter?: Date
}

interface PropertySearchQuery {
  query?: string                // texto libre
  filters?: PropertySearchFilters
  sortBy?: 'price' | 'date' | 'area' | 'relevance'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

interface SearchSuggestion {
  text: string
  type: 'location' | 'property_type' | 'recent' | 'popular'
  icon?: string
}
```

### 3.5 Resultados de Servicios

```typescript
// src/data/models/results.ts

interface AuthResult {
  success: boolean
  user?: User
  token?: string
  refreshToken?: string
  error?: string
}

interface ContactResult {
  success: boolean
  method: ContactMethod
  message?: string
  error?: string
}

interface ShareResult {
  success: boolean
  platform?: string
  error?: string
}

interface FavoritesStats {
  totalCount: number
  byType: Record<PropertyType, number>
  byOperation: Record<PropertyOperation, number>
  byCity: Record<string, number>
  averagePrice: number
}

interface PropertyMapMarker {
  id: string
  latitude: number
  longitude: number
  price: number
  currency: Currency
  operation: PropertyOperation
  type: PropertyType
  isSelected?: boolean
  isPremium?: boolean
}
```

---

## 4. Servicios — Contratos de API

### 4.1 AuthService

```typescript
interface IAuthService {
  login(email: string, password: string): Promise<AuthResult>
  register(userData: Partial<User> & { password: string }): Promise<AuthResult>
  loginWithSocial(provider: 'google' | 'apple' | 'facebook'): Promise<AuthResult>
  logout(): Promise<void>
  refreshToken(refreshToken: string): Promise<AuthResult>
  updateProfile(userId: string, updates: Partial<User>): Promise<AuthResult>
  getCurrentUser(): User | null
  isAuthenticated(): boolean
}
```

**Reglas de validación:**
- Email: formato válido, no vacío
- Contraseña: mínimo 6 caracteres
- Nombre: mínimo 2 caracteres
- Email único en el sistema

### 4.2 PropertyService

```typescript
interface IPropertyService {
  createProperty(userId: string, data: Partial<Property>): Promise<Property>
  getUserProperties(userId: string): Promise<Property[]>
  getPropertyById(id: string): Promise<Property | null>
  updateProperty(id: string, updates: Partial<Property>): Promise<Property>
  deleteProperty(id: string): Promise<void>
  renewProperty(id: string): Promise<Property>   // extiende 30 días
  searchProperties(query: PropertySearchQuery): Promise<Property[]>
}
```

### 4.3 SearchService

```typescript
interface ISearchService {
  searchProperties(query: PropertySearchQuery): Promise<Property[]>
  getSearchSuggestions(input: string): Promise<SearchSuggestion[]>
  getPopularSearches(): Promise<string[]>
  getRecentSearchTerms(): Promise<string[]>
  parseSearchText(text: string): { cleanText: string; implicitFilters: Partial<PropertySearchFilters> }
  buildSearchQuery(text: string, filters?: PropertySearchFilters): PropertySearchQuery
}
```

**Parseo automático de texto:**
| Entrada | Detecta |
|---|---|
| "casa" / "departamento" / "terreno" | PropertyType |
| "arriendo" / "venta" | PropertyOperation |
| "3 dormitorios" / "3D" | bedrooms |
| "Santiago" / ciudad | city filter |

### 4.4 FavoritesService

```typescript
interface IFavoritesService {
  addToFavorites(property: Property): Promise<boolean>
  removeFromFavorites(propertyId: string): Promise<boolean>
  toggleFavorite(property: Property): Promise<boolean>
  isFavorite(propertyId: string): Promise<boolean>
  getFavoriteIds(): Promise<string[]>
  getFavoriteProperties(): Promise<Property[]>
  getFavoriteCount(): Promise<number>
  getFavoritesStats(): Promise<FavoritesStats>
  clearAllFavorites(): Promise<boolean>
  exportFavorites(): Promise<{ ids: string[]; properties: Property[]; exportDate: Date }>
  importFavorites(data: { ids: string[] }): Promise<boolean>
}
```

### 4.5 ContactService

```typescript
interface IContactService {
  contactProperty(property: Property, options?: { message?: string; preferredMethod?: ContactMethod }): Promise<ContactResult>
  contactViaPhone(contact: ContactInfo): Promise<ContactResult>
  contactViaWhatsApp(contact: ContactInfo, message?: string): Promise<ContactResult>
  contactViaEmail(contact: ContactInfo, message?: string): Promise<ContactResult>
  contactViaSMS(contact: ContactInfo, message?: string): Promise<ContactResult>
  getAvailableContactMethods(contact: ContactInfo): ContactMethod[]
}
```

**Prioridad de método automático:** WhatsApp → Teléfono → Email → SMS

### 4.6 ShareService

```typescript
type SharePlatform = 'whatsapp' | 'facebook' | 'instagram' | 'twitter' | 'email' | 'sms' | 'clipboard'

interface IShareService {
  shareProperty(property: Property, options?: { platform?: SharePlatform; message?: string }): Promise<ShareResult>
  shareToSocialPlatform(property: Property, platform: SharePlatform): Promise<ShareResult>
  buildShareText(property: Property): string
  buildShareUrl(property: Property): string
}
```

---

## 5. Estado Global (Contexts)

### 5.1 AuthContext

```typescript
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

interface AuthContextValue extends AuthState {
  login(email: string, password: string): Promise<AuthResult>
  register(userData: Partial<User> & { password: string }): Promise<AuthResult>
  loginWithSocial(provider: 'google' | 'apple' | 'facebook'): Promise<AuthResult>
  logout(): Promise<void>
  refreshToken(): Promise<AuthResult>
  updateProfile(updates: Partial<User>): Promise<AuthResult>
  clearError(): void
  hasSubscription(type: SubscriptionType): boolean
  hasRemainingListings(): boolean
  getRemainingListings(): number
}
```

### 5.2 AppStateContext

```typescript
type AppFlow = 'onboarding' | 'auth' | 'main'

interface AppState {
  currentFlow: AppFlow
  hasCompletedOnboarding: boolean
  isInitialized: boolean
  isLoading: boolean
  error: string | null
}

interface AppStateContextValue extends AppState {
  completeOnboarding(): Promise<void>
  navigateToAuth(): void
  navigateToMain(): void
  resetAppState(): Promise<void>
  clearError(): void
  isFirstLaunch(): boolean
}
```

**Claves de persistencia (localStorage en web):**
- `@RealEstate:onboarding_completed`
- `@RealEstate:first_launch`
- `@RealEstate:auth_token`
- `@RealEstate:refresh_token`
- `@RealEstate:current_user`
- `@RealEstate:favorites`

---

## 6. Flujos de Negocio

### 6.1 Flujo de Autenticación

```
Inicio de app
  ↓
Verificar onboarding completado (localStorage)
  ├─ No → Onboarding (3-4 slides) → Login/Register
  └─ Sí → Verificar token
              ├─ Token válido → HomeScreen (mapa)
              └─ Token expirado → Refresh → HomeScreen
                                   └─ Error → LoginScreen
```

### 6.2 Flujo de Login

```
LoginScreen
  → email + password
  → Validar formato email
  → Validar password ≥ 6 chars
  → AuthService.login()
  → Éxito: guardar token + user → navegar a Main
  → Error: mostrar mensaje de error
```

### 6.3 Flujo de Registro

```
RegisterScreen
  → nombre, email, password, tipo de usuario
  → Validar todos los campos
  → AuthService.register()
  → Éxito: usuario creado con suscripción FREE
           → guardar token → navegar a Main
  → Error: mostrar mensaje (email duplicado, etc.)
```

### 6.4 Flujo de Descubrimiento de Propiedades

```
HomeScreen (mapa)
  → Cargar propiedades del área visible
  → Mostrar pins/markers con precio
  → Agrupar propiedades cercanas (clustering por zoom)
  → Click en pin → PropertyCard en panel inferior
  → Click en card → PropertyDetailScreen
```

### 6.5 Flujo de Detalle de Propiedad

```
PropertyDetailScreen
  → Carrusel de imágenes (tap para ver en full)
  → Datos principales (precio, tipo, operación)
  → Características (dormitorios, baños, área)
  → Amenidades (pool, gym, seguridad...)
  → Ubicación en mini-mapa
  → Información del contacto
  → Acciones: Favorito, Compartir, Contactar
```

### 6.6 Flujo de Contacto

```
Botón "Contactar"
  ↓
Obtener métodos disponibles del contacto
  ↓
Si hay método preferido → usar ese
Si no → prioridad: WhatsApp > Teléfono > Email > SMS
  ↓
WhatsApp → abrir wa.me/{phone}?text={mensaje}
Teléfono → tel:{phone}
Email → mailto:{email}?subject=...&body=...
SMS → sms:{phone}?body=...
```

### 6.7 Flujo de Búsqueda

```
SearchBar
  → Input de texto
  → Parsear texto implícitamente:
      "casa 3D Santiago arriendo" →
      { type: HOUSE, bedrooms: 3, city: 'Santiago', operation: RENT }
  → Mostrar sugerencias mientras escribe
  → Aplicar filtros explícitos (modal de filtros)
  → Resultados actualizados en tiempo real
```

### 6.8 Flujo de Publicación de Propiedad (vendedor)

```
DashboardScreen
  → Verificar límite de listados (Free: 2-3, Premium: ilimitados)
  → Botón "Nueva Propiedad"
  → Formulario: tipo, operación, precio, área, ubicación
  → Subir imágenes (mínimo 1)
  → Publicar
  → Estado: ACTIVE, expira en 30 días
  → Renovar manualmente o automáticamente (premium)
```

### 6.9 Estados de una Propiedad

```
ACTIVE → (expira) → EXPIRED → (renueva) → ACTIVE
ACTIVE → (vende) → SOLD
ACTIVE → (arrienda) → RENTED
EXPIRED → (elimina) → [borrada]
```

---

## 7. Reglas de Negocio

### 7.1 Suscripciones

| Característica | Free | Premium |
|---|---|---|
| Propiedades publicadas | 2-3 | Ilimitadas |
| Estadísticas | No | Sí |
| Propiedades destacadas | No | Sí |
| Propiedades premium | No | Sí |
| Auto-renovación | No | Sí |

### 7.2 Cálculos

```typescript
// Precio por m²
pricePerSquareMeter = price / features.area

// Precio de visualización
displayPrice = operation === 'rent'
  ? `${pricing.monthlyRent?.toLocaleString()} ${currency}/mes`
  : `${pricing.price.toLocaleString()} ${currency}`

// Días restantes para expirar
remainingDays = Math.ceil((listing.expiresAt - Date.now()) / 86_400_000)

// Score de completitud
completenessScore = (camposCompletos / totalCampos) * 100
```

### 7.3 Clustering de Mapa

- Nivel de zoom < 12: agrupar propiedades en radio de ~500m
- Nivel de zoom 12-14: agrupar en radio de ~200m
- Nivel de zoom > 14: mostrar pins individuales con precio

### 7.4 Validaciones de Propiedad

| Campo | Regla |
|---|---|
| título | Requerido, no vacío |
| descripción | Requerida, no vacía |
| precio | > 0 |
| área | > 0 |
| ubicación | Requiere coordenadas GPS |
| imágenes | Mínimo 1 |

---

## 8. Pantallas (Páginas en Web)

### 8.1 Onboarding (`/onboarding`)
- Slides con características principales de la app
- Botón "Comenzar" al final
- Marca como completado en localStorage

### 8.2 Login (`/login`)
- Input email
- Input password
- Botón login
- Botones de social login (Google, Apple, Facebook)
- Link a registro

### 8.3 Registro (`/register`)
- Input nombre
- Input email
- Input password
- Selector tipo de usuario (Individual, Agente, Empresa)
- Botón registrar

### 8.4 Home / Mapa (`/`)
- Mapa principal con propiedades (pantalla completa)
- SearchBar flotante superior
- Panel inferior con lista de propiedades del área
- Botones de filtro rápido (Venta/Arriendo, Tipo)
- Stats overlay (cantidad de propiedades en vista)

### 8.5 Detalle de Propiedad (`/propiedad/:id`)
- Carrusel de imágenes
- Precio y badge de operación (Venta/Arriendo)
- Título, tipo y ubicación
- Grid de características principales (dormitorios, baños, área, estacionamientos)
- Sección de amenidades
- Mapa pequeño con ubicación exacta
- Card de contacto
- Botones de acción: Favorito, Compartir, Contactar

### 8.6 Búsqueda (`/buscar`)
- Input de búsqueda con parseo inteligente
- Sugerencias en tiempo real
- Búsquedas populares
- Historial reciente
- Resultados en lista/grid
- Filtros avanzados (modal o panel lateral)

### 8.7 Dashboard (`/dashboard`)
- Header con datos del usuario y suscripción
- Barra de progreso de listados restantes (free)
- Lista de propiedades activas
- Lista de propiedades expiradas
- Botón "Nueva propiedad"
- Botón "Upgrade a Premium"

### 8.8 Perfil (`/perfil`)
- Avatar editable
- Datos personales (nombre, email, teléfono, empresa)
- Estado de suscripción
- Estadísticas (vistas, consultas, valoraciones)
- Preferencias (idioma, moneda, notificaciones)
- Botón logout

### 8.9 Favoritos (`/favoritos`)
- Lista de propiedades guardadas
- Stats resumen (precio promedio, tipos)
- Botón para quitar de favoritos

---

## 9. Componentes Principales

### 9.1 PropertyCard
- Imagen principal (thumbnail)
- Badge de operación (Venta/Arriendo)
- Precio formateado
- Título
- Características rápidas (dormitorios, baños, área)
- Ciudad/comuna
- Botón favorito (corazón)

### 9.2 PropertyPin (Mapa)
- Muestra precio abreviado (`$85M`, `$500k`)
- Color distinto si seleccionado
- Tamaño distinto si premium
- Badge de tipo de propiedad

### 9.3 SearchBar
- Input de texto
- Botón de búsqueda
- Botón de filtros
- Indicador de filtros activos (badge con cantidad)

### 9.4 FilterModal / FilterPanel
- Operación: Venta / Arriendo (toggle)
- Tipo de propiedad: checkboxes múltiples
- Rango de precio: slider dual
- Rango de área: slider dual
- Dormitorios: selector (1, 2, 3, 4+)
- Baños: selector
- Amenidades: checkboxes
- Botones: Limpiar / Aplicar

### 9.5 MiniMap
- Mapa estático o interactivo reducido
- Marker de la propiedad
- Zoom fijo

### 9.6 ContactCard
- Avatar del propietario/agente
- Nombre y badge de verificado
- Tiempo de respuesta
- Botones: llamar, WhatsApp, email

---

## 10. Tema Visual

### Colores

```typescript
const colors = {
  primary:    '#0F2A44',   // Azul profundo (navbar, botones principales)
  secondary:  '#4CAF93',   // Verde suave (acentos, éxito)
  accent:     '#FF6B5A',   // Coral (CTA, favoritos activos)
  background: '#FFFFFF',
  surface:    '#F8F9FA',   // Cards, panels
  text: {
    primary:   '#1A1A1A',
    secondary: '#6B7280',
    light:     '#9CA3AF',
  },
  border:     '#E5E7EB',
  success:    '#10B981',
  warning:    '#F59E0B',
  error:      '#EF4444',
}
```

### Tipografía

```typescript
const typography = {
  h1: { size: 28, weight: 700 },
  h2: { size: 22, weight: 700 },
  h3: { size: 18, weight: 600 },
  body1: { size: 16, weight: 400 },
  body2: { size: 14, weight: 400 },
  caption: { size: 12, weight: 400 },
}
```

### Spacing

```typescript
const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
}
```

---

## 11. Constantes

```typescript
const APP_CONFIG = {
  name: 'Real Estate Chile',
  version: '1.0.0',
}

const MAJOR_CITIES = [
  'Santiago', 'Valparaíso', 'Concepción', 'La Serena',
  'Antofagasta', 'Temuco', 'Rancagua', 'Talca',
  'Arica', 'Chillán',
]

// Límites del plan gratuito
const FREE_PLAN_LISTINGS_LIMIT = 3

// Días de vigencia de un listado
const LISTING_EXPIRATION_DAYS = 30

// Radio de búsqueda por defecto
const DEFAULT_SEARCH_RADIUS_KM = 5

// Centro del mapa inicial (Santiago)
const DEFAULT_MAP_CENTER = {
  latitude: -33.4489,
  longitude: -70.6693,
}

// Zoom inicial del mapa
const DEFAULT_MAP_ZOOM = 13
```

---

## 12. Datos de Ejemplo (Mock)

La app incluye un `SampleDataService` que genera datos realistas:

- **Ciudades cubiertas:** Santiago, Valparaíso, Concepción, La Serena, Antofagasta
- **Datasets disponibles:** `development`, `testing`, `demo`, `santiago`, `coastal`
- **Propiedades por dataset:** 10-30 propiedades con todos los campos completos
- **Coordenadas GPS:** Reales para cada ciudad

---

## 13. Mapa de Dependencias para Recrear en Web

| Mobile (React Native) | Web (React) |
|---|---|
| `react-native-maps` | `mapbox-gl` o `@vis.gl/react-google-maps` |
| `@react-navigation/native` | `react-router-dom v6` |
| `@react-navigation/stack` | `react-router-dom` (Routes) |
| `@react-navigation/bottom-tabs` | Navbar con `react-router-dom` |
| `@react-native-async-storage` | `localStorage` / `IndexedDB` |
| `@gorhom/bottom-sheet` | Drawer / Modal (shadcn, radix) |
| `expo-location` | `navigator.geolocation` |
| `expo-image-picker` | `<input type="file">` |
| `View`, `Text`, `Pressable` | `div`, `p`, `button` |
| `StyleSheet` | Tailwind CSS / CSS Modules |
| `FlatList` | `ul` / `div` con `map()` |

---

## 14. Arquitectura Recomendada para la Web

```
src/
├── app/                    # React Router / Next.js pages
│   ├── (auth)/             # Login, Register
│   ├── (main)/             # Home (mapa), Buscar, Favoritos
│   ├── propiedad/[id]/     # Detalle
│   ├── dashboard/          # Admin propiedades
│   └── perfil/             # Perfil de usuario
├── components/
│   ├── map/                # MapView, PropertyPin, MiniMap
│   ├── property/           # PropertyCard, PropertyDetail
│   ├── search/             # SearchBar, FilterPanel
│   ├── auth/               # LoginForm, RegisterForm
│   └── ui/                 # Button, Input, Badge (shadcn/ui)
├── contexts/               # AuthContext, AppStateContext (misma lógica)
├── services/               # Mismos servicios, adaptados a web
├── hooks/                  # useAuth, useSearch, useMap
├── types/                  # Todos los tipos de esta auditoría
├── constants/              # APP_CONFIG, colores, ciudades
└── lib/                    # utils, helpers
```

**Stack recomendado:**
- **Framework:** Next.js 15 (App Router)
- **UI:** Tailwind CSS + shadcn/ui
- **Mapa:** Mapbox GL JS o react-google-maps
- **Estado:** React Context (misma estructura) o Zustand
- **Formularios:** React Hook Form + Zod
- **HTTP:** Fetch API / Axios
