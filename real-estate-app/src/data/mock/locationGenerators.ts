import { Location, Region, MapBounds, ChileanRegion } from '../models';
import { CHILEAN_CITIES, RandomGenerator } from './generators';

/**
 * Major Chilean cities with detailed information
 */
export const MAJOR_CHILEAN_CITIES = [
  {
    name: 'Santiago',
    region: ChileanRegion.METROPOLITANA,
    coordinates: { latitude: -33.4489, longitude: -70.6693 },
    population: 7000000,
    communes: [
      'Las Condes', 'Providencia', 'Ñuñoa', 'La Reina', 'Vitacura', 'Lo Barnechea',
      'Maipú', 'Puente Alto', 'San Miguel', 'La Florida', 'Peñalolén', 'Macul',
      'Santiago Centro', 'Independencia', 'Recoleta', 'Conchalí', 'Huechuraba',
      'Quilicura', 'Renca', 'Cerro Navia', 'Lo Prado', 'Quinta Normal',
      'Estación Central', 'Pedro Aguirre Cerda', 'San Joaquín', 'San Ramón',
      'La Cisterna', 'El Bosque', 'La Pintana', 'San Bernardo', 'Calera de Tango'
    ],
    averagePrice: {
      house: { sale: 180000000, rent: 800000 },
      apartment: { sale: 120000000, rent: 600000 },
      land: { sale: 80000000, rent: 0 },
      office: { sale: 150000000, rent: 1200000 },
      commercial: { sale: 200000000, rent: 1500000 },
      warehouse: { sale: 100000000, rent: 800000 }
    }
  },
  {
    name: 'Valparaíso',
    region: ChileanRegion.VALPARAISO,
    coordinates: { latitude: -33.0472, longitude: -71.6127 },
    population: 300000,
    communes: ['Valparaíso', 'Cerro Alegre', 'Cerro Concepción', 'Plan', 'Almendral'],
    averagePrice: {
      house: { sale: 120000000, rent: 500000 },
      apartment: { sale: 80000000, rent: 400000 },
      land: { sale: 50000000, rent: 0 },
      office: { sale: 100000000, rent: 800000 },
      commercial: { sale: 120000000, rent: 900000 },
      warehouse: { sale: 70000000, rent: 500000 }
    }
  },
  {
    name: 'Viña del Mar',
    region: ChileanRegion.VALPARAISO,
    coordinates: { latitude: -33.0153, longitude: -71.5500 },
    population: 350000,
    communes: ['Viña del Mar', 'Reñaca', 'Con Con', 'Recreo', 'Forestal'],
    averagePrice: {
      house: { sale: 200000000, rent: 900000 },
      apartment: { sale: 150000000, rent: 700000 },
      land: { sale: 100000000, rent: 0 },
      office: { sale: 180000000, rent: 1100000 },
      commercial: { sale: 220000000, rent: 1300000 },
      warehouse: { sale: 90000000, rent: 600000 }
    }
  },
  {
    name: 'Concepción',
    region: ChileanRegion.BIOBIO,
    coordinates: { latitude: -36.8201, longitude: -73.0444 },
    population: 230000,
    communes: ['Concepción', 'Talcahuano', 'San Pedro de la Paz', 'Hualpén', 'Chiguayante'],
    averagePrice: {
      house: { sale: 100000000, rent: 450000 },
      apartment: { sale: 70000000, rent: 350000 },
      land: { sale: 40000000, rent: 0 },
      office: { sale: 80000000, rent: 600000 },
      commercial: { sale: 90000000, rent: 700000 },
      warehouse: { sale: 60000000, rent: 400000 }
    }
  },
  {
    name: 'La Serena',
    region: ChileanRegion.COQUIMBO,
    coordinates: { latitude: -29.9027, longitude: -71.2519 },
    population: 200000,
    communes: ['La Serena', 'Coquimbo', 'Vicuña', 'Paihuano'],
    averagePrice: {
      house: { sale: 90000000, rent: 400000 },
      apartment: { sale: 60000000, rent: 300000 },
      land: { sale: 35000000, rent: 0 },
      office: { sale: 70000000, rent: 500000 },
      commercial: { sale: 80000000, rent: 600000 },
      warehouse: { sale: 50000000, rent: 350000 }
    }
  },
  {
    name: 'Antofagasta',
    region: ChileanRegion.ANTOFAGASTA,
    coordinates: { latitude: -23.6509, longitude: -70.3975 },
    population: 400000,
    communes: ['Antofagasta', 'Mejillones', 'Tocopilla'],
    averagePrice: {
      house: { sale: 130000000, rent: 600000 },
      apartment: { sale: 90000000, rent: 500000 },
      land: { sale: 60000000, rent: 0 },
      office: { sale: 110000000, rent: 800000 },
      commercial: { sale: 140000000, rent: 1000000 },
      warehouse: { sale: 80000000, rent: 550000 }
    }
  },
  {
    name: 'Temuco',
    region: ChileanRegion.ARAUCANIA,
    coordinates: { latitude: -38.7359, longitude: -72.5904 },
    population: 280000,
    communes: ['Temuco', 'Padre Las Casas', 'Vilcún', 'Freire'],
    averagePrice: {
      house: { sale: 85000000, rent: 380000 },
      apartment: { sale: 55000000, rent: 280000 },
      land: { sale: 30000000, rent: 0 },
      office: { sale: 65000000, rent: 450000 },
      commercial: { sale: 75000000, rent: 550000 },
      warehouse: { sale: 45000000, rent: 300000 }
    }
  },
  {
    name: 'Puerto Montt',
    region: ChileanRegion.LOS_LAGOS,
    coordinates: { latitude: -41.4693, longitude: -72.9424 },
    population: 250000,
    communes: ['Puerto Montt', 'Puerto Varas', 'Osorno', 'Frutillar'],
    averagePrice: {
      house: { sale: 95000000, rent: 420000 },
      apartment: { sale: 65000000, rent: 320000 },
      land: { sale: 40000000, rent: 0 },
      office: { sale: 75000000, rent: 500000 },
      commercial: { sale: 85000000, rent: 600000 },
      warehouse: { sale: 55000000, rent: 380000 }
    }
  }
];

/**
 * Premium neighborhoods in major cities
 */
export const PREMIUM_NEIGHBORHOODS = {
  [ChileanRegion.METROPOLITANA]: [
    'Las Condes', 'Vitacura', 'Lo Barnechea', 'Providencia', 'La Reina'
  ],
  [ChileanRegion.VALPARAISO]: [
    'Reñaca', 'Con Con', 'Cerro Alegre', 'Cerro Concepción'
  ],
  [ChileanRegion.BIOBIO]: [
    'San Pedro de la Paz', 'Hualpén'
  ],
  [ChileanRegion.COQUIMBO]: [
    'La Serena Centro', 'Coquimbo'
  ],
  [ChileanRegion.ANTOFAGASTA]: [
    'Antofagasta Norte'
  ],
  [ChileanRegion.ARAUCANIA]: [
    'Temuco Centro'
  ],
  [ChileanRegion.LOS_LAGOS]: [
    'Puerto Varas', 'Frutillar'
  ]
};

/**
 * Generate coordinates within a city's bounds
 */
export function generateCityCoordinates(cityName: string, radiusKm: number = 15): Location {
  const city = MAJOR_CHILEAN_CITIES.find(c => c.name === cityName);
  if (!city) {
    // Default to Santiago if city not found
    return RandomGenerator.randomCoordinate(
      { latitude: -33.4489, longitude: -70.6693 },
      radiusKm
    );
  }
  
  return RandomGenerator.randomCoordinate(city.coordinates, radiusKm);
}

/**
 * Generate map region for a city
 */
export function generateCityRegion(cityName: string, zoomLevel: 'close' | 'medium' | 'far' = 'medium'): Region {
  const city = MAJOR_CHILEAN_CITIES.find(c => c.name === cityName);
  const coordinates = city?.coordinates || { latitude: -33.4489, longitude: -70.6693 };
  
  let delta: number;
  switch (zoomLevel) {
    case 'close':
      delta = 0.01; // Very zoomed in
      break;
    case 'medium':
      delta = 0.05; // Medium zoom
      break;
    case 'far':
      delta = 0.2; // Zoomed out
      break;
  }
  
  return {
    ...coordinates,
    latitudeDelta: delta,
    longitudeDelta: delta
  };
}

/**
 * Generate map bounds for a region
 */
export function generateMapBounds(center: Location, radiusKm: number): MapBounds {
  const radiusDeg = radiusKm / 111; // Approximate conversion km to degrees
  
  return {
    northEast: {
      latitude: center.latitude + radiusDeg,
      longitude: center.longitude + radiusDeg
    },
    southWest: {
      latitude: center.latitude - radiusDeg,
      longitude: center.longitude - radiusDeg
    }
  };
}

/**
 * Get city information by name
 */
export function getCityInfo(cityName: string) {
  return MAJOR_CHILEAN_CITIES.find(city => city.name === cityName);
}

/**
 * Get cities by region
 */
export function getCitiesByRegion(region: ChileanRegion) {
  return MAJOR_CHILEAN_CITIES.filter(city => city.region === region);
}

/**
 * Check if a commune is premium
 */
export function isPremiumNeighborhood(commune: string, region: ChileanRegion): boolean {
  const premiumAreas = (PREMIUM_NEIGHBORHOODS as any)[region] || [];
  return premiumAreas.includes(commune);
}

/**
 * Generate realistic Chilean coordinates
 */
export function generateChileanCoordinates(): Location {
  // Chile bounds: approximately -17.5 to -56 latitude, -66 to -109 longitude
  return {
    latitude: RandomGenerator.randomFloat(-56, -17.5),
    longitude: RandomGenerator.randomFloat(-109, -66)
  };
}

/**
 * Generate coordinates for a specific region
 */
export function generateRegionCoordinates(region: ChileanRegion): Location {
  const regionBounds = {
    [ChileanRegion.ARICA_PARINACOTA]: { latMin: -18.5, latMax: -17.5, lngMin: -70.5, lngMax: -68.5 },
    [ChileanRegion.TARAPACA]: { latMin: -21.5, latMax: -18.5, lngMin: -70.5, lngMax: -68.5 },
    [ChileanRegion.ANTOFAGASTA]: { latMin: -26.0, latMax: -21.5, lngMin: -71.0, lngMax: -67.0 },
    [ChileanRegion.ATACAMA]: { latMin: -29.0, latMax: -26.0, lngMin: -71.5, lngMax: -68.5 },
    [ChileanRegion.COQUIMBO]: { latMin: -32.0, latMax: -29.0, lngMin: -72.0, lngMax: -69.5 },
    [ChileanRegion.VALPARAISO]: { latMin: -33.5, latMax: -32.0, lngMin: -72.0, lngMax: -70.0 },
    [ChileanRegion.METROPOLITANA]: { latMin: -34.0, latMax: -33.0, lngMin: -71.5, lngMax: -70.0 },
    [ChileanRegion.OHIGGINS]: { latMin: -35.0, latMax: -34.0, lngMin: -72.0, lngMax: -70.0 },
    [ChileanRegion.MAULE]: { latMin: -36.5, latMax: -35.0, lngMin: -72.5, lngMax: -70.5 },
    [ChileanRegion.NUBLE]: { latMin: -37.0, latMax: -36.0, lngMin: -73.0, lngMax: -71.0 },
    [ChileanRegion.BIOBIO]: { latMin: -38.5, latMax: -36.5, lngMin: -73.5, lngMax: -71.0 },
    [ChileanRegion.ARAUCANIA]: { latMin: -39.5, latMax: -37.5, lngMin: -73.5, lngMax: -71.0 },
    [ChileanRegion.LOS_RIOS]: { latMin: -40.5, latMax: -39.0, lngMin: -74.0, lngMax: -71.5 },
    [ChileanRegion.LOS_LAGOS]: { latMin: -44.0, latMax: -40.0, lngMin: -74.5, lngMax: -71.0 },
    [ChileanRegion.AYSEN]: { latMin: -49.0, latMax: -44.0, lngMin: -75.0, lngMax: -71.0 },
    [ChileanRegion.MAGALLANES]: { latMin: -56.0, latMax: -48.0, lngMin: -75.0, lngMax: -66.0 }
  };
  
  const bounds = regionBounds[region];
  if (!bounds) {
    return generateChileanCoordinates();
  }
  
  return {
    latitude: RandomGenerator.randomFloat(bounds.latMin, bounds.latMax),
    longitude: RandomGenerator.randomFloat(bounds.lngMin, bounds.lngMax)
  };
}

/**
 * Get distance between two coordinates (Haversine formula)
 */
export function getDistance(coord1: Location, coord2: Location): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
  const dLng = (coord2.longitude - coord1.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find nearest city to coordinates
 */
export function findNearestCity(coordinates: Location): typeof MAJOR_CHILEAN_CITIES[0] {
  let nearestCity = MAJOR_CHILEAN_CITIES[0];
  let minDistance = getDistance(coordinates, nearestCity.coordinates);
  
  for (const city of MAJOR_CHILEAN_CITIES.slice(1)) {
    const distance = getDistance(coordinates, city.coordinates);
    if (distance < minDistance) {
      minDistance = distance;
      nearestCity = city;
    }
  }
  
  return nearestCity;
}

/**
 * Generate properties distributed across Chilean cities
 */
export function generateCityDistribution(totalProperties: number): { [cityName: string]: number } {
  // Population-based distribution
  const cityWeights = {
    'Santiago': 0.45,      // 45% - Major metropolitan area
    'Valparaíso': 0.08,    // 8%
    'Viña del Mar': 0.08,  // 8%
    'Concepción': 0.07,    // 7%
    'Antofagasta': 0.06,   // 6%
    'La Serena': 0.05,     // 5%
    'Temuco': 0.05,        // 5%
    'Puerto Montt': 0.04,  // 4%
    'Other': 0.12          // 12% - Smaller cities
  };
  
  const distribution: { [cityName: string]: number } = {};
  
  for (const [city, weight] of Object.entries(cityWeights)) {
    if (city !== 'Other') {
      distribution[city] = Math.round(totalProperties * weight);
    }
  }
  
  // Distribute remaining properties to other cities
  const assigned = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  const remaining = totalProperties - assigned;
  
  // Add smaller cities
  const smallerCities = ['Iquique', 'Copiapó', 'Ovalle', 'Rancagua', 'Talca', 'Chillán', 'Valdivia', 'Osorno'];
  const perSmallCity = Math.floor(remaining / smallerCities.length);
  
  smallerCities.forEach(city => {
    distribution[city] = perSmallCity;
  });
  
  return distribution;
}

/**
 * Generate realistic property density for map clustering
 */
export function generatePropertyClusters(center: Location, count: number, radiusKm: number = 5): Location[] {
  const clusters: Location[] = [];
  const clusterCount = Math.min(Math.ceil(count / 10), 5); // Max 5 clusters
  
  // Generate cluster centers
  const clusterCenters = Array.from({ length: clusterCount }, () => 
    RandomGenerator.randomCoordinate(center, radiusKm)
  );
  
  // Distribute properties among clusters
  const propertiesPerCluster = Math.floor(count / clusterCount);
  const remainder = count % clusterCount;
  
  clusterCenters.forEach((clusterCenter, index) => {
    const clusterSize = propertiesPerCluster + (index < remainder ? 1 : 0);
    
    for (let i = 0; i < clusterSize; i++) {
      clusters.push(RandomGenerator.randomCoordinate(clusterCenter, 1)); // 1km cluster radius
    }
  });
  
  return clusters;
}