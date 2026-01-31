import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Property } from '../../data/models';
import { colors, spacing, typography } from '../../theme';

/**
 * Props for the PropertyPin component
 */
export interface PropertyPinProps {
  /** Property data to display */
  property: Property;
  /** Whether this pin is currently active/selected */
  isActive: boolean;
  /** Callback when pin is pressed */
  onPress: () => void;
  /** Optional custom style */
  style?: any;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Animated property pin component for map display
 * Shows icon + price in normal state, circular photo when active
 */
export const PropertyPin: React.FC<PropertyPinProps> = ({
  property,
  isActive,
  onPress,
  style,
  testID,
}) => {
  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const photoScale = useSharedValue(0);
  const photoOpacity = useSharedValue(0);
  const pinTranslateY = useSharedValue(0);

  // Format price for display
  const formatPrice = (price: number, currency: string): string => {
    if (currency === 'CLP') {
      if (price >= 1000000) {
        return `$${(price / 1000000).toFixed(1)}M`;
      } else if (price >= 1000) {
        return `$${(price / 1000).toFixed(0)}K`;
      }
      return `$${price.toLocaleString()}`;
    }
    return `${currency} ${price.toLocaleString()}`;
  };

  // Get property type icon (simple text representation for now)
  const getPropertyIcon = (type: string): string => {
    switch (type) {
      case 'house':
        return '🏠';
      case 'apartment':
        return '🏢';
      case 'land':
        return '🏞️';
      default:
        return '🏠';
    }
  };

  // Animation effects when isActive changes
  useEffect(() => {
    if (isActive) {
      // Animate to active state
      scale.value = withSpring(1.2, { damping: 15, stiffness: 200 });
      opacity.value = withTiming(0.9, { duration: 200 });
      photoScale.value = withSpring(1, { damping: 15, stiffness: 200 });
      photoOpacity.value = withTiming(1, { duration: 300 });
      pinTranslateY.value = withSpring(-5, { damping: 15, stiffness: 200 });
    } else {
      // Animate to normal state
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });
      photoScale.value = withSpring(0, { damping: 15, stiffness: 200 });
      photoOpacity.value = withTiming(0, { duration: 200 });
      pinTranslateY.value = withSpring(0, { damping: 15, stiffness: 200 });
    }
  }, [isActive]);

  // Animated styles for the main pin container
  const animatedPinStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateY: pinTranslateY.value },
      ],
      opacity: opacity.value,
    };
  });

  // Animated styles for the photo overlay
  const animatedPhotoStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: photoScale.value }],
      opacity: photoOpacity.value,
    };
  });

  // Get the main property image
  const mainImage = property.media.images.find(img => img.isMain) || property.media.images[0];
  const priceText = formatPrice(property.pricing.price, property.pricing.currency);
  const propertyIcon = getPropertyIcon(property.type);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.container, style]}
      activeOpacity={0.7}
      testID={testID}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      {/* Normal state: Icon + Price */}
      <Animated.View style={[styles.pinContainer, animatedPinStyle]}>
        <View style={styles.pinContent}>
          <Text style={styles.icon}>{propertyIcon}</Text>
          <Text style={styles.price} numberOfLines={1}>
            {priceText}
          </Text>
        </View>
        <View style={styles.pinTail} />
      </Animated.View>

      {/* Active state: Circular Photo + Info */}
      {isActive && mainImage && (
        <Animated.View style={[styles.photoContainer, animatedPhotoStyle]}>
          <Image
            source={{ uri: mainImage.thumbnailUrl || mainImage.url }}
            style={styles.photo}
            resizeMode="cover"
          />
          <View style={styles.photoOverlay}>
            <Text style={styles.photoPrice} numberOfLines={1}>
              {priceText}
            </Text>
          </View>
          
          {/* Property info popup */}
          <View style={styles.infoPopup}>
            <Text style={styles.infoTitle} numberOfLines={2}>
              {property.title}
            </Text>
            <Text style={styles.infoDetails}>
              {property.features.area}m² • {property.features.bedrooms || 0} dorm.
            </Text>
            <Text style={styles.infoLocation} numberOfLines={1}>
              {property.location.address.city}
            </Text>
          </View>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    // Ensure the pin is properly positioned
    position: 'relative',
    // Ensure touch events are properly handled
    zIndex: 1,
  },
  pinContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinContent: {
    backgroundColor: colors.primary,
    borderRadius: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.text.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 2,
    borderColor: colors.background,
  },
  icon: {
    fontSize: 16,
    marginBottom: 2,
  },
  price: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '600',
    textAlign: 'center',
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.primary,
    marginTop: -1,
  },
  photoContainer: {
    position: 'absolute',
    top: -10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: colors.background,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: colors.accent,
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    shadowColor: colors.text.primary,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  photoPrice: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '700',
    fontSize: 10,
  },
  infoPopup: {
    position: 'absolute',
    top: 70,
    left: -60,
    width: 180,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.sm,
    shadowColor: colors.text.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTitle: {
    ...typography.body2,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  infoDetails: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  infoLocation: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '500',
  },
});

export default PropertyPin;