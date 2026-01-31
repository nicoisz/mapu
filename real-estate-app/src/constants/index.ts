/**
 * Application constants
 */

export const APP_CONFIG = {
  name: 'Real Estate Chile',
  version: '1.0.0',
  splashDuration: 2500, // 2.5 seconds
} as const;

export const CHILEAN_REGIONS = [
  'Arica y Parinacota',
  'Tarapacá',
  'Antofagasta',
  'Atacama',
  'Coquimbo',
  'Valparaíso',
  'Metropolitana de Santiago',
  'Libertador General Bernardo O\'Higgins',
  'Maule',
  'Ñuble',
  'Biobío',
  'La Araucanía',
  'Los Ríos',
  'Los Lagos',
  'Aysén del General Carlos Ibáñez del Campo',
  'Magallanes y de la Antártica Chilena',
] as const;

export const MAJOR_CHILEAN_CITIES = [
  'Santiago',
  'Valparaíso',
  'Concepción',
  'La Serena',
  'Antofagasta',
  'Temuco',
  'Rancagua',
  'Talca',
  'Arica',
  'Chillán',
] as const;

export const PROPERTY_TYPES = [
  'house',
  'apartment',
  'land',
] as const;

export const OPERATION_TYPES = [
  'sale',
  'rent',
] as const;

export const USER_TYPES = [
  'individual',
  'agent',
  'company',
] as const;

export const SUBSCRIPTION_TYPES = [
  'free',
  'premium',
] as const;