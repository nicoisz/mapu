import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { colors, spacing, typography } from '../../theme';
import { SearchBar } from '../../components/common';
import { MockMapView } from '../../components/map/MockMapView';
import { PropertyPin } from '../../components/map/PropertyPin';
import { PropertyCard } from '../../components/property/PropertyCard';
import { useSearch } from '../../hooks/useSearch';
import { Property } from '../../data/models/property';

const { width, height } = Dimensions.get('window');

export const HomeScreen: React.FC = () => {
  // State
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: -33.4489,
    longitude: -70.6693,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Refs
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = ['15%', '50%', '90%'];

  // Hooks
  const { searchResults, isLoading, search, clearSearch } = useSearch();

  // Load initial properties
  useEffect(() => {
    const loadInitialProperties = async () => {
      try {
        const { sampleDataService } = await import('../../data/mock/sampleDataService');
        const recentProperties = await sampleDataService.getRecentProperties(50);
        setProperties(recentProperties);
      } catch (error) {
        console.error('Error loading initial properties:', error);
      }
    };

    loadInitialProperties();
  }, []);

  // Update properties when search results change
  useEffect(() => {
    if (searchResults.length > 0) {
      setProperties(searchResults);
    } else {
      // Reload initial properties when search is cleared
      const loadInitialProperties = async () => {
        try {
          const { sampleDataService } = await import('../../data/mock/sampleDataService');
          const recentProperties = await sampleDataService.getRecentProperties(50);
          setProperties(recentProperties);
        } catch (error) {
          console.error('Error loading initial properties:', error);
        }
      };
      loadInitialProperties();
    }
  }, [searchResults]);

  // Handle property pin press
  const handlePropertyPress = useCallback((property: Property) => {
    setSelectedProperty(property);
    
    // Center map on selected property
    setMapRegion({
      latitude: property.location.latitude,
      longitude: property.location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });

    // Expand bottom sheet to show property details
    bottomSheetRef.current?.snapToIndex(1);
  }, []);

  // Handle search
  const handleSearch = useCallback((query: any) => {
    search(query);
  }, [search]);

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    clearSearch();
    setSelectedProperty(null);
    bottomSheetRef.current?.snapToIndex(0);
  }, [clearSearch]);

  // Handle center map button
  const handleCenterMap = useCallback(() => {
    setMapRegion({
      latitude: -33.4489,
      longitude: -70.6693,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    });
    setSelectedProperty(null);
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  // Render property pins on map
  const renderPropertyPins = () => {
    return properties.map((property) => (
      <View
        key={property.id}
        style={[
          styles.pinContainer,
          {
            left: width * 0.1 + Math.random() * width * 0.8,
            top: height * 0.2 + Math.random() * height * 0.4,
          }
        ]}
      >
        <PropertyPin
          property={property}
          isActive={selectedProperty?.id === property.id}
          onPress={() => handlePropertyPress(property)}
        />
      </View>
    ));
  };

  // Render bottom sheet content
  const renderBottomSheetContent = () => {
    if (selectedProperty) {
      return (
        <BottomSheetScrollView contentContainerStyle={styles.bottomSheetContent}>
          <PropertyCard
            property={selectedProperty}
            onPress={() => {}}
            style={styles.selectedPropertyCard}
          />
          
          <Text style={styles.nearbyTitle}>Propiedades cercanas</Text>
          {properties
            .filter(p => p.id !== selectedProperty.id)
            .slice(0, 10)
            .map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onPress={() => handlePropertyPress(property)}
                style={styles.nearbyPropertyCard}
              />
            ))}
        </BottomSheetScrollView>
      );
    }

    return (
      <BottomSheetScrollView contentContainerStyle={styles.bottomSheetContent}>
        <Text style={styles.propertiesTitle}>
          {properties.length} propiedades disponibles
        </Text>
        {properties.slice(0, 20).map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            onPress={() => handlePropertyPress(property)}
            style={styles.propertyCard}
          />
        ))}
      </BottomSheetScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Full-Screen Map */}
      <View style={styles.mapContainer}>
        <MockMapView
          style={styles.map}
          region={mapRegion}
          onRegionChangeComplete={setMapRegion}
          showsUserLocation={true}
        >
          {renderPropertyPins()}
        </MockMapView>
      </View>

      {/* Floating Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          onSearch={handleSearch}
          onClear={handleClearSearch}
          isLoading={isLoading}
          onFilterPress={() => {}}
          style={styles.searchBar}
        />
      </View>

      {/* Floating Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleCenterMap}
        >
          <Text style={styles.actionButtonText}>📍</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {}}
        >
          <Text style={styles.actionButtonText}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetIndicator}
      >
        {renderBottomSheetContent()}
      </BottomSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapContainer: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  map: {
    flex: 1,
  },
  pinContainer: {
    position: 'absolute',
    zIndex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: 60,
    left: spacing.md,
    right: spacing.md,
    zIndex: 2,
  },
  searchBar: {
    backgroundColor: colors.background,
    borderRadius: 25,
    shadowColor: colors.text.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButtons: {
    position: 'absolute',
    right: spacing.md,
    bottom: 200,
    zIndex: 2,
  },
  actionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    shadowColor: colors.text.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButtonText: {
    fontSize: 20,
  },
  bottomSheetBackground: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomSheetIndicator: {
    backgroundColor: colors.text.light,
    width: 40,
  },
  bottomSheetContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  propertiesTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  nearbyTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  selectedPropertyCard: {
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  nearbyPropertyCard: {
    marginBottom: spacing.sm,
  },
  propertyCard: {
    marginBottom: spacing.sm,
  },
});