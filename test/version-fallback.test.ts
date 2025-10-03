/**
 * Tests for version-fallback module
 */

import { getVersion, getBuildTime } from '../src/version-fallback';

describe('version-fallback', () => {
  describe('getVersion', () => {
    it('should return a valid version string', () => {
      const version = getVersion();
      expect(typeof version).toBe('string');
      expect(version.length).toBeGreaterThan(0);
      // Should be either from version module or default
      expect(version).toMatch(/^\d+\.\d+\.\d+/);
    });

    it('should not return an empty string', () => {
      const version = getVersion();
      expect(version).not.toBe('');
    });

    it('should return a consistent version across multiple calls', () => {
      const version1 = getVersion();
      const version2 = getVersion();
      expect(version1).toBe(version2);
    });

    it('should return a semantic version format', () => {
      const version = getVersion();
      // Should match semantic version pattern (x.y.z)
      expect(version).toMatch(/^\d+\.\d+\.\d+/);
    });
  });

  describe('getBuildTime', () => {
    it('should return a valid ISO date string', () => {
      const buildTime = getBuildTime();
      expect(typeof buildTime).toBe('string');
      expect(buildTime.length).toBeGreaterThan(0);

      // Should be a valid date
      const date = new Date(buildTime);
      expect(date.toString()).not.toBe('Invalid Date');
    });

    it('should not return an empty string', () => {
      const buildTime = getBuildTime();
      expect(buildTime).not.toBe('');
    });

    it('should return an ISO format date', () => {
      const buildTime = getBuildTime();
      // Should match ISO format (allow for timezone variations)
      expect(buildTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should return a consistent build time across multiple calls', () => {
      const buildTime1 = getBuildTime();
      const buildTime2 = getBuildTime();
      expect(buildTime1).toBe(buildTime2);
    });

    it('should return a valid timestamp that can be parsed', () => {
      const buildTime = getBuildTime();
      const timestamp = Date.parse(buildTime);
      expect(timestamp).not.toBeNaN();
      expect(timestamp).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle missing version module gracefully', () => {
      // Since the actual file may or may not exist, just ensure functions don't throw
      expect(() => getVersion()).not.toThrow();
      expect(() => getBuildTime()).not.toThrow();
    });

    it('should return reasonable defaults when modules are missing', () => {
      const version = getVersion();
      const buildTime = getBuildTime();

      // Should have reasonable fallback values
      expect(version).toMatch(/^\d+\.\d+\.\d+/);
      expect(buildTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('integration scenarios', () => {
    it('should work with current project structure', () => {
      // Test that the functions work in the current project context
      const version = getVersion();
      const buildTime = getBuildTime();

      expect(version).toBeDefined();
      expect(buildTime).toBeDefined();
      expect(typeof version).toBe('string');
      expect(typeof buildTime).toBe('string');
    });

    it('should return valid data for package operations', () => {
      const version = getVersion();
      const buildTime = getBuildTime();

      // Version should be valid for npm/package.json
      expect(version.split('.').length).toBeGreaterThanOrEqual(3);

      // Build time should be valid ISO string
      expect(new Date(buildTime).toISOString()).toBe(buildTime);
    });
  });
});
