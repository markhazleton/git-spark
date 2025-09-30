import { AnalysisReport } from '../types';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { createLogger } from '../utils/logger';

const logger = createLogger('csv-exporter');

export class CSVExporter {
  async export(report: AnalysisReport, outputPath: string): Promise<void> {
    try {
      // Ensure directory exists
      mkdirSync(outputPath, { recursive: true });

      // Export multiple CSV files for different data sets
      await this.exportAuthors(report.authors, outputPath);
      await this.exportFiles(report.files, outputPath);
      await this.exportTimeline(report.timeline, outputPath);

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

    const rows = authors.map(author => [
      this.escapeCsvField(author.name),
      this.escapeCsvField(author.email),
      author.commits,
      author.insertions,
      author.deletions,
      author.churn,
      author.filesChanged,
      this.formatDate(author.firstCommit),
      this.formatDate(author.lastCommit),
      author.activeDays,
      Math.round(author.avgCommitSize),
      author.largestCommit,
      Math.round((author.workPatterns.afterHours / author.commits) * 100),
      Math.round((author.workPatterns.weekends / author.commits) * 100),
    ]);

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
      file.commits,
      file.authors.length,
      file.insertions,
      file.deletions,
      file.churn,
      this.formatDate(file.firstChange),
      this.formatDate(file.lastChange),
      (file.riskScore * 100).toFixed(2),
      (file.hotspotScore * 100).toFixed(2),
      file.language || '',
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private generateTimelineCSV(timeline: any[]): string {
    const headers = ['Date', 'Commits', 'Authors', 'Churn', 'Files'];

    const rows = timeline.map(day => [
      this.formatDate(day.date),
      day.commits,
      day.authors,
      day.churn,
      day.files,
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private escapeCsvField(field: string): string {
    // Escape CSV fields that contain commas, quotes, or newlines
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
