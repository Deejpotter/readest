import { describe, it, expect, beforeAll } from 'vitest';
import {
  generateLightPalette,
  generateDarkPalette,
  hexToOklch,
  getContrastOklch,
  themes,
  type Palette,
  type Theme,
} from '@/styles/themes';
import tinycolor from 'tinycolor2';

/**
 * Calculate relative luminance from a hex color using WCAG formula.
 * WCAG 2.1: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function relativeLuminance(hex: string): number {
  const rgb = tinycolor(hex).toRgb();
  const [r, g, b] = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map((c) => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * WCAG contrast ratio between two hex colors.
 */
function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ============================================================
// Deej Potter Brand Colors
// ============================================================
const BRAND = {
  // Dark mode
  darkBg: '#030712',
  darkFg: '#f9fafb',
  // Light mode
  lightBg: '#f9fafb',
  lightFg: '#111827',
  // Accent
  primary: '#1E9952',
} as const;

describe('Deej Potter Theme Registration', () => {
  it('should be included in the exported themes array', () => {
    const deejpotter = themes.find((t: Theme) => t.name === 'deejpotter');
    expect(deejpotter).toBeDefined();
  });

  it('should have a readable label', () => {
    const deejpotter = themes.find((t: Theme) => t.name === 'deejpotter')!;
    expect(deejpotter.label).toBeTruthy();
    expect(typeof deejpotter.label).toBe('string');
  });

  it('should have both light and dark color definitions', () => {
    const deejpotter = themes.find((t: Theme) => t.name === 'deejpotter')!;
    expect(deejpotter.colors).toHaveProperty('light');
    expect(deejpotter.colors).toHaveProperty('dark');
  });

  it('should be the last theme in the array (our custom entry)', () => {
    const lastTheme = themes[themes.length - 1];
    expect(lastTheme.name).toBe('deejpotter');
  });
});

describe('Deej Potter Brand Colors', () => {
  describe('Primary color', () => {
    it('should be a valid hex color', () => {
      expect(BRAND.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('should be a green shade (recognizable as accent)', () => {
      const color = tinycolor(BRAND.primary);
      const hsl = color.toHsl();
      // Green hue ranges: ~90-170 degrees
      expect(hsl.h).toBeGreaterThanOrEqual(90);
      expect(hsl.h).toBeLessThanOrEqual(170);
    });

    it('should have moderate saturation for readability', () => {
      const color = tinycolor(BRAND.primary);
      const hsl = color.toHsl();
      // Saturated enough to be recognizable, not so much it's garish
      expect(hsl.s).toBeGreaterThan(0.3);
      expect(hsl.s).toBeLessThan(0.9);
    });
  });

  describe('Dark mode palette', () => {
    let palette: Palette;

    beforeAll(() => {
      palette = generateDarkPalette({
        bg: BRAND.darkBg,
        fg: BRAND.darkFg,
        primary: BRAND.primary,
      });
    });

    it('should generate all required palette keys', () => {
      const required = [
        'base-100',
        'base-200',
        'base-300',
        'base-content',
        'neutral',
        'neutral-content',
        'primary',
        'secondary',
        'accent',
      ];
      for (const key of required) {
        expect(palette).toHaveProperty(key);
        expect(palette[key as keyof Palette]).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    });

    it('should have dark base colors (very dark backgrounds)', () => {
      const lightness = tinycolor(palette['base-100']).toHsl().l;
      expect(lightness).toBeLessThan(0.15);
    });

    it('should have light text on dark backgrounds', () => {
      const fgLightness = tinycolor(palette['base-content']).toHsl().l;
      expect(fgLightness).toBeGreaterThan(0.8);
    });

    it('should have readable contrast between content and background', () => {
      const ratio = contrastRatio(palette['base-content'], palette['base-100']);
      // WCAG AA for normal text: 4.5:1, AAA: 7:1
      expect(ratio).toBeGreaterThan(7);
    });

    it('should have sufficient contrast for primary on base', () => {
      const ratio = contrastRatio(palette.primary, palette['base-100']);
      // WCAG AA for large text: 3:1
      expect(ratio).toBeGreaterThan(3);
    });
  });

  describe('Light mode palette', () => {
    let palette: Palette;

    beforeAll(() => {
      palette = generateLightPalette({
        bg: BRAND.lightBg,
        fg: BRAND.lightFg,
        primary: BRAND.primary,
      });
    });

    it('should generate all required palette keys', () => {
      const required = [
        'base-100',
        'base-200',
        'base-300',
        'base-content',
        'neutral',
        'neutral-content',
        'primary',
        'secondary',
        'accent',
      ];
      for (const key of required) {
        expect(palette).toHaveProperty(key);
        expect(palette[key as keyof Palette]).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    });

    it('should have light base colors (light backgrounds)', () => {
      const lightness = tinycolor(palette['base-100']).toHsl().l;
      expect(lightness).toBeGreaterThan(0.9);
    });

    it('should have dark text on light backgrounds', () => {
      const fgLightness = tinycolor(palette['base-content']).toHsl().l;
      expect(fgLightness).toBeLessThan(0.15);
    });

    it('should have readable contrast between content and background', () => {
      const ratio = contrastRatio(palette['base-content'], palette['base-100']);
      // WCAG AA for normal text
      expect(ratio).toBeGreaterThan(7);
    });

    it('should have sufficient contrast for primary on base', () => {
      const ratio = contrastRatio(palette.primary, palette['base-100']);
      // WCAG AA for large text
      expect(ratio).toBeGreaterThan(3);
    });
  });

  describe('Cross-mode consistency', () => {
    const darkPalette = generateDarkPalette({
      bg: BRAND.darkBg,
      fg: BRAND.darkFg,
      primary: BRAND.primary,
    });
    const lightPalette = generateLightPalette({
      bg: BRAND.lightBg,
      fg: BRAND.lightFg,
      primary: BRAND.primary,
    });

    it('should use the same primary color in both modes', () => {
      expect(darkPalette.primary).toBe(lightPalette.primary);
    });

    it('should produce visually distinct backgrounds for each mode', () => {
      const darkBgLightness = tinycolor(darkPalette['base-100']).toHsl().l;
      const lightBgLightness = tinycolor(lightPalette['base-100']).toHsl().l;
      // Dark mode bg should be significantly darker than light mode bg
      expect(lightBgLightness - darkBgLightness).toBeGreaterThan(0.7);
    });
  });
});

describe('hexToOklch with brand colors', () => {
  it('should convert deejpotter primary (#1E9952) to oklch', () => {
    const result = hexToOklch(BRAND.primary);
    expect(result).toMatch(/^\d+\.?\d*%\s+[\d.]+\s+[\d.]+deg$/);
  });

  it('should convert dark bg (#030712) to low-lightness oklch', () => {
    const result = hexToOklch(BRAND.darkBg);
    const lightness = parseFloat(result.split('%')[0]!);
    // #030712 is very dark. oklch lightness varies — we just check it's darker than mid-gray
    expect(lightness).toBeLessThan(30);
  });
});

describe('getContrastOklch with brand colors', () => {
  it('should return near-white for ultra-dark backgrounds', () => {
    const result = getContrastOklch(BRAND.darkBg);
    const lightness = parseFloat(result.split('%')[0]!);
    expect(lightness).toBeGreaterThan(95);
  });
});
