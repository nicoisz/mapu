import React, { useState, useEffect } from 'react';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { PropertyDetailScreen } from './PropertyDetailScreen';
import { RootStackParamList } from '../../navigation/types';
import { sampleDataService } from '../../data/mock';
import { Property } from '../../data/models/property';
import { colors, typography, spacing } from '../../theme';

type PropertyDetailRouteProp = RouteProp<RootStackParamList, 'PropertyDetail'>;
type PropertyDetailNavigationProp = StackNavigationProp<RootStackParamList, 'PropertyDetail'>;

export const PropertyDetailNavigationWrapper: React.FC = () => {
  const route = useRoute<PropertyDetailRouteProp>();
  const navigation = useNavigation<PropertyDetailNavigationProp>();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { propertyId } = route.params;
  
  useEffect(() => {
    const loadProperty = async () => {
      try {
        console.log('🔍 Loading property with ID:', propertyId);
        
        // Don't reinitialize, just use the existing data
        // sampleDataService.initialize('development');
        
        // First, let's get all properties to see what's available
        const allProperties = await sampleDataService.getProperties();
        console.log('📋 All available properties:', allProperties.map(p => ({ id: p.id, title: p.title })));
        
        // Find the property by ID
        const foundProperty = await sampleDataService.getPropertyById(propertyId);
        
        console.log('🏠 Found property:', foundProperty ? foundProperty.title : 'NOT FOUND');
        
        if (!foundProperty) {
          console.error('❌ Property not found for ID:', propertyId);
          // Try to find by partial match or use first property as fallback
          const fallbackProperty = allProperties[0];
          if (fallbackProperty) {
            console.log('🔄 Using fallback property:', fallbackProperty.title);
            setProperty(fallbackProperty);
          } else {
            setError(`Propiedad no encontrada (ID: ${propertyId})`);
          }
          setLoading(false);
          return;
        }
        
        setProperty(foundProperty);
        console.log('✅ Property loaded successfully');
      } catch (error) {
        console.error('❌ Error loading property:', error);
        setError(`Error cargando propiedad: ${error}`);
        setProperty(null);
      } finally {
        setLoading(false);
      }
    };
    
    loadProperty();
  }, [propertyId, navigation]);
  
  const handleBack = () => {
    navigation.goBack();
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando propiedad...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (!property) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Propiedad no encontrada</Text>
        <Text style={styles.errorText}>No se pudo cargar la información de esta propiedad.</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <PropertyDetailScreen 
      property={property} 
      onBack={handleBack}
    />
  );
};

const styles = {
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  loadingText: {
    ...typography.body1,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  errorTitle: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center' as const,
  },
  errorText: {
    ...typography.body1,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
    textAlign: 'center' as const,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  backButtonText: {
    ...typography.button,
    color: colors.background,
  },
};