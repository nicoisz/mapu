import React, { useState, useEffect } from 'react';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { View, Text, ActivityIndicator } from 'react-native';
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
  
  const { propertyId } = route.params;
  
  useEffect(() => {
    const loadProperty = async () => {
      try {
        // Initialize sample data service if not already done
        sampleDataService.initialize('development');
        
        // Find the property by ID
        const foundProperty = await sampleDataService.getPropertyById(propertyId);
        
        if (!foundProperty) {
          // Handle property not found - navigate back
          navigation.goBack();
          return;
        }
        
        setProperty(foundProperty);
      } catch (error) {
        console.error('Error loading property:', error);
        navigation.goBack();
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
  
  if (!property) {
    return null;
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
};