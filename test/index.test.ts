import { GitSpark, analyze, exportReport } from '../src/index';
import { GitSparkOptions, AnalysisReport } from '../src/types';
import * as process from 'process';

describe('GitSpark', () => {
  const testOptions: GitSparkOptions = {
    repoPath: process.cwd(),
    days: 30,
    format: 'json',
  };

  describe('constructor', () => {
    it('should create a GitSpark instance with valid options', () => {
      expect(() => new GitSpark(testOptions)).not.toThrow();
    });

    it('should throw error with invalid options', () => {
      const invalidOptions: GitSparkOptions = {
        repoPath: '/nonexistent/path',
      };

      expect(() => new GitSpark(invalidOptions)).toThrow();
    });
  });

  describe('analyze', () => {
    it('should perform analysis and return report', async () => {
      const gitSpark = new GitSpark(testOptions);
      const report = await gitSpark.analyze();

      expect(report).toBeDefined();
      expect(report.metadata).toBeDefined();
      expect(report.repository).toBeDefined();
      expect(report.authors).toBeDefined();
      expect(report.files).toBeDefined();
      expect(Array.isArray(report.authors)).toBe(true);
      expect(Array.isArray(report.files)).toBe(true);
    }, 30000); // 30 second timeout for analysis
  });

  describe('quick analyze function', () => {
    it('should perform quick analysis', async () => {
      const report = await analyze(undefined, { days: 7 });

      expect(report).toBeDefined();
      expect(report.repository).toBeDefined();
      expect(typeof report.repository.totalCommits).toBe('number');
    }, 15000);
  });
});

describe('GitSpark configuration', () => {
  it('should have valid default configuration', () => {
    const config = GitSpark.getDefaultConfig();

    expect(config.version).toBe('1.0');
    expect(config.analysis.excludePaths).toContain('node_modules/**');
    expect(config.output.defaultFormat).toBe('html');
    expect(config.performance.enableCaching).toBe(true);
  });
});

describe('exportReport function', () => {
  const mockReport: AnalysisReport = {
    metadata: {
      generatedAt: new Date(),
      version: '1.0.0',
      repoPath: '/test/repo',
      analysisOptions: { repoPath: '/test/repo' },
      processingTime: 1000,
      gitVersion: '2.44.0',
      commit: 'abc123',
      branch: 'main',
    },
    repository: {
      totalCommits: 100,
      totalAuthors: 5,
      totalFiles: 50,
      totalChurn: 1500,
      firstCommit: new Date('2024-01-01'),
      lastCommit: new Date(),
      activeDays: 30,
      avgCommitsPerDay: 3.33,
      languages: { TypeScript: 80, JavaScript: 20 },
      busFactor: 3,
      healthScore: 85,
      governanceScore: 80,
    },
    timeline: [],
    authors: [],
    files: [],
    hotspots: [],
    risks: {
      highRiskFiles: [],
      riskFactors: {},
      recommendations: [],
      overallRisk: 'low',
    },
    governance: {
      conventionalCommits: 75,
      traceabilityScore: 80,
      avgMessageLength: 50,
      wipCommits: 5,
      revertCommits: 2,
      shortMessages: 10,
      score: 80,
      recommendations: [],
    },
    summary: {
      healthRating: 'good',
      keyMetrics: { 'Total Commits': 100, 'Active Authors': 5 },
      insights: ['Good commit frequency'],
      actionItems: ['Improve test coverage'],
    },
  };

  it('exports exportReport function', () => {
    expect(typeof exportReport).toBe('function');
  });

  it('returns a promise', () => {
    const result = exportReport(mockReport, 'json', './test-output');
    expect(result).toBeInstanceOf(Promise);

    // Clean up the promise
    result.catch(() => {}); // Ignore errors since this is just a type test
  });

  it('accepts valid format parameters', () => {
    // exportReport function only supports html and json in quick export
    const validFormats: Array<'html' | 'json'> = ['html', 'json'];

    validFormats.forEach(format => {
      expect(() => exportReport(mockReport, format, './test-output')).not.toThrow();
    });
  });

  it('rejects unsupported formats', () => {
    // These formats are not supported in quick export
    const unsupportedFormats: Array<'markdown' | 'csv'> = ['markdown', 'csv'];

    unsupportedFormats.forEach(format => {
      expect(exportReport(mockReport, format as any, './test-output')).rejects.toThrow();
    });
  });

  it('accepts output path parameter', () => {
    expect(() => exportReport(mockReport, 'json', './custom-output')).not.toThrow();
    expect(() => exportReport(mockReport, 'json', '/absolute/path')).not.toThrow();
  });
});
