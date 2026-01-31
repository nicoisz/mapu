import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { MockMapView } from '../../components/map/MockMapView';
import { PropertyPin } from '../../components/map/PropertyPin';
import { PropertyCard } from '../../components/property/PropertyCard';
import { useSearch } from '../../hooks/useSearch';
import { Property } from '../../data/models/property';

const { width, height } = Dimensions.get('window');

export const HomeScreen: React.FC = () => {
  // Navigation
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // State
  const [properties, setProperties] = useState<Property[]>([]);
  const [bottomSheetIndex, setBottomSheetIndex] = useState(0);
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
        // Don't reinitialize, the service is already initialized
        const recentProperties = await sampleDataService.getRecentProperties(50);
        console.log('🏠 Loaded properties:', recentProperties.length);
        console.log('🔍 First few property IDs:', recentProperties.slice(0, 3).map(p => ({ id: p.id, title: p.title })));
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
      length: property.id.length
    });
    
    try {
      console.log('🚀 Navigating to PropertyDetail with ID:', property.id);
      navigation.navigate('PropertyDetail', { propertyId: property.id });
      console.log('✅ Navigation called successfully');
    } catch (error) {
      console.error('❌ Navigation error:', error);
    }
  }, [navigation]);

  // Handle search
  const handleSearch = useCallback((query: any) => {
    search(query);
  }, [search]);

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    clearSearch();
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
    bottomSheetRef.current?.snapToIndex(0);
  }, []);

  // Handle bottom sheet changes
  const handleBottomSheetChange = useCallback((index: number) => {
    setBottomSheetIndex(index);
  }, []);

  // Determine if map interactions should be disabled
  const mapInteractionsDisabled = bottomSheetIndex >= 2;

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
          isActive={false}
          onPress={() => handlePropertyPress(property)}
        />
      </View>
    ));
  };

  // Render bottom sheet content
  const renderBottomSheetContent = () => {
    return (
      <BottomSheetScrollView contentContainerStyle={styles.bottomSheetContent}>
        <Text style={styles.propertiesTitle}>
          {properties.length} propiedades disponibles
        </Text>
        <Text style={styles.bottomSheetDescription}>
          Toca un pin para ver los detalles 📍
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
        />
      </View>

      {/* Property Pins - Rendered OUTSIDE of MapView for proper layering */}
      <View style={styles.pinsContainer}>
        {renderPropertyPins()}
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
        onChange={handleBottomSheetChange}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetIndicator}
        enablePanDownToClose={false}
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
});