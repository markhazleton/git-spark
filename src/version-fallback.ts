/**
 * Version fallback module
 * Provides safe access to version information with fallbacks
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Retrieves the version of git-spark with multiple fallback strategies.
 * Attempts: generated version.ts module → package.json → default fallback
 *
 * @returns Promise resolving to semantic version string (e.g., "1.2.3")
 * @example
 * const version = await getVersion();
 * console.log(`Running git-spark v${version}`);
 */
export async function getVersion(): Promise<string> {
  // Method 1: Try to import the generated version file
  try {
    // Use dynamic import to avoid TypeScript compile-time checking
    const versionPath = './version.js';
    const versionModule = await import(versionPath);
    return versionModule.VERSION;
  } catch {
    // Method 2: Try to read package.json directly
    try {
      // Try from various potential locations relative to cwd
      const possiblePaths = [
        resolve(process.cwd(), 'package.json'),
        resolve(process.cwd(), '../package.json'),
        resolve(process.cwd(), '../../package.json'),
      ];

      for (const pkgPath of possiblePaths) {
        try {
          const pkgContent = readFileSync(pkgPath, 'utf-8');
          const pkg = JSON.parse(pkgContent);
          if (pkg.name === 'git-spark' && pkg.version) {
            return pkg.version;
          }
        } catch {
          // Continue to next path
        }
      }
    } catch {
      // If all else fails, return a default version
    }

    // If we get here, we couldn't find version info
  }

  return '0.0.0';
}

/**
 * Retrieves the build timestamp of git-spark.
 * Uses generated build time from version.ts or falls back to current time.
 *
 * @returns Promise resolving to ISO 8601 timestamp string
 * @example
 * const buildTime = await getBuildTime();
 * console.log(`Built at: ${buildTime}`);
 */
export async function getBuildTime(): Promise<string> {
  try {
    // Use dynamic import to avoid TypeScript compile-time checking
    const versionPath = './version.js';
    const versionModule = await import(versionPath);
    return versionModule.BUILD_TIME;
  } catch {
    return new Date().toISOString();
  }
}
