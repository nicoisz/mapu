import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Input, Button } from '../../components/forms';
import { colors, typography, spacing } from '../../theme';
import { 
  PropertyType, 
  PropertyOperation, 
  Currency, 
  ChileanRegion 
} from '../../data/models/enums';
import { CreatePropertyRequest } from '../../data/models/property';
import { useAuth } from '../../hooks/useAuth';
import { propertyService } from '../../services/propertyService';

interface AddPropertyScreenProps {
  navigation?: any;
}

interface FormData {
  title: string;
  description: string;
  type: PropertyType;
  operation: PropertyOperation;
  price: string;
  currency: Currency;
  area: string;
  bedrooms: string;
  bathrooms: string;
  parkingSpots: string;
  address: string;
  city: string;
  region: ChileanRegion;
  latitude: string;
  longitude: string;
}

interface FormErrors {
  [key: string]: string;
}

export const AddPropertyScreen: React.FC<AddPropertyScreenProps> = ({ navigation }) => {
  const { user, hasRemainingListings } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    type: PropertyType.HOUSE,
    operation: PropertyOperation.SALE,
    price: '',
    currency: Currency.CLP,
    area: '',
    bedrooms: '',
    bathrooms: '',
    parkingSpots: '',
    address: '',
    city: '',
    region: ChileanRegion.METROPOLITANA,
    latitude: '',
    longitude: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields validation
    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }
    if (!formData.price.trim()) {
      newErrors.price = 'El precio es requerido';
    } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = 'El precio debe ser un número válido mayor a 0';
    }
    if (!formData.area.trim()) {
      newErrors.area = 'El área es requerida';
    } else if (isNaN(Number(formData.area)) || Number(formData.area) <= 0) {
      newErrors.area = 'El área debe ser un número válido mayor a 0';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'La dirección es requerida';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'La ciudad es requerida';
    }

    // Optional numeric fields validation
    if (formData.bedrooms && (isNaN(Number(formData.bedrooms)) || Number(formData.bedrooms) < 0)) {
      newErrors.bedrooms = 'Número de dormitorios inválido';
    }
    if (formData.bathrooms && (isNaN(Number(formData.bathrooms)) || Number(formData.bathrooms) < 0)) {
      newErrors.bathrooms = 'Número de baños inválido';
    }
    if (formData.parkingSpots && (isNaN(Number(formData.parkingSpots)) || Number(formData.parkingSpots) < 0)) {
      newErrors.parkingSpots = 'Número de estacionamientos inválido';
    }

    // Coordinates validation (optional but if provided, must be valid)
    if (formData.latitude && (isNaN(Number(formData.latitude)) || Math.abs(Number(formData.latitude)) > 90)) {
      newErrors.latitude = 'Latitud inválida';
    }
    if (formData.longitude && (isNaN(Number(formData.longitude)) || Math.abs(Number(formData.longitude)) > 180)) {
      newErrors.longitude = 'Longitud inválida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = () => {
    // Mock image upload functionality
    Alert.alert(
      'Subir Imágenes',
      'Funcionalidad de carga de imágenes (simulada)',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Simular Carga', 
          onPress: () => {
            const mockImageUrl = `https://picsum.photos/400/300?random=${Date.now()}`;
            setSelectedImages(prev => [...prev, mockImageUrl]);
          }
        }
      ]
    );
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para crear una propiedad');
      return;
    }

    if (!hasRemainingListings()) {
      Alert.alert(
        'Sin publicaciones disponibles',
        'Has agotado tus publicaciones gratuitas. Actualiza a Premium para continuar.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Actualizar', onPress: () => console.log('Upgrade to premium') }
        ]
      );
      return;
    }

    if (!validateForm()) {
      Alert.alert('Error', 'Por favor corrige los errores en el formulario');
      return;
    }

    try {
      setIsLoading(true);

      // Create property request object
      const propertyRequest: CreatePropertyRequest = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        operation: formData.operation,
        location: {
          latitude: formData.latitude ? Number(formData.latitude) : -33.4489, // Default Santiago
          longitude: formData.longitude ? Number(formData.longitude) : -70.6693,
          address: {
            street: formData.address.trim(),
            city: formData.city.trim(),
            region: formData.region,
            country: 'Chile',
            postalCode: '',
            commune: '',
          }
        },
        pricing: {
          price: Number(formData.price),
          currency: formData.currency,
          isNegotiable: true,
        },
        features: {
          area: Number(formData.area),
          bedrooms: formData.bedrooms ? Number(formData.bedrooms) : undefined,
          bathrooms: formData.bathrooms ? Number(formData.bathrooms) : undefined,
          parkingSpots: formData.parkingSpots ? Number(formData.parkingSpots) : undefined,
        },
        images: selectedImages,
      };

      // Create property using the service
      const newProperty = await propertyService.createProperty(user.id, propertyRequest);

      Alert.alert(
        'Propiedad Creada',
        'Tu propiedad ha sido creada exitosamente y estará visible por 30 días.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (navigation) {
                navigation.goBack();
              }
            }
          }
        ]
      );

    } catch (error) {
      console.error('Error creating property:', error);
      Alert.alert('Error', 'No se pudo crear la propiedad. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Agregar Propiedad</Text>
        <Text style={styles.subtitle}>
          Completa la información de tu propiedad
        </Text>
      </View>

      {/* Basic Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información Básica</Text>
        
        <Input
          label="Título de la propiedad"
          value={formData.title}
          onChangeText={(value) => updateFormData('title', value)}
          error={errors.title}
          placeholder="Ej: Casa moderna en Las Condes"
          required
        />

        <Input
          label="Descripción"
          value={formData.description}
          onChangeText={(value) => updateFormData('description', value)}
          error={errors.description}
          placeholder="Describe las características principales..."
          multiline
          numberOfLines={4}
          required
        />

        {/* Property Type Selector */}
        <View style={styles.selectorContainer}>
          <Text style={styles.selectorLabel}>Tipo de Propiedad *</Text>
          <View style={styles.selectorGrid}>
            {Object.values(PropertyType).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.selectorOption,
                  formData.type === type && styles.selectorOptionSelected
                ]}
                onPress={() => updateFormData('type', type)}
              >
                <Text style={[
                  styles.selectorOptionText,
                  formData.type === type && styles.selectorOptionTextSelected
                ]}>
                  {getPropertyTypeLabel(type)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Operation Type Selector */}
        <View style={styles.selectorContainer}>
          <Text style={styles.selectorLabel}>Operación *</Text>
          <View style={styles.selectorRow}>
            {Object.values(PropertyOperation).map((operation) => (
              <TouchableOpacity
                key={operation}
                style={[
                  styles.selectorOption,
                  formData.operation === operation && styles.selectorOptionSelected
                ]}
                onPress={() => updateFormData('operation', operation)}
              >
                <Text style={[
                  styles.selectorOptionText,
                  formData.operation === operation && styles.selectorOptionTextSelected
                ]}>
                  {operation === PropertyOperation.SALE ? 'Venta' : 'Arriendo'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Pricing */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Precio</Text>
        
        <View style={styles.priceRow}>
          <View style={styles.priceInput}>
            <Input
              label="Precio"
              value={formData.price}
              onChangeText={(value) => updateFormData('price', value)}
              error={errors.price}
              placeholder="0"
              keyboardType="numeric"
              required
            />
          </View>
          
          <View style={styles.currencySelector}>
            <Text style={styles.selectorLabel}>Moneda</Text>
            <View style={styles.selectorRow}>
              {Object.values(Currency).map((currency) => (
                <TouchableOpacity
                  key={currency}
                  style={[
                    styles.selectorOption,
                    styles.currencyOption,
                    formData.currency === currency && styles.selectorOptionSelected
                  ]}
                  onPress={() => updateFormData('currency', currency)}
                >
                  <Text style={[
                    styles.selectorOptionText,
                    formData.currency === currency && styles.selectorOptionTextSelected
                  ]}>
                    {currency}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Property Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Características</Text>
        
        <Input
          label="Área (m²)"
          value={formData.area}
          onChangeText={(value) => updateFormData('area', value)}
          error={errors.area}
          placeholder="0"
          keyboardType="numeric"
          required
        />

        <View style={styles.featuresRow}>
          <View style={styles.featureInput}>
            <Input
              label="Dormitorios"
              value={formData.bedrooms}
              onChangeText={(value) => updateFormData('bedrooms', value)}
              error={errors.bedrooms}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.featureInput}>
            <Input
              label="Baños"
              value={formData.bathrooms}
              onChangeText={(value) => updateFormData('bathrooms', value)}
              error={errors.bathrooms}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>
        </View>

        <Input
          label="Estacionamientos"
          value={formData.parkingSpots}
          onChangeText={(value) => updateFormData('parkingSpots', value)}
          error={errors.parkingSpots}
          placeholder="0"
          keyboardType="numeric"
        />
      </View>

      {/* Location */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ubicación</Text>
        
        <Input
          label="Dirección"
          value={formData.address}
          onChangeText={(value) => updateFormData('address', value)}
          error={errors.address}
          placeholder="Ej: Av. Providencia 1234"
          required
        />

        <View style={styles.locationRow}>
          <View style={styles.locationInput}>
            <Input
              label="Ciudad"
              value={formData.city}
              onChangeText={(value) => updateFormData('city', value)}
              error={errors.city}
              placeholder="Santiago"
              required
            />
          </View>
        </View>

        {/* Region Selector */}
        <View style={styles.selectorContainer}>
          <Text style={styles.selectorLabel}>Región</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.regionSelector}>
              {Object.values(ChileanRegion).map((region) => (
                <TouchableOpacity
                  key={region}
                  style={[
                    styles.regionOption,
                    formData.region === region && styles.selectorOptionSelected
                  ]}
                  onPress={() => updateFormData('region', region)}
                >
                  <Text style={[
                    styles.regionOptionText,
                    formData.region === region && styles.selectorOptionTextSelected
                  ]}>
                    {region}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Optional Coordinates */}
        <View style={styles.coordinatesRow}>
          <View style={styles.coordinateInput}>
            <Input
              label="Latitud (opcional)"
              value={formData.latitude}
              onChangeText={(value) => updateFormData('latitude', value)}
              error={errors.latitude}
              placeholder="-33.4489"
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.coordinateInput}>
            <Input
              label="Longitud (opcional)"
              value={formData.longitude}
              onChangeText={(value) => updateFormData('longitude', value)}
              error={errors.longitude}
              placeholder="-70.6693"
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      {/* Images */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Imágenes</Text>
        
        <TouchableOpacity
          style={styles.imageUploadButton}
          onPress={handleImageUpload}
        >
          <Text style={styles.imageUploadButtonText}>
            📷 Agregar Imágenes (Simulado)
          </Text>
        </TouchableOpacity>

        {selectedImages.length > 0 && (
          <View style={styles.imageGrid}>
            {selectedImages.map((imageUrl, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: imageUrl }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Text style={styles.removeImageButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Submit Button */}
      <View style={styles.submitSection}>
        <Button
          title={isLoading ? 'Creando...' : 'Crear Propiedad'}
          onPress={handleSubmit}
          loading={isLoading}
          fullWidth
          size="large"
        />
      </View>
    </ScrollView>
  );
};

const getPropertyTypeLabel = (type: PropertyType): string => {
  const labels = {
    [PropertyType.HOUSE]: 'Casa',
    [PropertyType.APARTMENT]: 'Departamento',
    [PropertyType.LAND]: 'Terreno',
    [PropertyType.OFFICE]: 'Oficina',
    [PropertyType.COMMERCIAL]: 'Comercial',
    [PropertyType.WAREHOUSE]: 'Bodega',
  };
  return labels[type] || type;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  section: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  selectorContainer: {
    marginBottom: spacing.md,
  },
  selectorLabel: {
    ...typography.body2,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  selectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  selectorOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  selectorOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  selectorOptionText: {
    ...typography.body2,
    color: colors.text.primary,
    textAlign: 'center',
  },
  selectorOptionTextSelected: {
    color: colors.background,
  },
  priceRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  priceInput: {
    flex: 2,
  },
  currencySelector: {
    flex: 1,
  },
  currencyOption: {
    flex: 1,
  },
  featuresRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  featureInput: {
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  locationInput: {
    flex: 1,
  },
  regionSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  regionOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    minWidth: 120,
  },
  regionOptionText: {
    ...typography.body2,
    color: colors.text.primary,
    textAlign: 'center',
    fontSize: 12,
  },
  coordinatesRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  coordinateInput: {
    flex: 1,
  },
  imageUploadButton: {
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  imageUploadButtonText: {
    ...typography.body1,
    color: colors.text.secondary,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  imageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageButtonText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  submitSection: {
    padding: spacing.lg,
  },
});