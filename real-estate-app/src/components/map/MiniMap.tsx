import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { PropertyLocation } from '../../data/models/location';
import { colors, typography, spacing } from '../../theme';

// Conditional import for MapView
let MapView: any;
let Marker: any;
let PROVIDER_GOOGLE: any;

try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
} catch (error) {
  console.warn('react-native-maps not available, using mock components');
  const MockComponents = require('./MockMapView');
  MapView = MockComponents.MockMapView;
  Marker = MockComponents.MockMarker;
  PROVIDER_GOOGLE = 'google';
}

/**
 * Props for the MiniMap component
 */
export interface MiniMapProps {
  /** Property location to display */
  location: PropertyLocation;
  /** Height of the mini map */
  height?: number;
  /** Whether the map is interactive */
  interactive?: boolean;
  /** Callback when map is pressed */
  onPress?: () => void;
  /** Custom style for the container */
  style?: any;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Mini Map Component
 * 
 * Displays a small map showing the property location with a marker.
 * Used in property detail screens to show location context.
 */
export const MiniMap: React.FC<MiniMapProps> = ({
  location,
  height = 200,
  interactive = false,
  onPress,
  style,
  testID,
}) => {
  // Create region for the map centered on the property
  const region = {
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: 0.01, // Small delta for close zoom
    longitudeDelta: 0.01,
  };

  // Format address for display
  const formatAddress = (): string => {
    const parts = [];
    if (location.address.street && location.address.number) {
      parts.push(`${location.address.street} ${location.address.number}`);
    }
    if (location.address.commune) {
      parts.push(location.address.commune);
    }
    if (location.address.city) {
      parts.push(location.address.city);
    }
    return parts.join(', ');
  };

  const MapComponent = (
    <View style={[styles.container, { height }, style]} testID={testID}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        pitchEnabled={false}
        rotateEnabled={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        showsBuildings={true}
        showsTraffic={false}
        showsIndoors={false}
        mapType="standard"
      >
        <Marker
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
          title="Ubicación de la propiedad"
          description={formatAddress()}
        >
          <View style={styles.markerContainer}>
            <View style={styles.marker}>
              <Text style={styles.markerText}>🏠</Text>
            </View>
          </View>
        </Marker>
      </MapView>

      {/* Address overlay */}
      <View style={styles.addressOverlay}>
        <Text style={styles.addressText} numberOfLines={2}>
          📍 {formatAddress()}
        </Text>
      </View>

      {/* Interactive overlay for non-interactive maps */}
      {!interactive && onPress && (
        <TouchableOpacity
          style={styles.interactiveOverlay}
          onPress={onPress}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Ver ubicación en mapa completo"
        >
          <View style={styles.expandButton}>
            <Text style={styles.expandButtonText}>🔍</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );

  return MapComponent;
};

const styles = StyleSheet.create({
  container: {
    borderRadius: spacing.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.background,
    shadowColor: colors.text.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerText: {
    fontSize: 16,
  },
  addressOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: spacing.sm,
  },
  addressText: {
    ...typography.body2,
    color: colors.background,
    fontWeight: '500',
  },
  interactiveOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.text.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  expandButtonText: {
    fontSize: 14,
  },
});

export default MiniMap;