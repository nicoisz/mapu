import React, { useState } from 'react';
import { SplashScreen } from './SplashScreen';
import { OnboardingScreen } from './OnboardingScreen';
import { useAppState } from '../../contexts';

export const OnboardingFlow: React.FC = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { completeOnboarding, navigateToAuth } = useAppState();

  const handleSplashComplete = () => {
    setShowOnboarding(true);
  };

  const handleOnboardingComplete = async () => {
    await completeOnboarding();
    navigateToAuth();
  };

  if (!showOnboarding) {
    return <SplashScreen onAnimationComplete={handleSplashComplete} />;
  }

  return <OnboardingScreen onComplete={handleOnboardingComplete} />;
};