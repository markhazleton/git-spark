/**
 * Core types and interfaces for git-spark
 */

export interface GitSparkConfig {
  version: string;
  analysis: AnalysisConfig;
  output: OutputConfig;
  performance: PerformanceConfig;
}

export interface AnalysisConfig {
  excludePaths: string[];
  includeAuthors: string[];
  excludeAuthors: string[];
  thresholds: AnalysisThresholds;
  weights: AnalysisWeights;
}

export interface AnalysisThresholds {
  largeCommitLines: number;
  smallCommitLines: number;
  staleBranchDays: number;
  largeFileKB: number;
  hotspotAuthorThreshold: number;
}

export interface AnalysisWeights {
  risk: RiskWeights;
  governance: GovernanceWeights;
}

export interface RiskWeights {
  churn: number;
  recency: number;
  ownership: number;
  entropy: number;
  coupling: number;
}

export interface GovernanceWeights {
  conventional: number;
  traceability: number;
  length: number;
  wipPenalty: number;
  revertPenalty: number;
  shortPenalty: number;
}

export interface OutputConfig {
  defaultFormat: OutputFormat;
  outputDir: string;
  includeCharts: boolean;
  redactEmails: boolean;
  theme: string;
}

export interface PerformanceConfig {
  maxBuffer: number;
  enableCaching: boolean;
  cacheDir: string;
  chunkSize: number;
}

export type OutputFormat = 'html' | 'json' | 'console' | 'markdown' | 'csv';

export interface GitSparkOptions {
  repoPath?: string;
  since?: string;
  until?: string;
  days?: number;
  branch?: string;
  author?: string;
  path?: string;
  format?: OutputFormat;
  output?: string;
  config?: string;
  heavy?: boolean;
  logLevel?: LogLevel;
  noCache?: boolean;
  compare?: string;
  watch?: boolean;
  /** Redact author emails in all outputs */
  redactEmails?: boolean;
}

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose';

export interface CommitData {
  hash: string;
  shortHash: string;
  author: string;
  authorEmail: string;
  date: Date;
  message: string;
  subject: string;
  body: string;
  insertions: number;
  deletions: number;
  filesChanged: number;
  isMerge: boolean;
  isCoAuthored: boolean;
  coAuthors: string[];
  files: FileChange[];
}

export interface FileChange {
  path: string;
  insertions: number;
  deletions: number;
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied';
  oldPath?: string;
}

export interface AuthorStats {
  name: string;
  email: string;
  commits: number;
  insertions: number;
  deletions: number;
  churn: number;
  filesChanged: number;
  firstCommit: Date;
  lastCommit: Date;
  activeDays: number;
  avgCommitSize: number;
  largestCommit: number;
  workPatterns: WorkPattern;
  // Enhanced detailed metrics
  detailed: AuthorDetailedMetrics;
}

export interface WorkPattern {
  hourDistribution: number[];
  dayDistribution: number[];
  burstDays: number;
  afterHours: number;
  weekends: number;
}

export interface AuthorDetailedMetrics {
  // Core contribution metrics
  contribution: AuthorContributionMetrics;
  // Collaboration metrics
  collaboration: AuthorCollaborationMetrics;
  // Work pattern metrics
  workPattern: AuthorWorkPatternMetrics;
  // Quality & impact metrics
  quality: AuthorQualityMetrics;
  // Comparative metrics
  comparative: AuthorComparativeMetrics;
  // Insights
  insights: AuthorInsights;
}

export interface AuthorContributionMetrics {
  totalCommits: number;
  commitFrequency: number; // commits per day
  activeDaysCount: number;
  longestStreak: number;
  commitSizeDistribution: {
    micro: number; // <20 lines
    small: number; // 20-50 lines
    medium: number; // 51-200 lines
    large: number; // 201-500 lines
    veryLarge: number; // >500 lines
  };
  largestCommitDetails: {
    size: number;
    hash: string;
    date: Date;
    message: string;
    filesCount: number;
  };
  codeVolumeMetrics: {
    totalLinesChanged: number;
    netChange: number; // insertions - deletions
    churnTotal: number; // insertions + deletions
    avgCommitSize: number;
  };
  filesAndScope: {
    uniqueFiles: number;
    avgFilesPerCommit: number;
    fileDiversityScore: number; // percentage of codebase touched
    mostModifiedFiles: Array<{ path: string; commits: number; percentage: number }>;
    directoryFocus: Array<{ directory: string; percentage: number }>;
    sourceVsPublishedRatio: {
      sourceCommits: number;
      sourceLines: { insertions: number; deletions: number };
      publishedCommits: number;
      publishedLines: { insertions: number; deletions: number };
    };
  };
}

export interface AuthorCollaborationMetrics {
  coAuthorshipRate: number; // percentage of commits with co-authors
  coAuthors: Array<{ name: string; count: number }>;
  prIntegrationRate: number; // percentage via PR/merge commits
  prBreakdown: {
    mergeCommits: number;
    squashMerges: number;
    directCommits: number;
  };
  fileOwnership: {
    exclusiveFiles: number; // files only this author touched
    sharedFiles: number; // files with multiple authors
    highTrafficFiles: number; // files with 5+ authors
    ownershipStyle: 'collaborative' | 'specialized' | 'balanced';
  };
  knowledgeSharingIndex: number; // files shared with others / total files
}

export interface AuthorWorkPatternMetrics {
  commitTiming: {
    mostActiveDay: { day: string; percentage: number };
    mostActiveTime: { timeRange: string; percentage: number };
    workPattern: 'weekday-focused' | 'weekend-warrior' | 'distributed';
    afterHoursRate: number;
  };
  temporalPatterns: {
    burstDetection: Array<{ date: Date; commitCount: number; timeSpan: string }>;
    longestGap: { days: number; startDate: Date; endDate: Date };
    averageGap: number;
    consistencyScore: number; // 0-100
    velocityTrend: 'increasing' | 'stable' | 'decreasing';
  };
  workLifeBalance: {
    afterHoursPercentage: number;
    weekendPercentage: number;
    lateNightCommits: number; // 10pm-6am
    vacationBreaks: Array<{ startDate: Date; endDate: Date; days: number }>;
  };
}

export interface AuthorQualityMetrics {
  commitMessageQuality: {
    overallScore: number; // 0-100
    conventionalCommitsRate: number;
    issueTraceabilityRate: number;
    averageLength: number;
    qualityBreakdown: {
      conventional: number;
      hasIssueRefs: number;
      adequateLength: number;
      descriptive: number;
      properCapitalization: number;
      noWip: number;
    };
  };
  codeQuality: {
    revertRate: number;
    fixToFeatureRatio: number;
    wipCommitFrequency: number;
    refactoringActivity: {
      refactorCommits: number;
      linesRefactored: number;
      percentage: number;
    };
    documentationContributions: {
      docCommits: number;
      docLinesChanged: number;
      percentage: number;
    };
  };
  riskAndOwnership: {
    highRiskFileContributions: number;
    ownershipDominance: number; // average dominance in contributed files
    hotspotInvolvement: number;
    legacyCodeInteraction: number; // commits to old files
  };
}

export interface AuthorComparativeMetrics {
  teamContext: {
    relativeContribution: number; // percentage of team commits
    commitRank: number;
    linesChangedRank: number;
    filesRank: number;
    messageQualityRank: number;
    percentileRankings: {
      commits: number;
      linesChanged: number;
      filesTouched: number;
      messageQuality: number;
    };
  };
  specialization: {
    focusIndex: number; // how focused vs distributed
    specializationLevel: 'highly-specialized' | 'moderate' | 'generalist';
  };
  growth: {
    periodOverPeriodGrowth: {
      commits: number;
      linesChanged: number;
      filesTouched: number;
      messageQuality: number;
    };
    complexityTrajectory: {
      avgLinesPerCommitGrowth: number;
      avgFilesPerCommitGrowth: number;
    };
    technologyBreadth: {
      languages: Array<{ language: string; commits: number; percentage: number }>;
      diversityScore: number;
      trend: 'expanding' | 'stable' | 'narrowing';
    };
  };
}

export interface AuthorInsights {
  positivePatterns: string[];
  growthAreas: string[];
  neutralObservations: string[];
  concerningPatterns: string[];
  automatedInsights: {
    workLifeBalance: 'healthy' | 'concerning' | 'excellent';
    collaboration: 'highly-collaborative' | 'moderate' | 'isolated';
    codeQuality: 'excellent' | 'good' | 'needs-improvement';
    consistency: 'very-consistent' | 'consistent' | 'irregular';
    expertise: 'senior' | 'mid-level' | 'junior' | 'specialist';
  };
  recommendations: string[];
}

export interface FileStats {
  path: string;
  commits: number;
  authors: string[];
  churn: number;
  insertions: number;
  deletions: number;
  firstChange: Date;
  lastChange: Date;
  riskScore: number;
  hotspotScore: number;
  ownership: { [author: string]: number };
  language?: string;
  size?: number;
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

export interface AnalysisReport {
  metadata: ReportMetadata;
  repository: RepositoryStats;
  timeline: TimelineData[];
  authors: AuthorStats[];
  files: FileStats[];
  hotspots: FileStats[];
  risks: RiskAnalysis;
  governance: GovernanceAnalysis;
  summary: ReportSummary;
}

export interface ReportMetadata {
  generatedAt: Date;
  version: string;
  repoPath: string;
  analysisOptions: GitSparkOptions;
  processingTime: number;
  gitVersion: string;
  commit: string;
  branch: string;
  /** Non-fatal issues encountered during analysis */
  warnings?: string[];
  /** Derived configuration snapshot (after resolution/merge) */
  resolvedConfig?: Partial<GitSparkConfig>;
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

export interface ProgressCallback {
  (phase: string, progress: number, total: number): void;
}

export interface CacheEntry {
  key: string;
  data: any;
  timestamp: number;
  ttl: number;
}

export interface GitCommand {
  command: string;
  args: string[];
  options?: {
    cwd?: string;
    maxBuffer?: number;
    timeout?: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class GitSparkError extends Error {
  constructor(
    message: string,
    public code?: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'GitSparkError';
  }
}

export class ValidationError extends GitSparkError {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class GitError extends GitSparkError {
  constructor(
    message: string,
    public gitCommand?: string
  ) {
    super(message, 'GIT_ERROR');
    this.name = 'GitError';
  }
}

export class PerformanceError extends GitSparkError {
  constructor(message: string) {
    super(message, 'PERFORMANCE_ERROR');
    this.name = 'PerformanceError';
  }
}
