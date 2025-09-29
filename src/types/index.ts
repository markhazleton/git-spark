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
}

export interface WorkPattern {
  hourDistribution: number[];
  dayDistribution: number[];
  burstDays: number;
  afterHours: number;
  weekends: number;
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
