/**
 * Version fallback module
 * Provides safe access to version information with fallbacks
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

export function getVersion(): string {
  // Method 1: Try to import the generated version file
  try {
    const versionModule = require('./version');
    return versionModule.VERSION;
  } catch {
    // Method 2: Try to read package.json directly
    try {
      // Try from various potential locations
      const possiblePaths = [
        resolve(__dirname, '../package.json'),
        resolve(__dirname, '../../package.json'),
        resolve(__dirname, '../../../package.json'),
        resolve(process.cwd(), 'package.json'),
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

    // Method 3: Try to resolve git-spark module
    try {
      const gitSparkPkgPath = require.resolve('git-spark/package.json');
      const pkgContent = readFileSync(gitSparkPkgPath, 'utf-8');
      const pkg = JSON.parse(pkgContent);
      return pkg.version;
    } catch {
      // Final fallback
    }
  }

  return '0.0.0';
}

export function getBuildTime(): string {
  try {
    const versionModule = require('./version');
    return versionModule.BUILD_TIME;
  } catch {
    return new Date().toISOString();
  }
}
