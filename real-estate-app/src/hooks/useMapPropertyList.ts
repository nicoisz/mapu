import { useState, useCallback, useEffect, useMemo } from 'react';
import { Property } from '../data/models/property';
import { Location, Region, MapBounds } from '../data/models/location';
import { useMap, MapState, MapActions } from './useMap';

/**
 * Interface for map property list state
 */
export interface MapPropertyListState extends MapState {
  /** All available properties */
  allProperties: Property[];
  /** Properties filtered by current map bounds */
  filteredProperties: Property[];
  /** Whether properties are being loaded */
  isLoadingProperties: boolean;
  /** Error message if property loading fails */
  propertiesError: string | null;
}

/**
 * Interface for map property list actions
 */
export interface MapPropertyListActions extends MapActions {
  /** Set all properties */
  setAllProperties: (properties: Property[]) => void;
  /** Refresh properties based on current map region */
  refreshProperties: () => void;
  /** Handle map region change and update filtered properties */
  onRegionChange: (region: Region, bounds?: MapBounds) => void;
  /** Handle property selection from list */
  onPropertySelectFromList: (property: Property) => void;
  /** Handle property selection from map pin */
  onPropertySelectFromPin: (property: Property) => void;
  /** Clear property selection */
  clearPropertySelection: () => void;
}

/**
 * Options for useMapPropertyList hook
 */
export interface UseMapPropertyListOptions {
  /** Initial region for the map */
  initialRegion?: Region;
  /** Whether to track user location */
  trackUserLocation?: boolean;
  /** Whether to auto-center on user location */
  autoCenter?: boolean;
  /** Initial properties to display */
  initialProperties?: Property[];
  /** Callback to load properties for a given region */
  onLoadProperties?: (bounds: MapBounds) => Promise<Property[]>;
  /** Filter function to apply to properties */
  propertyFilter?: (property: Property) => boolean;
}

/**
 * Custom hook for managing map and property list integration
 * Provides synchronized state between map pins and property list
 */
export const useMapPropertyList = (
  options: UseMapPropertyListOptions = {}
): [MapPropertyListState, MapPropertyListActions] => {
  const {
    initialRegion,
    trackUserLocation = false,
    autoCenter = true,
    initialProperties = [],
    onLoadProperties,
    propertyFilter,
  } = options;

  // Use the base map hook
  const [mapState, mapActions] = useMap({
    initialRegion,
    trackUserLocation,
    autoCenter,
  });

  // Additional state for properties
  const [allProperties, setAllProperties] = useState<Property[]>(initialProperties);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);
  const [propertiesError, setPropertiesError] = useState<string | null>(null);

  /**
   * Filter properties based on map bounds and optional filter function
   */
  const filteredProperties = useMemo(() => {
    const bounds = mapActions.getCurrentBounds();
    
    let filtered = allProperties.filter(property => {
      // Check if property is within map bounds
      const { latitude, longitude } = property.location;
      const inBounds = 
        latitude >= bounds.southWest.latitude &&
        latitude <= bounds.northEast.latitude &&
        longitude >= bounds.southWest.longitude &&
        longitude <= bounds.northEast.longitude;
      
      if (!inBounds) return false;
      
      // Apply additional filter if provided
      if (propertyFilter) {
        return propertyFilter(property);
      }
      
      return true;
    });

    return filtered;
  }, [allProperties, mapState.region, propertyFilter, mapActions]);

  /**
   * Load properties for current map region
   */
  const loadPropertiesForRegion = useCallback(async (bounds: MapBounds) => {
    if (!onLoadProperties) return;
    
    setIsLoadingProperties(true);
    setPropertiesError(null);
    
    try {
      const properties = await onLoadProperties(bounds);
      setAllProperties(properties);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load properties';
      setPropertiesError(errorMessage);
      console.error('Failed to load properties:', error);
    } finally {
      setIsLoadingProperties(false);
    }
  }, [onLoadProperties]);

  /**
   * Handle map region change
   */
  const onRegionChange = useCallback((region: Region, bounds?: MapBounds) => {
    mapActions.setRegion(region);
    
    const regionBounds = bounds || mapActions.getCurrentBounds();
    
    // Update visible properties for the map
    mapActions.updateVisibleProperties(allProperties, regionBounds);
    
    // Load new properties if callback is provided
    if (onLoadProperties) {
      loadPropertiesForRegion(regionBounds);
    }
  }, [mapActions, allProperties, onLoadProperties, loadPropertiesForRegion]);

  /**
   * Handle property selection from list
   */
  const onPropertySelectFromList = useCallback((property: Property) => {
    mapActions.setSelectedProperty(property);
    
    // Center map on selected property
    mapActions.centerOnLocation(property.location);
  }, [mapActions]);

  /**
   * Handle property selection from map pin
   */
  const onPropertySelectFromPin = useCallback((property: Property) => {
    mapActions.setSelectedProperty(property);
    // Don't center map when selecting from pin as user is already looking at it
  }, [mapActions]);

  /**
   * Clear property selection
   */
  const clearPropertySelection = useCallback(() => {
    mapActions.setSelectedProperty(null);
  }, [mapActions]);

  /**
   * Refresh properties based on current map region
   */
  const refreshProperties = useCallback(() => {
    const bounds = mapActions.getCurrentBounds();
    loadPropertiesForRegion(bounds);
  }, [mapActions, loadPropertiesForRegion]);

  /**
   * Set all properties and update filtered properties
   */
  const handleSetAllProperties = useCallback((properties: Property[]) => {
    setAllProperties(properties);
    
    // Update visible properties for the map
    const bounds = mapActions.getCurrentBounds();
    mapActions.updateVisibleProperties(properties, bounds);
  }, [mapActions]);

  // Update visible properties when filtered properties change
  useEffect(() => {
    const bounds = mapActions.getCurrentBounds();
    mapActions.updateVisibleProperties(filteredProperties, bounds);
  }, [filteredProperties, mapActions]);

  // Load initial properties if callback is provided
  useEffect(() => {
    if (onLoadProperties && allProperties.length === 0) {
      const bounds = mapActions.getCurrentBounds();
      loadPropertiesForRegion(bounds);
    }
  }, [onLoadProperties, allProperties.length, mapActions, loadPropertiesForRegion]);

  // Combined state
  const state: MapPropertyListState = {
    ...mapState,
    allProperties,
    filteredProperties,
    isLoadingProperties,
    propertiesError,
  };

  // Combined actions
  const actions: MapPropertyListActions = {
    ...mapActions,
    setAllProperties: handleSetAllProperties,
    refreshProperties,
    onRegionChange,
    onPropertySelectFromList,
    onPropertySelectFromPin,
    clearPropertySelection,
  };

  return [state, actions];
};

export default useMapPropertyList;