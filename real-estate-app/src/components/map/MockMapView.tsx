import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { colors, typography, spacing } from '../../theme';

const { width, height } = Dimensions.get('window');

interface MockMapViewProps {
  children?: React.ReactNode;
  style?: any;
  region?: any;
  onRegionChangeComplete?: (region: any) => void;
  showsUserLocation?: boolean;
  followsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  [key: string]: any;
}

/**
 * Mock MapView component for development when native maps aren't available
 * This allows the app to run without crashing while native modules are being configured
 */
export const MockMapView: React.FC<MockMapViewProps> = ({ 
  children, 
  style, 
  region,
  ...props 
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.mockMap}>
        <Text style={styles.mockText}>🗺️</Text>
        <Text style={styles.mockLabel}>Mapa (Modo Desarrollo)</Text>
        {region && (
          <Text style={styles.regionText}>
            Lat: {region.latitude?.toFixed(4)}, Lng: {region.longitude?.toFixed(4)}
          </Text>
        )}
      </View>
      {children}
    </View>
  );
};

// Mock Marker component
export const MockMarker: React.FC<any> = ({ children, coordinate, ...props }) => {
  return (
    <View style={styles.marker}>
      <Text style={styles.markerText}>📍</Text>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  mockMap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    borderRadius: spacing.md,
    margin: spacing.sm,
  },
  mockText: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  mockLabel: {
    ...typography.h3,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  regionText: {
    ...typography.caption,
    color: colors.text.light,
  },
  marker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    alignItems: 'center',
  },
  markerText: {
    fontSize: 24,
  },
});