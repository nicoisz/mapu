import type { Config } from 'tailwindcss'

/** Calidez Boutique — every color reads from a CSS variable (see globals.css),
 *  so a single utility like `bg-primary` works in both light and dark themes
 *  and opacity modifiers (`bg-primary/10`) keep working. */
const withAlpha = (v: string) => `rgb(var(${v}) / <alpha-value>)`

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: withAlpha('--primary'),
          container: withAlpha('--primary-container'),
        },
        'on-primary': withAlpha('--on-primary'),
        'primary-container': withAlpha('--primary-container'),
        'on-primary-container': withAlpha('--on-primary-container'),

        secondary: {
          DEFAULT: withAlpha('--secondary'),
          container: withAlpha('--secondary-container'),
        },
        'on-secondary': withAlpha('--on-secondary'),
        'secondary-container': withAlpha('--secondary-container'),
        'on-secondary-container': withAlpha('--on-secondary-container'),

        tertiary: withAlpha('--tertiary'),
        'on-tertiary': withAlpha('--on-tertiary'),
        'tertiary-container': withAlpha('--tertiary-container'),
        'on-tertiary-container': withAlpha('--on-tertiary-container'),

        background: withAlpha('--background'),
        'on-background': withAlpha('--on-background'),
        surface: withAlpha('--surface'),
        'surface-dim': withAlpha('--surface-dim'),
        'surface-bright': withAlpha('--surface-bright'),
        'surface-container-lowest': withAlpha('--surface-container-lowest'),
        'surface-container-low': withAlpha('--surface-container-low'),
        'surface-container': withAlpha('--surface-container'),
        'surface-container-high': withAlpha('--surface-container-high'),
        'surface-container-highest': withAlpha('--surface-container-highest'),
        'surface-variant': withAlpha('--surface-variant'),
        'surface-tint': withAlpha('--surface-tint'),
        'on-surface': withAlpha('--on-surface'),
        'on-surface-variant': withAlpha('--on-surface-variant'),

        outline: withAlpha('--outline'),
        'outline-variant': withAlpha('--outline-variant'),
        border: withAlpha('--border'),

        error: withAlpha('--error'),
        'on-error': withAlpha('--on-error'),
        'error-container': withAlpha('--error-container'),
        'on-error-container': withAlpha('--on-error-container'),

        'inverse-surface': withAlpha('--inverse-surface'),
        'inverse-on-surface': withAlpha('--inverse-on-surface'),
        'inverse-primary': withAlpha('--inverse-primary'),

        accent: {
          DEFAULT: withAlpha('--accent'),
          light: withAlpha('--accent-light'),
          dark: withAlpha('--accent-dark'),
        },
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        headline: ['Fraunces', 'Georgia', 'serif'],
      },
      spacing: {
        'section-gap': '64px',
      },
      boxShadow: {
        soft: '0 4px 16px -4px rgb(var(--shadow-color) / 0.12)',
        elevated: '0 12px 32px -8px rgb(var(--shadow-color) / 0.18)',
      },
    },
  },
  plugins: [],
}

export default config
