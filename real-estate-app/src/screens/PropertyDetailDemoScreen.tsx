import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { PropertyDetailScreen } from './property/PropertyDetailScreen';
import { Property } from '../data/models/property';
import { sampleDataService } from '../data/mock';
import { ShareService, FavoritesService, ContactService } from '../services';
import { colors } from '../theme';

/**
 * Property Detail Demo Screen
 * 
 * Demonstrates the PropertyDetailScreen component with mock data
 * and functional save, share, and contact features.
 */
export const PropertyDetailDemoScreen: React.FC = () => {
  const [property, setProperty] = useState<Property | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDemoProperty();
  }, []);

  const loadDemoProperty = async () => {
    try {
      // Initialize services
      await FavoritesService.initialize();
      sampleDataService.initialize('development');

      // Get a featured property for demo
      const featuredProperties = await sampleDataService.getFeaturedProperties(1);
      
      if (featuredProperties.length > 0) {
        const demoProperty = featuredProperties[0];
        setProperty(demoProperty);
        
        // Check if it's already saved
        const saved = await FavoritesService.isFavorite(demoProperty.id);
        setIsSaved(saved);
      }
    } catch (error) {
      console.error('Error loading demo property:', error);
      Alert.alert('Error', 'No se pudo cargar la propiedad de demostración');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    console.log('Back button pressed - would navigate back');
    Alert.alert('Navegación', 'En una app real, esto regresaría a la pantalla anterior');
  };

  const handleSave = async (property: Property) => {
    try {
      const success = await FavoritesService.toggleFavorite(property);
      
      if (success) {
        const newSavedState = !isSaved;
        setIsSaved(newSavedState);
        
        Alert.alert(
          'Favoritos',
          newSavedState 
            ? 'Propiedad agregada a favoritos' 
            : 'Propiedad removida de favoritos'
        );
      } else {
        Alert.alert('Error', 'No se pudo actualizar favoritos');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Error al actualizar favoritos');
    }
  };

  const handleShare = async (property: Property) => {
    try {
      const result = await ShareService.shareProperty(property, {
        title: `Propiedad en ${property.location.address.city}`,
        message: '¡Mira esta increíble propiedad que encontré!',
      });

      if (result.success) {
        Alert.alert('Compartir', 'Propiedad compartida exitosamente');
      } else {
        Alert.alert('Error', result.error || 'Error al compartir');
      }
    } catch (error) {
      console.error('Error sharing property:', error);
      Alert.alert('Error', 'Error al compartir la propiedad');
    }
  };

  const handleContact = async (property: Property) => {
    try {
      const result = await ContactService.contactProperty(property, {
        message: 'Me interesa esta propiedad. ¿Podrían darme más información?',
      });

      if (result.success) {
        const methodName = ContactService.getContactMethodDisplayName(result.method!);
        Alert.alert(
          'Contacto',
          `Abriendo ${methodName} para contactar al vendedor`
        );
      } else {
        Alert.alert('Error', result.error || 'Error al contactar');
      }
    } catch (error) {
      console.error('Error contacting property:', error);
      Alert.alert('Error', 'Error al contactar');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        {/* In a real app, this would be a proper loading component */}
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.errorContainer}>
        {/* In a real app, this would be a proper error component */}
      </View>
    );
  }

  return (
    <PropertyDetailScreen
      property={property}
      onBack={handleBack}
      onSave={handleSave}
      onShare={handleShare}
      onContact={handleContact}
      isSaved={isSaved}
      testID="property-detail-demo"
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PropertyDetailDemoScreen;