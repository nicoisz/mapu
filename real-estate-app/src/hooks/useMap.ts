import { useState, useCallback, useRef, useEffect } from 'react';
import { Alert } from 'react-native';
import { Location, MapBounds, Region } from '../data/models/location';
import { Property } from '../data/models/property';
import { locationService, LocationError, LocationErrorType, LocationSubscription } from '../services';

/**
 * Map state interface
 */
export interface MapState {
  region: Region;
  userLocation: Location | null;
  isLoadingLocation: boolean;
  selectedProperty: Property | null;
  visibleProperties: Property[];
}

/**
 * Map actions interface
 */
export interface MapActions {
  setRegion: (region: Region) => void;
  setSelectedProperty: (property: Property | null) => void;
  centerOnUserLocation: () => Promise<void>;
  centerOnLocation: (location: Location) => void;
  updateVisibleProperties: (properties: Property[], bounds: MapBounds) => void;
  getCurrentBounds: () => MapBounds;
  startLocationTracking: () => Promise<void>;
  stopLocationTracking: () => void;
}

/**
 * Options for useMap hook
 */
export interface UseMapOptions {
  initialRegion?: Region;
  trackUserLocation?: boolean;
  autoCenter?: boolean;
}

/**
 * Default region for Chile (Santiago center)
 */
const DEFAULT_CHILE_REGION: Region = {
  latitude: -33.4489,
  longitude: -70.6693,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

/**
 * Custom hook for managing map state and interactions
 * Provides centralized map state management and location services integration
 */
export const useMap = (options: UseMapOptions = {}): [MapState, MapActions] => {
  const {
    initialRegion = DEFAULT_CHILE_REGION,
    trackUserLocation = false,
    autoCenter = true,
  } = options;

  // State
  const [region, setRegion] = useState<Region>(initialRegion);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [visibleProperties, setVisibleProperties] = useState<Property[]>([]);

  // Refs
  const locationSubscription = useRef<LocationSubscription | null>(null);

  /**
   * Calculate map bounds from current region
   */
  const calculateBoundsFromRegion = useCallback((currentRegion: Region): MapBounds => {
    const { latitude, longitude, latitudeDelta, longitudeDelta } = currentRegion;
    
    return {
      northEast: {
        latitude: latitude + latitudeDelta / 2,
        longitude: longitude + longitudeDelta / 2,
      },
      southWest: {
        latitude: latitude - latitudeDelta / 2,
        longitude: longitude - longitudeDelta / 2,
      },
    };
  }, []);

  /**
   * Get current map bounds
   */
  const getCurrentBounds = useCallback((): MapBounds => {
    return calculateBoundsFromRegion(region);
  }, [region, calculateBoundsFromRegion]);

  /**
   * Update region state
   */
  const handleSetRegion = useCallback((newRegion: Region) => {
    setRegion(newRegion);
  }, []);

  /**
   * Center map on user location
   */
  const centerOnUserLocation = useCallback(async (): Promise<void> => {
    if (isLoadingLocation) return;
    
    setIsLoadingLocation(true);
    
    try {
      const location = await locationService.getCurrentLocation({
        timeout: 10000,
        enableHighAccuracy: true,
      });
      
      setUserLocation(location);
      
      if (autoCenter) {
        const newRegion: Region = {
          ...location,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(newRegion);
      }
    } catch (error) {
      if (error instanceof LocationError) {
        let message = 'No se pudo obtener la ubicación';
        
        switch (error.type) {
          case LocationErrorType.PERMISSION_DENIED:
            message = 'Permisos de ubicación denegados. Por favor, habilita los permisos en configuración.';
            break;
          case LocationErrorType.LOCATION_UNAVAILABLE:
            message = 'Servicios de ubicación no disponibles. Verifica que el GPS esté activado.';
            break;
          case LocationErrorType.TIMEOUT:
            message = 'Tiempo de espera agotado al obtener la ubicación.';
            break;
        }
        
        Alert.alert('Error de Ubicación', message);
      }
    } finally {
      setIsLoadingLocation(false);
    }
  }, [isLoadingLocation, autoCenter]);

  /**
   * Center map on specific location
   */
  const centerOnLocation = useCallback((location: Location) => {
    const newRegion: Region = {
      ...location,
      latitudeDelta: region.latitudeDelta,
      longitudeDelta: region.longitudeDelta,
    };
    setRegion(newRegion);
  }, [region]);

  /**
   * Update visible properties based on map bounds
   */
  const updateVisibleProperties = useCallback((
    properties: Property[],
    bounds: MapBounds
  ) => {
    const visible = properties.filter(property =>
      locationService.isLocationInBounds(property.location, bounds)
    );
    setVisibleProperties(visible);
  }, []);

  /**
   * Start tracking user location
   */
  const startLocationTracking = useCallback(async (): Promise<void> => {
    if (locationSubscription.current) return;
    
    try {
      const subscription = await locationService.watchLocation(
        (location) => {
          setUserLocation(location);
          
          if (autoCenter) {
            const newRegion: Region = {
              ...location,
              latitudeDelta: region.latitudeDelta,
              longitudeDelta: region.longitudeDelta,
            };
            setRegion(newRegion);
          }
        },
        {
          enableHighAccuracy: true,
        }
      );
      
      locationSubscription.current = subscription;
    } catch (error) {
      console.error('Failed to start location tracking:', error);
    }
  }, [autoCenter, region]);

  /**
   * Stop tracking user location
   */
  const stopLocationTracking = useCallback(() => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
  }, []);

  // Auto-start location tracking if enabled
  useEffect(() => {
    if (trackUserLocation) {
      startLocationTracking();
    }
    
    return () => {
      stopLocationTracking();
    };
  }, [trackUserLocation, startLocationTracking, stopLocationTracking]);

  // Get initial user location
  useEffect(() => {
    if (autoCenter && !userLocation) {
      centerOnUserLocation();
    }
  }, [autoCenter, userLocation, centerOnUserLocation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLocationTracking();
    };
  }, [stopLocationTracking]);

  const state: MapState = {
    region,
    userLocation,
    isLoadingLocation,
    selectedProperty,
    visibleProperties,
  };

  const actions: MapActions = {
    setRegion: handleSetRegion,
    setSelectedProperty,
    centerOnUserLocation,
    centerOnLocation,
    updateVisibleProperties,
    getCurrentBounds,
    startLocationTracking,
    stopLocationTracking,
  };

  return [state, actions];
};

export default useMap;