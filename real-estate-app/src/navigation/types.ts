// Navigation type definitions for the Real Estate App

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
  PropertyDetail: { propertyId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Map: undefined;
  Dashboard: undefined;
  Profile: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type OnboardingStackParamList = {
  Splash: undefined;
  Intro: undefined;
};

// Screen names as constants for type safety
export const SCREEN_NAMES = {
  // Root Stack
  SPLASH: 'Splash' as const,
  ONBOARDING: 'Onboarding' as const,
  AUTH: 'Auth' as const,
  MAIN: 'Main' as const,
  PROPERTY_DETAIL: 'PropertyDetail' as const,
  
  // Main Tab
  HOME: 'Home' as const,
  SEARCH: 'Search' as const,
  MAP: 'Map' as const,
  DASHBOARD: 'Dashboard' as const,
  PROFILE: 'Profile' as const,
  
  // Auth Stack
  LOGIN: 'Login' as const,
  REGISTER: 'Register' as const,
  FORGOT_PASSWORD: 'ForgotPassword' as const,
  
  // Onboarding Stack
  INTRO: 'Intro' as const,
} as const;