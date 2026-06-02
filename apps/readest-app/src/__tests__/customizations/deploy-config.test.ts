import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Deployment configuration validation tests.
 *
 * Validates that our Render deployment config and related files
 * are well-formed and compatible with the project structure.
 */

const REPO_ROOT = join(__dirname, '..', '..', '..', '..', '..');
const APP_DIR = join(REPO_ROOT, 'apps', 'readest-app');

describe('render.yaml', () => {
  const renderYamlPath = join(REPO_ROOT, 'render.yaml');

  it('should exist at the repository root', () => {
    expect(existsSync(renderYamlPath)).toBe(true);
  });

  it('should be a non-empty file with valid syntax', () => {
    const content = readFileSync(renderYamlPath, 'utf-8');
    expect(content.length).toBeGreaterThan(0);
    // Basic YAML validation: should have key: value patterns
    expect(content).toMatch(/^[a-zA-Z]/m);
    expect(content).toMatch(/:/);
  });

  describe('Service configuration', () => {
    let content: string;

    beforeAll(() => {
      content = readFileSync(renderYamlPath, 'utf-8');
    });

    it('should define a web service entry', () => {
      expect(content).toMatch(/^services:/m);
      expect(content).toMatch(/-\s+type:\s+web/m);
    });

    it('should target the Deejpotter/readest repository', () => {
      expect(content).toMatch(/repo:\s+https:\/\/github\.com\/Deejpotter\/readest/m);
    });

    it('should set rootDir to the Next.js app directory', () => {
      expect(content).toMatch(/rootDir:\s+apps\/readest-app/m);
    });

    it('should use Node.js environment', () => {
      expect(content).toMatch(/env:\s+node/m);
    });

    describe('Build command', () => {
      it('should exist and begin with corepack enable', () => {
        // Extract buildCommand value from YAML line
        const match = content.match(/buildCommand:\s+(.+)/);
        expect(match).not.toBeNull();
        if (match) {
          expect(match[1]).toContain('corepack enable');
        }
      });

      it('should use pnpm install --frozen-lockfile', () => {
        expect(content).toContain('pnpm install');
        expect(content).toContain('--frozen-lockfile');
      });

      it('should include the build step', () => {
        expect(content).toContain('pnpm run build');
      });
    });

    describe('Start command', () => {
      it('should use pnpm run start', () => {
        expect(content).toContain('pnpm run start');
      });
    });

    describe('Environment variables', () => {
      it('should include NEXT_PUBLIC_APP_PLATFORM=web', () => {
        expect(content).toContain('NEXT_PUBLIC_APP_PLATFORM');
        expect(content).toContain('value: web');
      });

      it('should set NODE_ENV to production', () => {
        expect(content).toContain('NODE_ENV');
        expect(content).toContain('value: production');
      });
    });
  });
});

describe('.node-version', () => {
  const nodeVersionPath = join(APP_DIR, '.node-version');

  it('should exist in the app directory', () => {
    expect(existsSync(nodeVersionPath)).toBe(true);
  });

  it('should specify Node.js 24', () => {
    const version = readFileSync(nodeVersionPath, 'utf-8').trim();
    expect(version).toMatch(/^24/);
  });
});

describe('pnpm workspace', () => {
  const pnpmWorkspacePath = join(REPO_ROOT, 'pnpm-workspace.yaml');

  it('should exist (pnpm workspace)', () => {
    expect(existsSync(pnpmWorkspacePath)).toBe(true);
  });
});

describe('Package.json scripts', () => {
  const packageJson = JSON.parse(readFileSync(join(APP_DIR, 'package.json'), 'utf-8'));

  it('should have a web build script', () => {
    expect(packageJson.scripts).toHaveProperty('build-web');
  });

  it('should have a web dev script', () => {
    expect(packageJson.scripts).toHaveProperty('dev-web');
  });

  it('should have a web start script', () => {
    expect(packageJson.scripts).toHaveProperty('start-web');
  });
});
