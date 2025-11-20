# Enhanced Caching Strategy for Azure DevOps Integration

## Overview

Azure DevOps API calls can be extremely time-consuming, especially for large repositories with thousands of pull requests and extensive work item linkages. This document outlines a comprehensive, multi-layered caching strategy designed to minimize API calls and maximize re-run performance.

## Performance Challenges

### API Call Overhead

- **Large Repositories**: 1000+ PRs can take 10-15 minutes to fetch
- **Work Item Resolution**: Each PR may link to multiple work items
- **Rate Limiting**: Azure DevOps API limits (200 requests/minute)
- **Network Latency**: Each API call adds network round-trip time
- **Data Volume**: Large PR descriptions and comment threads

### Re-run Scenarios

- **Development Iterations**: Frequent re-runs during development
- **CI/CD Pipelines**: Regular automated analysis runs
- **Different Time Ranges**: Overlapping analysis periods
- **Team Analysis**: Different author/team filters on same data

## Multi-Level Caching Architecture

### Level 1: In-Memory Cache (Session Cache)

**Purpose**: Ultra-fast access for current session
**Scope**: Current process lifetime
**Use Cases**: Multiple analysis runs in same session

```typescript
export class MemoryCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number = 1000; // Configurable
  private statistics = {
    hits: 0,
    misses: 0,
    evictions: 0
  };

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.statistics.misses++;
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.statistics.misses++;
      return null;
    }

    // Move to end for LRU
    this.cache.delete(key);
    this.cache.set(key, entry);
    this.statistics.hits++;
    
    return entry.data as T;
  }

  async set<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
    // Implement LRU eviction if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      this.statistics.evictions++;
    }

    const entry: CacheEntry = {
      key,
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
      accessCount: 1,
      lastAccessed: Date.now()
    };

    this.cache.set(key, entry);
  }

  getStatistics(): CacheStatistics {
    const hitRate = this.statistics.hits / (this.statistics.hits + this.statistics.misses);
    return {
      ...this.statistics,
      hitRate: Math.round(hitRate * 100),
      currentSize: this.cache.size,
      maxSize: this.maxSize
    };
  }
}
```

### Level 2: File-Based Persistent Cache

**Purpose**: Persist cache across sessions
**Scope**: Cross-session, cross-run
**Use Cases**: Daily CI runs, development iterations

```typescript
export class FileCache {
  private cacheDir: string;
  private compressionEnabled: boolean = true;

  constructor(cacheDir: string = './.git-spark-cache') {
    this.cacheDir = cacheDir;
  }

  async get<T>(key: string): Promise<T | null> {
    const filePath = this.getCacheFilePath(key);
    
    try {
      if (!await this.fileExists(filePath)) {
        return null;
      }

      const fileStats = await fs.stat(filePath);
      const cacheEntry = await this.readCacheFile(filePath);
      
      // Check if expired
      if (this.isExpired(cacheEntry)) {
        await this.deleteCacheFile(filePath);
        return null;
      }

      // Update access tracking
      cacheEntry.lastAccessed = Date.now();
      cacheEntry.accessCount = (cacheEntry.accessCount || 0) + 1;
      await this.writeCacheFile(filePath, cacheEntry);

      return cacheEntry.data as T;
    } catch (error) {
      console.warn(`Cache read error for ${key}:`, error.message);
      return null;
    }
  }

  async set<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
    const filePath = this.getCacheFilePath(key);
    const cacheEntry: CacheEntry = {
      key,
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
      accessCount: 1,
      lastAccessed: Date.now(),
      version: CACHE_VERSION,
      dataSize: this.calculateDataSize(data)
    };

    try {
      await this.ensureCacheDirectory();
      await this.writeCacheFile(filePath, cacheEntry);
      
      // Trigger cleanup if cache is getting large
      await this.scheduleCleanup();
    } catch (error) {
      console.warn(`Cache write error for ${key}:`, error.message);
    }
  }

  private async writeCacheFile(filePath: string, entry: CacheEntry): Promise<void> {
    const dataToWrite = this.compressionEnabled 
      ? await this.compress(JSON.stringify(entry))
      : JSON.stringify(entry);
    
    await fs.writeFile(filePath, dataToWrite);
  }

  private async readCacheFile(filePath: string): Promise<CacheEntry> {
    const fileContent = await fs.readFile(filePath, 'utf8');
    const data = this.compressionEnabled 
      ? await this.decompress(fileContent)
      : fileContent;
    
    return JSON.parse(data);
  }
}
```

### Level 3: Incremental Update Cache

**Purpose**: Track what's changed since last run
**Scope**: Delta updates
**Use Cases**: Large repositories with frequent updates

```typescript
export class IncrementalCache {
  private metadataCache: Map<string, CacheMetadata> = new Map();

  async getIncrementalData(
    config: AzureDevOpsConfig,
    options: GitSparkOptions,
    lastRun?: Date
  ): Promise<IncrementalCacheResult> {
    
    const cacheKey = this.generateIncrementalKey(config, options);
    const metadata = await this.loadMetadata(cacheKey);
    
    if (!metadata || !lastRun) {
      // Full refresh needed
      return {
        strategy: 'full-refresh',
        cachedData: null,
        incrementalQueries: []
      };
    }

    // Determine what needs updating
    const incrementalQueries = this.buildIncrementalQueries(metadata, lastRun);
    const cachedData = await this.loadCachedData(cacheKey);

    return {
      strategy: 'incremental',
      cachedData,
      incrementalQueries,
      lastUpdate: metadata.lastUpdate
    };
  }

  private buildIncrementalQueries(
    metadata: CacheMetadata,
    since: Date
  ): IncrementalQuery[] {
    const queries: IncrementalQuery[] = [];

    // New or updated PRs since last run
    queries.push({
      type: 'pull-requests',
      filter: {
        minTime: since,
        status: 'all'
      },
      reason: 'fetch-new-or-updated-prs'
    });

    // PRs that were active in last run but might be completed now
    if (metadata.activePRs && metadata.activePRs.length > 0) {
      queries.push({
        type: 'pr-status-updates',
        prIds: metadata.activePRs,
        reason: 'check-status-changes'
      });
    }

    // Work items that might have been updated
    if (metadata.workItemIds && metadata.workItemIds.length > 0) {
      queries.push({
        type: 'work-item-updates',
        workItemIds: metadata.workItemIds,
        since: since,
        reason: 'check-work-item-changes'
      });
    }

    return queries;
  }

  async updateIncrementalCache(
    cacheKey: string,
    fullData: ProcessedPRData[],
    incrementalData: ProcessedPRData[]
  ): Promise<void> {
    
    // Merge incremental data with cached data
    const mergedData = this.mergeIncrementalData(fullData, incrementalData);
    
    // Update metadata
    const metadata: CacheMetadata = {
      lastUpdate: new Date(),
      totalPRs: mergedData.length,
      activePRs: mergedData.filter(pr => pr.status === 'active').map(pr => pr.pullRequestId),
      workItemIds: this.extractWorkItemIds(mergedData),
      cacheVersion: CACHE_VERSION,
      statistcs: {
        fullRefreshCount: 0,
        incrementalUpdateCount: 1,
        lastFullRefresh: new Date()
      }
    };

    await this.saveMetadata(cacheKey, metadata);
    await this.saveCachedData(cacheKey, mergedData);
  }
}
```

## Smart Cache Key Generation

### Hierarchical Key Structure

```typescript
export class SmartCacheKeyGenerator {
  static generateHierarchicalKeys(
    config: AzureDevOpsConfig,
    options: GitSparkOptions
  ): CacheKeyHierarchy {
    
    // Base key for organization/project
    const baseKey = `azdo:${config.organization}:${config.project}`;
    
    // Repository-specific key
    const repoKey = `${baseKey}:${config.repository || 'default'}`;
    
    // Analysis-specific key
    const analysisKey = this.buildAnalysisKey(repoKey, options);
    
    // Time-based partitioning
    const timePartition = this.calculateTimePartition(options);
    
    return {
      base: baseKey,
      repository: repoKey,
      analysis: analysisKey,
      timePartition: `${analysisKey}:${timePartition}`,
      
      // Specialized keys for different data types
      pullRequests: `${analysisKey}:prs:${timePartition}`,
      workItems: `${analysisKey}:workitems:${timePartition}`,
      commits: `${analysisKey}:commits:${timePartition}`,
      correlations: `${analysisKey}:correlations:${timePartition}`,
      analytics: `${analysisKey}:analytics:${timePartition}`
    };
  }

  private static buildAnalysisKey(repoKey: string, options: GitSparkOptions): string {
    const keyParts = [repoKey];
    
    // Add filter parameters that affect data selection
    if (options.branch) keyParts.push(`branch:${options.branch}`);
    if (options.author) keyParts.push(`author:${this.hashString(options.author)}`);
    if (options.since) keyParts.push(`since:${options.since}`);
    if (options.until) keyParts.push(`until:${options.until}`);
    if (options.days) keyParts.push(`days:${options.days}`);
    
    return keyParts.join(':');
  }

  private static calculateTimePartition(options: GitSparkOptions): string {
    // Create time-based partitions to enable incremental caching
    // Examples: "2024-10", "2024-Q4", "2024-W42"
    
    if (options.days && options.days <= 7) {
      return `daily:${new Date().toISOString().split('T')[0]}`;
    } else if (options.days && options.days <= 30) {
      const now = new Date();
      return `weekly:${now.getFullYear()}-W${this.getWeekNumber(now)}`;
    } else {
      const now = new Date();
      return `monthly:${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
  }
}
```

## Cache Invalidation Strategies

### Time-Based Invalidation

```typescript
export class CacheInvalidationManager {
  // Different TTL for different data types
  private static readonly TTL_CONFIG = {
    pullRequests: {
      active: 30 * 60,      // 30 minutes for active PRs
      completed: 24 * 60 * 60, // 24 hours for completed PRs
      abandoned: 7 * 24 * 60 * 60 // 7 days for abandoned PRs
    },
    workItems: {
      active: 60 * 60,      // 1 hour for active work items
      completed: 24 * 60 * 60  // 24 hours for completed work items
    },
    correlations: 2 * 60 * 60,  // 2 hours for correlation data
    analytics: 4 * 60 * 60      // 4 hours for analytics
  };

  static calculateTTL(dataType: string, status?: string): number {
    const config = this.TTL_CONFIG[dataType as keyof typeof this.TTL_CONFIG];
    
    if (typeof config === 'number') {
      return config;
    }
    
    if (typeof config === 'object' && status) {
      return config[status as keyof typeof config] || config.active;
    }
    
    return 60 * 60; // Default 1 hour
  }

  static shouldInvalidate(entry: CacheEntry, forceRefresh?: boolean): boolean {
    if (forceRefresh) return true;
    
    const age = Date.now() - entry.timestamp;
    const maxAge = entry.ttl || (60 * 60 * 1000); // Default 1 hour
    
    return age > maxAge;
  }
}
```

### Content-Based Invalidation

```typescript
export class ContentHashManager {
  static generateContentHash(data: any): string {
    // Generate hash based on data structure and key fields
    const hashInput = {
      prCount: Array.isArray(data) ? data.length : 1,
      lastModified: this.extractLastModified(data),
      keyFields: this.extractKeyFields(data)
    };
    
    return crypto.createHash('sha256')
      .update(JSON.stringify(hashInput))
      .digest('hex')
      .substring(0, 16);
  }

  static hasContentChanged(cachedData: any, freshData: any): boolean {
    const cachedHash = this.generateContentHash(cachedData);
    const freshHash = this.generateContentHash(freshData);
    
    return cachedHash !== freshHash;
  }
}
```

## Cache Warming Strategies

### Background Cache Warming

```typescript
export class CacheWarmer {
  async warmCache(
    config: AzureDevOpsConfig,
    options: GitSparkOptions
  ): Promise<void> {
    
    // Warm cache in background for common queries
    const warmingTasks = [
      this.warmPullRequestCache(config, options),
      this.warmWorkItemCache(config, options),
      this.warmAuthorCache(config, options)
    ];

    // Run warming tasks in parallel with limited concurrency
    await this.runWithConcurrencyLimit(warmingTasks, 3);
  }

  private async warmPullRequestCache(
    config: AzureDevOpsConfig,
    options: GitSparkOptions
  ): Promise<void> {
    
    // Warm cache for different time ranges
    const timeRanges = [
      { days: 7 },    // Last week
      { days: 30 },   // Last month
      { days: 90 },   // Last quarter
      { since: this.getQuarterStart() } // Current quarter
    ];

    for (const timeRange of timeRanges) {
      const cacheKey = SmartCacheKeyGenerator.generateHierarchicalKeys(
        config,
        { ...options, ...timeRange }
      ).pullRequests;

      const cached = await this.cacheManager.get(cacheKey);
      if (!cached) {
        // Fetch and cache in background
        this.backgroundFetch(config, { ...options, ...timeRange });
      }
    }
  }
}
```

## Performance Monitoring

### Cache Performance Metrics

```typescript
export class CacheMetrics {
  private metrics = {
    memoryCache: { hits: 0, misses: 0, evictions: 0 },
    fileCache: { hits: 0, misses: 0, size: 0 },
    apiCalls: { avoided: 0, made: 0, savedTime: 0 },
    performance: { cacheReadTime: [], apiCallTime: [] }
  };

  recordCacheHit(cacheType: 'memory' | 'file', responseTime: number): void {
    this.metrics[`${cacheType}Cache`].hits++;
    this.metrics.performance.cacheReadTime.push(responseTime);
  }

  recordCacheMiss(cacheType: 'memory' | 'file'): void {
    this.metrics[`${cacheType}Cache`].misses++;
  }

  recordAPICallAvoided(estimatedTime: number): void {
    this.metrics.apiCalls.avoided++;
    this.metrics.apiCalls.savedTime += estimatedTime;
  }

  generateReport(): CachePerformanceReport {
    const memoryCacheHitRate = this.calculateHitRate(this.metrics.memoryCache);
    const fileCacheHitRate = this.calculateHitRate(this.metrics.fileCache);
    const avgCacheReadTime = this.calculateAverage(this.metrics.performance.cacheReadTime);
    const avgAPICallTime = this.calculateAverage(this.metrics.performance.apiCallTime);

    return {
      memoryCacheHitRate,
      fileCacheHitRate,
      overallCacheEfficiency: this.metrics.apiCalls.avoided / 
        (this.metrics.apiCalls.avoided + this.metrics.apiCalls.made),
      timeSavedByCache: this.metrics.apiCalls.savedTime,
      avgCacheReadTime,
      avgAPICallTime,
      cacheSpeedupFactor: avgAPICallTime / avgCacheReadTime,
      recommendations: this.generateRecommendations()
    };
  }
}
```

## Configuration Options

### Cache Configuration Schema

```typescript
export interface EnhancedCacheConfig {
  enabled: boolean;
  
  // Memory cache settings
  memoryCache: {
    maxSize: number;           // Max entries in memory
    maxMemoryMB: number;       // Max memory usage
    evictionPolicy: 'lru' | 'lfu' | 'ttl';
  };
  
  // File cache settings
  fileCache: {
    directory: string;         // Cache directory
    maxSizeMB: number;         // Max disk usage
    compression: boolean;      // Enable compression
    encryption: boolean;       // Encrypt sensitive data
    cleanupInterval: number;   // Cleanup interval in hours
  };
  
  // TTL settings by data type
  ttl: {
    pullRequests: {
      active: number;
      completed: number;
      abandoned: number;
    };
    workItems: {
      active: number;
      completed: number;
    };
    correlations: number;
    analytics: number;
  };
  
  // Performance settings
  performance: {
    enableBackgroundWarming: boolean;
    maxConcurrentWarmingTasks: number;
    enableIncrementalUpdates: boolean;
    metricsEnabled: boolean;
  };
  
  // Invalidation settings
  invalidation: {
    strategy: 'time-based' | 'content-based' | 'hybrid';
    forceRefreshAfterHours: number;
    enableSmartInvalidation: boolean;
  };
}
```

## Usage Examples

### Development Workflow

```bash
# First run - fetches all data, caches everything
git-spark --azure-devops --days 30

# Second run - uses cache, very fast
git-spark --azure-devops --days 30

# Different time range - partial cache hit
git-spark --azure-devops --days 7

# Force refresh - bypasses cache
git-spark --azure-devops --days 30 --no-cache

# Show cache statistics
git-spark --azure-devops --cache-stats
```

### CI/CD Pipeline Optimization

```yaml
# Cache strategy for CI/CD
steps:
  - name: Restore git-spark cache
    uses: actions/cache@v3
    with:
      path: ./.git-spark-cache
      key: git-spark-cache-${{ github.repository }}-${{ hashFiles('.git-spark.json') }}
      restore-keys: |
        git-spark-cache-${{ github.repository }}-
        
  - name: Run git-spark analysis
    run: git-spark --azure-devops --days 7
    
  - name: Show cache performance
    run: git-spark --cache-stats
```

This enhanced caching strategy ensures that Azure DevOps PR data fetching is minimized through intelligent multi-level caching, smart invalidation, and incremental updates. The result is dramatically improved re-run performance while maintaining data freshness and accuracy.
