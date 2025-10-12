import * as fs from 'fs';
import * as path from 'path';

/**
 * Simple glob pattern matcher for gitignore patterns
 * Supports *, **, and ? wildcards
 */
function matchPattern(text: string, pattern: string): boolean {
  // Escape special regex characters except our wildcards
  const escapedPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\\\*/g, '*')
    .replace(/\\\?/g, '?');

  // Convert glob patterns to regex
  const regexPattern = escapedPattern
    .replace(/\*\*/g, '___DOUBLESTAR___')
    .replace(/\*/g, '[^/]*')
    .replace(/___DOUBLESTAR___/g, '.*')
    .replace(/\?/g, '[^/]');

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(text);
}

/**
 * GitIgnore utility class to handle .gitignore parsing and file filtering
 *
 * This class parses .gitignore files and provides functionality to check
 * whether files should be ignored based on gitignore patterns.
 */
export class GitIgnore {
  private patterns: string[] = [];
  private negativePatterns: string[] = [];

  constructor(gitignoreContent?: string) {
    if (gitignoreContent) {
      this.parseGitignore(gitignoreContent);
    }
  }

  /**
   * Create a GitIgnore instance from a .gitignore file path
   * @param gitignorePath Path to the .gitignore file
   * @returns GitIgnore instance
   */
  static fromFile(gitignorePath: string): GitIgnore {
    try {
      const content = fs.readFileSync(gitignorePath, 'utf8');
      return new GitIgnore(content);
    } catch (error) {
      // If .gitignore doesn't exist or can't be read, return empty instance
      return new GitIgnore();
    }
  }

  /**
   * Create a GitIgnore instance from repository root
   * Will look for .gitignore in the repository root
   * @param repoPath Path to the repository root
   * @returns GitIgnore instance
   */
  static fromRepository(repoPath: string): GitIgnore {
    const gitignorePath = path.join(repoPath, '.gitignore');
    return GitIgnore.fromFile(gitignorePath);
  }

  /**
   * Parse .gitignore content and extract patterns
   * @param content Content of .gitignore file
   */
  private parseGitignore(content: string): void {
    const lines = content.split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      // Handle negation patterns (lines starting with !)
      if (trimmed.startsWith('!')) {
        const pattern = trimmed.slice(1);
        this.negativePatterns.push(pattern);
      } else {
        this.patterns.push(trimmed);
      }
    }
  }

  /**
   * Check if a file path should be ignored based on gitignore patterns
   * @param filePath Relative file path from repository root
   * @returns true if file should be ignored, false otherwise
   */
  isIgnored(filePath: string): boolean {
    // Normalize path separators to forward slashes
    const normalizedPath = filePath.replace(/\\/g, '/');

    // Always ignore .git directory
    if (
      normalizedPath.includes('/.git/') ||
      normalizedPath === '.git' ||
      normalizedPath.startsWith('.git/')
    ) {
      return true;
    }

    let ignored = false;

    // Check against ignore patterns
    for (const pattern of this.patterns) {
      if (this.matchesPattern(normalizedPath, pattern)) {
        ignored = true;
        break;
      }

      // Also check if any parent directory matches the pattern
      if (this.matchesParentDirectory(normalizedPath, pattern)) {
        ignored = true;
        break;
      }
    }

    // If ignored, check negative patterns (unignore patterns)
    if (ignored) {
      for (const pattern of this.negativePatterns) {
        if (this.matchesPattern(normalizedPath, pattern)) {
          return false; // File is unignored
        }
      }
    }

    return ignored;
  }

  /**
   * Check if any parent directory of the file matches the pattern
   * @param filePath File path to check
   * @param pattern Gitignore pattern
   * @returns true if any parent directory matches
   */
  private matchesParentDirectory(filePath: string, pattern: string): boolean {
    const pathParts = filePath.split('/');

    // Check each parent directory component
    for (let i = 0; i < pathParts.length - 1; i++) {
      const dirName = pathParts[i];
      if (this.matchesPattern(dirName, pattern)) {
        return true;
      }

      // Check partial paths up to this directory
      const partialPath = pathParts.slice(0, i + 1).join('/');
      if (this.matchesPattern(partialPath, pattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if a path matches a gitignore pattern
   * @param filePath File path to check
   * @param pattern Gitignore pattern
   * @returns true if path matches pattern
   */
  private matchesPattern(filePath: string, pattern: string): boolean {
    // Handle directory patterns (ending with /)
    if (pattern.endsWith('/')) {
      const dirPattern = pattern.slice(0, -1);

      // If pattern doesn't start with /, it can match anywhere in the path
      if (!pattern.startsWith('/')) {
        // Check each directory component in the path
        const pathParts = filePath.split('/');
        for (let i = 0; i < pathParts.length; i++) {
          if (matchPattern(pathParts[i], dirPattern)) {
            return true;
          }
        }

        // Also check subdirectories
        for (let i = 0; i < pathParts.length - 1; i++) {
          const partialPath = pathParts.slice(0, i + 1).join('/');
          if (matchPattern(partialPath, dirPattern)) {
            return true;
          }
        }
      } else {
        // Absolute directory pattern
        const absolutePattern = dirPattern.slice(1);
        return matchPattern(filePath.split('/')[0], absolutePattern);
      }

      return false;
    }

    // Handle absolute patterns (starting with /)
    if (pattern.startsWith('/')) {
      const absolutePattern = pattern.slice(1);
      return matchPattern(filePath, absolutePattern);
    }

    // Handle patterns that contain slashes (path-specific patterns)
    if (pattern.includes('/')) {
      // Try exact match first
      if (matchPattern(filePath, pattern)) {
        return true;
      }
      // Try matching anywhere in the path for non-absolute patterns
      return matchPattern(filePath, `**/${pattern}`);
    }

    // For simple filename patterns, check against basename and as a glob pattern
    const basename = filePath.split('/').pop() || '';
    return matchPattern(basename, pattern) || matchPattern(filePath, `**/${pattern}`);
  }

  /**
   * Get all patterns being used for debugging purposes
   * @returns Object containing patterns and negative patterns
   */
  getPatterns(): { patterns: string[]; negativePatterns: string[] } {
    return {
      patterns: [...this.patterns],
      negativePatterns: [...this.negativePatterns],
    };
  }

  /**
   * Check if any gitignore patterns are loaded
   * @returns true if patterns exist, false if empty
   */
  hasPatterns(): boolean {
    return this.patterns.length > 0 || this.negativePatterns.length > 0;
  }
}
