# Azure DevOps API Pagination Strategy

## Overview

Azure DevOps REST API has specific pagination constraints and limits that must be handled properly to ensure reliable data collection. This document outlines the comprehensive pagination strategy for handling large repositories with thousands of pull requests.

## Azure DevOps API Pagination Constraints

### Hard Limits

- **Maximum Page Size**: 1000 items per request (some endpoints may have lower limits)
- **Continuation Token**: Required for accessing data beyond 1000 items
- **Rate Limiting**: ~200 requests per minute per organization
- **Timeout Limits**: Long-running queries may timeout
- **Memory Constraints**: Large responses can cause memory issues

### API Response Structure

```typescript
interface AzureDevOpsPaginatedResponse<T> {
  count: number;           // Items in current page
  value: T[];             // Array of items
  continuationToken?: string; // Token for next page (if more data exists)
}

interface PullRequestListResponse extends AzureDevOpsPaginatedResponse<AzureDevOpsPullRequest> {
  // Additional PR-specific metadata if any
}
```

## Pagination Strategy Implementation

### 1. Smart Page Size Management

```typescript
export class PaginationManager {
  private static readonly DEFAULT_PAGE_SIZE = 100;
  private static readonly MAX_PAGE_SIZE = 1000;
  private static readonly MIN_PAGE_SIZE = 10;
  
  constructor(
    private config: AzureDevOpsConfig,
    private performanceMetrics: PerformanceTracker
  ) {}

  calculateOptimalPageSize(
    endpoint: string,
    estimatedTotal: number,
    networkLatency: number
  ): number {
    // Start with default page size
    let pageSize = PaginationManager.DEFAULT_PAGE_SIZE;

    // Adjust based on network performance
    if (networkLatency > 1000) { // High latency
      pageSize = Math.min(500, PaginationManager.MAX_PAGE_SIZE);
    } else if (networkLatency < 200) { // Low latency
      pageSize = Math.min(50, PaginationManager.MAX_PAGE_SIZE);
    }

    // Adjust based on estimated total items
    if (estimatedTotal > 10000) {
      pageSize = Math.min(1000, PaginationManager.MAX_PAGE_SIZE);
    } else if (estimatedTotal < 100) {
      pageSize = Math.max(estimatedTotal, PaginationManager.MIN_PAGE_SIZE);
    }

    // Adjust based on endpoint-specific constraints
    const endpointLimits = this.getEndpointLimits(endpoint);
    pageSize = Math.min(pageSize, endpointLimits.maxPageSize);

    return pageSize;
  }

  private getEndpointLimits(endpoint: string): EndpointLimits {
    const limits: { [key: string]: EndpointLimits } = {
      'pullrequests': { maxPageSize: 1000, hasStringContinuation: true },
      'workitems': { maxPageSize: 200, hasStringContinuation: false },
      'commits': { maxPageSize: 1000, hasStringContinuation: true }
    };

    return limits[endpoint] || { maxPageSize: 100, hasStringContinuation: true };
  }
}
```

### 2. Continuation Token Handler

```typescript
export class ContinuationTokenManager {
  private tokenCache = new Map<string, ContinuationTokenInfo>();

  async handleContinuationToken(
    baseQuery: PullRequestQuery,
    token?: string
  ): Promise<PaginatedResult<AzureDevOpsPullRequest>> {
    
    const cacheKey = this.generateCacheKey(baseQuery);
    
    // Check if we have cached information about this query
    const cachedInfo = this.tokenCache.get(cacheKey);
    
    try {
      const response = await this.makeAPICall(baseQuery, token);
      
      // Update cache with token information
      if (response.continuationToken) {
        this.tokenCache.set(cacheKey, {
          lastToken: response.continuationToken,
          totalFetched: (cachedInfo?.totalFetched || 0) + response.count,
          lastFetchTime: Date.now(),
          hasMoreData: true
        });
      } else {
        // Mark as complete
        this.tokenCache.set(cacheKey, {
          ...cachedInfo,
          hasMoreData: false,
          completedAt: Date.now()
        });
      }

      return {
        data: response.value,
        continuationToken: response.continuationToken,
        totalFetched: this.tokenCache.get(cacheKey)?.totalFetched || response.count,
        hasMoreData: !!response.continuationToken,
        pageInfo: {
          pageSize: response.count,
          requestTime: Date.now()
        }
      };
      
    } catch (error) {
      // Handle token expiration or invalidation
      if (this.isTokenExpiredError(error)) {
        this.tokenCache.delete(cacheKey);
        throw new AzureDevOpsError('Continuation token expired, restart pagination', error);
      }
      throw error;
    }
  }

  private isTokenExpiredError(error: any): boolean {
    return error.statusCode === 400 && 
           error.message?.includes('continuation token');
  }
}
```

### 3. Multi-Query Strategy for Large Repositories

```typescript
export class LargeRepositoryPaginationHandler {
  
  async fetchAllPullRequests(
    config: AzureDevOpsConfig,
    options: GitSparkOptions
  ): Promise<ProcessedPRData[]> {
    
    const baseQuery = this.buildBaseQuery(config, options);
    const estimatedTotal = await this.estimateTotal(baseQuery);
    
    // If estimated total is very large, use time-based partitioning
    if (estimatedTotal > 5000) {
      return this.fetchWithTimePartitioning(baseQuery, options);
    } else {
      return this.fetchWithStandardPagination(baseQuery);
    }
  }

  private async fetchWithTimePartitioning(
    baseQuery: PullRequestQuery,
    options: GitSparkOptions
  ): Promise<ProcessedPRData[]> {
    
    // Break large time ranges into smaller chunks to stay within limits
    const timeRanges = this.calculateTimePartitions(options);
    const allResults: ProcessedPRData[] = [];
    
    for (const timeRange of timeRanges) {
      const partitionQuery = {
        ...baseQuery,
        minTime: timeRange.start,
        maxTime: timeRange.end
      };
      
      console.log(`Fetching PRs for period: ${timeRange.start.toISOString()} to ${timeRange.end.toISOString()}`);
      
      const partitionResults = await this.fetchWithStandardPagination(partitionQuery);
      allResults.push(...partitionResults);
      
      // Add delay between partitions to respect rate limits
      await this.delay(1000);
    }
    
    return allResults;
  }

  private calculateTimePartitions(options: GitSparkOptions): TimeRange[] {
    const ranges: TimeRange[] = [];
    const startDate = options.since ? new Date(options.since) : 
                     options.days ? new Date(Date.now() - options.days * 24 * 60 * 60 * 1000) :
                     new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Default 90 days
    
    const endDate = options.until ? new Date(options.until) : new Date();
    
    // Create monthly partitions for large date ranges
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    
    if (totalDays > 90) {
      // Monthly partitions
      let currentDate = new Date(startDate);
      while (currentDate < endDate) {
        const partitionEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        ranges.push({
          start: new Date(currentDate),
          end: partitionEnd > endDate ? endDate : partitionEnd
        });
        currentDate = partitionEnd;
      }
    } else if (totalDays > 30) {
      // Weekly partitions
      let currentDate = new Date(startDate);
      while (currentDate < endDate) {
        const partitionEnd = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        ranges.push({
          start: new Date(currentDate),
          end: partitionEnd > endDate ? endDate : partitionEnd
        });
        currentDate = partitionEnd;
      }
    } else {
      // Single range
      ranges.push({ start: startDate, end: endDate });
    }
    
    return ranges;
  }

  private async fetchWithStandardPagination(
    query: PullRequestQuery
  ): Promise<ProcessedPRData[]> {
    
    const allResults: ProcessedPRData[] = [];
    let continuationToken: string | undefined;
    let pageCount = 0;
    const maxPages = 50; // Safety limit to prevent infinite loops
    
    do {
      const paginationResult = await this.continuationTokenManager.handleContinuationToken(
        query,
        continuationToken
      );
      
      allResults.push(...paginationResult.data);
      continuationToken = paginationResult.continuationToken;
      pageCount++;
      
      // Safety check
      if (pageCount >= maxPages) {
        console.warn(`Reached maximum page limit (${maxPages}) for query. Results may be incomplete.`);
        break;
      }
      
      // Progress reporting
      if (this.progressCallback) {
        this.progressCallback(
          'Fetching pull requests',
          allResults.length,
          paginationResult.totalFetched || -1
        );
      }
      
      // Rate limiting
      await this.rateLimiter.waitIfNeeded();
      
    } while (continuationToken);
    
    return allResults;
  }
}
```

### 4. Error Handling and Recovery

```typescript
export class PaginationErrorHandler {
  
  async handlePaginationWithRetry<T>(
    operation: () => Promise<PaginatedResult<T>>,
    maxRetries: number = 3
  ): Promise<PaginatedResult<T>> {
    
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (this.isRetryableError(error)) {
          const delay = this.calculateBackoffDelay(attempt);
          console.warn(`Pagination attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
          await this.delay(delay);
          continue;
        } else {
          // Non-retryable error, fail immediately
          throw error;
        }
      }
    }
    
    throw new AzureDevOpsError(
      `Pagination failed after ${maxRetries} attempts: ${lastError.message}`,
      'PAGINATION_FAILED',
      lastError
    );
  }

  private isRetryableError(error: any): boolean {
    // Network errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') return true;
    
    // Server errors
    if (error.statusCode >= 500) return true;
    
    // Rate limiting
    if (error.statusCode === 429) return true;
    
    // Specific Azure DevOps transient errors
    if (error.statusCode === 503 && error.message?.includes('temporarily unavailable')) return true;
    
    return false;
  }

  private calculateBackoffDelay(attempt: number): number {
    // Exponential backoff with jitter
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000;  // 30 seconds
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000; // Add up to 1 second of jitter
    
    return Math.min(exponentialDelay + jitter, maxDelay);
  }
}
```

### 5. Progress Tracking for Large Datasets

```typescript
export class PaginationProgressTracker {
  private estimatedTotal: number = -1;
  private currentCount: number = 0;
  private startTime: number = Date.now();
  
  constructor(
    private progressCallback?: ProgressCallback,
    private config?: { estimateTotal: boolean }
  ) {}

  async estimateTotal(baseQuery: PullRequestQuery): Promise<number> {
    if (!this.config?.estimateTotal) {
      return -1; // Unknown total
    }
    
    try {
      // Make a lightweight query to get count estimate
      const countQuery = {
        ...baseQuery,
        searchCriteria: {
          ...baseQuery.searchCriteria,
          $top: 1 // Just get one item to see total
        }
      };
      
      const response = await this.apiClient.getPullRequestsCount(countQuery);
      this.estimatedTotal = response.count || -1;
      return this.estimatedTotal;
      
    } catch (error) {
      console.warn('Could not estimate total PR count:', error.message);
      return -1;
    }
  }

  updateProgress(fetchedCount: number, currentBatchSize: number): void {
    this.currentCount = fetchedCount;
    
    if (this.progressCallback) {
      const elapsed = Date.now() - this.startTime;
      const rate = fetchedCount / (elapsed / 1000); // items per second
      
      let progressMessage = `Fetched ${fetchedCount} pull requests`;
      
      if (this.estimatedTotal > 0) {
        const percentage = Math.round((fetchedCount / this.estimatedTotal) * 100);
        const remaining = this.estimatedTotal - fetchedCount;
        const estimatedTimeRemaining = remaining / rate;
        
        progressMessage += ` (${percentage}%, ~${Math.round(estimatedTimeRemaining)}s remaining)`;
      } else {
        progressMessage += ` (${Math.round(rate)} items/sec)`;
      }
      
      this.progressCallback(
        progressMessage,
        fetchedCount,
        this.estimatedTotal
      );
    }
  }

  generateCompletionSummary(): PaginationSummary {
    const elapsed = Date.now() - this.startTime;
    const rate = this.currentCount / (elapsed / 1000);
    
    return {
      totalFetched: this.currentCount,
      estimatedTotal: this.estimatedTotal,
      elapsedTimeMs: elapsed,
      averageRatePerSecond: rate,
      accuracy: this.estimatedTotal > 0 ? 
        Math.round((this.currentCount / this.estimatedTotal) * 100) : -1
    };
  }
}
```

## Configuration Options

### Pagination Configuration Schema

```typescript
export interface PaginationConfig {
  // Page size management
  pageSize: {
    default: number;        // Default page size (100)
    min: number;           // Minimum page size (10)
    max: number;           // Maximum page size (1000)
    adaptive: boolean;     // Enable adaptive page sizing
  };
  
  // Large repository handling
  largeRepository: {
    threshold: number;     // PR count threshold for special handling (5000)
    enableTimePartitioning: boolean; // Use time-based partitioning
    partitionSize: 'weekly' | 'monthly'; // Partition granularity
    maxPagesPerPartition: number; // Safety limit (50)
  };
  
  // Error handling
  errorHandling: {
    maxRetries: number;    // Maximum retry attempts (3)
    backoffStrategy: 'exponential' | 'linear'; // Backoff strategy
    retryableErrors: string[]; // HTTP status codes to retry
  };
  
  // Performance
  performance: {
    enableProgressEstimation: boolean; // Estimate total count
    rateLimitBuffer: number; // Extra delay buffer (100ms)
    concurrentPartitions: number; // Max concurrent time partitions (3)
  };
}
```

## Usage Examples

### Basic Pagination

```typescript
const collector = new AzureDevOpsCollector(config, gitData, cacheManager);

// Automatic pagination handling
const prs = await collector.collectPullRequests({
  organization: 'myorg',
  project: 'myproject',
  repository: 'myrepo',
  maxResults: 5000
});
```

### Large Repository with Time Partitioning

```typescript
const collector = new AzureDevOpsCollector({
  ...config,
  pagination: {
    largeRepository: {
      threshold: 2000,
      enableTimePartitioning: true,
      partitionSize: 'monthly'
    }
  }
});

// Automatically uses time partitioning for large datasets
const prs = await collector.collectPullRequests({
  since: '2024-01-01',
  until: '2024-12-31'
});
```

### Progress Monitoring

```typescript
const collector = new AzureDevOpsCollector(config, gitData, cacheManager, 
  (message, current, total) => {
    console.log(`${message} - ${current}/${total || '?'}`);
  }
);

const prs = await collector.collectPullRequests(options);
```

This comprehensive pagination strategy ensures reliable data collection from Azure DevOps while respecting API limits and providing excellent user experience with progress tracking and error recovery.
