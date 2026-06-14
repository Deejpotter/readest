import { describe, it, expect, beforeAll } from 'vitest';
import { readdirSync, readFileSync, statSync, existsSync } from 'fs';
import { join, extname } from 'path';

const EBOOKS_DIR = join(__dirname, '..', '..', '..', 'public', 'ebooks');

// Ebooks are stored in Cloudflare R2, not in git
describe.skip('Ebook Library', () => {
  let epubFiles: string[];

  beforeAll(() => {
    if (!existsSync(EBOOKS_DIR)) {
      return;
    }
    const allFiles = readdirSync(EBOOKS_DIR);
    epubFiles = allFiles.filter((f) => extname(f).toLowerCase() === '.epub').sort();
  });

  describe('Library structure', () => {
    it('should have at least one EPUB file', () => {
      expect(epubFiles.length).toBeGreaterThan(0);
    });

    it('should have a reasonable curated collection (50-500 books)', () => {
      expect(epubFiles.length).toBeGreaterThanOrEqual(50);
      expect(epubFiles.length).toBeLessThanOrEqual(500);
    });

    it('should not contain PDF files in curated collection', () => {
      const allFiles = readdirSync(EBOOKS_DIR);
      const pdfs = allFiles.filter((f) => extname(f).toLowerCase() === '.pdf');
      expect(pdfs.length).toBe(0);
    });
  });

  describe('File names', () => {
    it('should have safe filenames (no path separators or null bytes)', () => {
      for (const file of epubFiles) {
        expect(file).not.toMatch(/[/\\\0]/);
      }
    });

    it('should all end with .epub extension', () => {
      for (const file of epubFiles) {
        expect(extname(file).toLowerCase()).toBe('.epub');
      }
    });

    it('should have no duplicate normalized titles', () => {
      const normalized = epubFiles.map((f) =>
        f
          .replace(/\.epub$/i, '')
          .replace(/[^a-z0-9]/gi, '')
          .toLowerCase(),
      );
      const unique = new Set(normalized);
      expect(unique.size).toBe(normalized.length);
    });

    it('should not use placeholder names', () => {
      for (const file of epubFiles) {
        const base = file.replace(/\.epub$/i, '');
        expect(base.toLowerCase()).not.toMatch(/^(unknown|book|ebook|untitled)$/);
      }
    });
  });

  describe('File integrity', { timeout: 30000 }, () => {
    it('should have no empty or tiny files (< 1 KB)', () => {
      const tiny: string[] = [];
      for (const file of epubFiles) {
        const stats = statSync(join(EBOOKS_DIR, file));
        if (stats.size < 1024) tiny.push(file);
      }
      expect(tiny).toEqual([]);
    });

    it('should have no files over 100 MB (outliers trimmed)', () => {
      const huge: string[] = [];
      for (const file of epubFiles) {
        const stats = statSync(join(EBOOKS_DIR, file));
        if (stats.size / (1024 * 1024) >= 100) huge.push(file);
      }
      expect(huge).toEqual([]);
    });

    it('should all start with valid EPUB/ZIP magic bytes', () => {
      const bad: Array<{ file: string; header: string }> = [];
      for (const file of epubFiles) {
        const fullPath = join(EBOOKS_DIR, file);
        try {
          const header = readFileSync(fullPath).subarray(0, 2);
          // PK = 0x50 0x4b (ZIP magic bytes)
          if (header[0] !== 0x50 || header[1] !== 0x4b) {
            bad.push({
              file,
              header: Array.from(header)
                .map((b) => '0x' + b.toString(16))
                .join(' '),
            });
          }
        } catch {
          bad.push({ file, header: 'unreadable' });
        }
      }
      expect(bad).toEqual([]);
    });
  });

  describe('File size distribution', () => {
    let small: number;
    let medium: number;
    let large: number;

    beforeAll(() => {
      small = 0;
      medium = 0;
      large = 0;
      for (const file of epubFiles) {
        const sizeMB = statSync(join(EBOOKS_DIR, file)).size / (1024 * 1024);
        if (sizeMB < 1) small++;
        else if (sizeMB < 5) medium++;
        else large++;
      }
    });

    it('should have a variety of book sizes', () => {
      expect(small).toBeGreaterThan(0);
      expect(medium).toBeGreaterThan(0);
    });

    it('should not be dominated by large books (>5 MB)', () => {
      expect(large / epubFiles.length).toBeLessThan(0.5);
    });
  });

  describe('Directory structure', () => {
    it('should be flat (no subdirectories)', () => {
      const entries = readdirSync(EBOOKS_DIR, { withFileTypes: true });
      const dirs = entries.filter((e) => e.isDirectory());
      expect(dirs.length).toBe(0);
    });
  });
});
