import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { OnboardingFlow } from '../OnboardingFlow';
import { AppStateProvider } from '../../../contexts/AppStateContext';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock NavigationService
const mockNavigationService = {
  navigateToAuth: jest.fn(),
  navigateToMain: jest.fn(),
  navigateToOnboarding: jest.fn(),
};

jest.mock('../../../navigation/NavigationService', () => ({
  NavigationService: mockNavigationService,
}));

// Mock the child components with simpler implementations
jest.mock('../SplashScreen', () => ({
  SplashScreen: jest.fn(({ onAnimationComplete }) => {
    // Simulate immediate completion for testing
    setTimeout(onAnimationComplete, 0);
    return null;
  }),
}));

jest.mock('../OnboardingScreen', () => ({
  OnboardingScreen: jest.fn(() => null),
}));

describe('OnboardingFlow', () => {
  const { SplashScreen } = require('../SplashScreen');
  const { OnboardingScreen } = require('../OnboardingScreen');

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <AppStateProvider>
        {component}
      </AppStateProvider>
    );
  };

  it('initially renders splash screen', () => {
    renderWithProvider(<OnboardingFlow />);

    expect(SplashScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        onAnimationComplete: expect.any(Function),
      }),
      expect.anything()
    );
    expect(OnboardingScreen).not.toHaveBeenCalled();
  });

  it('transitions to onboarding screen after splash completes', async () => {
    renderWithProvider(<OnboardingFlow />);

    // Fast-forward timers to trigger splash completion
    jest.runAllTimers();

    await waitFor(() => {
      expect(OnboardingScreen).toHaveBeenCalledWith(
        expect.objectContaining({
          onComplete: expect.any(Function),
        }),
        expect.anything()
      );
    });
  });

  it('navigates to auth when onboarding completes', async () => {
    renderWithProvider(<OnboardingFlow />);

    // Get the onboarding completion callback and call it
    jest.runAllTimers();

    await waitFor(() => {
      expect(OnboardingScreen).toHaveBeenCalled();
    });

    // Simulate onboarding completion
    const onboardingCall = OnboardingScreen.mock.calls[0];
    const onboardingComplete = onboardingCall[0].onComplete;
    await onboardingComplete();

    expect(mockNavigationService.navigateToAuth).toHaveBeenCalledTimes(1);
  });

  it('maintains proper component lifecycle', () => {
    const { unmount } = renderWithProvider(<OnboardingFlow />);

    expect(SplashScreen).toHaveBeenCalledTimes(1);
    
    unmount();
    
    // Should not cause any errors on unmount
    expect(() => jest.runAllTimers()).not.toThrow();
  });
});