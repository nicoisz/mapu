// API response types and request interfaces

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: Date;
}

/**
 * API error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string; // For validation errors
}

/**
 * Paginated response for list endpoints
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * File upload response
 */
export interface FileUploadResponse {
  id: string;
  url: string;
  thumbnailUrl?: string;
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

/**
 * Geolocation API response
 */
export interface GeolocationResponse {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
}

/**
 * Map geocoding response
 */
export interface GeocodingResponse {
  address: string;
  latitude: number;
  longitude: number;
  components: {
    street?: string;
    number?: string;
    city?: string;
    region?: string;
    country?: string;
    postalCode?: string;
  };
  confidence: number; // 0-1
}

/**
 * Analytics event for tracking user behavior
 */
export interface AnalyticsEvent {
  event: string;
  userId?: string;
  sessionId: string;
  properties?: Record<string, any>;
  timestamp: Date;
}

/**
 * Push notification payload
 */
export interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
  category?: string;
}