import React, { useRef } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { PROVIDER_DEFAULT, Region } from 'react-native-maps';

interface SimpleMapViewProps {
  style?: any;
  onRegionChangeComplete?: (region: Region) => void;
}

/**
 * Ultra-simple MapView for debugging navigation issues
 * No controlled state, no complex logic, just basic map functionality
 */
export const SimpleMapView: React.FC<SimpleMapViewProps> = ({
  style,
  onRegionChangeComplete,
}) => {
  const mapRef = useRef<MapView>(null);

  return (
    <MapView
      ref={mapRef}
      style={[styles.map, style]}
      provider={PROVIDER_DEFAULT}
      initialRegion={{
        latitude: -33.4489,
        longitude: -70.6693,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
      onRegionChangeComplete={onRegionChangeComplete}
      showsUserLocation={true}
      scrollEnabled={true}
      zoomEnabled={true}
      rotateEnabled={true}
      pitchEnabled={true}
    />
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});