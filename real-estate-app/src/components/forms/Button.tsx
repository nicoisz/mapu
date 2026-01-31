import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  TouchableOpacityProps,
} from 'react-native';
import { colors, typography, spacing } from '../../theme';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  containerStyle?: object;
  textStyle?: object;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  containerStyle,
  textStyle,
  disabled,
  ...touchableProps
}) => {
  const isDisabled = disabled || loading;

  const getButtonStyle = () => {
    const baseStyle: any[] = [styles.button, styles[`button_${variant}`], styles[`button_${size}`]];
    
    if (fullWidth) {
      baseStyle.push(styles.buttonFullWidth);
    }
    
    if (isDisabled) {
      baseStyle.push(styles.buttonDisabled);
    }
    
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle: any[] = [styles.text, styles[`text_${variant}`], styles[`text_${size}`]];
    
    if (isDisabled) {
      baseStyle.push(styles.textDisabled);
    }
    
    return baseStyle;
  };

  return (
    <TouchableOpacity
      {...touchableProps}
      style={[getButtonStyle(), containerStyle]}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'primary' ? colors.background : colors.primary}
            style={styles.loader}
          />
        ) : (
          <>
            {leftIcon && (
              <View style={styles.leftIcon}>
                {leftIcon}
              </View>
            )}
            
            <Text style={[getTextStyle(), textStyle]}>
              {title}
            </Text>
            
            {rightIcon && (
              <View style={styles.rightIcon}>
                {rightIcon}
              </View>
            )}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  
  // Variants
  button_primary: {
    backgroundColor: colors.primary,
  },
  button_secondary: {
    backgroundColor: colors.secondary,
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  button_ghost: {
    backgroundColor: 'transparent',
  },
  
  // Sizes
  button_small: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 36,
  },
  button_medium: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  button_large: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    minHeight: 56,
  },
  
  // States
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonFullWidth: {
    width: '100%',
  },
  
  // Content
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Text styles
  text: {
    ...typography.button,
    textAlign: 'center',
  },
  text_primary: {
    color: colors.background,
  },
  text_secondary: {
    color: colors.background,
  },
  text_outline: {
    color: colors.primary,
  },
  text_ghost: {
    color: colors.primary,
  },
  
  // Text sizes
  text_small: {
    fontSize: 14,
  },
  text_medium: {
    fontSize: 16,
  },
  text_large: {
    fontSize: 18,
  },
  
  textDisabled: {
    opacity: 0.7,
  },
  
  // Icons
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
  
  // Loader
  loader: {
    marginHorizontal: spacing.sm,
  },
});