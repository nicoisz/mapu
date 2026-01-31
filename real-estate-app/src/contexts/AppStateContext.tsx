import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationService } from '../navigation';

// App state types
export type AppFlow = 'onboarding' | 'auth' | 'main';

export interface AppState {
  currentFlow: AppFlow;
  hasCompletedOnboarding: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
}

// Action types
type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_ONBOARDING_COMPLETED'; payload: boolean }
  | { type: 'SET_CURRENT_FLOW'; payload: AppFlow }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'RESET_APP_STATE' };

// Initial state
const initialState: AppState = {
  currentFlow: 'onboarding',
  hasCompletedOnboarding: false,
  isInitialized: false,
  isLoading: true,
  error: null,
};

// Reducer
const appStateReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
    case 'SET_ONBOARDING_COMPLETED':
      return { ...state, hasCompletedOnboarding: action.payload };
    case 'SET_CURRENT_FLOW':
      return { ...state, currentFlow: action.payload };
    case 'COMPLETE_ONBOARDING':
      return { 
        ...state, 
        hasCompletedOnboarding: true, 
        currentFlow: 'auth' 
      };
    case 'RESET_APP_STATE':
      return { ...initialState, isLoading: false };
    default:
      return state;
  }
};

// Context interface
interface AppStateContextType extends AppState {
  // Actions
  completeOnboarding: () => Promise<void>;
  navigateToAuth: () => void;
  navigateToMain: () => void;
  resetAppState: () => Promise<void>;
  clearError: () => void;
  
  // Utilities
  isFirstLaunch: () => boolean;
}

// Context
const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

// Storage keys
const STORAGE_KEYS = {
  ONBOARDING_COMPLETED: '@RealEstate:onboarding_completed',
  FIRST_LAUNCH: '@RealEstate:first_launch',
} as const;

// Provider props
interface AppStateProviderProps {
  children: ReactNode;
}

// Provider component
export const AppStateProvider: React.FC<AppStateProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appStateReducer, initialState);

  // Initialize app state on mount
  useEffect(() => {
    initializeAppState();
  }, []);

  const initializeAppState = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Check if onboarding has been completed
      const onboardingCompleted = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
      const hasCompletedOnboarding = onboardingCompleted === 'true';
      
      dispatch({ type: 'SET_ONBOARDING_COMPLETED', payload: hasCompletedOnboarding });
      
      // Set initial flow based on onboarding status
      if (hasCompletedOnboarding) {
        dispatch({ type: 'SET_CURRENT_FLOW', payload: 'auth' });
      } else {
        dispatch({ type: 'SET_CURRENT_FLOW', payload: 'onboarding' });
      }
      
      dispatch({ type: 'SET_INITIALIZED', payload: true });
    } catch (error) {
      console.error('Failed to initialize app state:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize app' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
      dispatch({ type: 'COMPLETE_ONBOARDING' });
    } catch (error) {
      console.error('Failed to save onboarding completion:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to save onboarding progress' });
    }
  };

  const navigateToAuth = () => {
    dispatch({ type: 'SET_CURRENT_FLOW', payload: 'auth' });
  };

  const navigateToMain = () => {
    dispatch({ type: 'SET_CURRENT_FLOW', payload: 'main' });
  };

  const resetAppState = async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ONBOARDING_COMPLETED,
        STORAGE_KEYS.FIRST_LAUNCH,
      ]);
      dispatch({ type: 'RESET_APP_STATE' });
      NavigationService.navigateToOnboarding();
    } catch (error) {
      console.error('Failed to reset app state:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to reset app' });
    }
  };

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const isFirstLaunch = () => {
    return !state.hasCompletedOnboarding;
  };

  const contextValue: AppStateContextType = {
    ...state,
    completeOnboarding,
    navigateToAuth,
    navigateToMain,
    resetAppState,
    clearError,
    isFirstLaunch,
  };

  return (
    <AppStateContext.Provider value={contextValue}>
      {children}
    </AppStateContext.Provider>
  );
};

// Hook to use app state context
export const useAppState = (): AppStateContextType => {
  const context = useContext(AppStateContext);
  
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  
  return context;
};