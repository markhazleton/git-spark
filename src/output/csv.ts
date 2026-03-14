import { AnalysisReport } from '../types/index.js';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('csv-exporter');

/**
 * Exports Git Spark analysis reports to CSV format files.
 * Generates multiple CSV files for authors, files, and daily trends.
 */
export class CSVExporter {
  async export(report: AnalysisReport, outputPath: string): Promise<void> {
    try {
      mkdirSync(outputPath, { recursive: true });

      await this.exportAuthors(report.authors ?? [], outputPath);
      await this.exportFiles(report.files ?? [], outputPath);
      await this.exportTimeline(report.timeline ?? [], outputPath);

      logger.info('CSV reports exported successfully', { outputPath });
    } catch (error) {
      logger.error('Failed to export CSV reports', {
        error:
          error instanceof Error
            ? {
                message: error.message,
                name: error.name,
                stack: error.stack,
              }
            : error,
        outputPath,
      });
      throw error;
    }
  }

  private async exportAuthors(authors: any[], outputPath: string): Promise<void> {
    const csvContent = this.generateAuthorsCSV(authors);
    const filePath = resolve(outputPath, 'authors.csv');
    writeFileSync(filePath, csvContent, 'utf-8');
  }

  private async exportFiles(files: any[], outputPath: string): Promise<void> {
    const csvContent = this.generateFilesCSV(files);
    const filePath = resolve(outputPath, 'files.csv');
    writeFileSync(filePath, csvContent, 'utf-8');
  }

  private async exportTimeline(timeline: any[], outputPath: string): Promise<void> {
    const csvContent = this.generateTimelineCSV(timeline);
    const filePath = resolve(outputPath, 'timeline.csv');
    writeFileSync(filePath, csvContent, 'utf-8');
  }

  private generateAuthorsCSV(authors: any[]): string {
    const headers = [
      'Name',
      'Email',
      'Commits',
      'Insertions',
      'Deletions',
      'Churn',
      'Files Changed',
      'First Commit',
      'Last Commit',
      'Active Days',
      'Avg Commit Size',
      'Largest Commit',
      'After Hours %',
      'Weekend %',
    ];

    const rows = authors.map(author => {
      const commits = this.toNumber(author.commits);
      const afterHours =
        commits > 0
          ? Math.round((this.toNumber(author.workPatterns?.afterHours) / commits) * 100)
          : 0;
      const weekends =
        commits > 0 ? Math.round((this.toNumber(author.workPatterns?.weekends) / commits) * 100) : 0;

      return [
        this.escapeCsvField(author.name),
        this.escapeCsvField(author.email),
        commits,
        this.toNumber(author.insertions),
        this.toNumber(author.deletions),
        this.toNumber(author.churn),
        this.toNumber(author.filesChanged),
        this.formatDate(author.firstCommit),
        this.formatDate(author.lastCommit),
        this.toNumber(author.activeDays),
        Math.round(this.toNumber(author.avgCommitSize)),
        this.toNumber(author.largestCommit),
        afterHours,
        weekends,
      ];
    });

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private generateFilesCSV(files: any[]): string {
    const headers = [
      'Path',
      'Commits',
      'Authors',
      'Insertions',
      'Deletions',
      'Churn',
      'First Change',
      'Last Change',
      'Risk Score',
      'Hotspot Score',
      'Language',
    ];

    const rows = files.map(file => [
      this.escapeCsvField(file.path),
      this.toNumber(file.commits),
      Array.isArray(file.authors) ? file.authors.length : this.toNumber(file.authors),
      this.toNumber(file.insertions),
      this.toNumber(file.deletions),
      this.toNumber(file.churn),
      this.formatDate(file.firstChange),
      this.formatDate(file.lastChange),
      (this.toNumber(file.riskScore) * 100).toFixed(2),
      (this.toNumber(file.hotspotScore) * 100).toFixed(2),
      this.escapeCsvField(file.language || ''),
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private generateTimelineCSV(timeline: any[]): string {
    const headers = ['Date', 'Commits', 'Authors', 'Churn', 'Files'];

    const rows = timeline.map(day => [
      this.formatDate(day.date),
      this.toNumber(day.commits),
      this.toNumber(day.authors),
      this.toNumber(day.churn),
      this.toNumber(day.files),
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private formatDate(value: Date | string | undefined): string {
    if (!value) {
      return '';
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toISOString().split('T')[0];
  }

  private escapeCsvField(value: unknown): string {
    const stringValue = String(value ?? '');
    if (!/[",\n]/.test(stringValue)) {
      return stringValue;
    }

    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  private toNumber(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  }
}
