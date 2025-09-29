/**
 * git-spark: Enterprise-grade Git repository analytics and reporting tool
 * Main entry point for the library
 */

export * from './types';
export * from './core/analyzer';
export * from './core/collector';
export * from './utils/git';
export * from './utils/logger';
export * from './utils/validation';

import {
  GitSparkOptions,
  AnalysisReport,
  GitSparkConfig,
  OutputFormat,
  ProgressCallback,
} from './types';
import { GitAnalyzer } from './core/analyzer';
import { validateOptions } from './utils/validation';
import { createLogger } from './utils/logger';

const logger = createLogger('git-spark');

/**
 * Main GitSpark class for enterprise-grade Git repository analysis
 * 
 * Provides a high-level interface for analyzing Git repositories and generating
 * comprehensive reports. Handles the complete analysis pipeline from data
 * collection through export in multiple formats.
 * 
 * Key features:
 * - Comprehensive commit and author analysis
 * - Risk assessment and governance scoring
 * - Multiple export formats (HTML, JSON, Markdown, CSV, Console)
 * - Progress tracking for long-running operations
 * - Extensive configuration options and validation
 * - Enterprise-grade error handling and logging
 * 
 * @example
 * ```typescript
 * // Basic analysis
 * const gitSpark = new GitSpark({
 *   repoPath: '/path/to/repo',
 *   since: '2024-01-01'
 * });
 * 
 * const report = await gitSpark.analyze();
 * await gitSpark.export('html', './reports');
 * 
 * // With progress tracking
 * const gitSpark = new GitSpark({
 *   repoPath: '/path/to/repo'
 * }, (progress) => {
 *   console.log(`${progress.stage}: ${progress.percentage}%`);
 * });
 * ```
 */
export class GitSpark {
  private analyzer: GitAnalyzer;
  private options: GitSparkOptions;

  constructor(options: GitSparkOptions, progressCallback?: ProgressCallback) {
    // Validate options
    const validation = validateOptions(options);
    if (!validation.isValid) {
      throw new Error(`Invalid options: ${validation.errors.join(', ')}`);
    }

    this.options = { ...options };
    this.analyzer = new GitAnalyzer(options.repoPath || process.cwd(), progressCallback);

    logger.info('GitSpark initialized', { options: this.options });
  }

  /**
   * Perform complete repository analysis
   */
  async analyze(): Promise<AnalysisReport> {
    logger.info('Starting repository analysis');

    try {
      const report = await this.analyzer.analyze(this.options);
      logger.info('Analysis completed successfully', {
        commits: report.repository.totalCommits,
        authors: report.repository.totalAuthors,
        files: report.repository.totalFiles,
      });

      return report;
    } catch (error) {
      logger.error('Analysis failed', { error });
      throw error;
    }
  }

  /**
   * Export analysis report in specified format
   */
  async export(format: OutputFormat, outputPath: string): Promise<void> {
    const report = await this.analyze();

    switch (format) {
      case 'html':
        await this.exportHTML(report, outputPath);
        break;
      case 'json':
        await this.exportJSON(report, outputPath);
        break;
      case 'markdown':
        await this.exportMarkdown(report, outputPath);
        break;
      case 'csv':
        await this.exportCSV(report, outputPath);
        break;
      case 'console':
        this.exportConsole(report);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Export as HTML report
   */
  private async exportHTML(report: AnalysisReport, outputPath: string): Promise<void> {
    const { HTMLExporter } = await import('./output/html');
    const exporter = new HTMLExporter();
    await exporter.export(report, outputPath);
    logger.info('HTML report exported', { outputPath });
  }

  /**
   * Export as JSON
   */
  private async exportJSON(report: AnalysisReport, outputPath: string): Promise<void> {
    const { JSONExporter } = await import('./output/json');
    const exporter = new JSONExporter();
    await exporter.export(report, outputPath);
    logger.info('JSON report exported', { outputPath });
  }

  /**
   * Export as Markdown
   */
  private async exportMarkdown(report: AnalysisReport, outputPath: string): Promise<void> {
    const { MarkdownExporter } = await import('./output/markdown');
    const exporter = new MarkdownExporter();
    await exporter.export(report, outputPath);
    logger.info('Markdown report exported', { outputPath });
  }

  /**
   * Export as CSV
   */
  private async exportCSV(report: AnalysisReport, outputPath: string): Promise<void> {
    const { CSVExporter } = await import('./output/csv');
    const exporter = new CSVExporter();
    await exporter.export(report, outputPath);
    logger.info('CSV report exported', { outputPath });
  }

  /**
   * Export to console
   */
  private exportConsole(report: AnalysisReport): void {
    const { ConsoleExporter } = require('./output/console');
    const exporter = new ConsoleExporter();
    exporter.export(report);
    logger.info('Console report displayed');
  }

  /**
   * Get default configuration
   */
  static getDefaultConfig(): GitSparkConfig {
    return {
      version: '1.0',
      analysis: {
        excludePaths: ['node_modules/**', 'dist/**', 'build/**', '.git/**'],
        includeAuthors: [],
        excludeAuthors: [],
        thresholds: {
          largeCommitLines: 500,
          smallCommitLines: 50,
          staleBranchDays: 30,
          largeFileKB: 300,
          hotspotAuthorThreshold: 3,
        },
        weights: {
          risk: {
            churn: 0.35,
            recency: 0.25,
            ownership: 0.2,
            entropy: 0.1,
            coupling: 0.1,
          },
          governance: {
            conventional: 0.4,
            traceability: 0.25,
            length: 0.15,
            wipPenalty: 0.1,
            revertPenalty: 0.05,
            shortPenalty: 0.05,
          },
        },
      },
      output: {
        defaultFormat: 'html',
        outputDir: './reports',
        includeCharts: true,
        redactEmails: false,
        theme: 'default',
      },
      performance: {
        maxBuffer: 200,
        enableCaching: true,
        cacheDir: '.git-spark-cache',
        chunkSize: 1000,
      },
    };
  }
}

/**
 * Quick analysis function for simple use cases
 */
export async function analyze(
  repoPath?: string,
  options?: Partial<GitSparkOptions>
): Promise<AnalysisReport> {
  const gitSpark = new GitSpark({
    repoPath: repoPath || process.cwd(),
    ...options,
  });

  return gitSpark.analyze();
}

/**
 * Quick export function
 */
export async function exportReport(
  report: AnalysisReport,
  format: OutputFormat,
  outputPath: string
): Promise<void> {
  // const gitSpark = new GitSpark({ repoPath: process.cwd() });
  // This is a simplified export that doesn't re-analyze
  switch (format) {
    case 'html':
      const { HTMLExporter } = await import('./output/html');
      await new HTMLExporter().export(report, outputPath);
      break;
    case 'json':
      const { JSONExporter } = await import('./output/json');
      await new JSONExporter().export(report, outputPath);
      break;
    default:
      throw new Error(`Format ${format} not supported in quick export`);
  }
}
