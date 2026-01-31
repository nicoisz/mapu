import { ChileanRegion } from './enums';

/**
 * Basic geographic location with latitude and longitude
 */
export interface Location {
  latitude: number;
  longitude: number;
}

/**
 * Map region with deltas for zoom level
 * Used for map view configuration
 */
export interface Region extends Location {
  latitudeDelta: number;
  longitudeDelta: number;
}

/**
 * Map bounds for filtering properties within visible area
 */
export interface MapBounds {
  northEast: Location;
  southWest: Location;
}

/**
 * Complete address information for Chilean properties
 */
export interface Address {
  street: string;
  number?: string;
  apartment?: string;
  neighborhood?: string;
  city: string;
  commune?: string; // Chilean administrative division
  region: ChileanRegion;
  postalCode?: string;
  country: 'Chile'; // Fixed for Chilean market
}

/**
 * Property location combining coordinates and address
 */
export interface PropertyLocation extends Location {
  address: Address;
  displayAddress?: string; // Formatted address for display
}