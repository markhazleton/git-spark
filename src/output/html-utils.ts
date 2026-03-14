/**
 * Utility functions for HTML report generation
 * Pure functions for text escaping, path truncation, and styling calculations
 */

/**
 * Escape HTML special characters to prevent XSS attacks
 *
 * @param text - Text to escape
 * @returns Escaped HTML-safe text
 */
export function escapeHtml(text: string): string {
  return (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Truncate file path to maximum length with ellipsis
 *
 * @param path - File path to truncate
 * @param max - Maximum length (default: 40)
 * @returns Truncated path with ... in the middle
 */
export function truncatePath(path: string, max = 40): string {
  if (path.length <= max) return path;
  const half = Math.floor((max - 3) / 2);
  return path.slice(0, half) + '...' + path.slice(-half);
}

/**
 * Map risk percentage to risk band category
 *
 * @param riskPercent - Risk percentage (0-100)
 * @returns Risk band: high, medium, low, or minimal
 */
export function getRiskBand(riskPercent: number): string {
  if (riskPercent >= 70) return 'high';
  if (riskPercent >= 50) return 'medium';
  if (riskPercent >= 30) return 'low';
  return 'minimal';
}

/**
 * Get CSS width class name based on percentage
 *
 * @param percentage - Percentage value (0-100)
 * @returns Width class name (w-0, w-1, w-2, etc.)
 */
export function getWidthClass(percentage: number): string {
  if (percentage <= 0) return 'w-0';
  if (percentage <= 1) return 'w-1';
  if (percentage <= 2) return 'w-2';
  if (percentage <= 3) return 'w-3';
  if (percentage <= 4) return 'w-4';
  if (percentage <= 5) return 'w-5';
  if (percentage <= 10) return 'w-10';
  if (percentage <= 15) return 'w-15';
  if (percentage <= 20) return 'w-20';
  if (percentage <= 25) return 'w-25';
  if (percentage <= 30) return 'w-30';
  if (percentage <= 40) return 'w-40';
  if (percentage <= 50) return 'w-50';
  if (percentage <= 60) return 'w-60';
  if (percentage <= 70) return 'w-70';
  if (percentage <= 80) return 'w-80';
  if (percentage <= 90) return 'w-90';
  return 'w-100';
}

/**
 * Format number for display with thousands separators
 *
 * @param n - Number to format
 * @returns Formatted number string
 */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat().format(n);
}

/**
 * Format percentage for display
 *
 * @param n - Percentage value
 * @returns Formatted percentage string
 */
export function formatPercentage(n: number): string {
  return `${n.toFixed(1)}%`;
}
