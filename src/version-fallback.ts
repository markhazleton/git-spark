/**
 * Version fallback module
 * Provides safe access to version information with fallbacks
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

export async function getVersion(): Promise<string> {
  // Method 1: Try to import the generated version file
  try {
    const versionModule = await import('./version.js');
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

export async function getBuildTime(): Promise<string> {
  try {
    const versionModule = await import('./version.js');
    return versionModule.BUILD_TIME;
  } catch {
    return new Date().toISOString();
  }
}
