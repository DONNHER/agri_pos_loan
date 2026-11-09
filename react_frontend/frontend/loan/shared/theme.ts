/**
 * Single Source-of-Truth Theme Configuration for TikCredit.
 *
 * Modify tokens in `APP_THEME` below to re-theme the entire platform from one file:
 * - `applyAppTheme()` syncs CSS custom properties (`--theme-*`) consumed by Tailwind v4
 *   semantic utilities in `frontend/index.css` and `frontend/layout/AppLayout.tsx`.
 */

export interface AppTheme {
  colors: {
    // Neutral Canvas & Structural Surfaces (60% / 30%)
    canvas: string;
    surface: string;
    subtle: string;
    line: string;

    // Primary Typography on Light/Neutral Surfaces
    ink: string;
    inkSecondary: string;
    inkMuted: string;

    // Inverse High-Contrast Surfaces (Hero Anchors, Active Sidebar, Dark Actions)
    inverse: string;
    inverseHover: string;
    inverseElevated: string;
    inverseTrack: string;
    inkInverse: string;
    inkInverseSubtle: string;
    inkInverseMuted: string;

    // Brand & Secondary Accents (10% Accent Budget)
    brand: string;
    brandHover: string;
    brandSoft: string;
    brandTint: string;
    onBrand: string;
    accent: string;

    // Semantic Status States
    success: string;
    warning: string;
    danger: string;

    // Modal & Drawer Backdrop Base
    scrim: string;
  };
  fonts: {
    sans: string;
    display: string;
    mono: string;
  };
}

export const APP_THEME: AppTheme = {
  colors: {
    canvas: '#F4F7F4',
    surface: '#FFFFFF',
    subtle: '#EAF0EB',
    line: '#DDE6DE',

    ink: '#14261C',
    inkSecondary: '#3F5949',
    inkMuted: '#6E8A79',

    inverse: '#132B1E',
    inverseHover: '#1B3B2A',
    inverseElevated: '#1D3F2D',
    inverseTrack: '#264E38',
    inkInverse: '#FFFFFF',
    inkInverseSubtle: '#B8D9C2',
    inkInverseMuted: '#8EBA9B',

    // Agrarian Forest & Golden Harvest Gold
    brand: '#1E7E34',
    brandHover: '#166527',
    brandSoft: '#EBF7EE',
    brandTint: '#D4EED9',
    onBrand: '#FFFFFF',
    accent: '#D97706',

    success: '#15803D',
    warning: '#B45309',
    danger: '#B91C1C',

    scrim: '#000000',
  },
  fonts: {
    sans: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    display: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
  },
};

const CSS_TOKEN_MAP: Array<[keyof AppTheme['colors'], string]> = [
  ['canvas', '--theme-canvas'],
  ['surface', '--theme-surface'],
  ['subtle', '--theme-subtle'],
  ['line', '--theme-line'],
  ['ink', '--theme-ink'],
  ['inkSecondary', '--theme-ink-secondary'],
  ['inkMuted', '--theme-ink-muted'],
  ['inverse', '--theme-inverse'],
  ['inverseHover', '--theme-inverse-hover'],
  ['inverseElevated', '--theme-inverse-elevated'],
  ['inverseTrack', '--theme-inverse-track'],
  ['inkInverse', '--theme-ink-inverse'],
  ['inkInverseSubtle', '--theme-ink-inverse-subtle'],
  ['inkInverseMuted', '--theme-ink-inverse-muted'],
  ['brand', '--theme-brand'],
  ['brandHover', '--theme-brand-hover'],
  ['brandSoft', '--theme-brand-soft'],
  ['brandTint', '--theme-brand-tint'],
  ['onBrand', '--theme-on-brand'],
  ['accent', '--theme-accent'],
  ['success', '--theme-success'],
  ['warning', '--theme-warning'],
  ['danger', '--theme-danger'],
  ['scrim', '--theme-scrim'],
];

export function applyAppTheme(theme: AppTheme = APP_THEME): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  for (const [tokenKey, cssVar] of CSS_TOKEN_MAP) {
    root.style.setProperty(cssVar, theme.colors[tokenKey]);
  }
  root.style.setProperty('--theme-font-sans', theme.fonts.sans);
  root.style.setProperty('--theme-font-display', theme.fonts.display);
  root.style.setProperty('--theme-font-mono', theme.fonts.mono);
}
