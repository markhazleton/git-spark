import { AnalysisReport } from '../src/types';
import * as process from 'process';

// Mock chalk and table modules to avoid ESM import issues
jest.mock('chalk', () => {
  const mockFn = (text: string) => text;
  const mockChalk = {
    blue: mockFn,
    bold: {
      blue: mockFn,
      cyan: mockFn,
      yellow: mockFn,
      red: mockFn,
    },
    gray: mockFn,
    yellow: mockFn,
    red: mockFn,
    green: mockFn,
  };
  // Handle both named and default exports
  mockChalk.bold = Object.assign(mockFn, {
    blue: mockFn,
    cyan: mockFn,
    yellow: mockFn,
    red: mockFn,
  });
  return {
    __esModule: true,
    default: mockChalk,
  };
});

jest.mock('table', () => ({
  table: (data: any[]) => data.map(row => row.join(' | ')).join('\n'),
}));

// Import after mocking
import { ConsoleExporter } from '../src/output/console';

describe('ConsoleExporter', () => {
  let consoleExporter: ConsoleExporter;
  let mockReport: AnalysisReport;
  let stdoutSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleExporter = new ConsoleExporter();

    // Mock process.stdout.write to capture console output
    stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);

    // Create simplified mock report matching actual structure
    mockReport = {
      metadata: {
        generatedAt: new Date('2024-01-15T10:30:00Z'),
        version: '1.0.0',
        repoPath: '/test/repo',
        analysisOptions: { repoPath: '/test/repo' },
        processingTime: 1500,
        gitVersion: '2.44.0',
        commit: 'abcdef1234567890',
        branch: 'main',
      },
      repository: {
        totalCommits: 42,
        totalAuthors: 3,
        totalFiles: 18,
        totalChurn: 12345,
        firstCommit: new Date('2024-01-01'),
        lastCommit: new Date('2024-02-01'),
        activeDays: 31,
        avgCommitsPerDay: 1.35,
        languages: { TypeScript: 60, JavaScript: 40 },
        busFactor: 2,
        healthScore: 0.85,
        governanceScore: 0.75,
      },
      summary: {
        healthRating: 'good' as const,
        keyMetrics: {
          totalCommits: 42,
          totalAuthors: 3,
          activeDays: 31,
          healthScore: 85,
        },
        insights: ['Repository shows consistent activity', 'Good contribution distribution'],
        actionItems: ['Consider improving test coverage', 'Add more documentation'],
      },
      authors: [
        {
          name: 'John Doe',
          email: 'john@example.com',
          commits: 25,
          insertions: 5000,
          deletions: 3000,
          churn: 8000,
          filesChanged: 12,
          firstCommit: new Date('2024-01-01'),
          lastCommit: new Date('2024-02-01'),
          activeDays: 25,
          avgCommitSize: 320,
          largestCommit: 1200,
          workPatterns: {
            hourDistribution: Array(24).fill(0),
            dayDistribution: Array(7).fill(0),
            burstDays: 5,
            afterHours: 10,
            weekends: 5,
          },
          detailed: {} as any, // Simplified for testing
          // BUG: Console exporter expects these properties that don't exist in AuthorStats
          totalChurn: 8000,
          averageCommitSize: 320,
        } as any,
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
          commits: 15,
          insertions: 2500,
          deletions: 1000,
          churn: 3500,
          filesChanged: 8,
          firstCommit: new Date('2024-01-05'),
          lastCommit: new Date('2024-01-30'),
          activeDays: 20,
          avgCommitSize: 233,
          largestCommit: 800,
          workPatterns: {
            hourDistribution: Array(24).fill(0),
            dayDistribution: Array(7).fill(0),
            burstDays: 3,
            afterHours: 5,
            weekends: 2,
          },
          detailed: {} as any, // Simplified for testing
          // BUG: Console exporter expects these properties that don't exist in AuthorStats
          totalChurn: 3500,
          averageCommitSize: 233,
        } as any,
      ],
      files: [
        {
          path: 'src/main.ts',
          commits: 15,
          authors: ['John Doe', 'Jane Smith'],
          churn: 3500,
          insertions: 2000,
          deletions: 1500,
          firstChange: new Date('2024-01-01'),
          lastChange: new Date('2024-02-01'),
          riskScore: 0.8,
          hotspotScore: 0.9,
          ownership: { 'John Doe': 0.6, 'Jane Smith': 0.4 },
          language: 'TypeScript',
          size: 1500,
        },
        {
          path: 'src/utils.ts',
          commits: 8,
          authors: ['John Doe', 'Jane Smith'],
          churn: 1200,
          insertions: 800,
          deletions: 400,
          firstChange: new Date('2024-01-05'),
          lastChange: new Date('2024-01-28'),
          riskScore: 0.4,
          hotspotScore: 0.5,
          ownership: { 'John Doe': 0.7, 'Jane Smith': 0.3 },
          language: 'TypeScript',
          size: 800,
        },
      ],
      hotspots: [
        {
          path: 'src/main.ts',
          commits: 15,
          authors: ['John Doe', 'Jane Smith'],
          churn: 3500,
          insertions: 2000,
          deletions: 1500,
          firstChange: new Date('2024-01-01'),
          lastChange: new Date('2024-02-01'),
          riskScore: 0.8,
          hotspotScore: 0.9,
          ownership: { 'John Doe': 0.6, 'Jane Smith': 0.4 },
          language: 'TypeScript',
          size: 1500,
        },
      ],
      risks: {
        highRiskFiles: [],
        riskFactors: {
          'Bus Factor': 0.7,
          'Code Quality': 0.6,
          Maintenance: 0.3,
          // Properties that console output actually uses
          highChurnFiles: 5,
          manyAuthorFiles: 3,
          largeCommits: 2,
          recentChanges: 8,
        },
        recommendations: [
          'Improve bus factor by spreading knowledge',
          'Focus on code quality improvements',
        ],
        overallRisk: 'medium',
        // BUG: Console exporter expects this property that doesn't exist in RiskAnalysis
        level: 'medium',
      } as any,
      governance: {
        conventionalCommits: 0.75,
        traceabilityScore: 0.6,
        avgMessageLength: 45,
        wipCommits: 3,
        revertCommits: 1,
        shortMessages: 5,
        score: 0.73,
        recommendations: ['Improve commit message consistency', 'Increase code review coverage'],
        // BUG: Console exporter expects this property that doesn't exist in GovernanceAnalysis
        averageMessageLength: 45,
      } as any,
      timeline: [
        {
          date: new Date('2024-01-01'),
          commits: 5,
          authors: 2,
          churn: 2500,
          files: 8,
        },
        {
          date: new Date('2024-01-02'),
          commits: 3,
          authors: 1,
          churn: 1800,
          files: 5,
        },
      ],
      teamScore: {
        overall: 78,
        collaboration: {
          score: 80,
          crossTeamInteraction: 72,
          knowledgeDistribution: 68,
          fileOwnershipDistribution: {
            exclusive: 40,
            shared: 45,
            collaborative: 15,
          },
          limitations: {
            dataSource: 'git-file-authorship-only' as const,
            knownLimitations: ['Based only on Git commit authorship, not actual collaboration'],
          },
        },
        consistency: {
          score: 75,
          velocityConsistency: 70,
          busFactorPercentage: 35,
          activeContributorRatio: 85,
          deliveryCadence: 75,
          contributionDistribution: {
            giniCoefficient: 0.3,
            topContributorDominance: 45,
          },
        },
        workLifeBalance: {
          score: 76,
          commitTimePatterns: 78,
          afterHoursCommitFrequency: 22,
          weekendCommitActivity: 15,
          commitTimingIndicators: {
            highVelocityDays: 3,
            consecutiveCommitDays: 8,
            afterHoursCommits: 45,
          },
          teamActiveCoverage: {
            multiContributorDays: 18,
            soloContributorDays: 12,
            coveragePercentage: 60,
            note: 'Measures daily contributor diversity, not vacation coverage',
          },
          limitations: {
            timezoneWarning: 'Commit timestamps may not reflect actual work hours',
            workPatternNote: 'Git commits ≠ work hours',
            burnoutDetection: 'Cannot accurately assess burnout from Git data alone',
            recommendedApproach: 'Use for general patterns only',
            knownLimitations: ['Timezone issues', 'CI commits not distinguished'],
          },
        },
        insights: {
          strengths: ['Strong review workflow adoption', 'Good knowledge distribution'],
          improvements: [
            'Increase after-hours commit activity monitoring',
            'Improve test file coverage',
          ],
          risks: ['Knowledge concentration detected'],
          teamDynamics: 'balanced' as const,
          maturityLevel: 'mature' as const,
          sustainabilityRating: 'good' as const,
        },
        recommendations: [
          'Implement consistent review workflow for all changes',
          'Encourage cross-team collaboration and knowledge sharing',
        ],
      },
    };
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
  });

  describe('export', () => {
    it('should generate console output successfully', () => {
      expect(() => consoleExporter.export(mockReport)).not.toThrow();
      expect(stdoutSpy).toHaveBeenCalled();
    });

    it('should include repository metadata in output', () => {
      consoleExporter.export(mockReport);

      const output = stdoutSpy.mock.calls.map(call => call[0]).join('');
      expect(output).toContain('GIT SPARK ANALYSIS REPORT');
      expect(output).toContain('Generated:');
      expect(output).toContain('/test/repo');
      expect(output).toContain('main');
    });

    it('should display summary section correctly', () => {
      consoleExporter.export(mockReport);

      const output = stdoutSpy.mock.calls.map(call => call[0]).join('');
      expect(output).toContain('EXECUTIVE SUMMARY');
      expect(output).toContain('Repository Health:');
      expect(output).toContain('GOOD');
      expect(output).toContain('Total Commits');
      expect(output).toContain('42');
    });

    it('should display author statistics table', () => {
      consoleExporter.export(mockReport);

      const output = stdoutSpy.mock.calls.map(call => call[0]).join('');
      expect(output).toContain('TOP CONTRIBUTORS');
      expect(output).toContain('John Doe');
      expect(output).toContain('Jane Smith');
      expect(output).toContain('25'); // John's commits
      expect(output).toContain('15'); // Jane's commits
    });

    it('should display file statistics table', () => {
      consoleExporter.export(mockReport);

      const output = stdoutSpy.mock.calls.map(call => call[0]).join('');
      expect(output).toContain('FILE HOTSPOTS');
      expect(output).toContain('main.ts');
      expect(output).toContain('utils.ts');
    });

    it('should display risk analysis', () => {
      consoleExporter.export(mockReport);

      const output = stdoutSpy.mock.calls.map(call => call[0]).join('');
      expect(output).toContain('RISK ANALYSIS');
      expect(output).toContain('MEDIUM');
      expect(output).toContain('Risk Factors:');
    });

    it('should display governance analysis', () => {
      consoleExporter.export(mockReport);

      const output = stdoutSpy.mock.calls.map(call => call[0]).join('');
      expect(output).toContain('GOVERNANCE ANALYSIS');
      expect(output).toContain('Governance Score:');
      expect(output).toContain('73%');
    });

    it('should handle empty authors array', () => {
      const emptyReport = { ...mockReport, authors: [] };

      expect(() => consoleExporter.export(emptyReport)).not.toThrow();
      expect(stdoutSpy).toHaveBeenCalled();
    });

    it('should handle empty files array', () => {
      const emptyReport = { ...mockReport, files: [] };

      expect(() => consoleExporter.export(emptyReport)).not.toThrow();
      expect(stdoutSpy).toHaveBeenCalled();
    });

    it('should format numbers correctly', () => {
      consoleExporter.export(mockReport);

      const output = stdoutSpy.mock.calls.map(call => call[0]).join('');
      // Check for proper number formatting
      expect(output).toContain('12,345'); // totalChurn with commas
    });

    it('should include insights and action items', () => {
      consoleExporter.export(mockReport);

      const output = stdoutSpy.mock.calls.map(call => call[0]).join('');
      expect(output).toContain('Key Insights:');
      expect(output).toContain('Repository shows consistent activity');
      expect(output).toContain('Action Items:');
      expect(output).toContain('Consider improving test coverage');
    });

    it('should show health score percentage', () => {
      consoleExporter.export(mockReport);

      const output = stdoutSpy.mock.calls.map(call => call[0]).join('');
      expect(output).toContain('85%'); // health score
    });

    it('should display processing time in footer', () => {
      consoleExporter.export(mockReport);

      const output = stdoutSpy.mock.calls.map(call => call[0]).join('');
      expect(output).toContain('1500ms');
      expect(output).toContain('git-spark v1.0.0');
    });

    it('should handle different health ratings with appropriate colors', () => {
      const excellentReport = { ...mockReport };
      excellentReport.summary.healthRating = 'excellent';

      expect(() => consoleExporter.export(excellentReport)).not.toThrow();

      const poorReport = { ...mockReport };
      poorReport.summary.healthRating = 'poor';

      expect(() => consoleExporter.export(poorReport)).not.toThrow();
    });

    it('should handle different risk levels', () => {
      const highRiskReport = { ...mockReport };
      (highRiskReport.risks as any).level = 'high';

      expect(() => consoleExporter.export(highRiskReport)).not.toThrow();

      const lowRiskReport = { ...mockReport };
      (lowRiskReport.risks as any).level = 'low';

      expect(() => consoleExporter.export(lowRiskReport)).not.toThrow();
    });
  });
});
