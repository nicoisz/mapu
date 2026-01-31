// Enums for the Chilean Real Estate Mobile App

/**
 * Property types available in the Chilean real estate market
 */
export enum PropertyType {
  HOUSE = 'house',
  APARTMENT = 'apartment',
  LAND = 'land',
  OFFICE = 'office',
  COMMERCIAL = 'commercial',
  WAREHOUSE = 'warehouse'
}

/**
 * Property operations (sale or rent)
 */
export enum PropertyOperation {
  SALE = 'sale',
  RENT = 'rent'
}

/**
 * Property status in the system
 */
export enum PropertyStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  SOLD = 'sold',
  RENTED = 'rented'
}

/**
 * Currency types supported in Chile
 */
export enum Currency {
  CLP = 'CLP', // Chilean Peso
  USD = 'USD'  // US Dollar
}

/**
 * User types in the system
 */
export enum UserType {
  INDIVIDUAL = 'individual',
  AGENT = 'agent',
  COMPANY = 'company'
}

/**
 * Subscription types for the freemium model
 */
export enum SubscriptionType {
  FREE = 'free',
  PREMIUM = 'premium'
}

/**
 * Chilean regions for location filtering
 */
export enum ChileanRegion {
  ARICA_PARINACOTA = 'Arica y Parinacota',
  TARAPACA = 'Tarapacá',
  ANTOFAGASTA = 'Antofagasta',
  ATACAMA = 'Atacama',
  COQUIMBO = 'Coquimbo',
  VALPARAISO = 'Valparaíso',
  METROPOLITANA = 'Metropolitana de Santiago',
  OHIGGINS = 'Libertador General Bernardo O\'Higgins',
  MAULE = 'Maule',
  NUBLE = 'Ñuble',
  BIOBIO = 'Biobío',
  ARAUCANIA = 'La Araucanía',
  LOS_RIOS = 'Los Ríos',
  LOS_LAGOS = 'Los Lagos',
  AYSEN = 'Aysén del General Carlos Ibáñez del Campo',
  MAGALLANES = 'Magallanes y de la Antártica Chilena'
}

/**
 * Contact method preferences
 */
export enum ContactMethod {
  PHONE = 'phone',
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
  SMS = 'sms'
}