/**
 * Author-related types for git-spark
 * Contains metrics and analytics for individual contributors
 */

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
    fileTypeBreakdown: {
      byExtension: Array<{
        extension: string;
        language: string;
        commits: number;
        files: number;
        churn: number;
        percentage: number;
      }>;
      categories: {
        sourceCode: { files: number; commits: number; churn: number; percentage: number };
        documentation: { files: number; commits: number; churn: number; percentage: number };
        configuration: { files: number; commits: number; churn: number; percentage: number };
        tests: { files: number; commits: number; churn: number; percentage: number };
        other: { files: number; commits: number; churn: number; percentage: number };
      };
      totals: {
        files: number;
        commits: number;
        churn: number;
      };
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
