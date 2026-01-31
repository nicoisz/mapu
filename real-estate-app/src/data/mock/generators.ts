import {
  Property,
  User,
  PropertyType,
  PropertyOperation,
  PropertyStatus,
  Currency,
  UserType,
  SubscriptionType,
  ChileanRegion,
  ContactMethod,
  PropertyLocation,
  PropertyFeatures,
  PropertyPricing,
  PropertyMedia,
  PropertyListing,
  ContactInfo,
  UserSubscription,
  UserPreferences,
  UserStats,
  Address,
  Location
} from '../models';

/**
 * Chilean cities with their coordinates and regions
 */
export const CHILEAN_CITIES = [
  // Santiago Metropolitan Region
  { name: 'Santiago', region: ChileanRegion.METROPOLITANA, lat: -33.4489, lng: -70.6693, communes: ['Las Condes', 'Providencia', 'Ñuñoa', 'La Reina', 'Vitacura', 'Lo Barnechea', 'Maipú', 'Puente Alto'] },
  { name: 'Las Condes', region: ChileanRegion.METROPOLITANA, lat: -33.4089, lng: -70.5045, communes: ['Las Condes'] },
  { name: 'Providencia', region: ChileanRegion.METROPOLITANA, lat: -33.4264, lng: -70.6128, communes: ['Providencia'] },
  { name: 'Vitacura', region: ChileanRegion.METROPOLITANA, lat: -33.3928, lng: -70.5447, communes: ['Vitacura'] },
  { name: 'Ñuñoa', region: ChileanRegion.METROPOLITANA, lat: -33.4569, lng: -70.5975, communes: ['Ñuñoa'] },
  
  // Valparaíso Region
  { name: 'Valparaíso', region: ChileanRegion.VALPARAISO, lat: -33.0472, lng: -71.6127, communes: ['Valparaíso', 'Cerro Alegre', 'Cerro Concepción'] },
  { name: 'Viña del Mar', region: ChileanRegion.VALPARAISO, lat: -33.0153, lng: -71.5500, communes: ['Viña del Mar', 'Reñaca', 'Con Con'] },
  
  // Biobío Region
  { name: 'Concepción', region: ChileanRegion.BIOBIO, lat: -36.8201, lng: -73.0444, communes: ['Concepción', 'Talcahuano', 'San Pedro de la Paz'] },
  
  // Coquimbo Region
  { name: 'La Serena', region: ChileanRegion.COQUIMBO, lat: -29.9027, lng: -71.2519, communes: ['La Serena', 'Coquimbo'] },
  
  // Antofagasta Region
  { name: 'Antofagasta', region: ChileanRegion.ANTOFAGASTA, lat: -23.6509, lng: -70.3975, communes: ['Antofagasta'] },
  
  // Araucanía Region
  { name: 'Temuco', region: ChileanRegion.ARAUCANIA, lat: -38.7359, lng: -72.5904, communes: ['Temuco', 'Padre Las Casas'] },
  
  // Los Lagos Region
  { name: 'Puerto Montt', region: ChileanRegion.LOS_LAGOS, lat: -41.4693, lng: -72.9424, communes: ['Puerto Montt', 'Puerto Varas'] },
];

/**
 * Chilean street names for realistic addresses
 */
export const CHILEAN_STREETS = [
  'Avenida Las Condes', 'Avenida Providencia', 'Avenida Apoquindo', 'Avenida Kennedy',
  'Avenida Libertador Bernardo O\'Higgins', 'Avenida Pedro de Valdivia', 'Avenida Irarrázaval',
  'Calle Merced', 'Calle Huérfanos', 'Calle Estado', 'Calle Bandera', 'Calle Ahumada',
  'Avenida Vicuña Mackenna', 'Avenida Grecia', 'Avenida Ñuñoa', 'Avenida Tobalaba',
  'Calle Los Leones', 'Calle Román Díaz', 'Calle General Holley', 'Calle Suecia',
  'Avenida El Bosque Norte', 'Avenida Isidora Goyenechea', 'Avenida Nueva Costanera',
  'Calle Pocuro', 'Calle Seminario', 'Calle Padre Mariano', 'Calle Lyon',
  'Avenida Francisco Bilbao', 'Avenida Salvador', 'Avenida Macul', 'Avenida Quilín'
];

/**
 * Property titles in Spanish for Chilean market
 */
export const PROPERTY_TITLES = {
  [PropertyType.HOUSE]: [
    'Casa en condominio con jardín',
    'Hermosa casa familiar',
    'Casa moderna con piscina',
    'Casa tradicional chilena',
    'Casa con vista panorámica',
    'Casa en sector residencial',
    'Casa pareada con patio',
    'Casa esquina con amplio jardín',
    'Casa remodelada lista para habitar',
    'Casa colonial restaurada'
  ],
  [PropertyType.APARTMENT]: [
    'Departamento con vista al mar',
    'Moderno departamento en torre',
    'Departamento luminoso y amplio',
    'Departamento en edificio nuevo',
    'Departamento con terraza',
    'Departamento amoblado',
    'Departamento en sector céntrico',
    'Departamento con balcón',
    'Departamento de lujo',
    'Departamento con estacionamiento'
  ],
  [PropertyType.LAND]: [
    'Terreno plano listo para construir',
    'Sitio con vista panorámica',
    'Terreno en condominio cerrado',
    'Sitio esquina bien ubicado',
    'Terreno con proyecto aprobado',
    'Sitio en sector residencial',
    'Terreno con acceso pavimentado',
    'Sitio con servicios básicos',
    'Terreno para inversión',
    'Sitio en zona de expansión'
  ],
  [PropertyType.OFFICE]: [
    'Oficina moderna en edificio corporativo',
    'Oficina con vista panorámica',
    'Oficina en sector financiero',
    'Oficina equipada lista para usar',
    'Oficina en edificio inteligente'
  ],
  [PropertyType.COMMERCIAL]: [
    'Local comercial en zona céntrica',
    'Local con gran vitrina',
    'Local en centro comercial',
    'Local esquina con alta visibilidad',
    'Local comercial equipado'
  ],
  [PropertyType.WAREHOUSE]: [
    'Bodega industrial con patio',
    'Bodega con oficinas incluidas',
    'Bodega en parque industrial',
    'Bodega con acceso de camiones',
    'Bodega con sistemas de seguridad'
  ]
};

/**
 * Property descriptions in Spanish
 */
export const PROPERTY_DESCRIPTIONS = [
  'Excelente oportunidad de inversión en una de las mejores zonas de la ciudad.',
  'Propiedad ubicada en sector consolidado con todos los servicios.',
  'Ideal para familia que busca tranquilidad y comodidad.',
  'Perfecta para inversionistas o para vivir.',
  'Ubicación privilegiada cerca de colegios y centros comerciales.',
  'Propiedad en excelente estado de conservación.',
  'Ambiente familiar y seguro, ideal para niños.',
  'Fácil acceso a transporte público y autopistas.',
  'Zona en constante crecimiento y valorización.',
  'Perfecta combinación de ubicación y precio.'
];

/**
 * Chilean names for realistic user profiles
 */
export const CHILEAN_NAMES = {
  first: [
    'María', 'José', 'Carlos', 'Ana', 'Luis', 'Carmen', 'Francisco', 'Isabel',
    'Manuel', 'Rosa', 'Antonio', 'Josefa', 'Pedro', 'Teresa', 'Juan', 'Margarita',
    'Diego', 'Patricia', 'Miguel', 'Claudia', 'Alejandro', 'Mónica', 'Ricardo',
    'Andrea', 'Roberto', 'Paola', 'Fernando', 'Cristina', 'Sergio', 'Verónica'
  ],
  last: [
    'González', 'Muñoz', 'Rojas', 'Díaz', 'Pérez', 'Soto', 'Contreras', 'Silva',
    'Martínez', 'Sepúlveda', 'Morales', 'Rodríguez', 'López', 'Fuentes', 'Hernández',
    'Torres', 'Araya', 'Flores', 'Espinoza', 'Valdés', 'Castillo', 'Tapia',
    'Reyes', 'Gutiérrez', 'Castro', 'Vargas', 'Ortiz', 'Ramírez', 'Sandoval', 'Carrasco'
  ]
};

/**
 * Company names for real estate agencies
 */
export const REAL_ESTATE_COMPANIES = [
  'Inmobiliaria Las Condes',
  'Propiedades Premium Chile',
  'Hogar y Inversión',
  'Chile Properties',
  'Inmobiliaria del Valle',
  'Propiedades Metropolitanas',
  'Inversiones Inmobiliarias Sur',
  'Corredora de Propiedades Norte',
  'Inmobiliaria Cordillera',
  'Propiedades Costeras'
];

/**
 * Utility functions for random generation
 */
export class RandomGenerator {
  static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static randomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  static randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  static randomBoolean(probability: number = 0.5): boolean {
    return Math.random() < probability;
  }

  static randomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }

  static randomPastDate(daysAgo: number): Date {
    const now = new Date();
    const past = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    return this.randomDate(past, now);
  }

  static randomFutureDate(daysFromNow: number): Date {
    const now = new Date();
    const future = new Date(now.getTime() + (daysFromNow * 24 * 60 * 60 * 1000));
    return this.randomDate(now, future);
  }

  static randomEmail(name: string): string {
    const domains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'uc.cl', 'puc.cl'];
    const cleanName = name.toLowerCase().replace(/\s+/g, '.');
    return `${cleanName}@${this.randomChoice(domains)}`;
  }

  static randomPhone(): string {
    // Chilean phone format: +56 9 XXXX XXXX
    const prefix = '+56 9';
    const number = this.randomInt(10000000, 99999999);
    return `${prefix} ${number.toString().substring(0, 4)} ${number.toString().substring(4)}`;
  }

  static randomCoordinate(center: Location, radiusKm: number): Location {
    // Generate random point within radius
    const radiusDeg = radiusKm / 111; // Approximate conversion km to degrees
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radiusDeg;
    
    return {
      latitude: center.latitude + (distance * Math.cos(angle)),
      longitude: center.longitude + (distance * Math.sin(angle))
    };
  }
}

/**
 * Generate realistic Chilean address
 */
export function generateAddress(city?: typeof CHILEAN_CITIES[0]): Address {
  const selectedCity = city || RandomGenerator.randomChoice(CHILEAN_CITIES);
  const street = RandomGenerator.randomChoice(CHILEAN_STREETS);
  const number = RandomGenerator.randomInt(100, 9999).toString();
  const commune = RandomGenerator.randomChoice(selectedCity.communes);
  
  return {
    street,
    number,
    apartment: RandomGenerator.randomBoolean(0.3) ? RandomGenerator.randomInt(1, 20).toString() : undefined,
    neighborhood: RandomGenerator.randomBoolean(0.7) ? `Sector ${RandomGenerator.randomChoice(['Norte', 'Sur', 'Centro', 'Alto', 'Oriente'])}` : undefined,
    city: selectedCity.name,
    commune,
    region: selectedCity.region,
    postalCode: RandomGenerator.randomInt(1000000, 9999999).toString(),
    country: 'Chile'
  };
}

/**
 * Generate property location with coordinates and address
 */
export function generatePropertyLocation(city?: typeof CHILEAN_CITIES[0]): PropertyLocation {
  const selectedCity = city || RandomGenerator.randomChoice(CHILEAN_CITIES);
  const address = generateAddress(selectedCity);
  
  // Generate coordinates near the city center
  const location = RandomGenerator.randomCoordinate(
    { latitude: selectedCity.lat, longitude: selectedCity.lng },
    10 // 10km radius
  );
  
  return {
    ...location,
    address,
    displayAddress: `${address.street} ${address.number}, ${address.commune}, ${address.city}`
  };
}

/**
 * Generate realistic property features
 */
export function generatePropertyFeatures(type: PropertyType): PropertyFeatures {
  const baseFeatures: PropertyFeatures = {
    area: 0,
    hasWater: true,
    hasElectricity: true,
  };

  switch (type) {
    case PropertyType.HOUSE:
      return {
        ...baseFeatures,
        bedrooms: RandomGenerator.randomInt(2, 5),
        bathrooms: RandomGenerator.randomInt(1, 4),
        halfBathrooms: RandomGenerator.randomBoolean(0.3) ? RandomGenerator.randomInt(1, 2) : undefined,
        area: RandomGenerator.randomInt(80, 300),
        builtArea: RandomGenerator.randomInt(60, 250),
        lotSize: RandomGenerator.randomInt(100, 500),
        parkingSpots: RandomGenerator.randomInt(1, 4),
        floors: RandomGenerator.randomInt(1, 3),
        yearBuilt: RandomGenerator.randomInt(1980, 2024),
        hasGarden: RandomGenerator.randomBoolean(0.8),
        hasPool: RandomGenerator.randomBoolean(0.3),
        hasSecurity: RandomGenerator.randomBoolean(0.6),
        hasBalcony: RandomGenerator.randomBoolean(0.4),
        hasTerrace: RandomGenerator.randomBoolean(0.5),
        hasFireplace: RandomGenerator.randomBoolean(0.4),
        hasAirConditioning: RandomGenerator.randomBoolean(0.6),
        hasHeating: RandomGenerator.randomBoolean(0.8),
        hasGas: RandomGenerator.randomBoolean(0.9),
        hasInternet: RandomGenerator.randomBoolean(0.95),
        petFriendly: RandomGenerator.randomBoolean(0.7),
        furnished: RandomGenerator.randomBoolean(0.2),
        newConstruction: RandomGenerator.randomBoolean(0.1)
      };

    case PropertyType.APARTMENT:
      return {
        ...baseFeatures,
        bedrooms: RandomGenerator.randomInt(1, 4),
        bathrooms: RandomGenerator.randomInt(1, 3),
        halfBathrooms: RandomGenerator.randomBoolean(0.2) ? 1 : undefined,
        area: RandomGenerator.randomInt(40, 150),
        builtArea: RandomGenerator.randomInt(35, 140),
        parkingSpots: RandomGenerator.randomInt(0, 2),
        floors: 1,
        yearBuilt: RandomGenerator.randomInt(1990, 2024),
        hasGym: RandomGenerator.randomBoolean(0.4),
        hasSecurity: RandomGenerator.randomBoolean(0.8),
        hasElevator: RandomGenerator.randomBoolean(0.7),
        hasBalcony: RandomGenerator.randomBoolean(0.6),
        hasTerrace: RandomGenerator.randomBoolean(0.3),
        hasAirConditioning: RandomGenerator.randomBoolean(0.5),
        hasHeating: RandomGenerator.randomBoolean(0.9),
        hasGas: RandomGenerator.randomBoolean(0.8),
        hasInternet: RandomGenerator.randomBoolean(0.98),
        petFriendly: RandomGenerator.randomBoolean(0.5),
        furnished: RandomGenerator.randomBoolean(0.4),
        newConstruction: RandomGenerator.randomBoolean(0.2)
      };

    case PropertyType.LAND:
      return {
        ...baseFeatures,
        area: RandomGenerator.randomInt(200, 2000),
        lotSize: RandomGenerator.randomInt(200, 2000),
        hasWater: RandomGenerator.randomBoolean(0.8),
        hasElectricity: RandomGenerator.randomBoolean(0.7),
        hasGas: RandomGenerator.randomBoolean(0.3),
        hasInternet: RandomGenerator.randomBoolean(0.6)
      };

    default:
      return baseFeatures;
  }
}

/**
 * Generate realistic property pricing
 */
export function generatePropertyPricing(
  type: PropertyType,
  operation: PropertyOperation,
  features: PropertyFeatures,
  location: PropertyLocation
): PropertyPricing {
  let basePrice: number;
  
  // Base prices in CLP based on property type and location
  const isExpensiveArea = ['Las Condes', 'Providencia', 'Vitacura', 'Viña del Mar'].includes(location.address.commune || '');
  const multiplier = isExpensiveArea ? 1.5 : 1.0;
  
  switch (type) {
    case PropertyType.HOUSE:
      if (operation === PropertyOperation.SALE) {
        basePrice = RandomGenerator.randomInt(80000000, 400000000) * multiplier; // 80M - 400M CLP
      } else {
        basePrice = RandomGenerator.randomInt(500000, 2000000) * multiplier; // 500K - 2M CLP monthly
      }
      break;
      
    case PropertyType.APARTMENT:
      if (operation === PropertyOperation.SALE) {
        basePrice = RandomGenerator.randomInt(40000000, 200000000) * multiplier; // 40M - 200M CLP
      } else {
        basePrice = RandomGenerator.randomInt(300000, 1200000) * multiplier; // 300K - 1.2M CLP monthly
      }
      break;
      
    case PropertyType.LAND:
      basePrice = RandomGenerator.randomInt(20000000, 150000000) * multiplier; // 20M - 150M CLP
      break;
      
    default:
      basePrice = 50000000;
  }
  
  const pricePerSquareMeter = Math.round(basePrice / features.area);
  
  const pricing: PropertyPricing = {
    price: Math.round(basePrice),
    currency: Currency.CLP,
    pricePerSquareMeter,
    isNegotiable: RandomGenerator.randomBoolean(0.7)
  };
  
  if (operation === PropertyOperation.RENT) {
    pricing.monthlyRent = pricing.price;
    pricing.deposit = Math.round(pricing.price * RandomGenerator.randomFloat(1, 2));
    pricing.maintenanceFee = RandomGenerator.randomBoolean(0.6) ? RandomGenerator.randomInt(50000, 200000) : undefined;
    pricing.price = Math.round(pricing.price * 12 * 15); // Estimate sale price
    // Recalculate price per square meter for the estimated sale price
    pricing.pricePerSquareMeter = Math.round(pricing.price / features.area);
  }
  
  // Additional costs
  if (type !== PropertyType.LAND) {
    pricing.propertyTax = Math.round(basePrice * 0.001); // Approximate 0.1% annual
    pricing.hoaFees = RandomGenerator.randomBoolean(0.4) ? RandomGenerator.randomInt(30000, 150000) : undefined;
  }
  
  // Price history
  if (RandomGenerator.randomBoolean(0.3)) {
    const originalPrice = Math.round(basePrice * RandomGenerator.randomFloat(1.05, 1.3));
    pricing.originalPrice = originalPrice;
    pricing.priceHistory = [
      {
        price: originalPrice,
        currency: Currency.CLP,
        date: RandomGenerator.randomPastDate(90),
        reason: 'Precio inicial'
      },
      {
        price: pricing.price,
        currency: Currency.CLP,
        date: RandomGenerator.randomPastDate(30),
        reason: RandomGenerator.randomChoice(['Ajuste de mercado', 'Vendedor motivado', 'Negociación'])
      }
    ];
  }
  
  if (pricing.isNegotiable) {
    pricing.minimumPrice = Math.round(pricing.price * RandomGenerator.randomFloat(0.85, 0.95));
  }
  
  return pricing;
}

/**
 * Generate property media (images, videos)
 */
export function generatePropertyMedia(type: PropertyType): PropertyMedia {
  const imageCount = RandomGenerator.randomInt(3, 12);
  const images = Array.from({ length: imageCount }, (_, index) => ({
    id: `img_${Date.now()}_${index}`,
    url: `https://picsum.photos/800/600?random=${Date.now() + index}`,
    thumbnailUrl: `https://picsum.photos/200/150?random=${Date.now() + index}`,
    caption: index === 0 ? 'Vista principal' : `Imagen ${index + 1}`,
    order: index,
    isMain: index === 0,
    room: index === 0 ? 'Exterior' : RandomGenerator.randomChoice([
      'Sala de estar', 'Cocina', 'Dormitorio principal', 'Baño', 'Jardín', 'Terraza'
    ])
  }));
  
  const media: PropertyMedia = { images };
  
  // Add video occasionally
  if (RandomGenerator.randomBoolean(0.2)) {
    media.videos = [{
      id: `vid_${Date.now()}`,
      url: `https://example.com/video/${Date.now()}.mp4`,
      thumbnailUrl: `https://picsum.photos/400/300?random=${Date.now()}`,
      title: 'Recorrido virtual',
      duration: RandomGenerator.randomInt(60, 300),
      order: 0
    }];
  }
  
  // Add virtual tour occasionally
  if (RandomGenerator.randomBoolean(0.1)) {
    media.virtualTour = `https://example.com/tour/${Date.now()}`;
  }
  
  // Add floor plan occasionally
  if (type !== PropertyType.LAND && RandomGenerator.randomBoolean(0.3)) {
    media.floorPlan = `https://picsum.photos/600/400?random=${Date.now()}_floorplan`;
  }
  
  return media;
}

/**
 * Generate property listing metadata
 */
export function generatePropertyListing(): PropertyListing {
  const publishedAt = RandomGenerator.randomPastDate(180); // Up to 6 months ago
  const isPremium = RandomGenerator.randomBoolean(0.3);
  
  return {
    publishedAt,
    expiresAt: RandomGenerator.randomBoolean(0.8) ? RandomGenerator.randomFutureDate(30) : undefined,
    lastUpdated: RandomGenerator.randomDate(publishedAt, new Date()),
    views: RandomGenerator.randomInt(0, 500),
    favorites: RandomGenerator.randomInt(0, 50),
    inquiries: RandomGenerator.randomInt(0, 20),
    isPremium,
    isHighlighted: isPremium && RandomGenerator.randomBoolean(0.5),
    isFeatured: isPremium && RandomGenerator.randomBoolean(0.3),
    completenessScore: RandomGenerator.randomInt(70, 100),
    qualityScore: RandomGenerator.randomInt(60, 95)
  };
}

/**
 * Generate contact information
 */
export function generateContactInfo(): ContactInfo {
  const firstName = RandomGenerator.randomChoice(CHILEAN_NAMES.first);
  const lastName = RandomGenerator.randomChoice(CHILEAN_NAMES.last);
  const name = `${firstName} ${lastName}`;
  
  return {
    id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    phone: RandomGenerator.randomPhone(),
    email: RandomGenerator.randomEmail(name),
    preferredMethod: RandomGenerator.randomChoice([ContactMethod.PHONE, ContactMethod.EMAIL, ContactMethod.WHATSAPP]),
    isVerified: RandomGenerator.randomBoolean(0.7),
    responseTime: `Usually responds within ${RandomGenerator.randomInt(15, 240)} minutes`, // 15 minutes to 4 hours
    languages: ['es', ...(RandomGenerator.randomBoolean(0.3) ? ['en'] : [])],
  };
}

/**
 * Generate complete property
 */
export function generateProperty(options?: {
  type?: PropertyType;
  operation?: PropertyOperation;
  city?: typeof CHILEAN_CITIES[0];
}): Property {
  const type = options?.type || RandomGenerator.randomChoice([PropertyType.HOUSE, PropertyType.APARTMENT, PropertyType.LAND]);
  const operation = options?.operation || RandomGenerator.randomChoice([PropertyOperation.SALE, PropertyOperation.RENT]);
  const city = options?.city;
  
  const location = generatePropertyLocation(city);
  const features = generatePropertyFeatures(type);
  const pricing = generatePropertyPricing(type, operation, features, location);
  const media = generatePropertyMedia(type);
  const listing = generatePropertyListing();
  const contact = generateContactInfo();
  
  const title = RandomGenerator.randomChoice(PROPERTY_TITLES[type]);
  const description = RandomGenerator.randomChoice(PROPERTY_DESCRIPTIONS);
  
  return {
    id: `prop_${Date.now()}_${RandomGenerator.randomInt(1000, 9999)}`,
    title,
    description,
    type,
    operation,
    status: RandomGenerator.randomChoice([PropertyStatus.ACTIVE, PropertyStatus.ACTIVE, PropertyStatus.ACTIVE, PropertyStatus.EXPIRED]), // Mostly active
    location,
    pricing,
    features,
    media,
    ownerId: `user_${RandomGenerator.randomInt(1000, 9999)}`,
    contact,
    listing,
    tags: RandomGenerator.randomBoolean(0.5) ? [
      ...RandomGenerator.randomChoice([['nuevo'], ['remodelado'], ['oportunidad'], ['inversión'], ['familiar']]),
      ...(listing.isPremium ? ['premium'] : [])
    ] : undefined,
    nearbyPlaces: RandomGenerator.randomBoolean(0.7) ? [
      {
        name: 'Metro Los Leones',
        type: 'metro' as const,
        distance: RandomGenerator.randomInt(200, 1500),
        walkingTime: RandomGenerator.randomInt(3, 20)
      },
      {
        name: 'Colegio San Patricio',
        type: 'school' as const,
        distance: RandomGenerator.randomInt(300, 2000),
        walkingTime: RandomGenerator.randomInt(5, 25)
      },
      {
        name: 'Mall Plaza',
        type: 'mall' as const,
        distance: RandomGenerator.randomInt(500, 3000),
        walkingTime: RandomGenerator.randomInt(8, 35)
      }
    ] : undefined,
    propertyId: RandomGenerator.randomBoolean(0.8) ? `${RandomGenerator.randomInt(100000, 999999)}-${RandomGenerator.randomInt(10, 99)}` : undefined,
    legalStatus: RandomGenerator.randomChoice(['Título saneado', 'En proceso', 'Regularización pendiente']),
    energyRating: RandomGenerator.randomBoolean(0.6) ? RandomGenerator.randomChoice(['A', 'B', 'C', 'D', 'E'] as const) : undefined
  };
}