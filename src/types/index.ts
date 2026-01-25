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
    fileTypeBreakdown: FileTypeBreakdown;
  };
}

export interface FileTypeBreakdown {
  /** File types by extension with activity metrics */
  byExtension: Array<{
    extension: string;
    language: string;
    commits: number;
    files: number;
    churn: number;
    percentage: number;
  }>;
  /** Summary categories */
  categories: {
    sourceCode: { files: number; commits: number; churn: number; percentage: number };
    documentation: { files: number; commits: number; churn: number; percentage: number };
    configuration: { files: number; commits: number; churn: number; percentage: number };
    tests: { files: number; commits: number; churn: number; percentage: number };
    other: { files: number; commits: number; churn: number; percentage: number };
  };
  /** Total activity for percentage calculations */
  totals: {
    files: number;
    commits: number;
    churn: number;
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

export interface AnalysisReport {
  metadata: ReportMetadata;
  repository: RepositoryStats;
  /** Current state of files in the repository (filesystem-based, not Git history) */
  currentState: CurrentRepositoryState;
  timeline: TimelineData[];
  authors: AuthorStats[];
  files: FileStats[];
  hotspots: FileStats[];
  risks: RiskAnalysis;
  governance: GovernanceAnalysis;
  teamScore: TeamScore;
  summary: ReportSummary;
  /** Daily trending metrics for comprehensive trend analysis */
  dailyTrends?: DailyTrendsData | undefined;
  /** Azure DevOps integration analytics (when enabled) */
  azureDevOps?: AzureDevOpsAnalytics | undefined;
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
  /** CLI arguments used to generate this report */
  cliArguments?: string[];
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
