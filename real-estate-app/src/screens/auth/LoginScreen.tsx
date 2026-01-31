import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input, Button, SocialButton } from '../../components/forms';
import { colors, typography, spacing } from '../../theme';
import { useAuthContext } from '../../contexts/AuthContext';
import { SocialProvider } from '../../data/models/user';

interface LoginScreenProps {
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword?: () => void;
}

interface LoginForm {
  email: string;
  password: string;
}

interface LoginErrors {
  email?: string;
  password?: string;
  general?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onNavigateToRegister,
  onNavigateToForgotPassword,
}) => {
  const { login, loginWithSocial, isLoading, clearError } = useAuthContext();
  
  const [form, setForm] = useState<LoginForm>({
    email: '',
    password: '',
  });
  
  const [errors, setErrors] = useState<LoginErrors>({});
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);

  const validateForm = (): boolean => {
    const newErrors: LoginErrors = {};

    // Email validation
    if (!form.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Formato de email inválido';
    }

    // Password validation
    if (!form.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (form.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof LoginForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Clear general error
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }
    
    clearError();
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const result = await login(form.email.trim(), form.password);
      
      if (!result.success) {
        setErrors({ general: result.error || 'Error al iniciar sesión' });
      }
      // Success is handled by the auth context and navigation
    } catch (error) {
      setErrors({ general: 'Error interno del servidor' });
    }
  };

  const handleSocialLogin = async (provider: SocialProvider) => {
    try {
      setSocialLoading(provider);
      clearError();
      
      const result = await loginWithSocial(provider);
      
      if (!result.success) {
        Alert.alert(
          'Error de autenticación',
          result.error || `Error al iniciar sesión con ${provider}`,
          [{ text: 'OK' }]
        );
      }
      // Success is handled by the auth context and navigation
    } catch (error) {
      Alert.alert(
        'Error',
        'Error interno del servidor',
        [{ text: 'OK' }]
      );
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Bienvenido</Text>
            <Text style={styles.subtitle}>
              Inicia sesión para encontrar tu hogar ideal
            </Text>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            <Input
              label="Email"
              value={form.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="tu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
              required
            />

            <Input
              label="Contraseña"
              value={form.password}
              onChangeText={(value) => handleInputChange('password', value)}
              placeholder="Tu contraseña"
              isPassword
              error={errors.password}
              required
            />

            {errors.general && (
              <Text style={styles.generalError}>{errors.general}</Text>
            )}

            <Button
              title="Iniciar Sesión"
              onPress={handleLogin}
              loading={isLoading}
              fullWidth
              containerStyle={styles.loginButton}
            />

            {/* Forgot Password */}
            {onNavigateToForgotPassword && (
              <TouchableOpacity
                onPress={onNavigateToForgotPassword}
                style={styles.forgotPassword}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPasswordText}>
                  ¿Olvidaste tu contraseña?
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>O continúa con</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login */}
          <View style={styles.socialLogin}>
            <SocialButton
              provider="google"
              onPress={() => handleSocialLogin('google')}
              loading={socialLoading === 'google'}
              disabled={socialLoading !== null}
            />
            
            <SocialButton
              provider="apple"
              onPress={() => handleSocialLogin('apple')}
              loading={socialLoading === 'apple'}
              disabled={socialLoading !== null}
            />
            
            <SocialButton
              provider="facebook"
              onPress={() => handleSocialLogin('facebook')}
              loading={socialLoading === 'facebook'}
              disabled={socialLoading !== null}
            />
          </View>

          {/* Register Link */}
          <View style={styles.registerLink}>
            <Text style={styles.registerText}>
              ¿No tienes cuenta?{' '}
            </Text>
            <TouchableOpacity
              onPress={onNavigateToRegister}
              activeOpacity={0.7}
            >
              <Text style={styles.registerLinkText}>
                Regístrate aquí
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body1,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    marginBottom: spacing.xl,
  },
  loginButton: {
    marginTop: spacing.md,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  forgotPasswordText: {
    ...typography.body2,
    color: colors.primary,
  },
  generalError: {
    ...typography.body2,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.body2,
    color: colors.text.light,
    marginHorizontal: spacing.md,
  },
  socialLogin: {
    marginBottom: spacing.xl,
  },
  registerLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  registerText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  registerLinkText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },
});