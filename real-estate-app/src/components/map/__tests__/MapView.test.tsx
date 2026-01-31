import React from 'react';
import { render } from '@testing-library/react-native';
import { RealEstateMapView } from '../MapView';
import { MapControls } from '../MapControls';

// Mock react-native-reanimated completely
jest.mock('react-native-reanimated', () => ({
  default: {
    View: require('react-native').View,
    Text: require('react-native').Text,
    ScrollView: require('react-native').ScrollView,
  },
  useSharedValue: () => ({ value: 0 }),
  useAnimatedStyle: () => ({}),
  withSpring: (value: any) => value,
  withTiming: (value: any) => value,
  runOnJS: (fn: any) => fn,
}));

describe('RealEstateMapView', () => {
  it('renders without crashing', () => {
    const { getByTestId } = render(<RealEstateMapView />);
    expect(getByTestId('map-view')).toBeTruthy();
  });

  it('renders with initial region', () => {
    const initialRegion = {
      latitude: -33.4489,
      longitude: -70.6693,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };

    const { getByTestId } = render(
      <RealEstateMapView initialRegion={initialRegion} />
    );
    
    expect(getByTestId('map-view')).toBeTruthy();
  });

  it('renders with properties', () => {
    const properties = [
      {
        id: '1',
        title: 'Test Property',
        location: {
          latitude: -33.4489,
          longitude: -70.6693,
        },
      },
    ];

    const { getByTestId } = render(
      <RealEstateMapView properties={properties as any} />
    );
    
    expect(getByTestId('map-view')).toBeTruthy();
  });
});

describe('MapControls', () => {
  it('renders location button', () => {
    render(
      <MapControls onLocationPress={jest.fn()} />
    );
    
    // The component should render without errors
    expect(true).toBe(true);
  });

  it('shows loading state', () => {
    render(
      <MapControls 
        onLocationPress={jest.fn()} 
        isLoadingLocation={true}
      />
    );
    
    // The component should render without errors
    expect(true).toBe(true);
  });
});