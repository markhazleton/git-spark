import { AnalysisReport } from '../types/index.js';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { createLogger } from '../utils/logger.js';

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

      // Export Azure DevOps data if available
      if (report.azureDevOps) {
        await this.exportAzureDevOps(report.azureDevOps, outputPath);
      }

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

  private async exportAzureDevOps(azureDevOps: any, outputPath: string): Promise<void> {
    // Export pull requests summary
    const pullRequestsCSV = this.generatePullRequestsCSV(azureDevOps);
    const prFilePath = resolve(outputPath, 'azure-devops-pull-requests.csv');
    writeFileSync(prFilePath, pullRequestsCSV, 'utf-8');

    // Export team collaboration data
    const teamCollabCSV = this.generateTeamCollaborationCSV(azureDevOps.teamCollaboration);
    const teamFilePath = resolve(outputPath, 'azure-devops-team-collaboration.csv');
    writeFileSync(teamFilePath, teamCollabCSV, 'utf-8');

    // Export integration quality data
    const integrationCSV = this.generateIntegrationQualityCSV(azureDevOps.gitIntegration);
    const integrationFilePath = resolve(outputPath, 'azure-devops-integration-quality.csv');
    writeFileSync(integrationFilePath, integrationCSV, 'utf-8');
  }

  private generatePullRequestsCSV(azureDevOps: any): string {
    const { summary, pullRequests, reviewProcess, gitIntegration } = azureDevOps;

    const headers = ['Metric', 'Value', 'Category'];

    const rows = [
      ['Total Pull Requests', summary.totalPullRequests, 'Summary'],
      [
        'Git Commit Coverage',
        (summary.coverage.gitCommitCoverage * 100).toFixed(2) + '%',
        'Summary',
      ],
      ['Cache Hit Rate', (summary.dataFreshness.cacheHitRate * 100).toFixed(2) + '%', 'Summary'],
      ['Small PRs (<10 files)', pullRequests.sizeDistribution.small, 'Size Distribution'],
      ['Medium PRs (10-50 files)', pullRequests.sizeDistribution.medium, 'Size Distribution'],
      ['Large PRs (50-200 files)', pullRequests.sizeDistribution.large, 'Size Distribution'],
      ['X-Large PRs (>200 files)', pullRequests.sizeDistribution.xlarge, 'Size Distribution'],
      [
        'Average Time to Merge (hours)',
        pullRequests.timing.averageTimeToMerge.toFixed(2),
        'Timing',
      ],
      ['Median Time to Merge (hours)', pullRequests.timing.medianTimeToMerge.toFixed(2), 'Timing'],
      [
        '90th Percentile Time to Merge (hours)',
        pullRequests.timing.percentileMetrics.p90TimeToMerge.toFixed(2),
        'Timing',
      ],
      ['Completed PRs', pullRequests.statusBreakdown.completed, 'Status'],
      ['Active PRs', pullRequests.statusBreakdown.active, 'Status'],
      ['Abandoned PRs', pullRequests.statusBreakdown.abandoned, 'Status'],
      [
        'Average Reviewers per PR',
        reviewProcess.participation.averageReviewersPerPR.toFixed(2),
        'Review Process',
      ],
      [
        'Self-Approval Rate',
        (reviewProcess.participation.selfApprovalRate * 100).toFixed(2) + '%',
        'Review Process',
      ],
      [
        'Approval Rate',
        (reviewProcess.quality.approvalRate * 100).toFixed(2) + '%',
        'Review Process',
      ],
      [
        'Rejection Rate',
        (reviewProcess.quality.rejectionRate * 100).toFixed(2) + '%',
        'Review Process',
      ],
      [
        'Thoroughness Score',
        (reviewProcess.quality.thoroughnessScore * 100).toFixed(2) + '%',
        'Review Process',
      ],
      [
        'Mapping Success Rate',
        (gitIntegration.mappingSuccessRate * 100).toFixed(2) + '%',
        'Git Integration',
      ],
    ];

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => this.escapeCsvField(cell.toString())).join(',')),
    ].join('\n');
  }

  private generateTeamCollaborationCSV(teamCollaboration: any): string {
    const headers = ['Creator', 'PR Count', 'Percentage of Total'];

    const totalPRs = teamCollaboration.creationPatterns.mostActivePRCreators.reduce(
      (sum: number, creator: { prCount: number }) => sum + creator.prCount,
      0
    );

    const rows = teamCollaboration.creationPatterns.mostActivePRCreators.map(
      (creator: { creator: string; prCount: number }) => [
        this.escapeCsvField(creator.creator),
        creator.prCount,
        ((creator.prCount / totalPRs) * 100).toFixed(2) + '%',
      ]
    );

    return [headers.join(','), ...rows.map((row: any[]) => row.join(','))].join('\n');
  }

  private generateIntegrationQualityCSV(gitIntegration: any): string {
    const headers = ['Integration Method', 'Count', 'Percentage'];

    const total = Object.values(gitIntegration.integrationMethods).reduce(
      (sum: number, count: any) => sum + count,
      0
    );

    const rows = Object.entries(gitIntegration.integrationMethods).map(
      ([method, count]: [string, any]) => [
        method.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        count,
        ((count / total) * 100).toFixed(2) + '%',
      ]
    );

    // Add quality metrics
    rows.push([
      'High Confidence Associations',
      gitIntegration.integrationQuality.highConfidenceAssociations,
      '',
    ]);
    rows.push([
      'Medium Confidence Associations',
      gitIntegration.integrationQuality.mediumConfidenceAssociations,
      '',
    ]);
    rows.push([
      'Low Confidence Associations',
      gitIntegration.integrationQuality.lowConfidenceAssociations,
      '',
    ]);
    rows.push(['Unmapped Commits', gitIntegration.integrationQuality.unmappedCommits, '']);

    return [headers.join(','), ...rows.map((row: any[]) => row.join(','))].join('\n');
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
