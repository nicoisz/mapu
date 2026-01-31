// UI-specific types and interfaces

/**
 * Loading states for async operations
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Generic async state wrapper
 */
export interface AsyncState<T> {
  data?: T;
  loading: boolean;
  error?: string;
  lastUpdated?: Date;
}

/**
 * Form validation state
 */
export interface FormFieldState {
  value: string;
  error?: string;
  touched: boolean;
  valid: boolean;
}

/**
 * Modal configuration
 */
export interface ModalConfig {
  isVisible: boolean;
  title?: string;
  content?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  type?: 'info' | 'warning' | 'error' | 'success';
}

/**
 * Toast notification configuration
 */
export interface ToastConfig {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number; // in milliseconds
  action?: {
    label: string;
    onPress: () => void;
  };
}

/**
 * Bottom sheet snap points and configuration
 */
export interface BottomSheetConfig {
  snapPoints: (string | number)[];
  initialSnapIndex?: number;
  enablePanDownToClose?: boolean;
  backdropComponent?: React.ComponentType;
}

/**
 * Map pin state for property markers
 */
export interface MapPinState {
  propertyId: string;
  isActive: boolean;
  isHovered: boolean;
  animationProgress: number;
}

/**
 * Search suggestion item
 */
export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'location' | 'property' | 'keyword';
  subtitle?: string;
  icon?: string;
}

/**
 * Filter chip for UI display
 */
export interface FilterChip {
  id: string;
  label: string;
  value: any;
  removable: boolean;
  color?: string;
}

/**
 * Navigation route parameters
 */
export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
  PropertyDetail: { propertyId: string };
  PropertyCreate: undefined;
  PropertyEdit: { propertyId: string };
  UserProfile: { userId?: string };
  Settings: undefined;
  Search: { query?: string };
  Map: { region?: any };
};

/**
 * Main tab navigation parameters
 */
export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Favorites: undefined;
  Dashboard: undefined;
  Profile: undefined;
};

/**
 * Theme mode
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Haptic feedback types
 */
export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

/**
 * Animation timing configuration
 */
export interface AnimationConfig {
  duration: number;
  easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  delay?: number;
}

/**
 * Gesture configuration
 */
export interface GestureConfig {
  enabled: boolean;
  minDistance?: number;
  maxDistance?: number;
  direction?: 'horizontal' | 'vertical' | 'both';
}