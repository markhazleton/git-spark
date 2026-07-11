import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { PeriodsReport } from '../types/index.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('periods-markdown');

function dateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function generatePeriodsMarkdown(report: PeriodsReport): string {
  return `# Git Spark Period Comparison

Generated on ${report.generatedAt.toLocaleDateString()}

Comparing ${report.periodCount} period(s) of ${report.periodDays} day(s) each in \`${report.repoPath}\`.

| Period | Date Range | Commits | Churn | Net Lines | Files | Authors |
|--------|-------------|---------|-------|-----------|-------|---------|
${report.periods
  .map(
    p =>
      `| ${p.label} | ${dateStr(p.startDate)} → ${dateStr(p.endDate)} | ${p.commits} | ${p.churn.toLocaleString()} | ${p.netLines >= 0 ? '+' : ''}${p.netLines.toLocaleString()} | ${p.filesChanged} | ${p.activeAuthors} |`
  )
  .join('\n')}
`;
}

/**
 * Write a multi-period churn/activity comparison report as Markdown.
 */
export function exportPeriodsMarkdown(report: PeriodsReport, outputPath: string): void {
  try {
    const fullPath = resolve(outputPath, 'periods-report.md');
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, generatePeriodsMarkdown(report), 'utf-8');
    logger.info('Periods Markdown report exported successfully', { path: fullPath });
  } catch (error) {
    logger.error('Failed to export periods Markdown report', {
      error:
        error instanceof Error ? { message: error.message, name: error.name, stack: error.stack } : error,
      outputPath,
    });
    throw error;
  }
}
