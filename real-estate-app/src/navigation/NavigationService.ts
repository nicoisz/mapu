import { NavigationContainerRef, CommonActions } from '@react-navigation/native';
import { createRef } from 'react';
import { RootStackParamList, SCREEN_NAMES } from './types';

// Navigation reference for programmatic navigation
export const navigationRef = createRef<NavigationContainerRef<RootStackParamList>>();

// Navigation service for programmatic navigation throughout the app
export class NavigationService {
  // Navigate to a specific screen
  static navigate<T extends keyof RootStackParamList>(
    name: T,
    ...params: RootStackParamList[T] extends undefined 
      ? [params?: undefined] 
      : [params: RootStackParamList[T]]
  ) {
    if (navigationRef.current?.isReady()) {
      navigationRef.current.navigate(name as any, params[0] as any);
    }
  }

  // Go back to previous screen
  static goBack() {
    if (navigationRef.current?.isReady() && navigationRef.current.canGoBack()) {
      navigationRef.current.goBack();
    }
  }

  // Reset navigation stack to a specific screen
  static reset<T extends keyof RootStackParamList>(
    name: T,
    params?: RootStackParamList[T]
  ) {
    if (navigationRef.current?.isReady()) {
      navigationRef.current.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name, params }],
        })
      );
    }
  }

  // Get current route name
  static getCurrentRouteName(): string | undefined {
    if (navigationRef.current?.isReady()) {
      return navigationRef.current.getCurrentRoute()?.name;
    }
    return undefined;
  }

  // Check if navigation is ready
  static isReady(): boolean {
    return navigationRef.current?.isReady() ?? false;
  }

  // Specific navigation methods for common flows
  static navigateToAuth() {
    this.reset(SCREEN_NAMES.AUTH);
  }

  static navigateToMain() {
    this.reset(SCREEN_NAMES.MAIN);
  }

  static navigateToOnboarding() {
    this.reset(SCREEN_NAMES.ONBOARDING);
  }

  static navigateToPropertyDetail(propertyId: string) {
    this.navigate(SCREEN_NAMES.PROPERTY_DETAIL, { propertyId });
  }
}