import { HTMLExporter } from '../src/output/html';
import {
  AnalysisReport,
  AuthorStats,
  FileStats,
  RepositoryStats,
  ReportSummary,
} from '../src/types';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

describe('HTMLExporter', () => {
  let exporter: HTMLExporter;
  let mockReport: AnalysisReport;

  beforeEach(() => {
    exporter = new HTMLExporter();

    // Create comprehensive mock report
    const mockAuthors: AuthorStats[] = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        commits: 150,
        insertions: 5000,
        deletions: 2000,
        churn: 7000,
        filesChanged: 45,
        firstCommit: new Date('2024-01-01'),
        lastCommit: new Date('2024-09-29'),
        activeDays: 120,
        avgCommitSize: 46.7,
        largestCommit: 500,
        workPatterns: {
          hourDistribution: new Array(24)
            .fill(0)
            .map((_, i) => (i === 9 ? 15 : Math.floor(Math.random() * 10))),
          dayDistribution: new Array(7).fill(0).map(() => Math.floor(Math.random() * 20) + 5),
          burstDays: 5,
          afterHours: 10,
          weekends: 8,
        },
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        commits: 120,
        insertions: 3500,
        deletions: 1500,
        churn: 5000,
        filesChanged: 35,
        firstCommit: new Date('2024-02-01'),
        lastCommit: new Date('2024-09-25'),
        activeDays: 90,
        avgCommitSize: 41.7,
        largestCommit: 300,
        workPatterns: {
          hourDistribution: new Array(24)
            .fill(0)
            .map((_, i) => (i === 14 ? 12 : Math.floor(Math.random() * 8))),
          dayDistribution: new Array(7).fill(0).map(() => Math.floor(Math.random() * 15) + 5),
          burstDays: 3,
          afterHours: 8,
          weekends: 6,
        },
      },
    ];

    const mockFiles: FileStats[] = [
      {
        path: 'src/core/analyzer.ts',
        commits: 45,
        authors: ['john@example.com', 'jane@example.com'],
        churn: 2500,
        insertions: 1800,
        deletions: 700,
        firstChange: new Date('2024-01-01'),
        lastChange: new Date('2024-09-20'),
        riskScore: 85.5,
        hotspotScore: 92.3,
        ownership: { 'john@example.com': 60, 'jane@example.com': 40 },
        language: 'typescript',
        size: 15000,
      },
      {
        path: 'src/output/html.ts',
        commits: 25,
        authors: ['john@example.com'],
        churn: 1200,
        insertions: 900,
        deletions: 300,
        firstChange: new Date('2024-03-01'),
        lastChange: new Date('2024-09-29'),
        riskScore: 45.2,
        hotspotScore: 55.8,
        ownership: { 'john@example.com': 100 },
        language: 'typescript',
        size: 8000,
      },
    ];

    const mockRepository: RepositoryStats = {
      totalCommits: 270,
      totalAuthors: 2,
      totalFiles: 125,
      totalChurn: 12000,
      firstCommit: new Date('2024-01-01'),
      lastCommit: new Date('2024-09-29'),
      activeDays: 150,
      avgCommitsPerDay: 1.8,
      languages: {
        typescript: 85000,
        javascript: 15000,
        json: 5000,
      },
      busFactor: 2,
      healthScore: 78.5,
      governanceScore: 82.3,
    };

    const mockSummary: ReportSummary = {
      healthRating: 'good',
      keyMetrics: {
        commits: 270,
        authors: 2,
        files: 125,
        healthScore: 78.5,
      },
      insights: [
        'Good commit frequency with consistent activity',
        'Healthy bus factor of 2 developers',
        'High-risk files identified for refactoring',
      ],
      actionItems: [
        'Consider breaking down large files',
        'Add more contributors to critical modules',
        'Improve test coverage in core components',
      ],
    };

    mockReport = {
      metadata: {
        generatedAt: new Date(),
        version: '1.0.0',
        repoPath: '/test/repo',
        analysisOptions: {
          repoPath: '/test/repo',
        },
        processingTime: 2500,
        gitVersion: '2.40.0',
        commit: 'abc123',
        branch: 'main',
      },
      repository: mockRepository,
      authors: mockAuthors,
      files: mockFiles,
      hotspots: mockFiles.slice(0, 1),
      timeline: [],
      risks: {
        riskFactors: { complexity: 75, churn: 60, ownership: 45 },
        highRiskFiles: mockFiles.filter(f => f.riskScore > 80),
        recommendations: [],
        overallRisk: 'medium',
      },
      governance: {
        score: 82.3,
        conventionalCommits: 75,
        traceabilityScore: 85,
        avgMessageLength: 48,
        wipCommits: 5,
        revertCommits: 2,
        shortMessages: 8,
        recommendations: [],
      },
      summary: mockSummary,
    };
  });

  describe('export', () => {
    const testOutputDir = './test-reports';

    afterEach(() => {
      // Clean up test files
      const testFile = resolve(testOutputDir, 'git-spark-report.html');
      if (existsSync(testFile)) {
        require('fs').unlinkSync(testFile);
      }
      if (existsSync(testOutputDir)) {
        require('fs').rmdirSync(testOutputDir, { recursive: true });
      }
    });

    it('should create HTML file with correct structure', async () => {
      await exporter.export(mockReport, testOutputDir);

      const outputFile = resolve(testOutputDir, 'git-spark-report.html');
      expect(existsSync(outputFile)).toBe(true);

      const htmlContent = readFileSync(outputFile, 'utf-8');

      // Verify basic HTML structure
      expect(htmlContent).toContain('<!DOCTYPE html>');
      expect(htmlContent).toContain('<html lang="en">');
      expect(htmlContent).toContain('Git Spark Analysis Report');
      expect(htmlContent).toContain('Repository Summary');
      expect(htmlContent).toContain('</html>');
    });

    it('should include repository statistics', async () => {
      await exporter.export(mockReport, testOutputDir);

      const outputFile = resolve(testOutputDir, 'git-spark-report.html');
      const htmlContent = readFileSync(outputFile, 'utf-8');

      expect(htmlContent).toContain('Total Commits: 270');
      expect(htmlContent).toContain('Total Authors: 2');
      expect(htmlContent).toContain('Total Files: 125');
      expect(htmlContent).toContain('Health Score: 78.5/100');
      expect(htmlContent).toContain('Governance Score: 82.3/100');
      expect(htmlContent).toContain('Bus Factor: 2');
    });

    it('should include author information', async () => {
      await exporter.export(mockReport, testOutputDir);

      const outputFile = resolve(testOutputDir, 'git-spark-report.html');
      const htmlContent = readFileSync(outputFile, 'utf-8');

      expect(htmlContent).toContain('Top Authors');
      expect(htmlContent).toContain('John Doe');
      expect(htmlContent).toContain('Jane Smith');
      expect(htmlContent).toContain('150'); // John's commit count
      expect(htmlContent).toContain('120'); // Jane's commit count
    });

    it('should include file information with risk indicators', async () => {
      await exporter.export(mockReport, testOutputDir);

      const outputFile = resolve(testOutputDir, 'git-spark-report.html');
      const htmlContent = readFileSync(outputFile, 'utf-8');

      expect(htmlContent).toContain('Hot Files');
      expect(htmlContent).toContain('src/core/analyzer.ts');
      expect(htmlContent).toContain('src/output/html.ts');
      expect(htmlContent).toContain('85.5'); // High risk score
      expect(htmlContent).toContain('45.2'); // Lower risk score
      expect(htmlContent).toContain('bg-danger'); // High risk color
      expect(htmlContent).toContain('bg-info'); // Medium risk color
    });

    it('should escape HTML characters in file paths and author names', async () => {
      // Add test data with special characters
      mockReport.authors[0].name = 'John <script>alert("test")</script> Doe';
      mockReport.files[0].path = 'src/components/<Component>.tsx';

      await exporter.export(mockReport, testOutputDir);

      const outputFile = resolve(testOutputDir, 'git-spark-report.html');
      const htmlContent = readFileSync(outputFile, 'utf-8');

      expect(htmlContent).toContain(
        'John &lt;script&gt;alert(&quot;test&quot;)&lt;/script&gt; Doe'
      );
      expect(htmlContent).toContain('src/components/&lt;Component&gt;.tsx');
      expect(htmlContent).not.toContain('<script>alert("test")</script>');
    });

    it('should include Bootstrap CSS and JavaScript', async () => {
      await exporter.export(mockReport, testOutputDir);

      const outputFile = resolve(testOutputDir, 'git-spark-report.html');
      const htmlContent = readFileSync(outputFile, 'utf-8');

      expect(htmlContent).toContain('bootstrap@5.1.3/dist/css/bootstrap.min.css');
      expect(htmlContent).toContain('bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js');
    });

    it('should include custom styles', async () => {
      await exporter.export(mockReport, testOutputDir);

      const outputFile = resolve(testOutputDir, 'git-spark-report.html');
      const htmlContent = readFileSync(outputFile, 'utf-8');

      expect(htmlContent).toContain('font-family: -apple-system');
      expect(htmlContent).toContain('background-color: #f8f9fa');
      expect(htmlContent).toContain('box-shadow:');
    });

    it('should handle empty data gracefully', async () => {
      const emptyReport = {
        ...mockReport,
        authors: [],
        files: [],
      };

      await exporter.export(emptyReport, testOutputDir);

      const outputFile = resolve(testOutputDir, 'git-spark-report.html');
      const htmlContent = readFileSync(outputFile, 'utf-8');

      expect(htmlContent).toContain('Top Authors');
      expect(htmlContent).toContain('Hot Files');
      // Should not throw errors with empty arrays
    });
  });

  describe('getRiskColor', () => {
    it('should return correct color classes for risk scores', () => {
      // Access private method through bracket notation for testing
      const getRiskColor = (exporter as any).getRiskColor.bind(exporter);

      expect(getRiskColor(95)).toBe('danger');
      expect(getRiskColor(80)).toBe('danger');
      expect(getRiskColor(75)).toBe('warning');
      expect(getRiskColor(60)).toBe('warning');
      expect(getRiskColor(50)).toBe('info');
      expect(getRiskColor(40)).toBe('info');
      expect(getRiskColor(30)).toBe('success');
      expect(getRiskColor(0)).toBe('success');
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      // Access private method through bracket notation for testing
      const escapeHtml = (exporter as any).escapeHtml.bind(exporter);

      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
      expect(escapeHtml('Author & Co')).toBe('Author &amp; Co');
      expect(escapeHtml("O'Reilly")).toBe('O&#039;Reilly');
      expect(escapeHtml('Component<Props>')).toBe('Component&lt;Props&gt;');
    });

    it('should handle empty strings', () => {
      const escapeHtml = (exporter as any).escapeHtml.bind(exporter);
      expect(escapeHtml('')).toBe('');
    });
  });
});
