/**
 * Periods command implementation
 * Compares churn and activity across consecutive fixed-length periods (e.g. sprints)
 */

import chalk from 'chalk';
import ora from 'ora';
import { resolve } from 'path';
import { DataCollector } from '../core/collector.js';
import { GitExecutor } from '../utils/git.js';
import { bucketIntoPeriods } from '../core/period-summary.js';
import { PeriodsOutputFormat, PeriodsReport } from '../types/index.js';
import { renderPeriodsConsole } from '../output/periods-console.js';
import { exportPeriodsMarkdown } from '../output/periods-markdown.js';
import { exportPeriodsHtml } from '../output/periods-html.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('cli:periods');

export interface PeriodsCommandOptions {
  repo?: string;
  branch?: string;
  until?: string;
  periodDays?: number;
  periods?: number;
  format?: PeriodsOutputFormat;
  output?: string;
}

export async function executePeriodsReport(options: PeriodsCommandOptions): Promise<void> {
  const spinner = ora('Initializing period comparison').start();

  try {
    const repoPath = resolve(options.repo || process.cwd());
    const branch = options.branch;
    const endDate = options.until ? new Date(options.until) : new Date();
    const periodDays = options.periodDays && options.periodDays > 0 ? options.periodDays : 7;
    const periodCount = options.periods && options.periods > 0 ? options.periods : 3;
    const format: PeriodsOutputFormat = options.format || 'console';
    const outputDir = resolve(options.output || './reports');

    const git = new GitExecutor(repoPath);

    spinner.text = 'Validating repository';
    const collector = new DataCollector(repoPath, (phase, current, total) => {
      const percentage = Math.round((current / total) * 100);
      spinner.text = `${phase} (${percentage}%)`;
    });
    const isValid = await collector.validateRepository();
    if (!isValid) {
      spinner.fail('Validation failed');
      console.error(chalk.red('✗ Not a valid Git repository: ') + repoPath);
      process.exit(1);
    }

    if (await git.isShallowRepository()) {
      spinner.warn('Shallow clone detected');
      console.warn(
        chalk.yellow(
          '  • This repository is a shallow clone — older periods may be missing commits ' +
            'that were never fetched. Run `git fetch --unshallow` for accurate results.'
        )
      );
    }

    const lookbackStart = new Date(endDate.getTime() - periodDays * periodCount * 24 * 60 * 60 * 1000);

    spinner.text = 'Collecting commit data';
    const commits = await collector.collectCommits({
      repoPath,
      since: lookbackStart.toISOString().split('T')[0],
      ...(options.until ? { until: options.until } : {}),
      ...(branch ? { branch } : {}),
    });

    spinner.text = 'Computing period summaries';
    const periods = bucketIntoPeriods(commits, periodDays, periodCount, endDate);

    const report: PeriodsReport = {
      repoPath,
      periodDays,
      periodCount,
      generatedAt: new Date(),
      periods,
    };

    spinner.succeed('Period comparison ready');

    switch (format) {
      case 'console':
        renderPeriodsConsole(report);
        break;
      case 'markdown':
        exportPeriodsMarkdown(report, outputDir);
        console.log(chalk.green(`✓ Report saved to: ${resolve(outputDir, 'periods-report.md')}`));
        break;
      case 'html':
        exportPeriodsHtml(report, outputDir);
        console.log(chalk.green(`✓ Report saved to: ${resolve(outputDir, 'periods-report.html')}`));
        break;
    }
  } catch (error) {
    spinner.fail('Period comparison failed');
    if (error instanceof Error) {
      console.error(chalk.red(`Error: ${error.message}`));
      logger.error('Period comparison failed', { error: error.message, stack: error.stack });
    } else {
      console.error(chalk.red('Unknown error occurred'));
      logger.error('Unknown error occurred', { error });
    }
    process.exit(1);
  }
}
