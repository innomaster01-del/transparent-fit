/**
 * Centralized design tokens. Used by every screen and component so visual
 * changes only happen in one place.
 */

export const colors = {
  // Background
  bgPrimary: '#08060f',
  bgSecondary: '#13101d',
  bgElevated: 'rgba(28, 22, 42, 0.95)',
  bgOverlay: 'rgba(0, 0, 0, 0.65)',

  // Brand
  purple: '#7C3AED',
  pink: '#DB2777',
  purpleSoft: 'rgba(124, 58, 237, 0.35)',

  // Text
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.65)',
  textTertiary: 'rgba(255, 255, 255, 0.4)',

  // Outline / overlay
  outlineWhite: 'rgba(255, 255, 255, 0.95)',
  outlineGlow: 'rgba(255, 255, 255, 0.45)',

  // States
  border: 'rgba(255, 255, 255, 0.12)',
  borderStrong: 'rgba(255, 255, 255, 0.25)',
};

export const space = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 22,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
};

export const fontSize = {
  caption: 10,
  small: 12,
  body: 14,
  title: 18,
  hero: 28,
};

export const fontFamily = {
  // Pick a distinctive display font in App.tsx via expo-font or react-native-asset
  display: 'Inter-Bold', // TODO swap for a more distinctive face when designer chooses
  body: 'Inter-Regular',
};

export const shadow = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  glow: {
    shadowColor: colors.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 8,
  },
};
