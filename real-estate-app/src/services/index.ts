// Services exports for the Chilean Real Estate Mobile App
// This file provides clean imports for all service modules

export { AuthService, authService } from './authService';
export { SessionManager, sessionManager } from './sessionManager';
export { 
  LocationService, 
  locationService, 
  LocationError, 
  LocationErrorType 
} from './locationService';
export { SearchService, searchService } from './searchService';
export { ShareService, SocialPlatform } from './shareService';
export { FavoritesService } from './favoritesService';
export { ContactService } from './contactService';
export { ContactMethod } from '../data/models/enums';
export { PropertyService, propertyService } from './propertyService';

// Re-export types for convenience
export type {
  User,
  AuthResult,
  CreateUserRequest,
  SocialProvider,
  Location,
  Region,
  MapBounds
} from '../data/models';

export type {
  LocationServiceOptions,
  LocationSubscription
} from './locationService';

export type {
  ShareOptions,
  ShareResult
} from './shareService';

export type {
  ContactResult,
  ContactOptions
} from './contactService';