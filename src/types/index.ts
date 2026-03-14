/**
 * Core types and interfaces for git-spark
 * Re-exports domain-specific types and contains core configuration and utility types
 */

// Re-export domain types for backward compatibility
export * from './author.js';
export * from './file.js';
export * from './analyzer.js';

/**
 * Complete configuration for Git Spark analyzer and exporters.
 * Contains nested configuration for analysis, output, and performance tuning.
 */
export interface GitSparkConfig {
  version: string;
  analysis: AnalysisConfig;
  output: OutputConfig;
  performance: PerformanceConfig;
}

export interface AnalysisConfig {
  excludePaths: string[];
  excludeExtensions: string[];
  includeAuthors: string[];
  excludeAuthors: string[];
  /** IANA timezone name for daily trends grouping */
  timezone?: string;
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
  fileFiltering: FileFilteringConfig;
}

export interface FileFilteringConfig {
  /** Extensions considered source code files for hotspot analysis */
  sourceCodeExtensions: string[];
  /** Extensions considered configuration/output files (excluded from hotspots) */
  configExtensions: string[];
  /** File patterns to exclude from hotspot analysis */
  excludePatterns: string[];
  /** Maximum number of files to show in hotspots */
  maxHotspots: number;
}

export interface PerformanceConfig {
  maxBuffer: number;
  enableCaching: boolean;
  cacheDir: string;
  chunkSize: number;
}

export type OutputFormat = 'html' | 'json' | 'console' | 'markdown' | 'csv';

/**
 * CLI options for Git Spark command-line interface.
 * Supports repository analysis, filtering, output customization, and integrations.
 */
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
  /** IANA timezone name for daily trends grouping */
  timezone?: string;
  heavy?: boolean;
  logLevel?: LogLevel;
  noCache?: boolean;
  compare?: string;
  watch?: boolean;
  /** Redact author emails in all outputs */
  redactEmails?: boolean;
  /** File extensions to exclude from analysis (e.g., ['.md', '.txt']) */
  excludeExtensions?: string[];
  /** Focus on team success - removes individual contributor sections */
  teamwork?: boolean;
  /** Resolved configuration snapshot (internal use) */
  resolvedConfig?: Partial<GitSparkConfig>;
  /** Marks config resolution completed (internal use) */
  configResolved?: boolean;
}

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose';

/**
 * Raw commit data extracted from Git repository.
 * Represents a single commit with metadata and file changes.
 */
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
  files: any[]; // FileChange[], imported from file.js
}

/**
 * Daily trending metrics computed exclusively from Git commit data
 *
 * All metrics are objective, observable patterns derived from Git history.
 * No speculation about team performance, code quality, or individual productivity.
 */
/**
 * Contribution heatmap data
 */
export interface ContributionGraphData {
  /** Calendar data by date */
  calendar: ContributionDay[];
  /** Maximum commits in a single day (for scaling colors) */
  maxCommits: number;
  /** Total commits in the period */
  totalCommits: number;
  /** Weeks structure for display */
  weeks: ContributionWeek[];
}

export interface ContributionDay {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Number of commits on this day */
  count: number;
  /** Intensity level (0-4) for color coding */
  intensity: number;
  /** ISO day of week (1=Monday, 7=Sunday) */
  dayOfWeek: number;
}

export interface ContributionWeek {
  /** Week number in the year */
  weekNumber: number;
  /** Days in this week */
  days: ContributionDay[];
}

export interface DailyTrendsData {
  /** Metadata about the trend analysis */
  analysisMetadata: DailyTrendsMetadata;

  /** Daily flow and throughput metrics */
  flowMetrics: DailyFlowMetrics[];

  /** Daily stability and risk indicators */
  stabilityMetrics: DailyStabilityMetrics[];

  /** Daily ownership and knowledge distribution */
  ownershipMetrics: DailyOwnershipMetrics[];

  /** Daily architectural coupling indicators */
  couplingMetrics: DailyCouplingMetrics[];

  /** Daily hygiene and documentation patterns */
  hygieneMetrics: DailyHygieneMetrics[];

  /** Contribution heatmap data */
  contributionsGraph: ContributionGraphData;

  /** Analysis limitations and warnings */
  limitations: DailyTrendsLimitations;
}

export interface DailyTrendsMetadata {
  /** Time zone used for day grouping (e.g., 'America/Chicago') */
  timezone: string;
  /** Analysis start date */
  startDate: Date;
  /** Analysis end date */
  endDate: Date;
  /** Total days analyzed */
  totalDays: number;
  /** Days with commit activity */
  activeDays: number;
  /** Working hours used for out-of-hours calculation */
  workingHours: {
    start: number; // 0-23
    end: number; // 0-23
    weekdays: boolean; // Mon-Fri only
  };
}

export interface DailyFlowMetrics {
  /** Date (local timezone) */
  date: Date;
  /** Calendar day (YYYY-MM-DD) */
  day: string;

  /** Commits authored that day */
  commitsPerDay: number;
  /** Unique authors that day */
  uniqueAuthorsPerDay: number;
  /** Total lines changed (insertions + deletions) */
  grossLinesChangedPerDay: number;
  /** Lines inserted */
  insertionsPerDay: number;
  /** Lines deleted */
  deletionsPerDay: number;
  /** Unique files touched */
  filesTouchedPerDay: number;

  /** Commit size distribution percentiles */
  commitSizeDistribution: {
    p50: number; // Median commit size
    p90: number; // 90th percentile commit size
  };
}

export interface DailyStabilityMetrics {
  /** Date (local timezone) */
  date: Date;
  /** Calendar day (YYYY-MM-DD) */
  day: string;

  /** Commits with 'revert' in message */
  revertsPerDay: number;
  /** Ratio of merge commits to total commits */
  mergeRatioPerDay: number;
  /** Files changed today that were also changed in last K days */
  retouchRate: number;
  /** File renames/moves detected */
  renamesPerDay: number;
  /** Percentage of commits outside working hours */
  outOfHoursShare: number;
}

export interface DailyOwnershipMetrics {
  /** Date (local timezone) */
  date: Date;
  /** Calendar day (YYYY-MM-DD) */
  day: string;

  /** New files created (first appearance in history) */
  newFilesCreatedPerDay: number;
  /** Files touched today with only 1 author in trailing 90 days */
  singleOwnerFilesTouched: number;
  /** Total files touched today */
  filesTouchedToday: number;
  /** Percentage of single-owner files among today's changes */
  singleOwnerShare: number;
  /** Average authors per file (trailing 90-day window) */
  avgAuthorsPerFile: number;
}

export interface DailyCouplingMetrics {
  /** Date (local timezone) */
  date: Date;
  /** Calendar day (YYYY-MM-DD) */
  day: string;

  /** Average number of file pairs co-changed per commit */
  coChangeDensityPerDay: number;
  /** Total file pairs co-changed */
  totalCoChangePairs: number;
  /** Commits with multiple file changes */
  multiFileCommits: number;
}

export interface DailyHygieneMetrics {
  /** Date (local timezone) */
  date: Date;
  /** Calendar day (YYYY-MM-DD) */
  day: string;

  /** Median commit message length (characters) */
  medianCommitMessageLength: number;
  /** Commits with messages shorter than threshold */
  shortMessages: number;
  /** Commits with conventional commit format */
  conventionalCommits: number;
}

export interface DailyTrendsLimitations {
  /** Data source description */
  dataSource: 'git-commit-history-only';

  /** Timezone handling warnings */
  timezoneWarnings: string[];

  /** Calculation method explanations */
  calculationMethods: Record<string, string>;

  /** Known limitations of Git-only analysis */
  knownLimitations: string[];

  /** Recommended complementary tools/approaches */
  recommendedSupplementalData: string[];
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

/**
 * Result of validation operation with errors and warnings.
 * Used by all validation functions to standardize error reporting.
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Base error class for all git-spark errors.
 * Provides error codes and cause tracking for debugging.
 */
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

/**
 * Validation error indicating invalid options or configuration.
 * Extends GitSparkError with field-level error context.
 */
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
