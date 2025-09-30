/**
 * Input validation utilities for Git command parameters
 * Prevents command injection vulnerabilities
 */

export interface ValidationResult {
  isValid: boolean;
  sanitized?: string;
  error?: string;
}

/**
 * Validates and sanitizes date strings for Git --since/--until parameters
 */
export function validateDateString(date: string): ValidationResult {
  if (!date || typeof date !== 'string') {
    return { isValid: false, error: 'Date must be a non-empty string' };
  }

  // Check for dangerous characters first (including null bytes and control characters)
  if (/[;&|`$(){}[\]\\]/.test(date) || date.includes('\x00') || /[\n\r\t]/.test(date)) {
    return { isValid: false, error: 'Date contains invalid characters' };
  }

  // Remove any potentially dangerous characters
  const sanitized = date.replace(/[;&|`$(){}[\]\\]/g, '');

  // Validate common date formats - be more strict
  const dateFormats = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/, // ISO 8601
    /^\d+ (days?|weeks?|months?|years?) ago$/, // relative dates
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, // YYYY-MM-DD HH:MM:SS
  ];

  const isValidFormat = dateFormats.some(format => format.test(sanitized));

  // Additional validation for specific formats
  if (sanitized.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = sanitized.split('-').map(Number);
    if (year < 1970 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
      return { isValid: false, error: 'Invalid date values' };
    }
  }

  // Additional validation for ISO 8601 times
  if (sanitized.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
    const timePart = sanitized.split('T')[1];
    const [hours, minutes, seconds] = timePart.split(':').map(part => parseInt(part, 10));
    if (hours > 23 || minutes > 59 || seconds > 59) {
      return { isValid: false, error: 'Invalid time values' };
    }
  }

  if (!isValidFormat) {
    return {
      isValid: false,
      error: 'Invalid date format. Use YYYY-MM-DD, ISO 8601, or relative dates like "1 week ago"',
    };
  }

  return { isValid: true, sanitized };
}

/**
 * Validates and sanitizes author names for Git --author parameter
 */
export function validateAuthorString(author: string): ValidationResult {
  if (!author || typeof author !== 'string') {
    return { isValid: false, error: 'Author must be a non-empty string' };
  }

  // Check for dangerous characters first (including null bytes and control characters)
  if (/[;&|`$(){}[\]\\]/.test(author) || author.includes('\x00') || /[\n\r\t]/.test(author)) {
    return { isValid: false, error: 'Author contains invalid characters' };
  }

  // Remove potentially dangerous characters but preserve valid email/name characters
  const sanitized = author.replace(/[;&|`$(){}[\]\\]/g, '');

  // Basic validation for author format (name, email, or both)
  const authorFormats = [
    /^[^<>]*$/, // Just a name (no angle brackets)
    /^[^<>]*<[^<>]+@[^<>]+\.[^<>]+>$/, // Name <email@domain.com>
    /^[^<>]+@[^<>]+\.[^<>]+$/, // email@domain.com
  ];

  const isValidFormat = authorFormats.some(format => format.test(sanitized));

  if (!isValidFormat) {
    return {
      isValid: false,
      error: 'Invalid author format. Use "Name", "email@domain.com", or "Name <email@domain.com>"',
    };
  }

  return { isValid: true, sanitized };
}

/**
 * Validates numeric parameters like --max-count
 */
export function validateNumericString(value: string | number): ValidationResult {
  if (typeof value === 'number') {
    if (!Number.isInteger(value) || value < 0) {
      return { isValid: false, error: 'Numeric value must be a non-negative integer' };
    }
    return { isValid: true, sanitized: value.toString() };
  }

  if (typeof value !== 'string') {
    return { isValid: false, error: 'Value must be a string or number' };
  }

  // Check for dangerous characters first (including null bytes and control characters)
  if (/[;&|`$(){}[\]\\]/.test(value) || value.includes('\x00') || /[\n\r\t]/.test(value)) {
    return { isValid: false, error: 'Value contains invalid characters' };
  }

  // Check for non-numeric values
  if (!/^\d+$/.test(value)) {
    return { isValid: false, error: 'Value must be a positive integer' };
  }

  const num = parseInt(value, 10);
  if (num < 0 || num > 1000000) {
    // Reasonable upper limit
    return { isValid: false, error: 'Value must be between 0 and 1,000,000' };
  }

  return { isValid: true, sanitized: value };
}

/**
 * Validates file paths for Git commands
 */
export function validatePathString(path: string): ValidationResult {
  if (!path || typeof path !== 'string') {
    return { isValid: false, error: 'Path must be a non-empty string' };
  }

  // Check for dangerous characters first (including null bytes, control characters, and shell redirects)
  if (/[;&|`$(){}[\]\\<>]/.test(path) || path.includes('\x00') || /[\n\r\t]/.test(path)) {
    return { isValid: false, error: 'Path contains invalid characters' };
  }

  // Check for path traversal and other suspicious patterns
  if (path.includes('..') || path.includes('//')) {
    return {
      isValid: false,
      error: 'Invalid path: contains directory traversal or suspicious patterns',
    };
  }

  // Remove potentially dangerous characters for final validation
  const sanitized = path.replace(/[;&|`$(){}[\]\\<>]/g, '');

  return { isValid: true, sanitized };
}

/**
 * Validates branch names for Git commands
 */
export function validateBranchString(branch: string): ValidationResult {
  if (!branch || typeof branch !== 'string') {
    return { isValid: false, error: 'Branch must be a non-empty string' };
  }

  // Check for dangerous characters first (including null bytes and control characters)
  if (/[;&|`$(){}[\]\\]/.test(branch) || branch.includes('\x00') || /[\n\r\t]/.test(branch)) {
    return { isValid: false, error: 'Branch contains invalid characters' };
  }

  // Remove potentially dangerous characters
  const sanitized = branch.replace(/[;&|`$(){}[\]\\]/g, '');

  // Git branch name validation rules
  const hasControlChars = sanitized.split('').some(char => {
    const code = char.charCodeAt(0);
    return code < 32 || code === 127; // Control characters
  });

  if (
    sanitized !== branch ||
    sanitized.startsWith('-') ||
    sanitized.includes('..') ||
    sanitized.includes(' ') ||
    hasControlChars ||
    /[~^:]/.test(sanitized)
  ) {
    return {
      isValid: false,
      error: 'Invalid branch name: contains invalid characters or patterns',
    };
  }

  return { isValid: true, sanitized };
}

/**
 * Comprehensive input validation for Git command options
 */
export function validateGitOptions(options: {
  since?: string;
  until?: string;
  author?: string;
  maxCount?: string | number;
  branch?: string;
  path?: string;
}): { isValid: boolean; sanitized?: typeof options; errors: string[] } {
  const errors: string[] = [];
  const sanitized: typeof options = {};

  if (options.since) {
    const result = validateDateString(options.since);
    if (result.isValid && result.sanitized) {
      sanitized.since = result.sanitized;
    } else {
      errors.push(`since: ${result.error}`);
    }
  }

  if (options.until) {
    const result = validateDateString(options.until);
    if (result.isValid && result.sanitized) {
      sanitized.until = result.sanitized;
    } else {
      errors.push(`until: ${result.error}`);
    }
  }

  if (options.author) {
    const result = validateAuthorString(options.author);
    if (result.isValid && result.sanitized) {
      sanitized.author = result.sanitized;
    } else {
      errors.push(`author: ${result.error}`);
    }
  }

  if (options.maxCount !== undefined) {
    const result = validateNumericString(options.maxCount);
    if (result.isValid && result.sanitized) {
      sanitized.maxCount = parseInt(result.sanitized, 10);
    } else {
      errors.push(`maxCount: ${result.error}`);
    }
  }

  if (options.branch) {
    const result = validateBranchString(options.branch);
    if (result.isValid && result.sanitized) {
      sanitized.branch = result.sanitized;
    } else {
      errors.push(`branch: ${result.error}`);
    }
  }

  if (options.path) {
    const result = validatePathString(options.path);
    if (result.isValid && result.sanitized) {
      sanitized.path = result.sanitized;
    } else {
      errors.push(`path: ${result.error}`);
    }
  }

  return {
    isValid: errors.length === 0,
    ...(errors.length === 0 ? { sanitized } : {}),
    errors,
  };
}
