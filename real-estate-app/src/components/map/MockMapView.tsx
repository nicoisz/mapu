import React, { useRef, useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  PanResponder, 
  Animated,
  TouchableOpacity,
} from 'react-native';
import { colors, typography, spacing } from '../../theme';

const { width, height } = Dimensions.get('window');

interface MockMapViewProps {
  children?: React.ReactNode;
  style?: any;
  region?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  onRegionChangeComplete?: (region: any) => void;
  showsUserLocation?: boolean;
  followsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  onRegionChange?: (region: any) => void;
  [key: string]: any;
}

/**
 * Interactive MockMapView component with pan, zoom, and clustering support
 * Simulates a real map experience for development
 */
export const MockMapView: React.FC<MockMapViewProps> = ({ 
  children, 
  style, 
  region,
  onRegionChangeComplete,
  onRegionChange,
  showsUserLocation,
  ...props 
}) => {
  // Animation values for pan and zoom
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const [currentRegion, setCurrentRegion] = useState(region || {
    latitude: -33.4489,
    longitude: -70.6693,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [zoomLevel, setZoomLevel] = useState(1);

  // Update region when prop changes
  useEffect(() => {
    if (region) {
      setCurrentRegion(region);
    }
  }, [region]);

  // Pan gesture handler
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
      },
      onPanResponderMove: (evt, gestureState) => {
        // Handle pan movement
        Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        })(evt, gestureState);

        // Update region based on pan - allow worldwide navigation
        const latMovement = gestureState.dy * 0.0001 * Math.max(currentRegion.latitudeDelta, 0.001);
        const lngMovement = gestureState.dx * 0.0001 * Math.max(currentRegion.longitudeDelta, 0.001);
        
        let newLatitude = currentRegion.latitude - latMovement;
        let newLongitude = currentRegion.longitude - lngMovement;
        
        // Clamp latitude to valid range (-90 to 90)
        newLatitude = Math.max(-85, Math.min(85, newLatitude));
        
        // Allow longitude to wrap around (-180 to 180)
        if (newLongitude > 180) newLongitude -= 360;
        if (newLongitude < -180) newLongitude += 360;
        
        const newRegion = {
          ...currentRegion,
          latitude: newLatitude,
          longitude: newLongitude,
        };
        
        setCurrentRegion(newRegion);
        onRegionChange?.(newRegion);
      },
      onPanResponderRelease: () => {
        pan.flattenOffset();
        onRegionChangeComplete?.(currentRegion);
      },
    })
  ).current;

  // Handle zoom gestures (simulated with double tap)
  const handleDoubleTap = useCallback(() => {
    const newZoom = zoomLevel > 5 ? 1 : zoomLevel * 2;
    setZoomLevel(newZoom);
    
    Animated.spring(scale, {
      toValue: newZoom,
      useNativeDriver: true,
    }).start();

    const zoomFactor = newZoom / zoomLevel;
    const newRegion = {
      ...currentRegion,
      latitudeDelta: Math.max(currentRegion.latitudeDelta / zoomFactor, 0.001),
      longitudeDelta: Math.max(currentRegion.longitudeDelta / zoomFactor, 0.001),
    };
    
    setCurrentRegion(newRegion);
    onRegionChangeComplete?.(newRegion);
  }, [zoomLevel, currentRegion, onRegionChangeComplete]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(zoomLevel * 1.5, 20); // Increased max zoom
    setZoomLevel(newZoom);
    
    Animated.spring(scale, {
      toValue: newZoom,
      useNativeDriver: true,
    }).start();

    const newRegion = {
      ...currentRegion,
      latitudeDelta: Math.max(currentRegion.latitudeDelta * 0.7, 0.001), // Min delta for max zoom
      longitudeDelta: Math.max(currentRegion.longitudeDelta * 0.7, 0.001),
    };
    
    setCurrentRegion(newRegion);
    onRegionChangeComplete?.(newRegion);
  }, [zoomLevel, currentRegion, onRegionChangeComplete]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(zoomLevel * 0.7, 0.1); // Decreased min zoom for world view
    setZoomLevel(newZoom);
    
    Animated.spring(scale, {
      toValue: newZoom,
      useNativeDriver: true,
    }).start();

    const newRegion = {
      ...currentRegion,
      latitudeDelta: Math.min(currentRegion.latitudeDelta * 1.4, 180), // Max delta for world view
      longitudeDelta: Math.min(currentRegion.longitudeDelta * 1.4, 360),
    };
    
    setCurrentRegion(newRegion);
    onRegionChangeComplete?.(newRegion);
  }, [zoomLevel, currentRegion, onRegionChangeComplete]);

  // Get neighborhood/city name based on coordinates
  const getLocationName = useCallback((lat: number, lng: number) => {
    // Find the nearest Chilean city based on coordinates
    const cities = [
      { name: 'Arica', lat: -18.4783, lng: -70.3126, region: 'Arica y Parinacota' },
      { name: 'Iquique', lat: -20.2307, lng: -70.1355, region: 'Tarapacá' },
      { name: 'Antofagasta', lat: -23.6509, lng: -70.3975, region: 'Antofagasta' },
      { name: 'Copiapó', lat: -27.3668, lng: -70.3323, region: 'Atacama' },
      { name: 'La Serena', lat: -29.9027, lng: -71.2519, region: 'Coquimbo' },
      { name: 'Valparaíso', lat: -33.0472, lng: -71.6127, region: 'Valparaíso' },
      { name: 'Viña del Mar', lat: -33.0153, lng: -71.5500, region: 'Valparaíso' },
      { name: 'Santiago', lat: -33.4489, lng: -70.6693, region: 'Metropolitana' },
      { name: 'Rancagua', lat: -34.1708, lng: -70.7394, region: "O'Higgins" },
      { name: 'Talca', lat: -35.4264, lng: -71.6554, region: 'Maule' },
      { name: 'Chillán', lat: -36.6067, lng: -72.1034, region: 'Ñuble' },
      { name: 'Concepción', lat: -36.8201, lng: -73.0444, region: 'Biobío' },
      { name: 'Temuco', lat: -38.7359, lng: -72.5904, region: 'Araucanía' },
      { name: 'Valdivia', lat: -39.8142, lng: -73.2459, region: 'Los Ríos' },
      { name: 'Puerto Montt', lat: -41.4693, lng: -72.9424, region: 'Los Lagos' },
      { name: 'Coyhaique', lat: -45.5752, lng: -72.0662, region: 'Aysén' },
      { name: 'Punta Arenas', lat: -53.1638, lng: -70.9171, region: 'Magallanes' },
    ];

    // Calculate distance to each city
    let nearestCity = cities[0];
    let minDistance = Math.sqrt(
      Math.pow(lat - nearestCity.lat, 2) + Math.pow(lng - nearestCity.lng, 2)
    );

    cities.forEach(city => {
      const distance = Math.sqrt(
        Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestCity = city;
      }
    });

    // If we're very close to a city (within ~0.1 degrees), show neighborhoods
    if (minDistance < 0.1) {
      if (nearestCity.name === 'Santiago') {
        const neighborhoods = [
          'Las Condes', 'Providencia', 'Ñuñoa', 'Vitacura', 'La Reina',
          'Maipú', 'Puente Alto', 'San Miguel', 'Santiago Centro', 'Recoleta'
        ];
        return neighborhoods[Math.floor(Math.abs(lat * lng * 1000) % neighborhoods.length)];
      } else if (nearestCity.name === 'Valparaíso') {
        const neighborhoods = ['Cerro Alegre', 'Cerro Concepción', 'Plan', 'Almendral'];
        return neighborhoods[Math.floor(Math.abs(lat * lng * 1000) % neighborhoods.length)];
      }
    }

    // Show city and region for medium distances
    if (minDistance < 2) {
      return `${nearestCity.name}, ${nearestCity.region}`;
    }

    // For far distances, show country or ocean
    if (lat >= -56 && lat <= -17.5 && lng >= -109 && lng <= -66) {
      return `Chile, ${nearestCity.region}`;
    } else if (lat >= -60 && lat <= 15 && lng >= -120 && lng <= -30) {
      return 'América del Sur';
    } else if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return 'Mundo';
    }

    return 'Ubicación desconocida';
  }, []);

  return (
    <View style={[styles.container, style]}>
      {/* Interactive Map Background */}
      <Animated.View 
        style={[
          styles.mapBackground,
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
              { scale: scale },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Dynamic grid pattern based on zoom */}
        <View style={styles.gridOverlay}>
          {Array.from({ length: Math.floor(40 / zoomLevel) }, (_, i) => (
            <View key={i} style={[styles.gridLine, { 
              opacity: Math.max(0.1, 0.3 - zoomLevel * 0.1) 
            }]} />
          ))}
        </View>
        
        {/* Neighborhood labels */}
        <View style={styles.neighborhoodLabels}>
          <Text style={[styles.neighborhoodText, { 
            opacity: zoomLevel > 1.5 ? 1 : 0.5,
            fontSize: Math.max(16, Math.min(32, 16 + zoomLevel * 4))
          }]}>
            {getLocationName(currentRegion.latitude, currentRegion.longitude)}
          </Text>
        </View>
        
        {/* User location indicator with pulsing animation */}
        {showsUserLocation && (
          <View style={styles.userLocation}>
            <Animated.View style={[styles.userLocationRing, {
              transform: [{ scale: scale }]
            }]} />
            <View style={styles.userLocationDot} />
          </View>
        )}
      </Animated.View>
      
      {/* Zoom Controls */}
      <View style={styles.zoomControls}>
        <TouchableOpacity 
          style={styles.zoomButton}
          onPress={handleZoomIn}
          activeOpacity={0.7}
        >
          <Text style={styles.zoomButtonText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.zoomButton}
          onPress={handleZoomOut}
          activeOpacity={0.7}
        >
          <Text style={styles.zoomButtonText}>−</Text>
        </TouchableOpacity>
      </View>

      {/* Region info overlay */}
      <View style={styles.regionInfo}>
        <Text style={styles.regionText}>
          {getLocationName(currentRegion.latitude, currentRegion.longitude)}
        </Text>
        <Text style={styles.coordinatesText}>
          Zoom: {zoomLevel.toFixed(1)}x • {currentRegion.latitude.toFixed(4)}, {currentRegion.longitude.toFixed(4)}
        </Text>
      </View>

      {/* Double tap overlay for zoom */}
      <TouchableOpacity 
        style={styles.doubleTapOverlay}
        onPress={handleDoubleTap}
        activeOpacity={1}
      >
        <View />
      </TouchableOpacity>
      
      {/* Property pins and other children */}
      <Animated.View 
        style={[
          styles.childrenContainer,
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
              { scale: scale },
            ],
          },
        ]}
        pointerEvents="box-none"
      >
        {children}
      </Animated.View>
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
    overflow: 'hidden',
  },
  mapBackground: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#E8F5E8',
  },
  gridOverlay: {
    position: 'absolute',
    top: -100,
    left: -100,
    right: -100,
    bottom: -100,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridLine: {
    width: '2%',
    height: '2%',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  neighborhoodLabels: {
    position: 'absolute',
    top: '30%',
    left: '20%',
    right: '20%',
    alignItems: 'center',
  },
  neighborhoodText: {
    ...typography.h3,
    color: 'rgba(0, 0, 0, 0.3)',
    fontWeight: '700',
    textAlign: 'center',
  },
  userLocation: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 20,
    height: 20,
    marginTop: -10,
    marginLeft: -10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    position: 'absolute',
    zIndex: 2,
  },
  userLocationRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    position: 'absolute',
    zIndex: 1,
  },
  zoomControls: {
    position: 'absolute',
    right: spacing.md,
    top: '40%',
    zIndex: 10,
  },
  zoomButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
    shadowColor: colors.text.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  zoomButtonText: {
    ...typography.h2,
    color: colors.text.primary,
    fontWeight: '300',
  },
  regionInfo: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: spacing.sm,
    borderRadius: 8,
    zIndex: 10,
    shadowColor: colors.text.primary,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
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
  doubleTapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  childrenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 6,
  },
  marker: {
    position: 'absolute',
    alignItems: 'center',
  },
  markerText: {
    fontSize: 24,
  },
});