export enum PropertyType {
  HOUSE      = 'house',
  APARTMENT  = 'apartment',
  LAND       = 'land',
  OFFICE     = 'office',
  COMMERCIAL = 'commercial',
  WAREHOUSE  = 'warehouse',
}

export enum PropertyOperation {
  SALE = 'sale',
  RENT = 'rent',
}

export enum PropertyStatus {
  ACTIVE  = 'active',
  EXPIRED = 'expired',
  SOLD    = 'sold',
  RENTED  = 'rented',
}

export enum Currency {
  CLP = 'CLP',
  USD = 'USD',
}

export enum UserType {
  INDIVIDUAL = 'individual',
  AGENT      = 'agent',
  COMPANY    = 'company',
}

export enum SubscriptionType {
  FREE    = 'free',
  PREMIUM = 'premium',
}

export enum ContactMethod {
  PHONE    = 'phone',
  EMAIL    = 'email',
  WHATSAPP = 'whatsapp',
  SMS      = 'sms',
}

export enum ChileanRegion {
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
