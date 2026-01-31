import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { OnboardingScreen } from '../OnboardingScreen';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => ({
  useSharedValue: (initial: any) => ({ value: initial }),
  useAnimatedStyle: (fn: Function) => ({}),
  interpolate: (value: any, inputRange: any[], outputRange: any[]) => outputRange[1],
  Extrapolate: { CLAMP: 'clamp' },
  default: {
    View: require('react-native').View,
  },
}));

// Mock react-native components to avoid DevMenu issues
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  // Create a mock FlatList that doesn't require native modules
  const MockFlatList = (props: any) => {
    const { data, renderItem } = props;
    return RN.View({
      children: data?.map((item: any, index: number) => 
        renderItem({ item, index })
      ) || []
    });
  };

  return {
    ...RN,
    FlatList: MockFlatList,
    Dimensions: {
      get: () => ({ width: 375, height: 812 }),
    },
  };
});

describe('OnboardingScreen', () => {
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    mockOnComplete.mockClear();
  });

  it('renders correctly', () => {
    const { getByText } = render(
      <OnboardingScreen onComplete={mockOnComplete} />
    );

    expect(getByText('Encuentra tu hogar ideal')).toBeTruthy();
  });

  it('calls onComplete when skip button is pressed', () => {
    const { getByText } = render(
      <OnboardingScreen onComplete={mockOnComplete} />
    );

    fireEvent.press(getByText('Saltar'));
    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it('shows next button', () => {
    const { getByText } = render(
      <OnboardingScreen onComplete={mockOnComplete} />
    );

    expect(getByText('Siguiente')).toBeTruthy();
  });
});