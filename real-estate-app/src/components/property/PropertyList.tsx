import React, { useCallback, useMemo, forwardRef } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import BottomSheetComponent from '@gorhom/bottom-sheet';
import { Property } from '../../data/models/property';
import { Location } from '../../data/models/location';
import { BottomSheet } from '../common/BottomSheet';
import { PropertyCard } from './PropertyCard';
import { colors, typography, spacing } from '../../theme';

/**
 * Props for the PropertyList component
 */
export interface PropertyListProps {
  /** Array of properties to display */
  properties: Property[];
  /** Currently selected property */
  selectedProperty?: Property;
  /** User's current location for distance calculation */
  userLocation?: Location;
  /** Callback when a property is selected */
  onPropertySelect: (property: Property) => void;
  /** Callback when the list is refreshed */
  onRefresh?: () => void;
  /** Whether the list is currently refreshing */
  isRefreshing?: boolean;
  /** Whether to show distance from user location */
  showDistance?: boolean;
  /** Custom snap points for the bottom sheet */
  snapPoints?: (string | number)[];
  /** Test ID for testing */
  testID?: string;
}

/**
 * Calculate distance between two locations using Haversine formula
 */
const calculateDistance = (loc1: Location, loc2: Location): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
  const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(loc1.latitude * Math.PI / 180) * Math.cos(loc2.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Property List Component
 * 
 * A bottom sheet component that displays a list of properties with filtering
 * based on map center and synchronization with map pin selection.
 */
export const PropertyList = forwardRef<BottomSheetComponent, PropertyListProps>(({
  properties,
  selectedProperty,
  userLocation,
  onPropertySelect,
  onRefresh,
  isRefreshing = false,
  showDistance = true,
  snapPoints = ['25%', '50%', '90%'],
  testID,
}, ref) => {
  // Sort properties by distance if user location is available
  const sortedProperties = useMemo(() => {
    if (!userLocation || !showDistance) {
      return properties;
    }

    return [...properties].sort((a, b) => {
      const distanceA = calculateDistance(userLocation, a.location);
      const distanceB = calculateDistance(userLocation, b.location);
      return distanceA - distanceB;
    });
  }, [properties, userLocation, showDistance]);

  // Calculate distances for each property
  const propertiesWithDistance = useMemo(() => {
    if (!userLocation || !showDistance) {
      return sortedProperties.map(property => ({ property, distance: undefined }));
    }

    return sortedProperties.map(property => ({
      property,
      distance: calculateDistance(userLocation, property.location)
    }));
  }, [sortedProperties, userLocation, showDistance]);

  // Handle property selection
  const handlePropertySelect = useCallback((property: Property) => {
    onPropertySelect(property);
  }, [onPropertySelect]);

  // Render property card
  const renderPropertyCard = useCallback(({ item }: { item: { property: Property; distance?: number } }) => {
    const { property, distance } = item;
    
    return (
      <PropertyCard
        property={property}
        onPress={() => handlePropertySelect(property)}
        showDistance={showDistance && distance !== undefined}
        distance={distance}
        isSelected={selectedProperty?.id === property.id}
        testID={`property-card-${property.id}`}
      />
    );
  }, [handlePropertySelect, selectedProperty, showDistance]);

  // Key extractor for FlatList
  const keyExtractor = useCallback((item: { property: Property; distance?: number }) => {
    return item.property.id;
  }, []);

  // Empty state component
  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🏠</Text>
      <Text style={styles.emptyTitle}>No hay propiedades</Text>
      <Text style={styles.emptySubtitle}>
        No se encontraron propiedades en esta área.
        {'\n'}Intenta mover el mapa o ajustar los filtros.
      </Text>
    </View>
  ), []);

  // Header component
  const renderHeader = useCallback(() => (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>
        Propiedades cercanas
      </Text>
      <Text style={styles.headerSubtitle}>
        {properties.length} {properties.length === 1 ? 'propiedad encontrada' : 'propiedades encontradas'}
      </Text>
    </View>
  ), [properties.length]);

  return (
    <BottomSheet
      ref={ref}
      snapPoints={snapPoints}
      enableBackdrop={false}
      testID={testID}
    >
      <View style={styles.container}>
        {renderHeader()}
        
        <FlatList
          data={propertiesWithDistance}
          renderItem={renderPropertyCard}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContainer,
            propertiesWithDistance.length === 0 && styles.emptyListContainer
          ]}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            ) : undefined
          }
          // Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={5}
          getItemLayout={(data, index) => ({
            length: 280, // Approximate height of PropertyCard
            offset: 280 * index,
            index,
          })}
        />
      </View>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  listContainer: {
    paddingBottom: spacing.xl,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
    opacity: 0.5,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default PropertyList;