import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacityProps,
} from 'react-native';
import { colors, typography, spacing } from '../../theme';
import { SocialProvider } from '../../data/models/user';

interface SocialButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  provider: SocialProvider;
  loading?: boolean;
  containerStyle?: object;
}

const socialConfig = {
  google: {
    title: 'Continuar con Google',
    icon: '🔍', // In a real app, use proper icons
    backgroundColor: '#FFFFFF',
    textColor: '#1A1A1A',
    borderColor: '#E5E7EB',
  },
  apple: {
    title: 'Continuar con Apple',
    icon: '🍎',
    backgroundColor: '#000000',
    textColor: '#FFFFFF',
    borderColor: '#000000',
  },
  facebook: {
    title: 'Continuar con Facebook',
    icon: '📘',
    backgroundColor: '#1877F2',
    textColor: '#FFFFFF',
    borderColor: '#1877F2',
  },
};

export const SocialButton: React.FC<SocialButtonProps> = ({
  provider,
  loading = false,
  containerStyle,
  disabled,
  ...touchableProps
}) => {
  const config = socialConfig[provider];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      {...touchableProps}
      style={[
        styles.button,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        },
        isDisabled && styles.buttonDisabled,
        containerStyle,
      ]}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={config.textColor}
            style={styles.loader}
          />
        ) : (
          <>
            <Text style={styles.icon}>{config.icon}</Text>
            <Text
              style={[
                styles.text,
                { color: config.textColor },
                isDisabled && styles.textDisabled,
              ]}
            >
              {config.title}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  text: {
    ...typography.button,
    fontSize: 16,
  },
  textDisabled: {
    opacity: 0.7,
  },
  loader: {
    marginHorizontal: spacing.sm,
  },
});