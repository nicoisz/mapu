import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Property } from '../../data/models/property';
import { colors, typography, spacing } from '../../theme';
import { NavigationService } from '../../navigation';

/**
 * Props for the PropertyCard component
 */
export interface PropertyCardProps {
  /** Property data to display */
  property: Property;
  /** Callback when card is pressed (optional, defaults to navigation) */
  onPress?: () => void;
  /** Whether to show distance from user location */
  showDistance?: boolean;
  /** Distance in meters (only used if showDistance is true) */
  distance?: number;
  /** Whether this card is currently selected */
  isSelected?: boolean;
  /** Custom style for the card */
  style?: any;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Property Card Component
 * 
 * Displays property information in a card layout with image, price, type, 
 * distance, and status. Includes tap navigation to property details.
 */
export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onPress,
  showDistance = false,
  distance,
  isSelected = false,
  style,
  testID,
}) => {
  // Default press handler navigates to property detail
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      NavigationService.navigateToPropertyDetail(property.id);
    }
  };
  // Format price for display
  const formatPrice = (price: number, currency: string): string => {
    if (currency === 'CLP') {
      if (price >= 1000000000) {
        return `$${(price / 1000000000).toFixed(1)}B`;
      } else if (price >= 1000000) {
        return `$${(price / 1000000).toFixed(1)}M`;
      } else if (price >= 1000) {
        return `$${(price / 1000).toFixed(0)}K`;
      }
      return `$${price.toLocaleString()}`;
    }
    return `${currency} ${price.toLocaleString()}`;
  };

  // Format distance for display
  const formatDistance = (distanceInMeters: number): string => {
    if (distanceInMeters >= 1000) {
      return `${(distanceInMeters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(distanceInMeters)} m`;
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

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return colors.success;
      case 'expired':
        return colors.warning;
      case 'sold':
      case 'rented':
        return colors.text.secondary;
      default:
        return colors.text.secondary;
    }
  };

  // Get status text
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'active':
        return 'Disponible';
      case 'expired':
        return 'Expirado';
      case 'sold':
        return 'Vendido';
      case 'rented':
        return 'Arrendado';
      default:
        return status;
    }
  };

  // Get main image
  const mainImage = property.media.images.find(img => img.isMain) || property.media.images[0];
  
  // Format price based on operation
  const displayPrice = property.operation === 'rent' && property.pricing.monthlyRent
    ? formatPrice(property.pricing.monthlyRent, property.pricing.currency)
    : formatPrice(property.pricing.price, property.pricing.currency);

  const priceLabel = property.operation === 'rent' ? '/mes' : '';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.selectedContainer,
        style
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${property.title}, ${displayPrice}${priceLabel}, ${getPropertyTypeText(property.type)}`}
    >
      {/* Property Image */}
      <View style={styles.imageContainer}>
        {mainImage ? (
          <Image
            source={{ uri: mainImage.thumbnailUrl || mainImage.url }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>📷</Text>
          </View>
        )}
        
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(property.status) }]}>
          <Text style={styles.statusText}>{getStatusText(property.status)}</Text>
        </View>

        {/* Premium Badge */}
        {property.listing.isPremium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>⭐</Text>
          </View>
        )}
      </View>

      {/* Property Information */}
      <View style={styles.contentContainer}>
        {/* Price and Operation */}
        <View style={styles.priceContainer}>
          <Text style={styles.price} numberOfLines={1}>
            {displayPrice}
            <Text style={styles.priceLabel}>{priceLabel}</Text>
          </Text>
          <Text style={styles.operation}>{getOperationText(property.operation)}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {property.title}
        </Text>

        {/* Property Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.propertyType}>
            {getPropertyTypeText(property.type)}
          </Text>
          
          {/* Features */}
          {property.features.bedrooms && (
            <Text style={styles.feature}>
              • {property.features.bedrooms} dorm
            </Text>
          )}
          
          {property.features.bathrooms && (
            <Text style={styles.feature}>
              • {property.features.bathrooms} baños
            </Text>
          )}
          
          <Text style={styles.feature}>
            • {property.features.area}m²
          </Text>
        </View>

        {/* Location and Distance */}
        <View style={styles.locationContainer}>
          <Text style={styles.location} numberOfLines={1}>
            📍 {property.location.address.commune}, {property.location.address.city}
          </Text>
          
          {showDistance && distance !== undefined && (
            <Text style={styles.distance}>
              {formatDistance(distance)}
            </Text>
          )}
        </View>

        {/* Publication Date */}
        <Text style={styles.publishDate}>
          Publicado {new Date(property.listing.publishedAt).toLocaleDateString('es-CL')}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.text.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  selectedContainer: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  imageContainer: {
    position: 'relative',
    height: 180,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
    opacity: 0.5,
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.xs,
  },
  statusText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '600',
    fontSize: 10,
  },
  premiumBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: spacing.xs,
  },
  premiumText: {
    fontSize: 12,
  },
  contentContainer: {
    padding: spacing.md,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  price: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '700',
    flex: 1,
  },
  priceLabel: {
    ...typography.body2,
    color: colors.text.secondary,
    fontWeight: '400',
  },
  operation: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: '600',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.xs,
  },
  title: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  propertyType: {
    ...typography.body2,
    color: colors.text.secondary,
    fontWeight: '500',
    marginRight: spacing.sm,
  },
  feature: {
    ...typography.body2,
    color: colors.text.secondary,
    marginRight: spacing.sm,
  },
  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  location: {
    ...typography.body2,
    color: colors.text.secondary,
    flex: 1,
    marginRight: spacing.sm,
  },
  distance: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '600',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.xs,
  },
  publishDate: {
    ...typography.caption,
    color: colors.text.light,
  },
});

export default PropertyCard;