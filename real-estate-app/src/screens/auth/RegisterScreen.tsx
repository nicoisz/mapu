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
import { UserType } from '../../data/models/enums';
import { SocialProvider } from '../../data/models/user';

interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  userType: UserType;
  phone?: string;
  companyName?: string;
  licenseNumber?: string;
}

interface RegisterScreenProps {
  onNavigateToLogin: () => void;
}

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  userType: UserType;
  companyName: string;
  licenseNumber: string;
  phone: string;
}

interface RegisterErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  companyName?: string;
  licenseNumber?: string;
  phone?: string;
  general?: string;
}

const userTypeOptions = [
  { value: UserType.INDIVIDUAL, label: 'Particular', description: 'Busco comprar o arrendar' },
  { value: UserType.AGENT, label: 'Corredor', description: 'Soy corredor de propiedades' },
  { value: UserType.COMPANY, label: 'Inmobiliaria', description: 'Represento una inmobiliaria' },
];

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onNavigateToLogin,
}) => {
  const { register, loginWithSocial, isLoading, clearError } = useAuthContext();
  
  const [form, setForm] = useState<RegisterForm>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: UserType.INDIVIDUAL,
    companyName: '',
    licenseNumber: '',
    phone: '',
  });
  
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);

  const validateForm = (): boolean => {
    const newErrors: RegisterErrors = {};

    // Name validation
    if (!form.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (form.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }

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

    // Confirm password validation
    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    // Company name validation (for agents and companies)
    if (form.userType === UserType.COMPANY && !form.companyName.trim()) {
      newErrors.companyName = 'El nombre de la empresa es requerido';
    }

    // License number validation (for agents and companies)
    if ((form.userType === UserType.AGENT || form.userType === UserType.COMPANY) && !form.licenseNumber.trim()) {
      newErrors.licenseNumber = 'El número de licencia es requerido';
    }

    // Phone validation (optional but if provided, should be valid)
    if (form.phone.trim() && !/^\+?[\d\s\-\(\)]{8,}$/.test(form.phone.trim())) {
      newErrors.phone = 'Formato de teléfono inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof RegisterForm, value: string | UserType) => {
    setForm(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field as keyof RegisterErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Clear general error
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }
    
    clearError();
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const userData: CreateUserRequest = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        userType: form.userType,
        phone: form.phone.trim() || undefined,
        companyName: form.companyName.trim() || undefined,
        licenseNumber: form.licenseNumber.trim() || undefined,
      };

      const result = await register(userData);
      
      if (!result.success) {
        setErrors({ general: result.error || 'Error al crear la cuenta' });
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
          result.error || `Error al registrarse con ${provider}`,
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

  const renderUserTypeSelector = () => (
    <View style={styles.userTypeContainer}>
      <Text style={styles.userTypeLabel}>Tipo de usuario *</Text>
      {userTypeOptions.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.userTypeOption,
            form.userType === option.value && styles.userTypeOptionSelected,
          ]}
          onPress={() => handleInputChange('userType', option.value)}
          activeOpacity={0.7}
        >
          <View style={styles.userTypeContent}>
            <Text style={[
              styles.userTypeTitle,
              form.userType === option.value && styles.userTypeTextSelected,
            ]}>
              {option.label}
            </Text>
            <Text style={[
              styles.userTypeDescription,
              form.userType === option.value && styles.userTypeTextSelected,
            ]}>
              {option.description}
            </Text>
          </View>
          <View style={[
            styles.userTypeRadio,
            form.userType === option.value && styles.userTypeRadioSelected,
          ]}>
            {form.userType === option.value && (
              <View style={styles.userTypeRadioInner} />
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

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
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>
              Únete y comienza a encontrar propiedades
            </Text>
          </View>

          {/* Registration Form */}
          <View style={styles.form}>
            <Input
              label="Nombre completo"
              value={form.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="Tu nombre completo"
              autoCapitalize="words"
              error={errors.name}
              required
            />

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
              label="Teléfono"
              value={form.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              placeholder="+56 9 1234 5678"
              keyboardType="phone-pad"
              error={errors.phone}
            />

            {renderUserTypeSelector()}

            {form.userType === UserType.COMPANY && (
              <Input
                label="Nombre de la empresa"
                value={form.companyName}
                onChangeText={(value) => handleInputChange('companyName', value)}
                placeholder="Nombre de tu inmobiliaria"
                error={errors.companyName}
                required
              />
            )}

            {(form.userType === UserType.AGENT || form.userType === UserType.COMPANY) && (
              <Input
                label="Número de licencia"
                value={form.licenseNumber}
                onChangeText={(value) => handleInputChange('licenseNumber', value)}
                placeholder="Número de licencia profesional"
                error={errors.licenseNumber}
                required
              />
            )}

            <Input
              label="Contraseña"
              value={form.password}
              onChangeText={(value) => handleInputChange('password', value)}
              placeholder="Mínimo 6 caracteres"
              isPassword
              error={errors.password}
              required
            />

            <Input
              label="Confirmar contraseña"
              value={form.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              placeholder="Repite tu contraseña"
              isPassword
              error={errors.confirmPassword}
              required
            />

            {errors.general && (
              <Text style={styles.generalError}>{errors.general}</Text>
            )}

            <Button
              title="Crear Cuenta"
              onPress={handleRegister}
              loading={isLoading}
              fullWidth
              containerStyle={styles.registerButton}
            />
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>O regístrate con</Text>
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

          {/* Login Link */}
          <View style={styles.loginLink}>
            <Text style={styles.loginText}>
              ¿Ya tienes cuenta?{' '}
            </Text>
            <TouchableOpacity
              onPress={onNavigateToLogin}
              activeOpacity={0.7}
            >
              <Text style={styles.loginLinkText}>
                Inicia sesión aquí
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
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
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
    marginBottom: spacing.lg,
  },
  registerButton: {
    marginTop: spacing.md,
  },
  generalError: {
    ...typography.body2,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  userTypeContainer: {
    marginBottom: spacing.md,
  },
  userTypeLabel: {
    ...typography.body2,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  userTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  userTypeOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  userTypeContent: {
    flex: 1,
  },
  userTypeTitle: {
    ...typography.body1,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  userTypeDescription: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  userTypeTextSelected: {
    color: colors.primary,
  },
  userTypeRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userTypeRadioSelected: {
    borderColor: colors.primary,
  },
  userTypeRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
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
    marginBottom: spacing.lg,
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  loginText: {
    ...typography.body2,
    color: colors.text.secondary,
  },
  loginLinkText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },
});