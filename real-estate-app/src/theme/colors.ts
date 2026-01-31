/**
 * Color palette for the Real Estate Mobile App
 * Based on design requirements: primary deep blue, secondary soft green, accent coral
 */

export const colors = {
  // Primary colors
  primary: '#0F2A44',      // Deep blue - main interface elements
  secondary: '#4CAF93',    // Soft green - success states and accents
  accent: '#FF6B5A',       // Coral - call-to-action elements and highlights
  
  // Background colors
  background: '#FFFFFF',
  surface: '#F8F9FA',
  
  // Text colors
  text: {
    primary: '#1A1A1A',
    secondary: '#6B7280',
    light: '#9CA3AF',
  },
  
  // UI colors
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  
  // Opacity variants for overlays and states
  overlay: 'rgba(15, 42, 68, 0.6)', // Primary with opacity
  disabled: 'rgba(107, 114, 128, 0.5)', // Secondary text with opacity
} as const;

export type ColorKey = keyof typeof colors;
export type TextColorKey = keyof typeof colors.text;