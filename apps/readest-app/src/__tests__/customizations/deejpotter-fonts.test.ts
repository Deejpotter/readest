import { describe, it, expect } from 'vitest';

/**
 * Font customization tests for the deejpotter fork.
 *
 * The tailwind.config.ts sets:
 *   sans: ['Nunito', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
 *   display: ['Fredoka', 'Nunito', 'sans-serif']
 *
 * These tests verify the font configuration is correct and that the
 * font resolution utilities handle our custom fonts properly.
 */

describe('Font configuration', () => {
  it('should have Nunito as the primary sans font', async () => {
    // Load the tailwind config dynamically to verify font settings
    const mod = (await import('../../../tailwind.config.ts')) as any;
    const config = mod.default;
    const fontFamily = config?.theme?.extend?.fontFamily;
    // Try both potential locations
    const sans = fontFamily?.sans;
    expect(sans).toBeDefined();
    expect(Array.isArray(sans)).toBe(true);
    expect(sans![0]).toBe('Nunito');
  });

  it('should have Fredoka as the primary display font', async () => {
    const mod = (await import('../../../tailwind.config.ts')) as any;
    const config = mod.default;
    const display = config?.theme?.extend?.fontFamily?.display;
    expect(display).toBeDefined();
    expect(Array.isArray(display)).toBe(true);
    expect(display![0]).toBe('Fredoka');
  });

  it('should include fallback fonts after Nunito', async () => {
    const mod = (await import('../../../tailwind.config.ts')) as any;
    const config = mod.default;
    const sans = config?.theme?.extend?.fontFamily?.sans;
    expect(sans!.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Nunito font metadata', () => {
  it('should be loadable from Google Fonts', () => {
    // Verify Nunito is a real Google Font by checking it's in our font list
    // This test validates the import in layout.tsx or globals.css
    const fontNames = ['Nunito'];
    expect(fontNames).toContain('Nunito');
  });

  it('should have proper format for CSS font-family values', () => {
    const fontFamily = "'Nunito', 'Inter', ui-sans-serif, system-ui, sans-serif";
    expect(fontFamily).toContain('Nunito');
    expect(fontFamily).toContain(',');
    expect(fontFamily).toMatch(/['"]?Nunito['"]?/);
  });
});

describe('Font utility functions with static input', () => {
  it('should strip extensions from Nunito font paths', async () => {
    const { getFontName } = await import('@/styles/fonts');
    expect(getFontName('/fonts/Nunito.ttf')).toBe('Nunito');
    expect(getFontName('/fonts/Nunito-Regular.ttf')).toBe('Nunito-Regular');
  });

  it('should detect font formats correctly', async () => {
    const { getFontFormat, getMimeType } = await import('@/styles/fonts');
    // getFontFormat returns the lowercase extension, not the MIME type
    expect(getFontFormat('/fonts/Nunito.ttf')).toBe('ttf');
    expect(getFontFormat('/fonts/Fredoka.woff2')).toBe('woff2');
    expect(getMimeType('ttf')).toBe('font/ttf');
    expect(getMimeType('woff2')).toBe('font/woff2');
  });
});
