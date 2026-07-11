import { table } from 'table';
import { PeriodsReport } from '../types/index.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('periods-console');

function dateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

/**
 * Render a multi-period churn/activity comparison table to the console.
 */
export function renderPeriodsConsole(report: PeriodsReport): void {
  logger.info('Periods report displayed');

  process.stdout.write(
    `\nChurn comparison across ${report.periodCount} period(s) of ${report.periodDays} day(s) each\n\n`
  );

  const rows = [
    ['Period', 'Date Range', 'Commits', 'Churn', 'Net Lines', 'Files', 'Authors'],
    ...report.periods.map(p => [
      p.label,
      `${dateStr(p.startDate)} → ${dateStr(p.endDate)}`,
      p.commits.toLocaleString(),
      p.churn.toLocaleString(),
      (p.netLines >= 0 ? '+' : '') + p.netLines.toLocaleString(),
      p.filesChanged.toLocaleString(),
      p.activeAuthors.toLocaleString(),
    ]),
  ];

  process.stdout.write(table(rows));
}
