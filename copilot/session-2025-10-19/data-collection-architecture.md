# Azure DevOps Data Collection Architecture

## Overview

This document outlines the architecture for integrating Azure DevOps Pull Request data collection into git-spark, ensuring efficient, reliable, and scalable data gathering that complements existing Git analytics.

## Architecture Principles

1. **Non-Intrusive Integration**: Azure DevOps data collection should not impact existing Git analysis performance
2. **Graceful Degradation**: Git-only analysis should continue working if Azure DevOps is unavailable
3. **Intelligent Caching**: Minimize API calls through smart caching strategies
4. **Rate Limit Respect**: Honor Azure DevOps API rate limits with exponential backoff
5. **Data Correlation**: Efficiently match PR data with Git commit data
6. **Incremental Updates**: Support incremental data collection for large repositories

## System Components

### 1. Azure DevOps API Client (`src/integrations/azure-devops/`)

```
src/integrations/azure-devops/
├── client/
│   ├── api-client.ts           # Core Azure DevOps REST API client
│   ├── auth-manager.ts         # Authentication handling (PAT, CLI, Managed Identity)
│   ├── rate-limiter.ts         # Rate limiting and retry logic
│   └── error-handler.ts        # Azure DevOps specific error handling
├── data/
│   ├── pr-fetcher.ts           # Pull request data fetching
│   ├── work-item-fetcher.ts    # Work item data fetching
│   ├── commit-correlator.ts    # Correlate PR commits with Git data
│   └── data-transformer.ts     # Transform API data to internal format
├── cache/
│   ├── cache-manager.ts        # Caching strategy and storage
│   ├── cache-key-generator.ts  # Generate consistent cache keys
│   └── cache-validator.ts      # Validate cached data freshness
└── index.ts                    # Public API surface
```

### 2. Configuration Management

#### Environment Detection

```typescript
export class AzureDevOpsDetector {
  /**
   * Auto-detect Azure DevOps configuration from Git remotes
   */
  static async detectFromGitRemote(repoPath: string): Promise<AzureDevOpsConfig | null> {
    // Parse Git remotes for Azure DevOps URLs
    // Extract organization, project, and repository names
    // Return configuration or null if not Azure DevOps
  }

  /**
   * Validate Azure DevOps connectivity
   */
  static async validateConnection(config: AzureDevOpsConfig): Promise<ValidationResult> {
    // Test API connectivity
    // Validate permissions
    // Check repository access
  }
}
```

#### Configuration Resolution

```typescript
export class ConfigResolver {
  /**
   * Resolve Azure DevOps configuration from multiple sources
   */
  static async resolveConfig(
    options: GitSparkOptions,
    configFile?: GitSparkConfig
  ): Promise<AzureDevOpsConfig | null> {
    // Priority order:
    // 1. CLI options (--devops-org, --devops-project, etc.)
    // 2. Configuration file (.git-spark.json)
    // 3. Environment variables (AZURE_DEVOPS_ORG, etc.)
    // 4. Auto-detection from Git remotes
    // 5. Interactive prompts (if TTY available)
  }
}
```

### 3. Data Collection Pipeline

#### Orchestration Flow

```typescript
export class AzureDevOpsCollector {
  constructor(
    private config: AzureDevOpsConfig,
    private gitData: CommitData[],
    private cacheManager: CacheManager,
    private progressCallback?: ProgressCallback
  ) {}

  async collect(): Promise<AzureDevOpsAnalytics> {
    // Phase 1: Initialize and validate
    await this.validateConfiguration();
    
    // Phase 2: Collect PR data
    const prs = await this.collectPullRequests();
    
    // Phase 3: Correlate with Git data
    const correlatedData = await this.correlateWithGitData(prs);
    
    // Phase 4: Enrich with work items (if enabled)
    const enrichedData = await this.enrichWithWorkItems(correlatedData);
    
    // Phase 5: Generate analytics
    return this.generateAnalytics(enrichedData);
  }

  private async collectPullRequests(): Promise<ProcessedPRData[]> {
    const cacheKey = this.generateCacheKey();
    
    // Check cache first
    const cached = await this.cacheManager.get(cacheKey);
    if (cached && !this.isCacheExpired(cached)) {
      this.progressCallback?.('Loading cached PR data', 100, 100);
      return cached.data;
    }

    // Fetch from API with Azure DevOps pagination constraints
    const allPRs: ProcessedPRData[] = [];
    let continuationToken: string | undefined;
    const pageSize = 100; // Optimal page size for Azure DevOps
    let totalFetched = 0;
    const maxPRs = this.config.analysis.maxPRs || 10000; // Configurable limit

    while (totalFetched < maxPRs) {
      this.progressCallback?.('Fetching pull requests', totalFetched, maxPRs);
      
      const queryOptions = {
        ...this.buildQueryOptions(),
        top: Math.min(pageSize, maxPRs - totalFetched), // Don't exceed remaining limit
        continuationToken: continuationToken
      };

      const response = await this.apiClient.getPullRequestsWithPagination(queryOptions);
      
      if (!response.value || response.value.length === 0) {
        break; // No more data
      }

      // Process and transform data
      const processedBatch = await this.processPRBatch(response.value);
      allPRs.push(...processedBatch);
      
      totalFetched += response.value.length;
      continuationToken = response.continuationToken;

      // Break if no continuation token (end of data)
      if (!continuationToken) {
        break;
      }

      // Handle Azure DevOps 1000-item pagination limit
      if (response.value.length < pageSize) {
        // Last page of current query, might need to adjust query for more data
        break;
      }

      // Respect rate limits
      await this.rateLimiter.waitIfNeeded();
    }

    // Cache the results
    await this.cacheManager.set(cacheKey, allPRs, this.config.analysis.cacheTTL);

    return allPRs;
  }
}
```

### 4. Git Data Correlation

#### Commit Matching Strategy

```typescript
export class CommitCorrelator {
  /**
   * Match PR commits with Git commit data
   */
  async correlateCommits(
    prData: ProcessedPRData[],
    gitCommits: CommitData[]
  ): Promise<CorrelatedPRData[]> {
    const gitCommitMap = new Map(gitCommits.map(c => [c.hash, c]));
    
    return prData.map(pr => {
      const matchedCommits = pr.commitIds
        .map(id => gitCommitMap.get(id))
        .filter(Boolean) as CommitData[];

      return {
        ...pr,
        gitCommits: matchedCommits,
        correlation: this.calculateCorrelationMetrics(pr, matchedCommits)
      };
    });
  }

  private calculateCorrelationMetrics(
    pr: ProcessedPRData,
    gitCommits: CommitData[]
  ): CorrelationMetrics {
    return {
      commitMatchRate: gitCommits.length / pr.commitCount,
      authorConsistency: this.checkAuthorConsistency(pr, gitCommits),
      timelineAlignment: this.checkTimelineAlignment(pr, gitCommits),
      changeConsistency: this.checkChangeConsistency(pr, gitCommits)
    };
  }
}
```

### 5. Caching Strategy

#### Multi-Level Caching

```typescript
export class CacheManager {
  constructor(
    private config: CacheConfig,
    private storage: CacheStorage
  ) {}

  // Level 1: In-memory cache for current session
  private memoryCache = new Map<string, CacheEntry>();

  // Level 2: File-based cache for persistence
  private fileCache: FileCacheManager;

  async get<T>(key: string): Promise<T | null> {
    // Check memory cache first
    const memoryResult = this.memoryCache.get(key);
    if (memoryResult && !this.isExpired(memoryResult)) {
      return memoryResult.data;
    }

    // Check file cache
    const fileResult = await this.fileCache.get(key);
    if (fileResult && !this.isExpired(fileResult)) {
      // Promote to memory cache
      this.memoryCache.set(key, fileResult);
      return fileResult.data;
    }

    return null;
  }

  async set<T>(key: string, data: T, ttl: number): Promise<void> {
    const entry: CacheEntry = {
      key,
      data,
      timestamp: Date.now(),
      ttl: ttl * 1000 // Convert to milliseconds
    };

    // Store in both levels
    this.memoryCache.set(key, entry);
    await this.fileCache.set(key, entry);
  }
}
```

#### Cache Key Strategy

```typescript
export class CacheKeyGenerator {
  static generatePRCacheKey(config: AzureDevOpsConfig, options: GitSparkOptions): string {
    const keyParts = [
      'azdo-prs',
      config.organization,
      config.project,
      config.repository || 'auto',
      options.since || 'no-since',
      options.until || 'no-until',
      options.branch || 'all-branches',
      this.hashConfig(config.filters)
    ];

    return keyParts.join(':');
  }

  static generateWorkItemCacheKey(workItemIds: number[]): string {
    return `azdo-workitems:${workItemIds.sort().join(',')}`;
  }

  private static hashConfig(obj: any): string {
    return crypto.createHash('md5')
      .update(JSON.stringify(obj))
      .digest('hex')
      .substring(0, 8);
  }
}
```

### 6. Rate Limiting and Error Handling

#### Adaptive Rate Limiting

```typescript
export class RateLimiter {
  private requestTimes: number[] = [];
  private backoffDelay = 0;

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    
    // Remove requests older than 1 minute
    this.requestTimes = this.requestTimes.filter(time => now - time < 60000);

    // Check if we're approaching rate limits
    if (this.requestTimes.length >= 200) { // Azure DevOps limit: ~200/minute
      const oldestRequest = Math.min(...this.requestTimes);
      const waitTime = 60000 - (now - oldestRequest);
      if (waitTime > 0) {
        await this.sleep(waitTime);
      }
    }

    // Apply backoff delay if we've been rate limited
    if (this.backoffDelay > 0) {
      await this.sleep(this.backoffDelay);
      this.backoffDelay = Math.max(this.backoffDelay * 0.8, 0); // Decay backoff
    }

    this.requestTimes.push(now);
  }

  handleRateLimit(retryAfter?: number): void {
    this.backoffDelay = Math.max(
      this.backoffDelay * 2,
      retryAfter ? retryAfter * 1000 : 5000,
      60000 // Max 1 minute
    );
  }
}
```

#### Error Recovery Strategy

```typescript
export class ErrorHandler {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    backoffMs = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (!this.isRetryableError(error) || attempt === maxRetries) {
          throw error;
        }

        // Exponential backoff
        const delay = backoffMs * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  static isRetryableError(error: any): boolean {
    if (error instanceof AzureDevOpsRateLimitError) return true;
    if (error.statusCode >= 500) return true; // Server errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') return true;
    return false;
  }
}
```

### 7. Performance Optimization

#### Parallel Processing

```typescript
export class ParallelProcessor {
  constructor(
    private concurrencyLimit: number = 5,
    private rateLimiter: RateLimiter
  ) {}

  async processInBatches<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = 10
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (item) => {
        await this.rateLimiter.waitIfNeeded();
        return processor(item);
      });

      // Process batch with concurrency limit
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }
}
```

#### Memory Management

```typescript
export class DataStreamer {
  /**
   * Stream large datasets to avoid memory issues
   */
  async *streamPullRequests(
    config: AzureDevOpsConfig,
    batchSize: number = 100
  ): AsyncGenerator<ProcessedPRData[], void, unknown> {
    let skip = 0;

    while (true) {
      const batch = await this.fetchPRBatch(config, skip, batchSize);
      if (batch.length === 0) break;

      yield batch;
      skip += batch.length;
    }
  }
}
```

### 8. Integration Points

#### Main Analysis Integration

```typescript
// In src/core/analyzer.ts
export class GitAnalyzer {
  async analyze(options: GitSparkOptions): Promise<AnalysisReport> {
    // Existing Git analysis
    const gitReport = await this.analyzeGitData(options);

    // Azure DevOps integration (if enabled)
    if (options.azureDevOps) {
      const azureDevOpsData = await this.analyzeAzureDevOpsData(options, gitReport);
      return this.mergeReports(gitReport, azureDevOpsData);
    }

    return gitReport;
  }

  private async analyzeAzureDevOpsData(
    options: GitSparkOptions,
    gitReport: AnalysisReport
  ): Promise<AzureDevOpsAnalytics> {
    const config = await ConfigResolver.resolveConfig(options);
    if (!config) {
      throw new AzureDevOpsError('Unable to resolve Azure DevOps configuration');
    }

    const collector = new AzureDevOpsCollector(
      config,
      gitReport.commits, // Pass Git data for correlation
      this.cacheManager,
      this.progressCallback
    );

    return collector.collect();
  }
}
```

## Data Flow Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Git Analysis  │    │  Azure DevOps    │    │  Cache Manager  │
│                 │    │   API Client     │    │                 │
│ • Commit Data   │    │                  │    │ • Memory Cache  │
│ • Author Stats  │    │ • PR Data        │    │ • File Cache    │
│ • File Changes  │    │ • Work Items     │    │ • TTL Validation│
└─────────┬───────┘    └────────┬─────────┘    └─────────┬───────┘
          │                     │                        │
          │                     │                        │
          ▼                     ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data Correlator                              │
│                                                                 │
│ • Match PR commits with Git commits                             │
│ • Correlate authors and timestamps                              │
│ • Calculate correlation metrics                                 │
│ • Validate data consistency                                     │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                Analytics Generator                              │
│                                                                 │
│ • Workflow efficiency metrics                                   │
│ • Team collaboration patterns                                   │
│ • Code quality indicators                                       │
│ • Delivery insights                                             │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Enhanced Report                                │
│                                                                 │
│ • Combined Git + Azure DevOps insights                          │
│ • Interactive dashboards                                        │
│ • Actionable recommendations                                    │
│ • Trend analysis                                                │
└─────────────────────────────────────────────────────────────────┘
```

## Error Handling Strategy

### Graceful Degradation

1. **Azure DevOps Unavailable**: Continue with Git-only analysis
2. **Partial Data**: Use available data, mark incomplete sections
3. **Authentication Failure**: Provide clear error messages and resolution steps
4. **Rate Limiting**: Automatic backoff and retry with progress indication

### User Experience

1. **Clear Progress**: Show detailed progress for PR data collection
2. **Error Context**: Provide actionable error messages
3. **Fallback Options**: Suggest alternatives when integration fails
4. **Configuration Help**: Guide users through setup process

This architecture ensures robust, efficient, and user-friendly Azure DevOps integration while maintaining git-spark's existing reliability and performance characteristics.
