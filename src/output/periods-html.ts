import { createHash } from 'crypto';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { PeriodsReport } from '../types/index.js';
import { escapeHtml, formatNumber } from './html-utils.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('periods-html');

function dateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

const STYLE = `
  :root { color-scheme: light dark; }
  body { font-family: system-ui, sans-serif; margin: 2rem auto; max-width: 900px; padding: 0 1rem;
    background: #fff; color: #1a1a1a; }
  @media (prefers-color-scheme: dark) { body { background: #1a1a1a; color: #e5e5e5; } }
  h1 { font-size: 1.5rem; }
  table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
  th, td { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid rgba(128,128,128,0.3); }
  th { font-weight: 600; }
  td.num, th.num { text-align: right; }
  caption { text-align: left; color: rgba(128,128,128,0.9); margin-bottom: 0.5rem; }
`;

function generatePeriodsHtml(report: PeriodsReport): string {
  const styleHash = createHash('sha256').update(STYLE, 'utf8').digest('base64');
  const csp = [
    "default-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "style-src 'self' 'sha256-" + styleHash + "'",
    "script-src 'none'",
  ].join('; ');

  const rows = report.periods
    .map(
      p => `<tr>
        <td>${escapeHtml(p.label)}</td>
        <td>${dateStr(p.startDate)} → ${dateStr(p.endDate)}</td>
        <td class="num">${formatNumber(p.commits)}</td>
        <td class="num">${formatNumber(p.churn)}</td>
        <td class="num">${p.netLines >= 0 ? '+' : ''}${formatNumber(p.netLines)}</td>
        <td class="num">${formatNumber(p.filesChanged)}</td>
        <td class="num">${formatNumber(p.activeAuthors)}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="generator" content="git-spark">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <title>Git Spark Period Comparison - ${escapeHtml(report.repoPath)}</title>
  <style>${STYLE}</style>
</head>
<body>
  <h1>Period Comparison</h1>
  <p>Comparing ${report.periodCount} period(s) of ${report.periodDays} day(s) each in <code>${escapeHtml(report.repoPath)}</code>.</p>
  <table>
    <caption>Generated ${escapeHtml(report.generatedAt.toLocaleString())}</caption>
    <thead>
      <tr>
        <th scope="col">Period</th>
        <th scope="col">Date Range</th>
        <th class="num" scope="col">Commits</th>
        <th class="num" scope="col">Churn</th>
        <th class="num" scope="col">Net Lines</th>
        <th class="num" scope="col">Files</th>
        <th class="num" scope="col">Authors</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
}

/**
 * Write a multi-period churn/activity comparison report as a self-contained HTML page.
 */
export function exportPeriodsHtml(report: PeriodsReport, outputPath: string): void {
  try {
    const fullPath = resolve(outputPath, 'periods-report.html');
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, generatePeriodsHtml(report), 'utf-8');
    logger.info('Periods HTML report exported successfully', { path: fullPath });
  } catch (error) {
    logger.error('Failed to export periods HTML report', {
      error:
        error instanceof Error ? { message: error.message, name: error.name, stack: error.stack } : error,
      outputPath,
    });
    throw error;
  }
}
