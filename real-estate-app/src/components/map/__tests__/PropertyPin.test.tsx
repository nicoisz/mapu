import React from 'react';
import { render } from '@testing-library/react-native';
import { PropertyPin } from '../PropertyPin';
import { generateProperty } from '../../../data/mock/generators';

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

describe('PropertyPin Component', () => {
  const mockProperty = generateProperty();
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(
      <PropertyPin
        property={mockProperty}
        isActive={false}
        onPress={mockOnPress}
      />
    );
  });

  test('renders property price', () => {
    const { getByText } = render(
      <PropertyPin
        property={mockProperty}
        isActive={false}
        onPress={mockOnPress}
      />
    );
    
    expect(getByText(mockProperty.pricing.price.toLocaleString())).toBeTruthy();
  });
});