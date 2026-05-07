/**
 * Theme tokens — mirrored from web src/index.css HSL CSS variables.
 * Primary: hsl(24 94% 53%) = #F97316 (Pictocart orange)
 *
 * All HSL → hex/rgba conversions done at build time so RN can consume directly.
 */

export const lightTheme = {
  background: '#FFFFFF',
  foreground: '#141821',
  card: '#FFFFFF',
  cardForeground: '#141821',
  popover: '#FFFFFF',
  popoverForeground: '#141821',
  primary: '#F97316', // hsl(24 94% 53%)
  primaryForeground: '#FFFFFF',
  primarySoft: '#FFF1E6', // hsl(24 94% 96%) — accent
  primaryStrong: '#C2410C', // hsl(24 94% 40%) — accent foreground
  secondary: '#F1F2F4', // hsl(220 14% 96%)
  secondaryForeground: '#141821',
  muted: '#F1F2F4',
  mutedForeground: '#6B7280', // hsl(220 9% 46%)
  accent: '#FFF1E6',
  accentForeground: '#C2410C',
  destructive: '#EF4444', // hsl(0 84% 60%)
  destructiveForeground: '#FFFFFF',
  success: '#22C55E', // hsl(142 71% 45%)
  successForeground: '#FFFFFF',
  warning: '#F59E0B', // hsl(38 92% 50%)
  warningForeground: '#FFFFFF',
  border: '#E5E7EB', // hsl(220 13% 91%)
  input: '#E5E7EB',
  ring: '#F97316',
  // Sidebar
  sidebarBackground: '#FCFCFC',
  sidebarForeground: '#374151',
  // Misc
  shadow: 'rgba(0,0,0,0.06)',
  shadowStrong: 'rgba(0,0,0,0.12)',
};

export const darkTheme = {
  background: '#0C0F14',
  foreground: '#F1F2F4',
  card: '#11151B',
  cardForeground: '#F1F2F4',
  popover: '#11151B',
  popoverForeground: '#F1F2F4',
  primary: '#F97316',
  primaryForeground: '#FFFFFF',
  primarySoft: '#3D1B07', // hsl(24 94% 12%)
  primaryStrong: '#FB923C', // hsl(24 94% 70%)
  secondary: '#1E232C',
  secondaryForeground: '#F1F2F4',
  muted: '#1E232C',
  mutedForeground: '#828A95',
  accent: '#3D1B07',
  accentForeground: '#FB923C',
  destructive: '#7F1D1D',
  destructiveForeground: '#FFFFFF',
  success: '#15803D',
  successForeground: '#FFFFFF',
  warning: '#B45309',
  warningForeground: '#FFFFFF',
  border: '#262B33',
  input: '#262B33',
  ring: '#F97316',
  sidebarBackground: '#0E1117',
  sidebarForeground: '#D1D5DB',
  shadow: 'rgba(0,0,0,0.3)',
  shadowStrong: 'rgba(0,0,0,0.5)',
};

export type Theme = typeof lightTheme;

export const radius = {
  sm: 6,
  md: 8,
  lg: 10, // 0.625rem from web
  xl: 14,
  full: 9999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const typography = {
  // Inter via system font stack — matches web 'Inter, system-ui'
  fontFamily: undefined, // RN uses system by default; expo-font load handled in _layout
  // Sizes
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 34,
};

// Order status → color (matches web semantics)
export const orderStatusColor: Record<string, string> = {
  pending: '#F59E0B',
  confirmed: '#3B82F6',
  processing: '#8B5CF6',
  shipped: '#06B6D4',
  delivered: '#22C55E',
  cancelled: '#EF4444',
  returned: '#6B7280',
};

export const paymentStatusColor: Record<string, string> = {
  pending: '#F59E0B',
  paid: '#22C55E',
  failed: '#EF4444',
  refunded: '#6B7280',
  cod: '#3B82F6',
};
