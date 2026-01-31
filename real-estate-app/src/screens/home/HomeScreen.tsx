import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../navigation/types';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { colors, spacing, typography } from '../../theme';
import { SearchBar } from '../../components/common';
import { RealMapView } from '../../components/map/RealMapView';
import { PropertyPin } from '../../components/map/PropertyPin';
import { PropertyCard } from '../../components/property/PropertyCard';
import { useSearch } from '../../hooks/useSearch';
import { Property } from '../../data/models/property';
import { Marker } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

export const HomeScreen: React.FC = () => {
  // Navigation
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // State
  const [properties, setProperties] = useState<Property[]>([]);
  const [visibleProperties, setVisibleProperties] = useState<Property[]>([]);
  const [bottomSheetIndex, setBottomSheetIndex] = useState(0);
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

  // Clustering and filtering functions
  const isPropertyInRegion = useCallback((property: Property, region: typeof mapRegion) => {
    const latMin = region.latitude - region.latitudeDelta / 2;
    const latMax = region.latitude + region.latitudeDelta / 2;
    const lngMin = region.longitude - region.longitudeDelta / 2;
    const lngMax = region.longitude + region.longitudeDelta / 2;
    
    return (
      property.location.latitude >= latMin &&
      property.location.latitude <= latMax &&
      property.location.longitude >= lngMin &&
      property.location.longitude <= lngMax
    );
  }, []);

  const clusterProperties = useCallback((properties: Property[], region: typeof mapRegion) => {
    // Simple clustering based on zoom level
    const zoomLevel = 1 / Math.max(region.latitudeDelta, region.longitudeDelta);
    const clusterDistance = zoomLevel > 50 ? 0.001 : zoomLevel > 20 ? 0.005 : 0.01;
    
    const clusters: Property[] = [];
    const processed = new Set<string>();
    
    properties.forEach(property => {
      if (processed.has(property.id)) return;
      
      // Find nearby properties to cluster
      const nearbyProperties = properties.filter(p => {
        if (processed.has(p.id) || p.id === property.id) return false;
        
        const distance = Math.sqrt(
          Math.pow(p.location.latitude - property.location.latitude, 2) +
          Math.pow(p.location.longitude - property.location.longitude, 2)
        );
        
        return distance < clusterDistance;
      });
      
      if (nearbyProperties.length > 0) {
        // Create cluster representative (use the property with lowest price)
        const clusterProperties = [property, ...nearbyProperties];
        const representative = clusterProperties.reduce((min, p) => 
          p.pricing.price < min.pricing.price ? p : min
        );
        
        // Mark all as processed
        clusterProperties.forEach(p => processed.add(p.id));
        
        // Add cluster info to representative
        (representative as any).clusterSize = clusterProperties.length;
        clusters.push(representative);
      } else {
        processed.add(property.id);
        clusters.push(property);
      }
    });
    
    return clusters;
  }, []);

  // Update visible properties when region or properties change (simplified)
  useEffect(() => {
    // For now, show all properties to test basic functionality
    setVisibleProperties(properties.slice(0, 20)); // Limit to 20 for performance
  }, [properties]);

  // Load initial properties
  useEffect(() => {
    const loadInitialProperties = async () => {
      try {
        const { sampleDataService } = await import('../../data/mock/sampleDataService');
        // Don't reinitialize, the service is already initialized
        const recentProperties = await sampleDataService.getRecentProperties(50);
        console.log('🏠 Loaded properties:', recentProperties.length);
        console.log('🔍 First few property coordinates:', recentProperties.slice(0, 3).map(p => ({ 
          id: p.id, 
          title: p.title,
          lat: p.location.latitude,
          lng: p.location.longitude,
          city: p.location.address.city
        })));
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
          // Don't reinitialize, use existing data
          const recentProperties = await sampleDataService.getRecentProperties(50);
          setProperties(recentProperties);
        } catch (error) {
          console.error('Error loading initial properties:', error);
        }
      };
      loadInitialProperties();
    }
  }, [searchResults]);

  // Handle property pin press - Navigate directly to property details
  const handlePropertyPress = useCallback((property: Property) => {
    console.log('🔥 Pin pressed for property:', {
      id: property.id,
      title: property.title,
      type: typeof property.id,
      length: property.id.length,
      clusterSize: (property as any).clusterSize
    });
    
    // If it's a cluster, show properties in bottom sheet
    if ((property as any).clusterSize > 1) {
      setSelectedProperty(property);
      bottomSheetRef.current?.snapToIndex(1);
      return;
    }
    
    try {
      console.log('🚀 Navigating to PropertyDetail with ID:', property.id);
      navigation.navigate('PropertyDetail', { propertyId: property.id });
      console.log('✅ Navigation called successfully');
    } catch (error) {
      console.error('❌ Navigation error:', error);
    }
  }, [navigation]);

  // Handle map region changes
  const handleRegionChange = useCallback((region: typeof mapRegion) => {
    // Don't update state during dragging to avoid conflicts
    // setMapRegion(region);
  }, []);

  const handleRegionChangeComplete = useCallback((region: typeof mapRegion) => {
    // Only update state when the user finishes moving the map
    setMapRegion(region);
    console.log('🗺️ Map region changed:', {
      center: `${region.latitude.toFixed(4)}, ${region.longitude.toFixed(4)}`,
      zoom: `${region.latitudeDelta.toFixed(4)} x ${region.longitudeDelta.toFixed(4)}`
    });
  }, []);

  // Handle search
  const handleSearch = useCallback((query: any) => {
    search(query);
  }, [search]);

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    clearSearch();
    bottomSheetRef.current?.snapToIndex(0);
  }, [clearSearch]);

  // Handle bottom sheet changes
  const handleBottomSheetChange = useCallback((index: number) => {
    setBottomSheetIndex(index);
  }, []);

  // Generate realistic positions for properties based on their coordinates
  const getPropertyScreenPosition = useCallback((property: Property) => {
    // Convert lat/lng to screen coordinates relative to current map region
    const latRange = mapRegion.latitudeDelta;
    const lngRange = mapRegion.longitudeDelta;
    
    // Calculate offset from map center
    const latOffset = (property.location.latitude - mapRegion.latitude) / latRange;
    const lngOffset = (property.location.longitude - mapRegion.longitude) / lngRange;
    
    // Convert to screen coordinates
    const x = width * 0.5 + (lngOffset * width);
    const y = height * 0.5 + (latOffset * height);
    
    return { x, y };
  }, [mapRegion]);

  // Render property pins on map with real coordinates
  const renderPropertyPins = () => {
    return visibleProperties.map((property) => {
      const clusterSize = (property as any).clusterSize || 1;
      
      return (
        <Marker
          key={property.id}
          coordinate={{
            latitude: property.location.latitude,
            longitude: property.location.longitude,
          }}
          onPress={() => handlePropertyPress(property)}
          tracksViewChanges={false} // Optimize performance
        >
          <View style={styles.markerContainer}>
            <PropertyPin
              property={property}
              isActive={selectedProperty?.id === property.id}
              onPress={() => handlePropertyPress(property)}
            />
            {clusterSize > 1 && (
              <View style={styles.clusterBadge}>
                <Text style={styles.clusterText}>{clusterSize}</Text>
              </View>
            )}
          </View>
        </Marker>
      );
    });
  };

  // Render bottom sheet content
  const renderBottomSheetContent = () => {
    const displayProperties = selectedProperty && (selectedProperty as any).clusterSize > 1 
      ? properties.filter(p => isPropertyInRegion(p, mapRegion)).slice(0, 10)
      : visibleProperties.slice(0, 20);

    return (
      <BottomSheetScrollView contentContainerStyle={styles.bottomSheetContent}>
        <Text style={styles.propertiesTitle}>
          {selectedProperty && (selectedProperty as any).clusterSize > 1 
            ? `${(selectedProperty as any).clusterSize} propiedades en esta zona`
            : `${visibleProperties.length} propiedades visibles`
          }
        </Text>
        <Text style={styles.bottomSheetDescription}>
          {selectedProperty && (selectedProperty as any).clusterSize > 1
            ? 'Propiedades agrupadas en esta ubicación'
            : 'Mueve el mapa para explorar más propiedades 🗺️'
          }
        </Text>
        {displayProperties.map((property) => (
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
      {/* Full-Screen Interactive Map */}
      <View style={styles.mapContainer}>
        <RealMapView
          style={styles.map}
          onRegionChangeComplete={handleRegionChangeComplete}
          showsUserLocation={true}
        >
          {/* Render property pins inside the map */}
          {renderPropertyPins()}
        </RealMapView>
      </View>

      {/* Property Pins Container - Now empty, pins are inside MapView */}
      <View style={styles.pinsContainer} pointerEvents="none" />

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

      {/* Map Stats Overlay */}
      <View style={styles.statsOverlay}>
        <Text style={styles.statsText}>
          {visibleProperties.length} propiedades
        </Text>
        <Text style={styles.statsText}>
          Lat: {mapRegion.latitude.toFixed(4)}, Lng: {mapRegion.longitude.toFixed(4)}
        </Text>
      </View>

      {/* Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        onChange={handleBottomSheetChange}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetIndicator}
        enablePanDownToClose={false}
        enableOverDrag={false}
        enableContentPanningGesture={false}
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  map: {
    flex: 1,
  },
  pinsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3,
    pointerEvents: 'box-none', // Allow touches to pass through to children
  },
  pinContainer: {
    position: 'absolute',
    zIndex: 4,
  },
  searchContainer: {
    position: 'absolute',
    top: 60,
    left: spacing.md,
    right: spacing.md,
    zIndex: 10,
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
    zIndex: 10,
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
  statsOverlay: {
    position: 'absolute',
    top: 120,
    right: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    zIndex: 10,
    shadowColor: colors.text.primary,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  statsText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 11,
    fontWeight: '500',
  },
  clusterBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  clusterText: {
    ...typography.caption,
    color: colors.background,
    fontSize: 11,
    fontWeight: '700',
  },
  bottomSheetBackground: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: colors.text.primary,
    shadowOffset: {
      width: 0,
      height: -5,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bottomSheetIndicator: {
    backgroundColor: colors.primary,
    width: 40,
    height: 4,
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
  propertyCard: {
    marginBottom: spacing.sm,
  },
  bottomSheetDescription: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  returnToChileButton: {
    position: 'absolute',
    top: 180,
    right: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    zIndex: 10,
    shadowColor: colors.text.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  returnToChileText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '600',
    fontSize: 12,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});