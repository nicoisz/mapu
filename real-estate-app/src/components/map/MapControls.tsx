import React from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Props for MapControls component
 */
export interface MapControlsProps {
  /** Callback when location button is pressed */
  onLocationPress?: () => void;
  /** Whether location is currently loading */
  isLoadingLocation?: boolean;
  /** Whether location button should be disabled */
  locationDisabled?: boolean;
  /** Callback when zoom in button is pressed */
  onZoomIn?: () => void;
  /** Callback when zoom out button is pressed */
  onZoomOut?: () => void;
  /** Custom style for the container */
  style?: any;
}

/**
 * Map controls component providing location, zoom, and other map controls
 */
export const MapControls: React.FC<MapControlsProps> = ({
  onLocationPress,
  isLoadingLocation = false,
  locationDisabled = false,
  onZoomIn,
  onZoomOut,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Location Button */}
      <TouchableOpacity
        style={[
          styles.controlButton,
          locationDisabled && styles.disabledButton,
        ]}
        onPress={onLocationPress}
        disabled={locationDisabled || isLoadingLocation}
        activeOpacity={0.7}
      >
        {isLoadingLocation ? (
          <ActivityIndicator size="small" color="#0F2A44" />
        ) : (
          <Ionicons
            name="location"
            size={24}
            color={locationDisabled ? '#9CA3AF' : '#0F2A44'}
          />
        )}
      </TouchableOpacity>

      {/* Zoom Controls */}
      {(onZoomIn || onZoomOut) && (
        <View style={styles.zoomContainer}>
          {onZoomIn && (
            <TouchableOpacity
              style={[styles.controlButton, styles.zoomButton]}
              onPress={onZoomIn}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={24} color="#0F2A44" />
            </TouchableOpacity>
          )}
          
          {onZoomOut && (
            <TouchableOpacity
              style={[styles.controlButton, styles.zoomButton, styles.zoomButtonBottom]}
              onPress={onZoomOut}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={24} color="#0F2A44" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    bottom: 100, // Leave space for bottom sheet
    alignItems: 'center',
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#F3F4F6',
  },
  zoomContainer: {
    marginTop: 8,
  },
  zoomButton: {
    marginBottom: 0,
  },
  zoomButtonBottom: {
    marginTop: 1,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
});

export default MapControls;