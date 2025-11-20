import {
  AzureDevOpsConfig,
  AzureDevOpsPullRequest,
  ProcessedPRData,
  GitSparkOptions,
  CommitData,
  ProgressCallback,
  AzureDevOpsError,
  AzureDevOpsAnalytics,
} from '../../types';
import { createLogger } from '../../utils/logger';
import { createAzureDevOpsConfig } from './config';
import { AzureDevOpsClient } from './client';
import { CacheManager } from './cache-manager';
import { GitCommitAssociator } from './git-integration';
import { AzureDevOpsAnalyticsProcessor } from './analytics';

const logger = createLogger('azure-devops-collector');

/**
 * Main orchestrator for Azure DevOps data collection and processing
 * Coordinates configuration, API client, caching, and Git integration
 */
export class AzureDevOpsCollector {
  private config: AzureDevOpsConfig | null = null;
  private client: AzureDevOpsClient | null = null;
  private cacheManager: CacheManager | null = null;
  private gitAssociator: GitCommitAssociator | null = null;
  private analyticsProcessor: AzureDevOpsAnalyticsProcessor | null = null;
  private readonly enabled: boolean;

  constructor(
    private repoPath: string,
    private options: GitSparkOptions,
    private gitData: CommitData[],
    private progressCallback?: ProgressCallback
  ) {
    this.enabled = !!options.azureDevOps;

    if (!this.enabled) {
      logger.info('Azure DevOps integration disabled');
      return;
    }

    logger.info('Azure DevOps collector initialized', {
      repoPath,
      hasProgressCallback: !!progressCallback,
      gitCommits: gitData.length,
    });
  }

  /**
   * Initialize Azure DevOps integration components
   */
  async initialize(): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      this.reportProgress('Initializing Azure DevOps integration', 0, 4);

      // Step 1: Resolve configuration
      this.reportProgress('Resolving Azure DevOps configuration', 1, 4);
      this.config = await createAzureDevOpsConfig(this.repoPath, this.options);

      if (!this.config) {
        throw new AzureDevOpsError('Failed to resolve Azure DevOps configuration');
      }

      logger.info('Azure DevOps configuration resolved', {
        organization: this.config.organization,
        project: this.config.project,
        repository: this.config.repository,
        hasToken: !!this.config.personalAccessToken,
      });

      // Step 2: Initialize cache manager
      this.reportProgress('Initializing cache system', 2, 4);
      this.cacheManager = new CacheManager(this.config, this.repoPath);

      // Step 3: Initialize API client
      this.reportProgress('Initializing API client', 3, 4);
      this.client = new AzureDevOpsClient(this.config, this.progressCallback);

      // Test connectivity
      const connectivityTest = await this.client.testConnection();
      if (!connectivityTest.success) {
        throw new AzureDevOpsError(
          `Azure DevOps connectivity test failed: ${connectivityTest.error}`,
          'CONNECTIVITY_ERROR'
        );
      }

      logger.info('Azure DevOps connectivity verified', {
        responseTime: connectivityTest.responseTime,
      });

      // Step 4: Initialize Git integration and analytics
      this.reportProgress('Initializing Git integration', 4, 4);
      this.gitAssociator = new GitCommitAssociator(this.gitData, this.config);
      this.analyticsProcessor = new AzureDevOpsAnalyticsProcessor(this.config);

      logger.info('Azure DevOps collector initialization complete');
    } catch (error) {
      logger.error('Azure DevOps collector initialization failed', { error });
      throw error;
    }
  }

  /**
   * Collect and process Azure DevOps pull request data
   */
  async collectPullRequestData(): Promise<ProcessedPRData[]> {
    if (!this.enabled || !this.isInitialized()) {
      return [];
    }

    try {
      const startTime = Date.now();
      logger.info('Starting Azure DevOps pull request collection');

      this.reportProgress('Checking cache for existing data', 0, 5);

      // Check cache first (unless disabled by --no-cache flag)
      const cacheKey = this.getCacheKey();
      const cachedData = !this.options.noCache
        ? await this.cacheManager!.getCachedProcessedPRData(cacheKey)
        : null;

      if (cachedData && this.isCacheValid(cachedData)) {
        logger.info('Using cached Azure DevOps data', {
          prCount: cachedData.length,
          cacheAge: this.getCacheAge(cachedData),
        });
        return cachedData;
      }

      this.reportProgress('Fetching pull requests from Azure DevOps API', 1, 5);

      // Fetch fresh data from API
      const filters = this.buildFilters();
      const pullRequests = await this.client!.fetchPullRequests(filters);

      logger.info('Pull requests fetched from Azure DevOps', {
        count: pullRequests.length,
        timeRange: this.getTimeRangeDescription(filters),
      });

      this.reportProgress('Processing pull request data', 2, 5);

      // Process each PR
      const processedData: ProcessedPRData[] = [];
      for (let i = 0; i < pullRequests.length; i++) {
        const pr = pullRequests[i];

        if (i % 10 === 0) {
          this.reportProgress(
            `Processing PR ${i + 1}/${pullRequests.length}`,
            2 + (i / pullRequests.length) * 2,
            5
          );
        }

        try {
          const processedPR = await this.processPullRequest(pr);
          processedData.push(processedPR);

          // Cache individual PR for future use
          await this.cacheManager!.cachePullRequest(pr);
        } catch (error) {
          logger.warn('Failed to process pull request', {
            prId: pr.pullRequestId,
            title: pr.title,
            error: error instanceof Error ? error.message : String(error),
          });

          // Continue processing other PRs
          continue;
        }
      }

      this.reportProgress('Caching processed data', 4, 5);

      // Cache processed data
      await this.cacheManager!.cacheProcessedPRData(cacheKey, processedData);

      this.reportProgress('Azure DevOps data collection complete', 5, 5);

      const duration = Date.now() - startTime;
      logger.info('Azure DevOps pull request collection complete', {
        totalPRs: pullRequests.length,
        processedPRs: processedData.length,
        duration,
        averageProcessingTime: processedData.length > 0 ? duration / processedData.length : 0,
      });

      return processedData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.error('Azure DevOps pull request collection failed', {
        error: errorMessage,
        stack: errorStack,
        type: error?.constructor?.name,
      });
      throw error;
    }
  }

  /**
   * Generate comprehensive analytics from collected data
   */
  async generateAnalytics(processedData: ProcessedPRData[]): Promise<AzureDevOpsAnalytics> {
    if (!this.enabled || !this.isInitialized()) {
      throw new AzureDevOpsError('Azure DevOps collector not properly initialized');
    }

    try {
      logger.info('Generating Azure DevOps analytics', {
        dataPoints: processedData.length,
      });

      this.reportProgress('Analyzing pull request data', 0, 3);

      const analytics = await this.analyticsProcessor!.processAnalytics(
        processedData,
        this.gitData
      );

      this.reportProgress('Generating insights and recommendations', 1, 3);

      // Add team collaboration insights
      const teamInsights = await this.generateTeamInsights(processedData);
      analytics.teamCollaboration = teamInsights;

      this.reportProgress('Azure DevOps analytics complete', 3, 3);

      logger.info('Azure DevOps analytics generation complete', {
        totalPRs: analytics.summary.totalPullRequests,
        dateRange: {
          start:
            analytics.summary.dateRange.start instanceof Date
              ? analytics.summary.dateRange.start.toISOString()
              : new Date(analytics.summary.dateRange.start).toISOString(),
          end:
            analytics.summary.dateRange.end instanceof Date
              ? analytics.summary.dateRange.end.toISOString()
              : new Date(analytics.summary.dateRange.end).toISOString(),
        },
        gitCommitCoverage: analytics.summary.coverage.gitCommitCoverage,
      });

      return analytics;
    } catch (error) {
      logger.error('Azure DevOps analytics generation failed', { error });
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    if (!this.enabled || !this.cacheManager) {
      return null;
    }

    return this.cacheManager.getStats();
  }

  /**
   * Cleanup resources and perform maintenance
   */
  async cleanup(): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      logger.info('Performing Azure DevOps collector cleanup');

      if (this.cacheManager) {
        await this.cacheManager.cleanup();
      }

      logger.info('Azure DevOps collector cleanup complete');
    } catch (error) {
      logger.warn('Azure DevOps collector cleanup error', { error });
    }
  }

  /**
   * Check if collector is properly initialized
   */
  private isInitialized(): boolean {
    return !!(
      this.config &&
      this.client &&
      this.cacheManager &&
      this.gitAssociator &&
      this.analyticsProcessor
    );
  }

  /**
   * Process individual pull request
   */
  private async processPullRequest(pr: AzureDevOpsPullRequest): Promise<ProcessedPRData> {
    const gitAssociations = await this.gitAssociator!.findAssociatedCommits(pr);
    const metrics = await this.calculatePRMetrics(pr, gitAssociations);

    const processedPR: ProcessedPRData = {
      pullRequest: pr,
      metrics,
      gitCommitAssociations: gitAssociations,
      processingMetadata: {
        processedAt: new Date(),
        apiVersion: this.config!.api?.version || '7.0',
        limitations: this.getProcessingLimitations(),
        warnings: [],
        cacheInfo: {
          hit: false,
          source: 'api',
        },
      },
    };

    return processedPR;
  }

  /**
   * Calculate pull request metrics
   */
  private async calculatePRMetrics(
    pr: AzureDevOpsPullRequest,
    gitAssociations: any[]
  ): Promise<any> {
    // Implementation for calculating PR metrics
    // This will be expanded based on the specific metrics needed
    const metrics = {
      timeToMerge: this.calculateTimeToMerge(pr),
      timeToFirstReview: this.calculateTimeToFirstReview(pr),
      reviewerCount: pr.reviewers.length,
      iterationCount: 1, // Placeholder - would need to fetch iterations
      size: {
        filesChanged: gitAssociations.length,
        linesAdded: 0, // Would calculate from Git data
        linesDeleted: 0, // Would calculate from Git data
        totalChurn: 0, // Would calculate from Git data
      },
      complexity: {
        crossDirectoryChanges: false, // Would analyze file paths
        multipleFileTypes: false, // Would analyze file extensions
        highRiskFilesTouched: 0, // Would check against known high-risk files
      },
      reviewQuality: {
        hadApprovals: pr.reviewers.some(r => r.vote > 0),
        hadRejections: pr.reviewers.some(r => r.vote < 0),
        selfApproved: false, // Would check if creator is in reviewers with approval
        reviewCoverage: pr.reviewers.length > 0 ? 1 : 0,
      },
      integration: {
        mergeStrategy: pr.completionOptions?.mergeStrategy,
        sourceBranchDeleted: pr.completionOptions?.deleteSourceBranch || false,
        hadConflicts: false, // Would need additional API calls to determine
        buildStatus: 'none' as const, // Would need build integration
      },
    };

    return metrics;
  }

  /**
   * Calculate time to merge in hours
   */
  private calculateTimeToMerge(pr: AzureDevOpsPullRequest): number | undefined {
    if (pr.status !== 'completed' || !pr.closedDate) {
      return undefined;
    }

    const closedDate = new Date(pr.closedDate);
    const creationDate = new Date(pr.creationDate);
    const timeToMergeMs = closedDate.getTime() - creationDate.getTime();
    return timeToMergeMs / (1000 * 60 * 60); // Convert to hours
  }

  /**
   * Calculate time to first review in hours
   */
  private calculateTimeToFirstReview(_pr: AzureDevOpsPullRequest): number | undefined {
    // This would require additional API calls to get review timeline
    // For now, return undefined indicating we don't have this data
    return undefined;
  }

  /**
   * Build API filters based on options
   */
  private buildFilters() {
    const filters: any = {};

    // Use original user-requested dates for Azure DevOps, not Git-adjusted dates
    const sinceDate = this.options.originalSince || this.options.since;
    const untilDate = this.options.originalUntil || this.options.until;

    if (sinceDate) {
      filters.minCreatedDate = new Date(sinceDate);
      logger.info(`Azure DevOps using original since date: ${sinceDate}`);
    } else if (this.options.days) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - this.options.days);
      filters.minCreatedDate = daysAgo;
    }

    if (untilDate) {
      filters.maxCreatedDate = new Date(untilDate);
      logger.info(`Azure DevOps using original until date: ${untilDate}`);
    }

    // Default to completed and active PRs
    filters.pullRequestStates = ['completed', 'active'];

    return filters;
  }

  /**
   * Generate cache key for current configuration
   */
  private getCacheKey(): string {
    const org = this.config!.organization;
    const project = this.config!.project;
    const repo = this.config!.repository || 'default';
    return `${org}-${project}-${repo}`;
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(cachedData: ProcessedPRData[]): boolean {
    if (cachedData.length === 0) {
      return false;
    }

    // Check if any cache entry is too old
    const maxAge = this.config!.cache?.ttlMs || 60 * 60 * 1000; // 1 hour default
    const now = Date.now();

    for (const data of cachedData) {
      // Handle date conversion for cached data
      const processedAt =
        data.processingMetadata.processedAt instanceof Date
          ? data.processingMetadata.processedAt
          : new Date(data.processingMetadata.processedAt);

      const age = now - processedAt.getTime();
      if (age > maxAge) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get age of cached data in milliseconds
   */
  private getCacheAge(cachedData: ProcessedPRData[]): number {
    if (cachedData.length === 0) {
      return 0;
    }

    const oldestEntry = cachedData.reduce((oldest, current) => {
      // Handle date conversion for cached data
      const currentDate =
        current.processingMetadata.processedAt instanceof Date
          ? current.processingMetadata.processedAt
          : new Date(current.processingMetadata.processedAt);
      const oldestDate =
        oldest.processingMetadata.processedAt instanceof Date
          ? oldest.processingMetadata.processedAt
          : new Date(oldest.processingMetadata.processedAt);

      return currentDate < oldestDate ? current : oldest;
    });

    // Handle date conversion for the final calculation
    const oldestDate =
      oldestEntry.processingMetadata.processedAt instanceof Date
        ? oldestEntry.processingMetadata.processedAt
        : new Date(oldestEntry.processingMetadata.processedAt);

    return Date.now() - oldestDate.getTime();
  }

  /**
   * Get time range description for logging
   */
  private getTimeRangeDescription(filters: any): string {
    const start = filters.minCreatedDate?.toISOString() || 'beginning';
    const end = filters.maxCreatedDate?.toISOString() || 'now';
    return `${start} to ${end}`;
  }

  /**
   * Generate team collaboration insights
   */
  private async generateTeamInsights(_processedData: ProcessedPRData[]): Promise<any> {
    // Placeholder implementation - would expand based on requirements
    return {
      creationPatterns: {
        mostActivePRCreators: [],
        creationDistribution: 0,
      },
      crossTeamCollaboration: {
        crossReviewRate: 0,
        knowledgeSharingScore: 0,
        mentorshipIndicators: {
          seniorToJuniorReviews: 0,
          juniorToSeniorPRs: 0,
        },
      },
      teamDynamics: {
        collaborationScore: 0,
        bottleneckIndicators: [],
        teamHealthScore: 0,
      },
    };
  }

  /**
   * Get processing limitations for metadata
   */
  private getProcessingLimitations(): string[] {
    return [
      'Pull request data limited to Azure DevOps API capabilities',
      'Review timing requires additional API calls not currently implemented',
      'Build status integration not implemented',
      'Conflict detection not implemented',
    ];
  }

  /**
   * Report progress to callback
   */
  private reportProgress(message: string, current: number, total: number): void {
    if (this.progressCallback) {
      this.progressCallback(message, current, total);
    }

    logger.debug('Progress update', { message, current, total });
  }
}
