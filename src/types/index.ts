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
  teamScore: TeamScore;
  summary: ReportSummary;
  /** Daily trending metrics for comprehensive trend analysis */
  dailyTrends?: DailyTrendsData | undefined;
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
