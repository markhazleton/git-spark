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
  /** Azure DevOps integration options */
  azureDevOps?: boolean;
  devopsOrg?: string;
  devopsProject?: string;
  devopsRepo?: string;
  devopsPat?: string;
  devopsConfig?: string;
  /** Preserve original user-requested dates for Azure DevOps (before Git repo adjustment) */
  originalSince?: string;
  originalUntil?: string;
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
 * GitHub-style contributions graph data
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

  /** GitHub-style contributions graph data */
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

// Azure DevOps Integration Types

export interface AzureDevOpsConfig {
  /** Azure DevOps organization name */
  organization: string;
  /** Azure DevOps project name */
  project: string;
  /** Personal Access Token for authentication */
  personalAccessToken?: string;
  /** Repository name (defaults to Git remote) */
  repository?: string;
  /** Cache configuration for Azure DevOps data */
  cache?: AzureDevOpsCacheConfig;
  /** API configuration and limits */
  api?: AzureDevOpsApiConfig;
  /** Data filtering options */
  filters?: AzureDevOpsFilters;
  /** Integration behavior settings */
  integration?: AzureDevOpsIntegrationConfig;
}

export interface AzureDevOpsCacheConfig {
  /** Enable caching (default: true) */
  enabled: boolean;
  /** Cache directory (default: .git-spark/cache/azure-devops) */
  directory: string;
  /** Cache TTL in milliseconds (default: 1 hour) */
  ttlMs: number;
  /** Enable incremental updates (default: true) */
  incremental: boolean;
  /** Maximum cache size in MB (default: 100) */
  maxSizeMB: number;
  /** Background cache warming (default: false) */
  backgroundWarmup: boolean;
}

export interface AzureDevOpsApiConfig {
  /** API base URL (default: dev.azure.com) */
  baseUrl: string;
  /** API version (default: 7.0) */
  version: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeoutMs: number;
  /** Max retries for failed requests (default: 3) */
  maxRetries: number;
  /** Rate limiting configuration */
  rateLimit: {
    /** Requests per minute (default: 180) */
    requestsPerMinute: number;
    /** Enable rate limiting (default: true) */
    enabled: boolean;
  };
  /** Pagination configuration */
  pagination: {
    /** Default page size (default: 100) */
    pageSize: number;
    /** Maximum page size (default: 1000) */
    maxPageSize: number;
    /** Enable time partitioning for large datasets (default: true) */
    enableTimePartitioning: boolean;
  };
}

export interface AzureDevOpsFilters {
  /** Pull request state filter */
  pullRequestStates?: ('active' | 'abandoned' | 'completed')[];
  /** Minimum PR creation date */
  minCreatedDate?: Date;
  /** Maximum PR creation date */
  maxCreatedDate?: Date;
  /** Source branch patterns to include */
  sourceBranchPatterns?: string[];
  /** Target branch patterns to include */
  targetBranchPatterns?: string[];
  /** Creator email patterns to include */
  creatorPatterns?: string[];
  /** Exclude automated PRs (default: false) */
  excludeAutomated?: boolean;
}

export interface AzureDevOpsIntegrationConfig {
  /** Enable pull request analytics (default: true) */
  enablePullRequests: boolean;
  /** Enable work item linking analysis (default: false) */
  enableWorkItems: boolean;
  /** Enable reviewer analytics (default: true) */
  enableReviewers: boolean;
  /** Enable build integration analytics (default: false) */
  enableBuilds: boolean;
  /** Merge commit analytics integration (default: true) */
  mergeCommitIntegration: boolean;
  /** Progress reporting during data collection */
  progressReporting: boolean;
}

export interface AzureDevOpsPullRequest {
  /** Pull request ID */
  pullRequestId: number;
  /** Pull request title */
  title: string;
  /** Pull request description */
  description?: string;
  /** Current status */
  status: 'active' | 'abandoned' | 'completed';
  /** Creation date */
  creationDate: Date;
  /** Closed date (if completed/abandoned) */
  closedDate?: Date;
  /** Source branch reference */
  sourceRefName: string;
  /** Target branch reference */
  targetRefName: string;
  /** Creator information */
  createdBy: AzureDevOpsIdentity;
  /** Merge commit (if completed via merge) */
  lastMergeCommit?: AzureDevOpsCommitRef;
  /** Reviewer information */
  reviewers: AzureDevOpsPullRequestReviewer[];
  /** Work item links */
  workItemRefs?: AzureDevOpsWorkItemRef[];
  /** Completion options */
  completionOptions?: AzureDevOpsCompletionOptions;
  /** Auto-complete settings */
  autoCompleteSetBy?: AzureDevOpsIdentity;
  /** Labels */
  labels?: AzureDevOpsLabel[];
  /** PR URL */
  url: string;
  /** Is draft PR */
  isDraft: boolean;
  /** Supports iterations */
  supportsIterations: boolean;
}

export interface AzureDevOpsIdentity {
  /** Display name */
  displayName: string;
  /** Unique identifier */
  id: string;
  /** Email address */
  uniqueName?: string;
  /** Profile image URL */
  imageUrl?: string;
  /** User descriptor */
  descriptor?: string;
}

export interface AzureDevOpsCommitRef {
  /** Commit ID */
  commitId: string;
  /** Commit URL */
  url: string;
  /** Author information */
  author?: AzureDevOpsGitUserInfo;
  /** Committer information */
  committer?: AzureDevOpsGitUserInfo;
  /** Commit comment/message */
  comment?: string;
}

export interface AzureDevOpsGitUserInfo {
  /** Display name */
  name: string;
  /** Email address */
  email: string;
  /** Date */
  date: Date;
}

export interface AzureDevOpsPullRequestReviewer {
  /** Reviewer identity */
  reviewer: AzureDevOpsIdentity;
  /** Review vote (-10 to 10) */
  vote: number;
  /** Review status */
  votedFor?: AzureDevOpsIdentity[];
  /** Has declined */
  hasDeclined: boolean;
  /** Is flagged */
  isFlagged: boolean;
  /** Review URL */
  reviewerUrl?: string;
}

export interface AzureDevOpsWorkItemRef {
  /** Work item ID */
  id: string;
  /** Work item URL */
  url: string;
}

export interface AzureDevOpsCompletionOptions {
  /** Merge strategy */
  mergeStrategy: 'NoFastForward' | 'Squash' | 'Rebase' | 'RebaseMerge';
  /** Delete source branch */
  deleteSourceBranch: boolean;
  /** Transition work items */
  transitionWorkItems: boolean;
  /** Squash merge commit message */
  squashMergeCommitMessage?: string;
}

export interface AzureDevOpsLabel {
  /** Label ID */
  id: string;
  /** Label name */
  name: string;
  /** Label description */
  description?: string;
  /** Label color */
  color?: string;
}

export interface ProcessedPRData {
  /** Original PR data */
  pullRequest: AzureDevOpsPullRequest;
  /** Calculated metrics */
  metrics: PullRequestMetrics;
  /** Git commit associations */
  gitCommitAssociations: GitCommitAssociation[];
  /** Processing metadata */
  processingMetadata: PRProcessingMetadata;
}

export interface PullRequestMetrics {
  /** Time to merge (in hours) */
  timeToMerge?: number;
  /** Time to first review (in hours) */
  timeToFirstReview?: number;
  /** Number of reviewers */
  reviewerCount: number;
  /** Number of comments/iterations */
  iterationCount: number;
  /** Size metrics */
  size: {
    /** Files changed */
    filesChanged: number;
    /** Lines added */
    linesAdded: number;
    /** Lines deleted */
    linesDeleted: number;
    /** Total churn */
    totalChurn: number;
  };
  /** Complexity indicators */
  complexity: {
    /** Cross-directory changes */
    crossDirectoryChanges: boolean;
    /** Multiple file types */
    multipleFileTypes: boolean;
    /** High-risk files touched */
    highRiskFilesTouched: number;
  };
  /** Review quality indicators */
  reviewQuality: {
    /** Had approvals */
    hadApprovals: boolean;
    /** Had rejections */
    hadRejections: boolean;
    /** Self-approved */
    selfApproved: boolean;
    /** Review coverage score (0-1) */
    reviewCoverage: number;
  };
  /** Integration metrics */
  integration: {
    /** Merge strategy used */
    mergeStrategy?: string;
    /** Source branch deleted */
    sourceBranchDeleted: boolean;
    /** Had conflicts */
    hadConflicts: boolean;
    /** Build status */
    buildStatus?: 'succeeded' | 'failed' | 'canceled' | 'none';
  };
}

export interface GitCommitAssociation {
  /** Git commit hash */
  commitHash: string;
  /** Association confidence (0-1) */
  confidence: number;
  /** Association method */
  method: 'merge-commit' | 'squash-commit' | 'branch-analysis' | 'manual-link';
  /** Additional metadata */
  metadata?: Record<string, any>;
}

export interface PRProcessingMetadata {
  /** Processing timestamp */
  processedAt: Date;
  /** Data source version */
  apiVersion: string;
  /** Limitations encountered */
  limitations: string[];
  /** Warnings */
  warnings: string[];
  /** Cache hit/miss info */
  cacheInfo: {
    hit: boolean;
    source: 'memory' | 'file' | 'api';
    age?: number;
  };
}

export interface AzureDevOpsAnalytics {
  /** Summary metrics */
  summary: AzureDevOpsSummary;
  /** Pull request analytics */
  pullRequests: PullRequestAnalytics;
  /** Review process analytics */
  reviewProcess: ReviewProcessAnalytics;
  /** Integration with Git data */
  gitIntegration: GitIntegrationAnalytics;
  /** Team collaboration insights */
  teamCollaboration: TeamCollaborationInsights;
  /** Limitations and data quality */
  dataQuality: DataQualityReport;
}

export interface AzureDevOpsSummary {
  /** Total PRs analyzed */
  totalPullRequests: number;
  /** Date range of analysis */
  dateRange: {
    start: Date;
    end: Date;
  };
  /** Data freshness */
  dataFreshness: {
    cacheHitRate: number;
    oldestDataAge: number;
    newestDataAge: number;
  };
  /** Coverage metrics */
  coverage: {
    /** Percentage of Git commits associated with PRs */
    gitCommitCoverage: number;
    /** PR states included */
    prStatesIncluded: string[];
  };
}

export interface PullRequestAnalytics {
  /** Size distribution */
  sizeDistribution: {
    small: number; // <10 files
    medium: number; // 10-50 files
    large: number; // 50-200 files
    xlarge: number; // >200 files
  };
  /** Timing metrics */
  timing: {
    averageTimeToMerge: number;
    medianTimeToMerge: number;
    averageTimeToFirstReview: number;
    percentileMetrics: {
      p50TimeToMerge: number;
      p90TimeToMerge: number;
      p50TimeToReview: number;
      p90TimeToReview: number;
    };
  };
  /** Status breakdown */
  statusBreakdown: {
    completed: number;
    active: number;
    abandoned: number;
  };
  /** Merge strategy distribution */
  mergeStrategies: {
    merge: number;
    squash: number;
    rebase: number;
    rebaseMerge: number;
  };
}

export interface ReviewProcessAnalytics {
  /** Review participation */
  participation: {
    averageReviewersPerPR: number;
    reviewCoverageDistribution: number[]; // [0-20%, 20-40%, 40-60%, 60-80%, 80-100%]
    selfApprovalRate: number;
  };
  /** Review quality indicators */
  quality: {
    approvalRate: number;
    rejectionRate: number;
    averageReviewCycles: number;
    thoroughnessScore: number; // Based on time spent and feedback
  };
  /** Reviewer workload */
  workload: {
    topReviewers: Array<{
      reviewer: string;
      reviewCount: number;
      averageResponseTime: number;
    }>;
    workloadDistribution: number; // Gini coefficient for review distribution
  };
}

export interface GitIntegrationAnalytics {
  /** Commit-to-PR mapping success rate */
  mappingSuccessRate: number;
  /** Integration methods used */
  integrationMethods: {
    mergeCommit: number;
    squashCommit: number;
    branchAnalysis: number;
    manualLink: number;
  };
  /** Quality of integration */
  integrationQuality: {
    highConfidenceAssociations: number;
    mediumConfidenceAssociations: number;
    lowConfidenceAssociations: number;
    unmappedCommits: number;
  };
  /** Branch strategy insights */
  branchStrategy: {
    featureBranchPattern: string;
    commonSourceBranches: string[];
    commonTargetBranches: string[];
    branchLifetime: {
      average: number;
      median: number;
    };
  };
}

export interface TeamCollaborationInsights {
  /** PR creation patterns */
  creationPatterns: {
    mostActivePRCreators: Array<{
      creator: string;
      prCount: number;
      averagePRSize: number;
    }>;
    creationDistribution: number; // Gini coefficient for PR creation
  };
  /** Cross-team collaboration */
  crossTeamCollaboration: {
    crossReviewRate: number; // Reviews across different areas
    knowledgeSharingScore: number;
    mentorshipIndicators: {
      seniorToJuniorReviews: number;
      juniorToSeniorPRs: number;
    };
  };
  /** Team dynamics */
  teamDynamics: {
    collaborationScore: number;
    bottleneckIndicators: string[];
    teamHealthScore: number;
  };
}

export interface DataQualityReport {
  /** Data completeness */
  completeness: {
    prDataCompleteness: number;
    reviewDataCompleteness: number;
    commitAssociationRate: number;
  };
  /** Known limitations */
  limitations: {
    apiLimitations: string[];
    dataSourceLimitations: string[];
    calculationLimitations: string[];
  };
  /** Confidence intervals */
  confidence: {
    timingMetrics: 'high' | 'medium' | 'low';
    reviewMetrics: 'high' | 'medium' | 'low';
    collaborationMetrics: 'high' | 'medium' | 'low';
  };
  /** Recommendations */
  recommendations: string[];
}

export class AzureDevOpsError extends GitSparkError {
  constructor(
    message: string,
    public errorCode?: string,
    public statusCode?: number,
    cause?: Error
  ) {
    super(message, 'AZURE_DEVOPS_ERROR', cause);
    this.name = 'AzureDevOpsError';
  }
}

export interface AzureDevOpsValidationResult extends ValidationResult {
  /** Configuration validation details */
  configValidation?: {
    organizationValid: boolean;
    projectValid: boolean;
    tokenValid: boolean;
    repositoryValid: boolean;
  };
  /** API connectivity test results */
  connectivityTest?: {
    canConnect: boolean;
    responseTime?: number;
    apiVersion?: string;
  };
}
