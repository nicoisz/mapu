import React, { useRef, useCallback, useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import MapView, { PROVIDER_GOOGLE, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import { colors, typography, spacing } from '../../theme';

interface RealMapViewProps {
  children?: React.ReactNode;
  style?: any;
  region?: Region;
  onRegionChange?: (region: Region) => void;
  onRegionChangeComplete?: (region: Region) => void;
  showsUserLocation?: boolean;
  followsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  [key: string]: any;
}

/**
 * Real MapView component using react-native-maps
 * Provides full Google Maps functionality with pan, zoom, and world navigation
 */
export const RealMapView: React.FC<RealMapViewProps> = ({
  children,
  style,
  region,
  onRegionChange,
  onRegionChangeComplete,
  showsUserLocation = true,
  followsUserLocation = false,
  showsMyLocationButton = false,
  ...props
}) => {
  const mapRef = useRef<MapView>(null);
  const [currentRegion, setCurrentRegion] = useState<Region>(region || {
    latitude: -33.4489,
    longitude: -70.6693,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Handle region change
  const handleRegionChange = useCallback((newRegion: Region) => {
    setCurrentRegion(newRegion);
    onRegionChange?.(newRegion);
  }, [onRegionChange]);

  // Handle region change complete
  const handleRegionChangeComplete = useCallback((newRegion: Region) => {
    setCurrentRegion(newRegion);
    onRegionChangeComplete?.(newRegion);
  }, [onRegionChangeComplete]);

  // Center map on Chile
  const centerOnChile = useCallback(() => {
    const chileRegion: Region = {
      latitude: -33.4489,
      longitude: -70.6693,
      latitudeDelta: 10,
      longitudeDelta: 10,
    };
    
    mapRef.current?.animateToRegion(chileRegion, 1000);
  }, []);

  // Get location name based on coordinates
  const getLocationName = useCallback((lat: number, lng: number) => {
    if (lat >= -56 && lat <= -17.5 && lng >= -109 && lng <= -66) {
      if (Math.abs(lat + 33.4489) < 0.5 && Math.abs(lng + 70.6693) < 0.5) {
        return 'Santiago, Chile';
      } else if (Math.abs(lat + 23.6509) < 0.5 && Math.abs(lng + 70.3975) < 0.5) {
        return 'Antofagasta, Chile';
      } else if (Math.abs(lat + 41.4693) < 0.5 && Math.abs(lng + 72.9424) < 0.5) {
        return 'Puerto Montt, Chile';
      }
      return 'Chile';
    } else if (lat >= -60 && lat <= 15 && lng >= -120 && lng <= -30) {
      return 'América del Sur';
    }
    return 'Mundo';
  }, []);

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: -33.4489,
          longitude: -70.6693,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        onRegionChange={handleRegionChange}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation={showsUserLocation}
        followsUserLocation={followsUserLocation}
        showsMyLocationButton={showsMyLocationButton}
        showsCompass={true}
        showsScale={false}
        showsBuildings={false}
        showsTraffic={false}
        showsIndoors={false}
        rotateEnabled={true}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={true}
        toolbarEnabled={false}
        moveOnMarkerPress={false}
        {...props}
      >
        {children}
      </MapView>

      {/* Location info overlay */}
      <View style={styles.locationInfo}>
        <Text style={styles.locationText}>
          {getLocationName(currentRegion.latitude, currentRegion.longitude)}
        </Text>
        <Text style={styles.coordinatesText}>
          {currentRegion.latitude.toFixed(4)}, {currentRegion.longitude.toFixed(4)}
        </Text>
      </View>

      {/* Return to Chile button (when far from Chile) */}
      {(currentRegion.latitude < -60 || currentRegion.latitude > -15 || 
        currentRegion.longitude < -120 || currentRegion.longitude > -60) && (
        <TouchableOpacity 
          style={styles.returnToChileButton}
          onPress={centerOnChile}
          activeOpacity={0.7}
        >
          <Text style={styles.returnToChileText}>🇨🇱 Chile</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  locationInfo: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: spacing.sm,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  locationText: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '600',
  },
  coordinatesText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 10,
  },
  returnToChileButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    shadowColor: colors.text.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  returnToChileText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '600',
    fontSize: 12,
  },
});