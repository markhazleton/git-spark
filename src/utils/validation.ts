import { GitSparkOptions, ValidationResult, ValidationError } from '../types';
import { existsSync, statSync } from 'fs';
import { resolve } from 'path';
import * as semver from 'semver';

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
      new RegExp(options.path);
    } catch {
      warnings.push('Path pattern may not be a valid glob or regex pattern');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateNodeVersion(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const nodeVersion = process.version;
  const requiredVersion = '>=18.0.0';

  if (!semver.satisfies(nodeVersion, requiredVersion)) {
    errors.push(`Node.js ${requiredVersion} is required. Current version: ${nodeVersion}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateGitInstallation(): Promise<ValidationResult> {
  return new Promise(resolve => {
    const { spawn } = require('child_process');
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

export function sanitizeInput(input: string): string {
  // Remove potentially dangerous characters
  return input
    .replace(/[;&|`$(){}[\]]/g, '')
    .replace(/\.\./g, '')
    .trim();
}

export function sanitizePath(path: string): string {
  // Prevent directory traversal
  const normalized = resolve(path);
  if (normalized.includes('..')) {
    throw new ValidationError('Path traversal not allowed', 'path');
  }
  return normalized;
}

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
