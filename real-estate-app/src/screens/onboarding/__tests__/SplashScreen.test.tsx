import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { SplashScreen } from '../SplashScreen';

// Mock react-native-reanimated with a complete mock that doesn't break components
jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  const Text = require('react-native').Text;
  
  return {
    __esModule: true,
    default: {
      View: View,
      Text: Text,
    },
    useSharedValue: (initial: any) => ({ value: initial }),
    useAnimatedStyle: (fn: Function) => ({}),
    withTiming: (value: any, config?: any, callback?: Function) => {
      if (callback) {
        setTimeout(callback, 0);
      }
      return value;
    },
    withSequence: (...values: any[]) => values[values.length - 1],
    withDelay: (delay: number, value: any) => value,
    runOnJS: (fn: Function) => () => fn(),
  };
});

describe('SplashScreen', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders correctly with logo and title', () => {
    const mockOnComplete = jest.fn();
    const { getByText } = render(
      <SplashScreen onAnimationComplete={mockOnComplete} />
    );

    expect(getByText('RE')).toBeTruthy();
    expect(getByText('RealEstate')).toBeTruthy();
    expect(getByText('Encuentra tu hogar ideal')).toBeTruthy();
  });

  it('calls onAnimationComplete after timer expires', async () => {
    const mockOnComplete = jest.fn();
    render(<SplashScreen onAnimationComplete={mockOnComplete} />);

    // Fast-forward time by 2.5 seconds
    jest.advanceTimersByTime(2500);

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });
  });

  it('does not call onAnimationComplete before timer expires', () => {
    const mockOnComplete = jest.fn();
    render(<SplashScreen onAnimationComplete={mockOnComplete} />);

    // Fast-forward time by 2 seconds (less than 2.5)
    jest.advanceTimersByTime(2000);

    expect(mockOnComplete).not.toHaveBeenCalled();
  });

  it('cleans up timer on unmount', () => {
    const mockOnComplete = jest.fn();
    const { unmount } = render(
      <SplashScreen onAnimationComplete={mockOnComplete} />
    );

    unmount();

    // Fast-forward time after unmount
    jest.advanceTimersByTime(3000);

    expect(mockOnComplete).not.toHaveBeenCalled();
  });
});