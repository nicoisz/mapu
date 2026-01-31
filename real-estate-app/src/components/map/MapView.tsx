import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Property } from '../../data/models/property';
import { PropertyPin } from './PropertyPin';
import { colors, typography, spacing } from '../../theme';

// Fallback types since react-native-maps is not available
interface Location {
  latitude: number;
  longitude: number;
}

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface MapBounds {
  northEast: Location;
  southWest: Location;
}

interface MapPressEvent {
  coordinate: Location;
}

/**
 * Props for the MapView component
 */
export interface MapViewProps {
  /** Array of properties to display on the map */
  properties?: Property[];
  /** Initial region for the map */
  initialRegion?: Region;
  /** Callback when a property is selected */
  onPropertySelect?: (property: Property) => void;
  /** Callback when map region changes */
  onRegionChange?: (region: Region, bounds: MapBounds) => void;
  /** Callback when map is pressed */
  onMapPress?: (coordinate: Location) => void;
  /** Currently selected property */
  selectedProperty?: Property;
  /** Whether to show user location */
  showUserLocation?: boolean;
  /** Whether to follow user location */
  followUserLocation?: boolean;
  /** Custom style for the map container */
  style?: any;
}

/**
 * Map ref interface for exposed methods
 */
export interface MapViewRef {
  animateToRegion: (region: Region, duration?: number) => void;
  fitToCoordinates: (coordinates: Location[], options?: any) => void;
  centerOnUserLocation: () => void;
  centerOnLocation: (location: Location, animated?: boolean) => void;
  fitToProperties: () => void;
  getCurrentBounds: () => MapBounds;
  getCurrentRegion: () => Region;
  getUserLocation: () => Location | null;
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

// Fallback MapView component
const MapViewFallback: React.FC<{
  properties: Property[];
  onPropertyPress: (property: Property) => void;
  selectedProperty?: Property;
}> = ({ properties, onPropertyPress, selectedProperty }) => (
  <View style={styles.mapFallback} testID="map-view">
    <Text style={styles.mapFallbackTitle}>🗺️ Mapa de Propiedades</Text>
    <Text style={styles.mapFallbackSubtitle}>
      {properties.length > 0 
        ? `${properties.length} propiedades en el área`
        : 'No hay propiedades para mostrar'
      }
    </Text>
    
    {properties.length > 0 && (
      <ScrollView style={styles.propertiesList} showsVerticalScrollIndicator={false}>
        {properties.map((property) => (
          <TouchableOpacity
            key={property.id}
            style={[
              styles.propertyItem,
              selectedProperty?.id === property.id && styles.propertyItemSelected
            ]}
            onPress={() => onPropertyPress(property)}
            activeOpacity={0.7}
          >
            <PropertyPin
              property={property}
              isActive={selectedProperty?.id === property.id}
              onPress={() => onPropertyPress(property)}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    )}
  </View>
);

/**
 * Real Estate MapView Component
 * 
 * A comprehensive map component for displaying properties with interactive features.
 * Includes property pins, user location, region management, and property selection.
 */
export const RealEstateMapView = forwardRef<MapViewRef, MapViewProps>(({
  properties = [],
  initialRegion = DEFAULT_CHILE_REGION,
  onPropertySelect,
  onRegionChange,
  onMapPress,
  selectedProperty,
  showUserLocation = true,
  followUserLocation = false,
  style,
}, ref) => {
  // State management
  const [currentRegion, setCurrentRegion] = useState<Region>(initialRegion);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [visibleProperties, setVisibleProperties] = useState<Property[]>(properties);

  // Update visible properties when properties prop changes
  useEffect(() => {
    setVisibleProperties(properties);
  }, [properties]);

  // Handle property selection
  const handlePropertyPress = useCallback((property: Property) => {
    onPropertySelect?.(property);
  }, [onPropertySelect]);

  // Mock implementations for ref methods
  useImperativeHandle(ref, () => ({
    animateToRegion: (region: Region, duration?: number) => {
      setCurrentRegion(region);
    },
    fitToCoordinates: (coordinates: Location[], options?: any) => {
      // Mock implementation
    },
    centerOnUserLocation: () => {
      // Mock implementation
    },
    centerOnLocation: (location: Location, animated?: boolean) => {
      setCurrentRegion({
        ...location,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    },
    fitToProperties: () => {
      // Mock implementation
    },
    getCurrentBounds: (): MapBounds => ({
      northEast: { latitude: currentRegion.latitude + 0.01, longitude: currentRegion.longitude + 0.01 },
      southWest: { latitude: currentRegion.latitude - 0.01, longitude: currentRegion.longitude - 0.01 },
    }),
    getCurrentRegion: () => currentRegion,
    getUserLocation: () => userLocation,
  }));

  return (
    <View style={[styles.container, style]}>
      <MapViewFallback
        properties={visibleProperties}
        onPropertyPress={handlePropertyPress}
        selectedProperty={selectedProperty}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.xl,
  },
  mapFallbackTitle: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  mapFallbackSubtitle: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  propertiesList: {
    flex: 1,
    width: '100%',
    maxWidth: 400,
  },
  propertyItem: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  propertyItemSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
});