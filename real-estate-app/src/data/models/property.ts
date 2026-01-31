import { PropertyType, PropertyOperation, PropertyStatus, Currency } from './enums';
import { PropertyLocation } from './location';
import { ContactInfo } from './contact';

/**
 * Property features and specifications
 */
export interface PropertyFeatures {
  bedrooms?: number;
  bathrooms?: number;
  halfBathrooms?: number;
  area: number; // in square meters
  builtArea?: number; // in square meters
  lotSize?: number; // in square meters for houses/land
  parkingSpots?: number;
  floors?: number;
  yearBuilt?: number;
  
  // Amenities
  hasGarden?: boolean;
  hasPool?: boolean;
  hasGym?: boolean;
  hasSecurity?: boolean;
  hasElevator?: boolean;
  hasBalcony?: boolean;
  hasTerrace?: boolean;
  hasFireplace?: boolean;
  hasAirConditioning?: boolean;
  hasHeating?: boolean;
  
  // Utilities
  hasWater?: boolean;
  hasElectricity?: boolean;
  hasGas?: boolean;
  hasInternet?: boolean;
  
  // Additional features
  petFriendly?: boolean;
  furnished?: boolean;
  newConstruction?: boolean;
}

/**
 * Property pricing information
 */
export interface PropertyPricing {
  price: number;
  currency: Currency;
  pricePerSquareMeter?: number;
  
  // For rentals
  monthlyRent?: number;
  deposit?: number;
  maintenanceFee?: number;
  
  // Additional costs
  propertyTax?: number;
  hoaFees?: number; // Homeowner association fees
  
  // Pricing history
  originalPrice?: number;
  priceHistory?: PriceHistoryEntry[];
  
  // Negotiation
  isNegotiable: boolean;
  minimumPrice?: number;
}

/**
 * Price history entry for tracking price changes
 */
export interface PriceHistoryEntry {
  price: number;
  currency: Currency;
  date: Date;
  reason?: string; // e.g., "Market adjustment", "Motivated seller"
}

/**
 * Property media (images, videos, virtual tours)
 */
export interface PropertyMedia {
  images: PropertyImage[];
  videos?: PropertyVideo[];
  virtualTour?: string; // URL to virtual tour
  floorPlan?: string; // URL to floor plan image
}

/**
 * Property image with metadata
 */
export interface PropertyImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  order: number;
  isMain: boolean; // Primary image for listings
  room?: string; // e.g., "Living Room", "Kitchen", "Bedroom 1"
}

/**
 * Property video with metadata
 */
export interface PropertyVideo {
  id: string;
  url: string;
  thumbnailUrl?: string;
  title?: string;
  duration?: number; // in seconds
  order: number;
}

/**
 * Property listing metadata
 */
export interface PropertyListing {
  publishedAt: Date;
  expiresAt?: Date;
  lastUpdated: Date;
  views: number;
  favorites: number;
  inquiries: number;
  
  // Premium features
  isPremium: boolean;
  isHighlighted: boolean;
  isFeatured: boolean;
  
  // Listing quality
  completenessScore: number; // 0-100 based on filled fields
  qualityScore: number; // 0-100 based on images, description quality
}

/**
 * Main property interface
 */
export interface Property {
  id: string;
  title: string;
  description: string;
  type: PropertyType;
  operation: PropertyOperation;
  status: PropertyStatus;
  
  // Location and pricing
  location: PropertyLocation;
  pricing: PropertyPricing;
  
  // Property details
  features: PropertyFeatures;
  media: PropertyMedia;
  
  // Contact and ownership
  ownerId: string; // User ID of property owner
  contact: ContactInfo;
  
  // Listing information
  listing: PropertyListing;
  
  // Additional metadata
  tags?: string[]; // e.g., ["luxury", "new", "investment"]
  nearbyPlaces?: NearbyPlace[]; // Schools, hospitals, metro stations
  
  // Legal information
  propertyId?: string; // Official property registration ID
  legalStatus?: string; // e.g., "Clear title", "In process"
  
  // Energy efficiency (Chilean standard)
  energyRating?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
}

/**
 * Nearby places of interest
 */
export interface NearbyPlace {
  name: string;
  type: 'school' | 'hospital' | 'metro' | 'bus' | 'mall' | 'park' | 'restaurant' | 'bank';
  distance: number; // in meters
  walkingTime?: number; // in minutes
}

/**
 * Property creation request
 */
export interface CreatePropertyRequest {
  title: string;
  description: string;
  type: PropertyType;
  operation: PropertyOperation;
  location: PropertyLocation;
  pricing: Omit<PropertyPricing, 'priceHistory'>;
  features: PropertyFeatures;
  images: string[]; // URLs to uploaded images
  tags?: string[];
}

/**
 * Property search filters
 */
export interface PropertySearchFilters {
  operation?: PropertyOperation;
  type?: PropertyType[];
  priceRange?: {
    min: number;
    max: number;
    currency: Currency;
  };
  areaRange?: {
    min: number;
    max: number;
  };
  bedrooms?: {
    min?: number;
    max?: number;
  };
  bathrooms?: {
    min?: number;
    max?: number;
  };
  features?: Partial<PropertyFeatures>;
  location?: {
    center: PropertyLocation;
    radius: number; // in kilometers
  };
  tags?: string[];
  isPremium?: boolean;
  publishedAfter?: Date;
}

/**
 * Property search query
 */
export interface PropertySearchQuery {
  query?: string; // Text search
  filters?: PropertySearchFilters;
  sortBy?: 'price' | 'date' | 'area' | 'relevance';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}