import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Property } from '../../data/models/property';
import { colors, typography, spacing } from '../../theme';
import { MiniMap } from '../../components/map/MiniMap';

const { width: screenWidth } = Dimensions.get('window');

/**
 * Props for the PropertyDetailScreen component
 */
export interface PropertyDetailScreenProps {
  /** Property data to display */
  property: Property;
  /** Callback when back button is pressed */
  onBack: () => void;
  /** Callback when save/favorite button is pressed */
  onSave?: (property: Property) => void;
  /** Callback when share button is pressed */
  onShare?: (property: Property) => void;
  /** Callback when contact button is pressed */
  onContact?: (property: Property) => void;
  /** Whether the property is currently saved/favorited */
  isSaved?: boolean;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Property Detail Screen Component
 * 
 * Displays comprehensive property details including photo gallery,
 * property information sections, mini-map, and action buttons.
 */
export const PropertyDetailScreen: React.FC<PropertyDetailScreenProps> = ({
  property,
  onBack,
  onSave,
  onShare,
  onContact,
  isSaved = false,
  testID,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Format price for display
  const formatPrice = (price: number, currency: string): string => {
    if (currency === 'CLP') {
      return `$${price.toLocaleString('es-CL')}`;
    }
    return `${currency} ${price.toLocaleString()}`;
  };

  // Get property type display text
  const getPropertyTypeText = (type: string): string => {
    switch (type) {
      case 'house':
        return 'Casa';
      case 'apartment':
        return 'Departamento';
      case 'land':
        return 'Terreno';
      case 'office':
        return 'Oficina';
      case 'commercial':
        return 'Local Comercial';
      case 'warehouse':
        return 'Bodega';
      default:
        return type;
    }
  };

  // Get operation display text
  const getOperationText = (operation: string): string => {
    switch (operation) {
      case 'sale':
        return 'Venta';
      case 'rent':
        return 'Arriendo';
      default:
        return operation;
    }
  };

  // Handle image scroll
  const handleImageScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / screenWidth);
    setCurrentImageIndex(index);
  };

  // Render image item for carousel
  const renderImageItem = ({ item }: { item: any }) => (
    <View style={styles.imageContainer}>
      <Image
        source={{ uri: item.url }}
        style={styles.carouselImage}
        resizeMode="cover"
      />
    </View>
  );

  // Render image indicators
  const renderImageIndicators = () => (
    <View style={styles.indicatorContainer}>
      {property.media.images.map((_, index) => (
        <View
          key={index}
          style={[
            styles.indicator,
            index === currentImageIndex && styles.activeIndicator,
          ]}
        />
      ))}
    </View>
  );

  // Format features for display
  const formatFeatures = () => {
    const features = [];
    if (property.features.bedrooms) {
      features.push(`${property.features.bedrooms} dormitorios`);
    }
    if (property.features.bathrooms) {
      features.push(`${property.features.bathrooms} baños`);
    }
    if (property.features.area) {
      features.push(`${property.features.area}m²`);
    }
    if (property.features.parkingSpots) {
      features.push(`${property.features.parkingSpots} estacionamientos`);
    }
    return features;
  };

  // Display price based on operation
  const displayPrice = property.operation === 'rent' && property.pricing.monthlyRent
    ? formatPrice(property.pricing.monthlyRent, property.pricing.currency)
    : formatPrice(property.pricing.price, property.pricing.currency);

  const priceLabel = property.operation === 'rent' ? '/mes' : '';

  return (
    <SafeAreaView style={styles.container} testID={testID}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header with back button and actions */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Text style={styles.headerButtonText}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          {onSave && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => onSave(property)}
              accessibilityRole="button"
              accessibilityLabel={isSaved ? "Quitar de favoritos" : "Agregar a favoritos"}
            >
              <Text style={styles.headerButtonText}>
                {isSaved ? '❤️' : '🤍'}
              </Text>
            </TouchableOpacity>
          )}
          
          {onShare && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => onShare(property)}
              accessibilityRole="button"
              accessibilityLabel="Compartir propiedad"
            >
              <Text style={styles.headerButtonText}>📤</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Photo Gallery */}
        <View style={styles.galleryContainer}>
          <FlatList
            ref={flatListRef}
            data={property.media.images}
            renderItem={renderImageItem}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleImageScroll}
            scrollEventThrottle={16}
          />
          {property.media.images.length > 1 && renderImageIndicators()}
        </View>

        {/* Property Information */}
        <View style={styles.contentContainer}>
          {/* Price and Operation */}
          <View style={styles.priceSection}>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>
                {displayPrice}
                <Text style={styles.priceLabel}>{priceLabel}</Text>
              </Text>
              <View style={styles.operationBadge}>
                <Text style={styles.operationText}>{getOperationText(property.operation)}</Text>
              </View>
            </View>
            
            {property.pricing.pricePerSquareMeter && (
              <Text style={styles.pricePerMeter}>
                {formatPrice(property.pricing.pricePerSquareMeter, property.pricing.currency)}/m²
              </Text>
            )}
          </View>

          {/* Title and Type */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{property.title}</Text>
            <Text style={styles.propertyType}>{getPropertyTypeText(property.type)}</Text>
          </View>

          {/* Location */}
          <View style={styles.locationSection}>
            <Text style={styles.locationText}>
              📍 {property.location.address.street} {property.location.address.number}
            </Text>
            <Text style={styles.locationSubtext}>
              {property.location.address.commune}, {property.location.address.city}, {property.location.address.region}
            </Text>
          </View>

          {/* Features */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Características</Text>
            <View style={styles.featuresGrid}>
              {formatFeatures().map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.descriptionText}>{property.description}</Text>
          </View>

          {/* Additional Features */}
          {(property.features.hasGarden || property.features.hasPool || property.features.hasGym) && (
            <View style={styles.amenitiesSection}>
              <Text style={styles.sectionTitle}>Amenidades</Text>
              <View style={styles.amenitiesGrid}>
                {property.features.hasGarden && (
                  <View style={styles.amenityItem}>
                    <Text style={styles.amenityIcon}>🌿</Text>
                    <Text style={styles.amenityText}>Jardín</Text>
                  </View>
                )}
                {property.features.hasPool && (
                  <View style={styles.amenityItem}>
                    <Text style={styles.amenityIcon}>🏊</Text>
                    <Text style={styles.amenityText}>Piscina</Text>
                  </View>
                )}
                {property.features.hasGym && (
                  <View style={styles.amenityItem}>
                    <Text style={styles.amenityIcon}>💪</Text>
                    <Text style={styles.amenityText}>Gimnasio</Text>
                  </View>
                )}
                {property.features.hasSecurity && (
                  <View style={styles.amenityItem}>
                    <Text style={styles.amenityIcon}>🔒</Text>
                    <Text style={styles.amenityText}>Seguridad</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Contact Information */}
          {property.contact && (
            <View style={styles.contactSection}>
              <Text style={styles.sectionTitle}>Contacto</Text>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{property.contact.name}</Text>
                {property.contact.phone && (
                  <Text style={styles.contactDetail}>📞 {property.contact.phone}</Text>
                )}
                {property.contact.email && (
                  <Text style={styles.contactDetail}>✉️ {property.contact.email}</Text>
                )}
                {property.contact.whatsapp && (
                  <Text style={styles.contactDetail}>💬 WhatsApp disponible</Text>
                )}
              </View>
            </View>
          )}

          {/* Location Map */}
          <View style={styles.mapSection}>
            <Text style={styles.sectionTitle}>Ubicación</Text>
            <MiniMap
              location={property.location}
              height={200}
              interactive={false}
              onPress={() => {
                // TODO: Open full map view
                console.log('Open full map for property location');
              }}
              style={styles.miniMap}
            />
          </View>

          {/* Publication Info */}
          <View style={styles.publicationSection}>
            <Text style={styles.publicationText}>
              Publicado el {new Date(property.listing.publishedAt).toLocaleDateString('es-CL')}
            </Text>
            <Text style={styles.publicationText}>
              {property.listing.views} visualizaciones
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Contact Action Button */}
      {onContact && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => onContact(property)}
            accessibilityRole="button"
            accessibilityLabel="Contactar vendedor"
          >
            <Text style={styles.contactButtonText}>Contactar</Text>
          </TouchableOpacity>
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
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50, // Account for status bar
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  galleryContainer: {
    height: 300,
    position: 'relative',
  },
  imageContainer: {
    width: screenWidth,
    height: 300,
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeIndicator: {
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.md,
  },
  priceSection: {
    marginBottom: spacing.lg,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  price: {
    ...typography.h1,
    color: colors.primary,
    fontWeight: '700',
  },
  priceLabel: {
    ...typography.body1,
    color: colors.text.secondary,
    fontWeight: '400',
  },
  operationBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.md,
  },
  operationText: {
    ...typography.body2,
    color: colors.background,
    fontWeight: '600',
  },
  pricePerMeter: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  titleSection: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  propertyType: {
    ...typography.body1,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  locationSection: {
    marginBottom: spacing.lg,
  },
  locationText: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  locationSubtext: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  featuresSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  featureItem: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
  },
  featureText: {
    ...typography.body2,
    color: colors.text.primary,
    fontWeight: '500',
  },
  descriptionSection: {
    marginBottom: spacing.lg,
  },
  descriptionText: {
    ...typography.body1,
    color: colors.text.primary,
    lineHeight: 24,
  },
  amenitiesSection: {
    marginBottom: spacing.lg,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  amenityItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  amenityIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  amenityText: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  contactSection: {
    marginBottom: spacing.lg,
  },
  contactInfo: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: spacing.md,
  },
  contactName: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  contactDetail: {
    ...typography.body2,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  mapSection: {
    marginBottom: spacing.lg,
  },
  miniMap: {
    marginTop: spacing.sm,
  },
  publicationSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginBottom: spacing.xxl,
  },
  publicationText: {
    ...typography.caption,
    color: colors.text.light,
    marginBottom: spacing.xs,
  },
  actionContainer: {
    padding: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  contactButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: spacing.md,
    alignItems: 'center',
  },
  contactButtonText: {
    ...typography.body1,
    color: colors.background,
    fontWeight: '600',
  },
});

export default PropertyDetailScreen;