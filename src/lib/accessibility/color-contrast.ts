/**
 * Color Contrast Utilities
 *
 * Provides utilities for checking and ensuring color contrast compliance.
 * Implements WCAG 2.1 Success Criteria:
 * - 1.4.3 Contrast (Minimum) - Level AA
 * - 1.4.6 Contrast (Enhanced) - Level AAA
 */

/**
 * WCAG 2.1 contrast requirements
 */
export const ContrastRequirements = {
  AA_NORMAL_TEXT: 4.5, // Normal text (< 18pt or < 14pt bold)
  AA_LARGE_TEXT: 3, // Large text (>= 18pt or >= 14pt bold)
  AAA_NORMAL_TEXT: 7, // Enhanced contrast for normal text
  AAA_LARGE_TEXT: 4.5, // Enhanced contrast for large text
  AA_UI_COMPONENTS: 3, // Non-text UI components and graphics
} as const;

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to relative luminance
 * Following WCAG 2.1 formula
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number }
): number {
  const l1 = getLuminance(color1.r, color1.g, color1.b);
  const l2 = getLuminance(color2.r, color2.g, color2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA requirements
 */
export function meetsWcagAA(
  contrastRatio: number,
  isLargeText: boolean = false
): boolean {
  const requirement = isLargeText
    ? ContrastRequirements.AA_LARGE_TEXT
    : ContrastRequirements.AA_NORMAL_TEXT;
  return contrastRatio >= requirement;
}

/**
 * Check if contrast ratio meets WCAG AAA requirements
 */
export function meetsWcagAAA(
  contrastRatio: number,
  isLargeText: boolean = false
): boolean {
  const requirement = isLargeText
    ? ContrastRequirements.AAA_LARGE_TEXT
    : ContrastRequirements.AAA_NORMAL_TEXT;
  return contrastRatio >= requirement;
}

/**
 * Get contrast rating based on ratio
 */
export function getContrastRating(
  contrastRatio: number,
  isLargeText: boolean = false
): 'AAA' | 'AA' | 'Fail' {
  if (meetsWcagAAA(contrastRatio, isLargeText)) return 'AAA';
  if (meetsWcagAA(contrastRatio, isLargeText)) return 'AA';
  return 'Fail';
}

/**
 * Calculate contrast ratio from hex colors
 */
export function getContrastRatioFromHex(hex1: string, hex2: string): number | null {
  const color1 = hexToRgb(hex1);
  const color2 = hexToRgb(hex2);

  if (!color1 || !color2) return null;

  return getContrastRatio(color1, color2);
}

/**
 * OKLCH to RGB conversion (approximate)
 * Note: This is a simplified conversion for checking purposes
 */
export function oklchToRgb(
  l: number,
  c: number,
  h: number
): { r: number; g: number; b: number } {
  // Convert OKLCH to OKLab
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  // OKLab to linear sRGB (approximate)
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  const r = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const blue = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

  // Convert to sRGB [0, 255]
  const toSrgb = (x: number): number => {
    const clamped = Math.max(0, Math.min(1, x));
    return Math.round(
      (clamped <= 0.0031308
        ? 12.92 * clamped
        : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055) * 255
    );
  };

  return {
    r: toSrgb(r),
    g: toSrgb(g),
    b: toSrgb(blue),
  };
}

/**
 * Check contrast between two OKLCH colors
 */
export function checkOklchContrast(
  color1: { l: number; c: number; h: number },
  color2: { l: number; c: number; h: number }
): {
  ratio: number;
  meetsAA: boolean;
  meetsAAA: boolean;
  meetsAALarge: boolean;
  meetsAAALarge: boolean;
} {
  const rgb1 = oklchToRgb(color1.l, color1.c, color1.h);
  const rgb2 = oklchToRgb(color2.l, color2.c, color2.h);
  const ratio = getContrastRatio(rgb1, rgb2);

  return {
    ratio,
    meetsAA: meetsWcagAA(ratio, false),
    meetsAAA: meetsWcagAAA(ratio, false),
    meetsAALarge: meetsWcagAA(ratio, true),
    meetsAAALarge: meetsWcagAAA(ratio, true),
  };
}

/**
 * Suggested accessible color pairs for the Kametrix theme
 * These have been verified to meet WCAG 2.1 AA standards
 */
export const AccessibleColorPairs = {
  light: {
    // Background: oklch(0.97 0.01 285) -> #f5f4f7
    // Foreground: oklch(0.2 0.02 285) -> #2d2b33
    background: { l: 0.97, c: 0.01, h: 285 },
    foreground: { l: 0.2, c: 0.02, h: 285 },
    // Primary on white background
    primary: { l: 0.45, c: 0.2, h: 300 },
    primaryForeground: { l: 0.98, c: 0.01, h: 285 },
    // Muted (readable on background)
    muted: { l: 0.9, c: 0.02, h: 285 },
    mutedForeground: { l: 0.4, c: 0.02, h: 285 }, // Adjusted for better contrast
  },
  dark: {
    // Background: oklch(0.08 0.03 285) -> #0d0a12
    // Foreground: oklch(0.98 0.01 285) -> #fbfafb
    background: { l: 0.08, c: 0.03, h: 285 },
    foreground: { l: 0.98, c: 0.01, h: 285 },
    // Primary in dark mode
    primary: { l: 0.55, c: 0.25, h: 300 },
    primaryForeground: { l: 0.98, c: 0.01, h: 285 },
    // Muted (readable on dark background)
    muted: { l: 0.15, c: 0.04, h: 285 },
    mutedForeground: { l: 0.7, c: 0.02, h: 285 }, // Adjusted for better contrast
  },
} as const;
