/**
 * Analyzer and report types for git-spark
 * Contains analysis results, report types, and risk/governance metrics
 */

import { FileStats, FileTypeBreakdown } from './file.js';

export interface AnalysisReport {
  metadata: ReportMetadata;
  repository: RepositoryStats;
  /** Current state of files in the repository (filesystem-based, not Git history) */
  currentState: CurrentRepositoryState;
  timeline: TimelineData[];
  authors: any[]; // AuthorStats[], imported from author.ts
  files: FileStats[];
  hotspots: FileStats[];
  risks: RiskAnalysis;
  governance: GovernanceAnalysis;
  teamScore: TeamScore;
  summary: ReportSummary;
  /** Daily trending metrics for comprehensive trend analysis */
  dailyTrends?: any | undefined; // DailyTrendsData, imported from index
  /** Azure DevOps integration analytics (when enabled) */
  azureDevOps?: any | undefined; // AzureDevOpsAnalytics, imported from index
}

export interface ReportMetadata {
  generatedAt: Date;
  version: string;
  repoPath: string;
  analysisOptions: any; // GitSparkOptions, imported from index
  processingTime: number;
  gitVersion: string;
  commit: string;
  branch: string;
  /** CLI arguments used to generate this report */
  cliArguments?: string[];
  /** Non-fatal issues encountered during analysis */
  warnings?: string[];
  /** Derived configuration snapshot (after resolution/merge) */
  resolvedConfig?: Record<string, any>;
}

export interface RepositoryStats {
  totalCommits: number;
  totalAuthors: number;
  totalFiles: number;
  totalChurn: number;
  firstCommit: Date;
  lastCommit: Date;
  activeDays: number;
  avgCommitsPerDay: number;
  languages: { [language: string]: number };
  busFactor: number;
  healthScore: number;
  governanceScore: number;
}

export interface CurrentRepositoryState {
  /** Total files currently in the repository */
  totalFiles: number;
  /** Total size of all files in bytes */
  totalSizeBytes: number;
  /** Breakdown by file extension with counts */
  byExtension: Array<{
    extension: string;
    language: string;
    fileCount: number;
    totalSizeBytes: number;
    percentage: number;
    averageFileSize: number;
  }>;
  /** Breakdown by file category */
  categories: {
    sourceCode: {
      fileCount: number;
      totalSizeBytes: number;
      percentage: number;
    };
    documentation: {
      fileCount: number;
      totalSizeBytes: number;
      percentage: number;
    };
    configuration: {
      fileCount: number;
      totalSizeBytes: number;
      percentage: number;
    };
    tests: {
      fileCount: number;
      totalSizeBytes: number;
      percentage: number;
    };
    other: {
      fileCount: number;
      totalSizeBytes: number;
      percentage: number;
    };
  };
  /** Top directories by file count */
  topDirectories: Array<{
    path: string;
    fileCount: number;
    percentage: number;
  }>;
  /** Analysis timestamp */
  analyzedAt: Date;
}

export interface TimelineData {
  date: Date;
  commits: number;
  authors: number;
  churn: number;
  files: number;
}

export interface RiskAnalysis {
  highRiskFiles: FileStats[];
  riskFactors: { [factor: string]: number };
  recommendations: string[];
  overallRisk: 'low' | 'medium' | 'high';
}

export interface GovernanceAnalysis {
  conventionalCommits: number;
  traceabilityScore: number;
  avgMessageLength: number;
  wipCommits: number;
  revertCommits: number;
  shortMessages: number;
  score: number;
  recommendations: string[];
}

export interface TeamScore {
  overall: number;
  collaboration: TeamCollaborationMetrics;
  consistency: TeamConsistencyMetrics;
  workLifeBalance: TeamWorkLifeBalanceMetrics;
  insights: TeamInsights;
  recommendations: string[];
}

export interface TeamCollaborationMetrics {
  score: number;
  crossTeamInteraction: number; // Files touched by multiple authors
  knowledgeDistribution: number; // Distribution of file ownership
  fileOwnershipDistribution: {
    exclusive: number;
    shared: number;
    collaborative: number;
  };
  limitations: {
    dataSource: 'git-file-authorship-only';
    knownLimitations: string[];
  };
}

export interface TeamConsistencyMetrics {
  score: number;
  velocityConsistency: number;
  busFactorPercentage: number; // Percentage of authors who account for 80% of commits
  activeContributorRatio: number;
  deliveryCadence: number;
  contributionDistribution: {
    giniCoefficient: number;
    topContributorDominance: number;
  };
}

export interface TeamQualityMetrics {
  score: number;
  refactoringActivity: number;
  bugFixRatio: number;
  documentationContribution: number;
  testFileDetection: {
    hasTestFiles: boolean;
    testFiles: number;
    testFileToSourceRatio: number; // File count ratio, not execution coverage
    limitations: {
      note: string;
      recommendedTools: string[];
    };
  };
  limitations: {
    qualityMeasurement: 'commit-message-pattern-analysis';
    testCoverageNote: 'File detection only, not execution coverage';
    knownLimitations: string[];
  };
}

export interface TeamWorkLifeBalanceMetrics {
  score: number;
  commitTimePatterns: number; // Health score based on commit timing patterns
  afterHoursCommitFrequency: number; // Commits outside standard hours
  weekendCommitActivity: number; // Weekend commit percentage
  commitTimingIndicators: {
    highVelocityDays: number;
    consecutiveCommitDays: number; // Days with commits in sequence
    afterHoursCommits: number;
  };
  teamActiveCoverage: {
    multiContributorDays: number;
    soloContributorDays: number;
    coveragePercentage: number;
    note: string;
  };
  limitations: {
    timezoneWarning: string;
    workPatternNote: string;
    burnoutDetection: string;
    recommendedApproach: string;
    knownLimitations: string[];
  };
}

export interface TeamFileTypeMetrics {
  /** Team-wide file type breakdown across all contributors */
  teamFileTypeBreakdown: FileTypeBreakdown;
  /** Individual contributor file type specializations */
  authorSpecializations: Array<{
    authorName: string;
    authorEmail: string;
    primaryFileTypes: Array<{
      extension: string;
      language: string;
      percentage: number;
      commits: number;
    }>;
    specializationScore: number; // 0-1, how specialized vs. generalist
  }>;
  /** Cross-pollination metrics */
  crossPollinationMetrics: {
    generalMultiLanguageAuthors: number;
    languageSpecialists: number;
    averageLanguagesPerAuthor: number;
  };
}

export interface TeamInsights {
  strengths: string[];
  improvements: string[];
  risks: string[];
  teamDynamics: 'highly-collaborative' | 'balanced' | 'siloed' | 'fragmented';
  maturityLevel: 'nascent' | 'developing' | 'mature' | 'optimized';
  sustainabilityRating: 'excellent' | 'good' | 'concerning' | 'critical';
}

export interface ReportSummary {
  healthRating: 'excellent' | 'good' | 'fair' | 'poor';
  keyMetrics: { [metric: string]: string | number };
  insights: string[];
  actionItems: string[];
}

export interface ComparisonReport {
  base: AnalysisReport;
  compare: AnalysisReport;
  differences: ComparisonDifferences;
}

export interface ComparisonDifferences {
  commits: {
    added: number;
    removed: number;
    net: number;
  };
  authors: {
    added: string[];
    removed: string[];
    common: string[];
  };
  files: {
    added: string[];
    removed: string[];
    modified: string[];
  };
  metrics: {
    [key: string]: {
      base: number;
      compare: number;
      change: number;
      changePercent: number;
    };
  };
}
