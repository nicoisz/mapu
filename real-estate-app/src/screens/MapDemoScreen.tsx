import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Property } from '../data/models/property';
import { sampleDataService } from '../data/mock/sampleDataService';
import { colors, typography, spacing } from '../theme';

// Fallback map component for demo
const MapDemoFallback: React.FC<{ 
  properties: Property[]; 
  selectedProperty?: Property;
  onPropertySelect: (property: Property) => void;
}> = ({ properties, selectedProperty, onPropertySelect }) => (
  <View style={styles.mapFallback}>
    <Text style={styles.mapFallbackTitle}>🗺️ Mapa Demo</Text>
    <Text style={styles.mapFallbackText}>
      {properties.length} propiedades cargadas
    </Text>
    
    <ScrollView style={styles.propertiesList} showsVerticalScrollIndicator={false}>
      {properties.map((property) => (
        <TouchableOpacity
          key={property.id}
          style={[
            styles.propertyItem,
            selectedProperty?.id === property.id && styles.selectedPropertyItem
          ]}
          onPress={() => onPropertySelect(property)}
        >
          <Text style={styles.propertyTitle}>{property.title}</Text>
          <Text style={styles.propertyPrice}>
            ${property.pricing.price.toLocaleString()} {property.pricing.currency}
          </Text>
          <Text style={styles.propertyLocation}>
            📍 {property.location.address.city}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
);

/**
 * Demo screen to test PropertyPin integration with MapView
 */
export const MapDemoScreen: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setIsLoading(true);
      
      // Initialize sample data service
      sampleDataService.initialize('demo');
      
      // Get some sample properties
      const sampleProperties = await sampleDataService.searchProperties({
        query: '',
        sortBy: 'date',
        limit: 10,
      });
      
      setProperties(sampleProperties);
    } catch (error) {
      console.error('Error loading properties:', error);
      Alert.alert('Error', 'No se pudieron cargar las propiedades');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
    Alert.alert(
      'Propiedad Seleccionada',
      `${property.title}\n\n${property.description}\n\nPrecio: $${property.pricing.price.toLocaleString()} ${property.pricing.currency}`,
      [
        { text: 'Cerrar', style: 'cancel' },
        { text: 'Ver Detalles', onPress: () => console.log('Ver detalles:', property.id) }
      ]
    );
  };

  const handleReload = () => {
    loadProperties();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando propiedades...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Demo del Mapa</Text>
        <TouchableOpacity onPress={handleReload} style={styles.reloadButton}>
          <Text style={styles.reloadButtonText}>🔄 Recargar</Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapDemoFallback
          properties={properties}
          selectedProperty={selectedProperty || undefined}
          onPropertySelect={handlePropertySelect}
        />
      </View>

      {/* Selected Property Info */}
      {selectedProperty && (
        <View style={styles.selectedPropertyInfo}>
          <Text style={styles.selectedPropertyTitle}>
            Propiedad Seleccionada:
          </Text>
          <Text style={styles.selectedPropertyName}>
            {selectedProperty.title}
          </Text>
          <Text style={styles.selectedPropertyPrice}>
            ${selectedProperty.pricing.price.toLocaleString()} {selectedProperty.pricing.currency}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body1,
    color: colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h2,
    color: colors.primary,
  },
  reloadButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reloadButtonText: {
    ...typography.body2,
    color: colors.primary,
  },
  mapContainer: {
    flex: 1,
  },
  mapFallback: {
    flex: 1,
    backgroundColor: colors.surface,
    margin: spacing.md,
    borderRadius: 12,
    padding: spacing.md,
  },
  mapFallbackTitle: {
    ...typography.h3,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  mapFallbackText: {
    ...typography.body2,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  propertiesList: {
    flex: 1,
  },
  propertyItem: {
    backgroundColor: colors.background,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedPropertyItem: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primary + '10',
  },
  propertyTitle: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  propertyPrice: {
    ...typography.h4,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  propertyLocation: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  selectedPropertyInfo: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  selectedPropertyTitle: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  selectedPropertyName: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  selectedPropertyPrice: {
    ...typography.h4,
    color: colors.primary,
  },
});

export default MapDemoScreen;