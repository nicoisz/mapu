import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, AppStateProvider, useAppState, useAuthContext } from './src/contexts';
import { AppNavigator, navigationRef, NavigationService } from './src/navigation';
import { colors, typography, spacing } from './src/theme';

// Navigation handler component that responds to state changes
const NavigationHandler: React.FC = () => {
  const { hasCompletedOnboarding } = useAppState();
  const { isAuthenticated } = useAuthContext();

  useEffect(() => {
    // Handle navigation based on state changes
    if (!hasCompletedOnboarding) {
      // If onboarding not completed, go to onboarding
      NavigationService.navigateToOnboarding();
    } else if (!isAuthenticated) {
      // If onboarding completed but not authenticated, go to auth
      NavigationService.navigateToAuth();
    } else {
      // If both onboarding completed and authenticated, go to main
      NavigationService.navigateToMain();
    }
  }, [hasCompletedOnboarding, isAuthenticated]);

  return null;
};

// App content component that handles the navigation flow
const AppContent: React.FC = () => {
  const { isInitialized, isLoading, error, hasCompletedOnboarding } = useAppState();
  const { isAuthenticated, isLoading: authLoading } = useAuthContext();

  // Show loading screen while initializing
  if (!isInitialized || isLoading || authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  // Show error screen if initialization failed
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error de conexión</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Determine initial route based on app state and authentication
  const getInitialRouteName = () => {
    // If onboarding hasn't been completed, always show onboarding first
    if (!hasCompletedOnboarding) {
      return 'Onboarding';
    }
    // If onboarding is complete but user is not authenticated, show auth
    if (!isAuthenticated) {
      return 'Auth';
    }
    // If both onboarding is complete and user is authenticated, show main app
    return 'Main';
  };

  return (
    <NavigationContainer ref={navigationRef}>
      <NavigationHandler />
      <AppNavigator initialRouteName={getInitialRouteName()} />
    </NavigationContainer>
  );
};

// Root app component with providers
export default function App() {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <AuthProvider>
          <View style={styles.container}>
            <StatusBar style="dark" backgroundColor={colors.background} />
            <AppContent />
          </View>
        </AuthProvider>
      </AppStateProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  loadingText: {
    ...typography.body1,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  errorTitle: {
    ...typography.h2,
    color: colors.error,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  errorText: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
