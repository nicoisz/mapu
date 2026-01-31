/**
 * Spacing system for the Real Estate Mobile App
 * Provides consistent spacing values throughout the application
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export type SpacingKey = keyof typeof spacing;

/**
 * Helper function to get spacing value
 */
export const getSpacing = (key: SpacingKey): number => spacing[key];