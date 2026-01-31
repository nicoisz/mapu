import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../theme';
import { SearchBar, FilterModal } from '../../components/common';
import { useSearch } from '../../hooks/useSearch';
import { useMap } from '../../hooks/useMap';
import { Property } from '../../data/models/property';

// Fallback map component for when react-native-maps isn't available
const MapFallback: React.FC<{ properties: Property[] }> = ({ properties }) => (
  <View style={styles.mapFallback}>
    <Text style={styles.mapFallbackTitle}>🗺️ Mapa</Text>
    <Text style={styles.mapFallbackText}>
      {properties.length > 0 
        ? `${properties.length} propiedades encontradas`
        : 'Busca propiedades para verlas en el mapa'
      }
    </Text>
    {properties.length > 0 && (
      <View style={styles.propertiesList}>
        {properties.slice(0, 3).map((property) => (
          <Text key={property.id} style={styles.propertyItem}>
            <Text>📍</Text> {property.title} - ${property.pricing.price.toLocaleString()} {property.pricing.currency}
          </Text>
        ))}
        {properties.length > 3 && (
          <Text style={styles.moreProperties}>
            ... y {properties.length - 3} propiedades más
          </Text>
        )}
      </View>
    )}
  </View>
);

export const HomeScreen: React.FC = () => {
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  
  const {
    searchResults,
    isLoading,
    search,
    clearSearch,
    filters,
    setFilters,
    clearFilters,
  } = useSearch();

  const [, mapActions] = useMap({
    trackUserLocation: true,
    autoCenter: true,
  });

  // Use search results if available, otherwise show all properties from map
  const [displayProperties, setDisplayProperties] = useState<Property[]>([]);

  useEffect(() => {
    if (searchResults.length > 0) {
      setDisplayProperties(searchResults);
    } else {
      // If no search results, we could load properties based on map bounds
      // For now, we'll show empty until a search is performed
      setDisplayProperties([]);
    }
  }, [searchResults]);

  const handleSearch = (query: any) => {
    search(query);
  };

  const handleFilterPress = () => {
    setIsFilterModalVisible(true);
  };

  const handleApplyFilters = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    clearFilters();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <SearchBar
        onSearch={handleSearch}
        onClear={clearSearch}
        isLoading={isLoading}
        onFilterPress={handleFilterPress}
      />

      {/* Map View - Using fallback for now */}
      <View style={styles.mapContainer}>
        <MapFallback properties={displayProperties} />
      </View>

      {/* Filter Modal */}
      <FilterModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        initialFilters={filters}
      />
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
  },
  mapFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: spacing.md,
    borderRadius: 12,
    padding: spacing.xl,
  },
  mapFallbackTitle: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  mapFallbackText: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  propertiesList: {
    width: '100%',
    maxWidth: 300,
  },
  propertyItem: {
    ...typography.body2,
    color: colors.text.primary,
    backgroundColor: colors.background,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  moreProperties: {
    ...typography.caption,
    color: colors.text.light,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});