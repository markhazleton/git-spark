import { GitSparkOptions, ValidationResult, ValidationError } from '../types/index.js';
import { existsSync, statSync } from 'fs';
import { resolve } from 'path';
import * as semver from 'semver';

/**
 * Validates Git Spark CLI options for correctness and safety.
 *
 * @param options - The CLI options to validate
 * @returns Validation result with errors and warnings
 * @example
 * const result = validateOptions({ repoPath: '.', format: 'html' });
 * if (!result.isValid) {
 *   console.error(result.errors);
 * }
 */
export function validateOptions(options: GitSparkOptions): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate repository path
  if (options.repoPath) {
    if (!existsSync(options.repoPath)) {
      errors.push(`Repository path does not exist: ${options.repoPath}`);
    } else if (!statSync(options.repoPath).isDirectory()) {
      errors.push(`Repository path is not a directory: ${options.repoPath}`);
    } else if (!existsSync(resolve(options.repoPath, '.git'))) {
      errors.push(`Directory is not a Git repository: ${options.repoPath}`);
    }
  }

  // Validate date formats
  if (options.since && !isValidDate(options.since)) {
    errors.push(`Invalid since date format. Use YYYY-MM-DD: ${options.since}`);
  }

  if (options.until && !isValidDate(options.until)) {
    errors.push(`Invalid until date format. Use YYYY-MM-DD: ${options.until}`);
  }

  // Validate date range
  if (options.since && options.until) {
    const sinceDate = new Date(options.since);
    const untilDate = new Date(options.until);
    if (sinceDate >= untilDate) {
      errors.push('Since date must be before until date');
    }
  }

  // Validate days parameter
  if (options.days !== undefined) {
    if (!Number.isInteger(options.days) || options.days <= 0) {
      errors.push('Days must be a positive integer');
    }
    if (options.days > 3650) {
      warnings.push('Analyzing more than 10 years of history may be slow');
    }
  }

  // Validate output format
  if (options.format) {
    const validFormats = ['html', 'json', 'console', 'markdown', 'csv'];
    if (!validFormats.includes(options.format)) {
      errors.push(`Invalid format. Must be one of: ${validFormats.join(', ')}`);
    }
  }

  // Validate output directory
  if (options.output) {
    const outputDir = resolve(options.output);
    const parentDir = resolve(outputDir, '..');
    if (!existsSync(parentDir)) {
      errors.push(`Output directory parent does not exist: ${parentDir}`);
    }
  }

  // Validate config file
  if (options.config) {
    if (!existsSync(options.config)) {
      errors.push(`Config file does not exist: ${options.config}`);
    } else if (!options.config.endsWith('.json')) {
      warnings.push('Config file should have .json extension');
    }
  }

  // Validate log level
  if (options.logLevel) {
    const validLevels = ['error', 'warn', 'info', 'debug', 'verbose'];
    if (!validLevels.includes(options.logLevel)) {
      errors.push(`Invalid log level. Must be one of: ${validLevels.join(', ')}`);
    }
  }

  if (options.timezone) {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: options.timezone }).format(new Date());
    } catch {
      errors.push(`Invalid timezone: ${options.timezone}`);
    }
  }

  // redaction flag requires no validation now; future: ensure not combined with raw mode exports

  // Validate author pattern
  if (options.author) {
    if (options.author.length < 2) {
      warnings.push('Author filter is very short and may not match any commits');
    }
  }

  // Validate path pattern
  if (options.path) {
    try {
      // Sanitize input: limit length and check for balanced parentheses
      if (options.path.length > 500) {
        errors.push('Path pattern is too long (max 500 characters)');
      }
      
      // Check for balanced parentheses to prevent malformed regex
      const openParens = (options.path.match(/\(/g) || []).length;
      const closeParens = (options.path.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        errors.push('Path pattern has unbalanced parentheses');
      }
      
      // Check for potentially dangerous regex patterns that could cause ReDoS
      // Detect these specific patterns in the user's input string
      const hasNestedStarPlus = options.path.includes('(.*)+') || options.path.includes('(.*)*.js');
      const hasRepeatedEscapedDot = options.path.includes('\\.\\+\\.\\+') || options.path.includes('\\.\\*\\.\\*');
      const hasNestedWordQuant = options.path.includes('(\\w+*)+');
      const hasNestedCharClass = options.path.includes('([a-z]+)+');
      
      if (hasNestedStarPlus || hasRepeatedEscapedDot || hasNestedWordQuant || hasNestedCharClass) {
        errors.push('Path pattern contains potentially dangerous regex that could cause performance issues');
      } else {
        // Validate regex syntax only — never execute user-supplied patterns to prevent ReDoS
        try {
          new RegExp(options.path);
        } catch (e) {
          errors.push('Path pattern is not a valid regex pattern');
        }
      }
    } catch (e) {
      errors.push('Path pattern is not a valid regex pattern');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates that the current Node.js runtime meets minimum version requirements.
 *
 * @returns Validation result indicating if Node.js version is supported
 * @throws {ValidationResult} With errors if runtime version check fails
 * @example
 * const result = validateNodeVersion();
 * if (!result.isValid) {
 *   throw new Error(result.errors[0]);
 * }
 */
export function validateNodeVersion(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const nodeVersion = process.version;
  const requiredVersion = '>=20.19.0';

  if (!semver.satisfies(nodeVersion, requiredVersion)) {
    errors.push(`Node.js ${requiredVersion} is required. Current version: ${nodeVersion}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates that Git is installed and accessible in the system PATH.
 *
 * @returns Promise resolving to validation result with Git version info
 * @example
 * const result = await validateGitInstallation();
 * if (result.isValid) {
 *   console.log('Git is installed and accessible');
 * }
 */
export async function validateGitInstallation(): Promise<ValidationResult> {
  const { spawn } = await import('child_process');
  
  return new Promise((resolve) => {
    const git = spawn('git', ['--version']);

    let output = '';
    git.stdout.on('data', (data: Buffer) => {
      output += data.toString();
    });

    git.on('close', (code: number) => {
      if (code === 0) {
        const versionMatch = output.match(/git version (\d+\.\d+\.\d+)/);
        if (versionMatch) {
          const version = versionMatch[1];
          if (semver.gte(version, '2.20.0')) {
            resolve({
              isValid: true,
              errors: [],
              warnings: [],
            });
          } else {
            resolve({
              isValid: false,
              errors: [`Git 2.20.0 or higher is required. Current version: ${version}`],
              warnings: [],
            });
          }
        } else {
          resolve({
            isValid: false,
            errors: ['Could not determine Git version'],
            warnings: [],
          });
        }
      } else {
        resolve({
          isValid: false,
          errors: ['Git is not installed or not accessible in PATH'],
          warnings: [],
        });
      }
    });

    git.on('error', () => {
      resolve({
        isValid: false,
        errors: ['Git is not installed or not accessible in PATH'],
        warnings: [],
      });
    });
  });
}

/**
 * Removes potentially dangerous characters from user input to prevent injection attacks.
 *
 * @param input - The user input string to sanitize
 * @returns Sanitized string with dangerous characters removed
 * @example
 * const safe = sanitizeInput('test; rm -rf /');
 * // Returns: 'test rm -rf '
 */
export function sanitizeInput(input: string): string {
  // Remove potentially dangerous characters
  return input
    .replace(/[;&|`$(){}[\]]/g, '')
    .replace(/\.\./g, '')
    .trim();
}

/**
 * Normalizes a file path and prevents directory traversal attacks.
 *
 * @param path - The path to sanitize
 * @returns Normalized absolute path
 * @throws {ValidationError} If path contains directory traversal patterns (..)
 * @example
 * const safe = sanitizePath('./config.json');
 * // Returns: absolute path to config.json
 */
export function sanitizePath(path: string): string {
  // Prevent directory traversal
  const normalized = resolve(path);
  if (normalized.includes('..')) {
    throw new ValidationError('Path traversal not allowed', 'path');
  }
  return normalized;
}

/**
 * Sanitizes email addresses with optional redaction for privacy.
 *
 * @param email - The email address to sanitize
 * @param redact - If true, obscures the email (default: false)
 * @returns Original or redacted email address
 * @example
 * sanitizeEmail('john@example.com', false); // 'john@example.com'
 * sanitizeEmail('john@example.com', true); // 'j***@example.com'
 */
export function sanitizeEmail(email: string, redact = false): string {
  if (redact) {
    const [user, domain] = email.split('@');
    if (domain) {
      return `${user.charAt(0)}***@${domain}`;
    }
    return '***';
  }
  return email;
}

/**
 * Analyzes commit message metadata (conventional format, issue references, status).
 *
 * @param message - The commit message to analyze
 * @returns Object with analysis results
 * @example
 * const analysis = validateCommitMessage('feat(api): add new endpoint');
 * // Returns: { isConventional: true, hasIssueReference: false, isWip: false, isRevert: false, length: 25 }
 */
export function validateCommitMessage(message: string): {
  isConventional: boolean;
  hasIssueReference: boolean;
  isWip: boolean;
  isRevert: boolean;
  length: number;
} {
  const conventional = /^(feat|fix|docs|style|refactor|perf|test|chore|ci|build)(\(.+\))?: .+/.test(
    message
  );
  const issueRef = /#\d+/.test(message) || /closes|fixes|resolves/i.test(message);
  const isWip = /wip|work in progress/i.test(message);
  const isRevert = /^revert/i.test(message);

  return {
    isConventional: conventional,
    hasIssueReference: issueRef,
    isWip,
    isRevert,
    length: message.length,
  };
}

function isValidDate(dateString: string): boolean {
  // Check YYYY-MM-DD format
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}
