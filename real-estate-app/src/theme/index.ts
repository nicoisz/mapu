/**
 * Theme system entry point
 * Exports all theme-related constants and utilities
 */

import { colors, type ColorKey, type TextColorKey } from './colors';
import { typography, type TypographyKey } from './typography';
import { spacing, type SpacingKey, getSpacing } from './spacing';

export { colors, type ColorKey, type TextColorKey } from './colors';
export { typography, type TypographyKey } from './typography';
export { spacing, type SpacingKey, getSpacing } from './spacing';

// Combined theme object for easy access
export const theme = {
  colors,
  typography,
  spacing,
} as const;

export type Theme = typeof theme;