# Azure DevOps PR Data Types and Interfaces

> **📋 DOCUMENT STATUS**: This is a historical design document from October 2025.  
> **✅ IMPLEMENTATION STATUS**: All types and interfaces have been **IMPLEMENTED** in `src/types/index.ts`.  
> This document is retained for type system design documentation and reference.

## Core Azure DevOps Types

### Pull Request Data Structure

```typescript
/**
 * Azure DevOps Pull Request data from REST API
 */
export interface AzureDevOpsPullRequest {
  pullRequestId: number;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'abandoned' | 'draft';
  createdBy: {
    displayName: string;
    uniqueName: string;
    id: string;
  };
  creationDate: string; // ISO 8601
  closedDate?: string; // ISO 8601
  sourceRefName: string; // refs/heads/feature-branch
  targetRefName: string; // refs/heads/main
  repository: {
    id: string;
    name: string;
    project: {
      id: string;
      name: string;
    };
  };
  reviewers: Array<{
    displayName: string;
    uniqueName: string;
    id: string;
    vote: number; // -10, -5, 0, 5, 10
    isRequired: boolean;
  }>;
  workItemRefs?: Array<{
    id: string;
    title?: string;
    workItemType?: string;
  }>;
  commits?: Array<{
    commitId: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
    comment: string;
  }>;
  completionOptions?: {
    squashMerge: boolean;
    deleteSourceBranch: boolean;
    transitionWorkItems: boolean;
  };
}

/**
 * Processed PR analytics data
 */
export interface ProcessedPRData {
  pullRequestId: number;
  title: string;
  description: string;
  author: string;
  authorEmail: string;
  repository: string;
  status: 'active' | 'completed' | 'abandoned' | 'draft';
  createdDate: Date;
  closedDate?: Date;
  sourceBranch: string;
  targetBranch: string;
  reviewers: string[];
  workItems: Array<{id: number; title: string; type?: string}>;
  commitCount: number;
  changeStats: {
    filesChanged: number;
    linesAdded: number;
    linesDeleted: number;
    totalChanges: number;
  };
  timing: PRTimingMetrics;
  collaboration: PRCollaborationMetrics;
  quality: PRQualityMetrics;
}

/**
 * PR timing analysis
 */
export interface PRTimingMetrics {
  timeToCloseHours?: number;
  timeToFirstReviewHours?: number;
  timeWaitingForReviewHours?: number;
  timeInReviewHours?: number;
  reviewCycles: number;
  approvalDelayHours?: number;
  isStale: boolean;
  isBlocked: boolean;
  hasDelayedApproval: boolean;
  hasSlowReviewerResponse: boolean;
  hasSlowAuthorResponse: boolean;
}

/**
 * PR collaboration patterns
 */
export interface PRCollaborationMetrics {
  reviewerCount: number;
  requiredReviewerCount: number;
  crossTeamReviewers: number;
  commentCount: number;
  reviewIterations: number;
  knowledgeSharingScore: number;
}

/**
 * PR quality indicators
 */
export interface PRQualityMetrics {
  workItemLinkage: boolean;
  hasDescription: boolean;
  followsNamingConvention: boolean;
  commitMessageQuality: number;
  testCoverage?: {
    hasTestChanges: boolean;
    testToSourceRatio: number;
  };
  riskScore: number; // Based on size, complexity, reviewers
}
```

## Extended git-spark Types

### Enhanced GitSparkOptions

```typescript
export interface GitSparkOptions {
  // Existing options...
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
  redactEmails?: boolean;
  
  // New Azure DevOps options
  azureDevOps?: boolean;
  devopsOrg?: string;
  devopsProject?: string;
  devopsRepo?: string;
  devopsAuth?: 'pat' | 'cli' | 'managed-identity';
  devopsToken?: string;
  devopsTokenFile?: string;
}
```

### Enhanced Author Statistics

```typescript
export interface EnhancedAuthorStats extends AuthorStats {
  pullRequestMetrics?: {
    prsCreated: number;
    prsCompleted: number;
    prsAbandoned: number;
    prsDraft: number;
    avgTimeToClose: number;
    avgReviewCycles: number;
    reviewParticipation: number;
    workItemLinkage: number;
    crossTeamCollaboration: number;
    reviewQuality: {
      avgCommentsPerReview: number;
      thoroughnessScore: number;
    };
    authorshipPatterns: {
      avgPRSize: number;
      descriptionQuality: number;
      namingConventionCompliance: number;
    };
  };
}
```

### Azure DevOps Analytics Report

```typescript
export interface AzureDevOpsAnalytics {
  summary: {
    totalPRs: number;
    activePRs: number;
    completedPRs: number;
    abandonedPRs: number;
    avgTimeToClose: number;
    avgReviewCycles: number;
    workItemLinkageRate: number;
  };
  
  workflow: {
    efficiency: PRWorkflowEfficiency;
    bottlenecks: PRBottleneckAnalysis;
    patterns: PRPatternAnalysis;
  };
  
  collaboration: {
    teamMetrics: TeamCollaborationMetrics;
    reviewPatterns: ReviewPatternAnalysis;
    knowledgeSharing: KnowledgeSharingMetrics;
  };
  
  quality: {
    codeReviewQuality: CodeReviewQualityMetrics;
    processCompliance: ProcessComplianceMetrics;
    riskAssessment: PRRiskAssessment;
  };
  
  trends: {
    deliveryVelocity: DeliveryVelocityTrends;
    teamProductivity: TeamProductivityTrends;
    qualityTrends: QualityTrends;
  };
}

export interface PRWorkflowEfficiency {
  avgTimeToFirstReview: number;
  avgReviewCycleTime: number;
  avgApprovalTime: number;
  stalePRCount: number;
  blockedPRCount: number;
  throughputPerWeek: number;
  efficiencyScore: number; // 0-100
}

export interface PRBottleneckAnalysis {
  slowReviewers: Array<{
    reviewer: string;
    avgResponseTime: number;
    prCount: number;
  }>;
  staleReviews: Array<{
    prId: number;
    title: string;
    daysSinceLastActivity: number;
    blockedOn: string;
  }>;
  reviewCapacityIssues: {
    overloadedReviewers: string[];
    reviewDistribution: { [reviewer: string]: number };
  };
}

export interface PRPatternAnalysis {
  sizeDistribution: {
    micro: number;   // <50 lines
    small: number;   // 50-200 lines
    medium: number;  // 200-500 lines
    large: number;   // 500-1000 lines
    veryLarge: number; // >1000 lines
  };
  branchingPatterns: {
    featureBranches: number;
    hotfixes: number;
    releases: number;
    other: number;
  };
  timingPatterns: {
    businessHoursCreation: number;
    afterHoursCreation: number;
    weekendActivity: number;
  };
}
```

## Azure DevOps Configuration

### Configuration Schema

```typescript
export interface AzureDevOpsConfig {
  enabled: boolean;
  organization: string;
  project: string;
  repository?: string; // Optional, auto-detect from Git remote
  authentication: {
    method: 'pat' | 'cli' | 'managed-identity';
    tokenFile?: string;
    tokenEnvVar?: string;
  };
  analysis: {
    includePRData: boolean;
    includeWorkItems: boolean;
    maxPRs?: number; // Limit for performance
    cacheTTL: number; // Cache time-to-live in seconds
    rateLimitDelay: number; // Delay between API calls in ms
    parallelRequests: number; // Max concurrent API calls
  };
  filters: {
    prStates: Array<'active' | 'completed' | 'abandoned' | 'draft'>;
    targetBranches?: string[]; // Filter PRs by target branch
    authors?: string[]; // Filter PRs by author
    dateRange?: {
      since?: string;
      until?: string;
    };
  };
  thresholds: {
    stalePRDays: number; // Days before PR is considered stale
    slowReviewHours: number; // Hours before review is considered slow
    largeRequestLines: number; // Lines changed threshold for large PR
    maxReviewCycles: number; // Max expected review cycles
  };
}
```

### Enhanced GitSparkConfig

```typescript
export interface GitSparkConfig {
  version: string;
  analysis: AnalysisConfig;
  output: OutputConfig;
  performance: PerformanceConfig;
  azureDevOps?: AzureDevOpsConfig; // New optional section
}
```

## API Integration Types

### Azure DevOps API Client

```typescript
export interface AzureDevOpsApiClient {
  organization: string;
  project: string;
  authentication: AzureDevOpsAuth;
  
  // Core methods
  getPullRequests(options: PRQueryOptions): Promise<AzureDevOpsPullRequest[]>;
  getPullRequestDetails(prId: number): Promise<AzureDevOpsPullRequest>;
  getPullRequestCommits(prId: number): Promise<PRCommit[]>;
  getWorkItem(workItemId: number): Promise<WorkItem>;
  
  // Utility methods
  validateConnection(): Promise<boolean>;
  getRateLimitStatus(): Promise<RateLimitInfo>;
  getRepositoryInfo(): Promise<RepositoryInfo>;
}

export interface AzureDevOpsAuth {
  method: 'pat' | 'cli' | 'managed-identity';
  token?: string;
  credentials?: any;
}

export interface PRQueryOptions {
  repository?: string;
  status?: string;
  creatorId?: string;
  reviewerId?: string;
  sourceRefName?: string;
  targetRefName?: string;
  minTime?: Date;
  maxTime?: Date;
  maxResults?: number;
  skip?: number;
}

export interface PRCommit {
  commitId: string;
  author: {
    name: string;
    email: string;
    date: Date;
  };
  comment: string;
  changeCounts: {
    add: number;
    edit: number;
    delete: number;
  };
}

export interface WorkItem {
  id: number;
  title: string;
  workItemType: string;
  state: string;
  assignedTo?: string;
  createdDate: Date;
  changedDate: Date;
}
```

## Error Handling and Validation

### Azure DevOps Specific Errors

```typescript
export class AzureDevOpsError extends GitSparkError {
  constructor(
    message: string,
    public apiResponse?: any,
    public statusCode?: number
  ) {
    super(message, 'AZURE_DEVOPS_ERROR');
    this.name = 'AzureDevOpsError';
  }
}

export class AzureDevOpsAuthError extends AzureDevOpsError {
  constructor(message: string, public authMethod?: string) {
    super(message);
    this.name = 'AzureDevOpsAuthError';
    this.code = 'AZURE_DEVOPS_AUTH_ERROR';
  }
}

export class AzureDevOpsRateLimitError extends AzureDevOpsError {
  constructor(
    message: string,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'AzureDevOpsRateLimitError';
    this.code = 'AZURE_DEVOPS_RATE_LIMIT_ERROR';
  }
}
```

### Validation Types

```typescript
export interface AzureDevOpsValidationResult extends ValidationResult {
  connectionValid: boolean;
  repositoryMatch: boolean;
  permissionsValid: boolean;
  configurationValid: boolean;
}
```

This type system provides comprehensive support for Azure DevOps integration while maintaining backward compatibility with existing git-spark functionality. The interfaces are designed to be extensible and support future enhancements to PR analytics capabilities.
