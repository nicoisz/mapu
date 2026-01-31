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
 * Designed to simulate a full-screen interactive map experience
 */
export const MockMapView: React.FC<MockMapViewProps> = ({ 
  children, 
  style, 
  region,
  showsUserLocation,
  ...props 
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Map Background */}
      <View style={styles.mapBackground}>
        {/* Grid pattern to simulate map tiles */}
        <View style={styles.gridOverlay}>
          {Array.from({ length: 20 }, (_, i) => (
            <View key={i} style={styles.gridLine} />
          ))}
        </View>
        
        {/* Map center indicator */}
        <View style={styles.centerIndicator}>
          <Text style={styles.mapIcon}>🗺️</Text>
        </View>
        
        {/* User location indicator */}
        {showsUserLocation && (
          <View style={styles.userLocation}>
            <View style={styles.userLocationDot} />
            <View style={styles.userLocationRing} />
          </View>
        )}
        
        {/* Region info overlay */}
        {region && (
          <View style={styles.regionInfo}>
            <Text style={styles.regionText}>
              Santiago, Chile
            </Text>
            <Text style={styles.coordinatesText}>
              {region.latitude.toFixed(4)}, {region.longitude.toFixed(4)}
            </Text>
          </View>
        )}
      </View>
      
      {/* Property pins and other children */}
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
    backgroundColor: '#E8F5E8', // Light green map background
    position: 'relative',
  },
  mapBackground: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#E8F5E8',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridLine: {
    width: '5%',
    height: '5%',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  centerIndicator: {
    position: 'absolute',
    top: '45%',
    left: '45%',
    width: '10%',
    height: '10%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapIcon: {
    fontSize: 32,
    opacity: 0.3,
  },
  userLocation: {
    position: 'absolute',
    top: '40%',
    left: '40%',
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    position: 'absolute',
  },
  userLocationRing: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
  },
  regionInfo: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: spacing.sm,
    borderRadius: 8,
  },
  regionText: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '600',
  },
  coordinatesText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 10,
  },
  marker: {
    position: 'absolute',
    alignItems: 'center',
  },
  markerText: {
    fontSize: 24,
  },
});