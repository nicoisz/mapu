import React, { useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import BottomSheetComponent from '@gorhom/bottom-sheet';
import { RealEstateMapView, type MapViewRef } from '../components/map/MapView';
import { PropertyList } from '../components/property/PropertyList';
import { useMapPropertyList } from '../hooks/useMapPropertyList';
import { generateProperty } from '../data/mock/generators';
import { Property } from '../data/models/property';
import { MapBounds } from '../data/models/location';
import { colors } from '../theme';

/**
 * Demo screen showing integrated map and property list functionality
 * Demonstrates the complete bottom sheet and property list implementation
 */
export const MapPropertyListDemoScreen: React.FC = () => {
  // Refs
  const mapRef = useRef<MapViewRef>(null);
  const bottomSheetRef = useRef<BottomSheetComponent>(null);

  // Mock function to load properties for a region
  const loadPropertiesForRegion = useCallback(async (bounds: MapBounds): Promise<Property[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate mock properties within the bounds
    const properties: Property[] = [];
    const propertyCount = Math.floor(Math.random() * 15) + 5; // 5-20 properties
    
    for (let i = 0; i < propertyCount; i++) {
      const property = generateProperty();
      
      // Adjust property location to be within bounds
      const latRange = bounds.northEast.latitude - bounds.southWest.latitude;
      const lngRange = bounds.northEast.longitude - bounds.southWest.longitude;
      
      property.location.latitude = bounds.southWest.latitude + (Math.random() * latRange);
      property.location.longitude = bounds.southWest.longitude + (Math.random() * lngRange);
      
      properties.push(property);
    }
    
    return properties;
  }, []);

  // Use the integrated map property list hook
  const [state, actions] = useMapPropertyList({
    trackUserLocation: true,
    autoCenter: true,
    onLoadProperties: loadPropertiesForRegion,
  });

  // Handle property selection from map pin
  const handlePropertySelectFromPin = useCallback((property: Property) => {
    actions.onPropertySelectFromPin(property);
    
    // Expand bottom sheet to show property details
    bottomSheetRef.current?.expand();
  }, [actions]);

  // Handle property selection from list
  const handlePropertySelectFromList = useCallback((property: Property) => {
    actions.onPropertySelectFromList(property);
    
    // Center map on selected property
    mapRef.current?.centerOnLocation(property.location, true);
  }, [actions]);

  // Handle map region change
  const handleRegionChange = useCallback((region: any, bounds: MapBounds) => {
    actions.onRegionChange(region, bounds);
  }, [actions]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    actions.refreshProperties();
  }, [actions]);

  // Show error if properties failed to load
  useEffect(() => {
    if (state.propertiesError) {
      Alert.alert(
        'Error',
        `Failed to load properties: ${state.propertiesError}`,
        [
          { text: 'Retry', onPress: handleRefresh },
          { text: 'OK' }
        ]
      );
    }
  }, [state.propertiesError, handleRefresh]);

  return (
    <View style={styles.container}>
      {/* Map View */}
      <RealEstateMapView
        ref={mapRef}
        properties={state.visibleProperties}
        selectedProperty={state.selectedProperty || undefined}
        onPropertySelect={handlePropertySelectFromPin}
        onRegionChange={handleRegionChange}
        showUserLocation={true}
        followUserLocation={false}
        style={styles.map}
      />

      {/* Property List Bottom Sheet */}
      <PropertyList
        ref={bottomSheetRef}
        properties={state.filteredProperties}
        selectedProperty={state.selectedProperty || undefined}
        userLocation={state.userLocation || undefined}
        onPropertySelect={handlePropertySelectFromList}
        onRefresh={handleRefresh}
        isRefreshing={state.isLoadingProperties}
        showDistance={true}
        snapPoints={['20%', '50%', '90%']}
        testID="property-list-bottom-sheet"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  map: {
    flex: 1,
  },
});

export default MapPropertyListDemoScreen;