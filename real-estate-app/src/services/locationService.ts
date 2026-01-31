import * as ExpoLocation from 'expo-location';
import { Location, Region, MapBounds } from '../data/models';

/**
 * Location service error types
 */
export enum LocationErrorType {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  LOCATION_UNAVAILABLE = 'LOCATION_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Location service error class
 */
export class LocationError extends Error {
  constructor(
    public type: LocationErrorType,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'LocationError';
  }
}

/**
 * Location service configuration options
 */
export interface LocationServiceOptions {
  timeout?: number; // in milliseconds
  accuracy?: ExpoLocation.LocationAccuracy;
  enableHighAccuracy?: boolean;
}

/**
 * Location watch subscription
 */
export interface LocationSubscription {
  remove: () => void;
}

/**
 * Location service for handling geolocation functionality
 * Provides methods for getting current location, watching location changes,
 * and managing location permissions
 */
export class LocationService {
  private static instance: LocationService;
  private watchSubscriptions: Map<string, ExpoLocation.LocationSubscription> = new Map();
  private defaultOptions: LocationServiceOptions = {
    timeout: 10000, // 10 seconds
    accuracy: ExpoLocation.LocationAccuracy.Balanced,
    enableHighAccuracy: false
  };

  private constructor() {}

  /**
   * Get singleton instance of LocationService
   */
  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Request location permissions from the user
   * @returns Promise<boolean> - true if permissions granted
   */
  public async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      throw new LocationError(
        LocationErrorType.PERMISSION_DENIED,
        'Failed to request location permissions',
        error as Error
      );
    }
  }

  /**
   * Check if location permissions are granted
   * @returns Promise<boolean> - true if permissions are granted
   */
  public async hasPermissions(): Promise<boolean> {
    try {
      const { status } = await ExpoLocation.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current user location
   * @param options - Location service options
   * @returns Promise<Location> - Current location coordinates
   */
  public async getCurrentLocation(options?: LocationServiceOptions): Promise<Location> {
    const config = { ...this.defaultOptions, ...options };

    try {
      // Check permissions first
      const hasPermission = await this.hasPermissions();
      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          throw new LocationError(
            LocationErrorType.PERMISSION_DENIED,
            'Location permission denied by user'
          );
        }
      }

      // Get current location
      const location = await ExpoLocation.getCurrentPositionAsync({
        accuracy: config.accuracy,
        timeInterval: config.timeout,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
    } catch (error) {
      if (error instanceof LocationError) {
        throw error;
      }

      // Handle Expo location errors
      const expoError = error as any;
      if (expoError.code === 'E_LOCATION_UNAVAILABLE') {
        throw new LocationError(
          LocationErrorType.LOCATION_UNAVAILABLE,
          'Location services are disabled or unavailable',
          expoError
        );
      }

      if (expoError.code === 'E_LOCATION_TIMEOUT') {
        throw new LocationError(
          LocationErrorType.TIMEOUT,
          'Location request timed out',
          expoError
        );
      }

      throw new LocationError(
        LocationErrorType.UNKNOWN,
        'Unknown location error occurred',
        expoError
      );
    }
  }

  /**
   * Watch location changes and call callback with updates
   * @param callback - Function to call with location updates
   * @param options - Location service options
   * @returns LocationSubscription - Subscription object with remove method
   */
  public async watchLocation(
    callback: (location: Location) => void,
    options?: LocationServiceOptions
  ): Promise<LocationSubscription> {
    const config = { ...this.defaultOptions, ...options };

    try {
      // Check permissions first
      const hasPermission = await this.hasPermissions();
      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          throw new LocationError(
            LocationErrorType.PERMISSION_DENIED,
            'Location permission denied by user'
          );
        }
      }

      // Start watching location
      const subscription = await ExpoLocation.watchPositionAsync(
        {
          accuracy: config.accuracy,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          callback({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });
        }
      );

      // Store subscription for cleanup
      const subscriptionId = Date.now().toString();
      this.watchSubscriptions.set(subscriptionId, subscription);

      return {
        remove: () => {
          subscription.remove();
          this.watchSubscriptions.delete(subscriptionId);
        }
      };
    } catch (error) {
      if (error instanceof LocationError) {
        throw error;
      }

      throw new LocationError(
        LocationErrorType.UNKNOWN,
        'Failed to start location watching',
        error as Error
      );
    }
  }

  /**
   * Calculate map bounds from center point and radius
   * @param center - Center location
   * @param radiusKm - Radius in kilometers
   * @returns MapBounds - Calculated bounds
   */
  public calculateBounds(center: Location, radiusKm: number): MapBounds {
    // Approximate conversion: 1 degree ≈ 111 km
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos(center.latitude * Math.PI / 180));

    return {
      northEast: {
        latitude: center.latitude + latDelta,
        longitude: center.longitude + lngDelta
      },
      southWest: {
        latitude: center.latitude - latDelta,
        longitude: center.longitude - lngDelta
      }
    };
  }

  /**
   * Calculate distance between two locations in kilometers
   * @param location1 - First location
   * @param location2 - Second location
   * @returns number - Distance in kilometers
   */
  public calculateDistance(location1: Location, location2: Location): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (location2.latitude - location1.latitude) * Math.PI / 180;
    const dLon = (location2.longitude - location1.longitude) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(location1.latitude * Math.PI / 180) * Math.cos(location2.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Check if a location is within map bounds
   * @param location - Location to check
   * @param bounds - Map bounds
   * @returns boolean - true if location is within bounds
   */
  public isLocationInBounds(location: Location, bounds: MapBounds): boolean {
    return (
      location.latitude >= bounds.southWest.latitude &&
      location.latitude <= bounds.northEast.latitude &&
      location.longitude >= bounds.southWest.longitude &&
      location.longitude <= bounds.northEast.longitude
    );
  }

  /**
   * Get default location for Chile (Santiago center)
   * Used as fallback when user location is unavailable
   */
  public getDefaultChileanLocation(): Location {
    return {
      latitude: -33.4489, // Santiago, Chile
      longitude: -70.6693
    };
  }

  /**
   * Clean up all active location subscriptions
   */
  public cleanup(): void {
    this.watchSubscriptions.forEach(subscription => {
      subscription.remove();
    });
    this.watchSubscriptions.clear();
  }
}

// Export singleton instance
export const locationService = LocationService.getInstance();