import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { LoginScreen } from './LoginScreen';
import { RegisterScreen } from './RegisterScreen';
import { useAuthContext } from '../../contexts';
import { useAppState } from '../../contexts';

type AuthMode = 'login' | 'register';

interface AuthScreenProps {
  initialMode?: AuthMode;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const { isAuthenticated } = useAuthContext();
  const { navigateToMain } = useAppState();

  // Navigate to main app when authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigateToMain();
    }
  }, [isAuthenticated, navigateToMain]);

  const handleNavigateToRegister = () => {
    setMode('register');
  };

  const handleNavigateToLogin = () => {
    setMode('login');
  };

  const handleNavigateToForgotPassword = () => {
    // TODO: Implement forgot password screen
    console.log('Navigate to forgot password');
  };

  return (
    <View style={styles.container}>
      {mode === 'login' ? (
        <LoginScreen
          onNavigateToRegister={handleNavigateToRegister}
          onNavigateToForgotPassword={handleNavigateToForgotPassword}
        />
      ) : (
        <RegisterScreen
          onNavigateToLogin={handleNavigateToLogin}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});