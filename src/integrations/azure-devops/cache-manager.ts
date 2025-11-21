import { AzureDevOpsConfig, AzureDevOpsPullRequest, ProcessedPRData } from '../../types/index.js';
import { createLogger } from '../../utils/logger.js';
import { MemoryCache, MemoryCacheStats } from './memory-cache.js';
import { FileCache, FileCacheStats, FileCacheCleanupResult } from './file-cache.js';
import { join } from 'path';

const logger = createLogger('azure-devops-cache-manager');

/**
 * Multi-level cache manager for Azure DevOps data
 * Orchestrates memory and file caching for optimal performance
 */
export class CacheManager {
  private readonly memoryCache: MemoryCache;
  private readonly fileCache: FileCache;
  private readonly config: AzureDevOpsCacheConfig;
  private readonly enabled: boolean;

  // Performance tracking
  private stats: CacheManagerStats = {
    hits: { memory: 0, file: 0, total: 0 },
    misses: { memory: 0, file: 0, total: 0 },
    writes: { memory: 0, file: 0, total: 0 },
    errors: { memory: 0, file: 0, total: 0 },
    hitRate: { memory: 0, file: 0, overall: 0 },
    averageResponseTime: { memory: 0, file: 0 },
  };

  constructor(config: AzureDevOpsConfig, repoPath: string) {
    this.config = config.cache || this.getDefaultCacheConfig();
    this.enabled = this.config.enabled;

    if (!this.enabled) {
      logger.info('Azure DevOps cache disabled by configuration');
      // Create dummy caches that do nothing
      this.memoryCache = new MemoryCache({ maxEntries: 1, defaultTtlMs: 1000 });
      this.fileCache = new FileCache({
        cacheDir: join(repoPath, '.git-spark', 'cache', 'azure-devops'),
        maxSizeMB: 1,
      });
      return;
    }

    // Initialize memory cache
    this.memoryCache = new MemoryCache({
      maxEntries: 1000,
      defaultTtlMs: 30 * 60 * 1000, // 30 minutes
    });

    // Initialize file cache
    const cacheDir = this.config.directory.startsWith('/')
      ? this.config.directory
      : join(repoPath, this.config.directory);

    this.fileCache = new FileCache({
      cacheDir,
      maxSizeMB: this.config.maxSizeMB,
      defaultTtlMs: this.config.ttlMs,
    });

    logger.info('Cache manager initialized', {
      enabled: this.enabled,
      cacheDir,
      maxSizeMB: this.config.maxSizeMB,
      ttlMs: this.config.ttlMs,
      incremental: this.config.incremental,
    });

    // Start background cleanup if enabled
    if (this.config.backgroundWarmup) {
      this.startBackgroundCleanup();
    }
  }

  /**
   * Get data from cache with multi-level fallback
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled) {
      this.stats.misses.total++;
      return null;
    }

    const startTime = Date.now();

    try {
      // Try memory cache first (fastest)
      const memoryResult = this.memoryCache.get<T>(key);
      if (memoryResult !== null) {
        this.stats.hits.memory++;
        this.stats.hits.total++;
        this.updateAverageResponseTime('memory', Date.now() - startTime);

        logger.debug('Cache hit (memory)', { key, responseTime: Date.now() - startTime });
        return memoryResult;
      }
      this.stats.misses.memory++;

      // Try file cache second
      const fileResult = await this.fileCache.get<T>(key);
      if (fileResult !== null) {
        this.stats.hits.file++;
        this.stats.hits.total++;
        this.updateAverageResponseTime('file', Date.now() - startTime);

        // Promote to memory cache for faster future access
        this.memoryCache.set(key, fileResult, 30 * 60 * 1000); // 30 minutes in memory
        this.stats.writes.memory++;

        logger.debug('Cache hit (file, promoted to memory)', {
          key,
          responseTime: Date.now() - startTime,
        });
        return fileResult;
      }
      this.stats.misses.file++;

      // Complete miss
      this.stats.misses.total++;
      logger.debug('Cache miss (complete)', { key, responseTime: Date.now() - startTime });
      return null;
    } catch (error) {
      this.stats.errors.total++;
      logger.warn('Cache get error', { key, error });
      return null;
    }
  }

  /**
   * Store data in both memory and file cache
   */
  async set<T>(key: string, data: T, options: CacheSetOptions = {}): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      const memoryTtl = options.memoryTtlMs || 30 * 60 * 1000; // 30 minutes
      const fileTtl = options.fileTtlMs || this.config.ttlMs;

      // Store in memory cache
      this.memoryCache.set(key, data, memoryTtl);
      this.stats.writes.memory++;

      // Store in file cache
      await this.fileCache.set(key, data, fileTtl);
      this.stats.writes.file++;

      this.stats.writes.total++;

      logger.debug('Cache set (both levels)', {
        key,
        dataSize: JSON.stringify(data).length,
        memoryTtl,
        fileTtl,
      });
    } catch (error) {
      this.stats.errors.total++;
      logger.error('Cache set error', { key, error });
      throw error;
    }
  }

  /**
   * Check if key exists in cache
   */
  async has(key: string): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      return this.memoryCache.has(key) || (await this.fileCache.has(key));
    } catch (error) {
      logger.debug('Cache has() error', { key, error });
      return false;
    }
  }

  /**
   * Delete key from all cache levels
   */
  async delete(key: string): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      const memoryDeleted = this.memoryCache.delete(key);
      const fileDeleted = await this.fileCache.delete(key);

      logger.debug('Cache delete', { key, memoryDeleted, fileDeleted });
      return memoryDeleted || fileDeleted;
    } catch (error) {
      logger.warn('Cache delete error', { key, error });
      return false;
    }
  }

  /**
   * Clear all cache levels
   */
  async clear(): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      this.memoryCache.clear();
      await this.fileCache.clear();

      // Reset stats
      this.stats = {
        hits: { memory: 0, file: 0, total: 0 },
        misses: { memory: 0, file: 0, total: 0 },
        writes: { memory: 0, file: 0, total: 0 },
        errors: { memory: 0, file: 0, total: 0 },
        hitRate: { memory: 0, file: 0, overall: 0 },
        averageResponseTime: { memory: 0, file: 0 },
      };

      logger.info('Cache cleared (all levels)');
    } catch (error) {
      logger.error('Cache clear error', { error });
      throw error;
    }
  }

  /**
   * Get comprehensive cache statistics
   */
  async getStats(): Promise<ComprehensiveCacheStats> {
    try {
      const memoryStats = this.memoryCache.getStats();
      const fileStats = await this.fileCache.getStats();

      // Calculate hit rates
      const totalHits = this.stats.hits.total;
      const totalMisses = this.stats.misses.total;
      const totalRequests = totalHits + totalMisses;

      this.stats.hitRate.memory =
        totalRequests > 0 ? Math.round((this.stats.hits.memory / totalRequests) * 100) / 100 : 0;

      this.stats.hitRate.file =
        totalRequests > 0 ? Math.round((this.stats.hits.file / totalRequests) * 100) / 100 : 0;

      this.stats.hitRate.overall =
        totalRequests > 0 ? Math.round((totalHits / totalRequests) * 100) / 100 : 0;

      return {
        enabled: this.enabled,
        manager: { ...this.stats },
        memory: memoryStats,
        file: fileStats,
        performance: {
          totalRequests,
          hitRatePercentage: Math.round(this.stats.hitRate.overall * 100),
          averageMemoryResponseTime: this.stats.averageResponseTime.memory,
          averageFileResponseTime: this.stats.averageResponseTime.file,
          memoryEfficiency: memoryStats.utilizationPercentage,
          fileEfficiency: fileStats.utilizationPercentage,
        },
      };
    } catch (error) {
      logger.error('Cache stats error', { error });
      throw error;
    }
  }

  /**
   * Perform cache cleanup and maintenance
   */
  async cleanup(): Promise<CacheCleanupResult> {
    if (!this.enabled) {
      return {
        memoryEntriesRemoved: 0,
        fileCleanup: {
          expiredFilesDeleted: 0,
          sizeConstraintFilesDeleted: 0,
          totalFilesDeleted: 0,
          bytesFreed: 0,
          mbFreed: 0,
        },
      };
    }

    try {
      logger.info('Starting cache cleanup');

      // Memory cleanup
      const memoryEntriesRemoved = this.memoryCache.cleanup();

      // File cleanup
      const fileCleanup = await this.fileCache.cleanup();

      const result: CacheCleanupResult = {
        memoryEntriesRemoved,
        fileCleanup,
      };

      logger.info('Cache cleanup completed', result);
      return result;
    } catch (error) {
      logger.error('Cache cleanup error', { error });
      throw error;
    }
  }

  /**
   * Update cache entry using updater function
   */
  async update<T>(key: string, updater: (current: T | null) => T): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      const current = await this.get<T>(key);
      const updated = updater(current);
      await this.set(key, updated);

      logger.debug('Cache update', { key, hadPrevious: current !== null });
    } catch (error) {
      logger.error('Cache update error', { key, error });
      throw error;
    }
  }

  /**
   * Specialized methods for Azure DevOps data types
   */

  /**
   * Cache pull request data with optimized settings
   */
  async cachePullRequest(pr: AzureDevOpsPullRequest): Promise<void> {
    const key = MemoryCache.generateKey('pr', pr.pullRequestId.toString());
    await this.set(key, pr, {
      memoryTtlMs: 60 * 60 * 1000, // 1 hour in memory
      fileTtlMs: 24 * 60 * 60 * 1000, // 24 hours on disk
    });
  }

  /**
   * Get cached pull request data
   */
  async getCachedPullRequest(prId: number): Promise<AzureDevOpsPullRequest | null> {
    const key = MemoryCache.generateKey('pr', prId.toString());
    return this.get<AzureDevOpsPullRequest>(key);
  }

  /**
   * Cache processed PR analytics data
   */
  async cacheProcessedPRData(orgProject: string, prData: ProcessedPRData[]): Promise<void> {
    const key = MemoryCache.generateKey('analytics', 'processed-prs', orgProject);
    await this.set(key, prData, {
      memoryTtlMs: 30 * 60 * 1000, // 30 minutes in memory
      fileTtlMs: 2 * 60 * 60 * 1000, // 2 hours on disk
    });
  }

  /**
   * Get cached processed PR analytics data
   */
  async getCachedProcessedPRData(orgProject: string): Promise<ProcessedPRData[] | null> {
    const key = MemoryCache.generateKey('analytics', 'processed-prs', orgProject);
    return this.get<ProcessedPRData[]>(key);
  }

  /**
   * Incremental cache update for new PR data
   */
  async updatePullRequestsIncremental(
    orgProject: string,
    newPRs: AzureDevOpsPullRequest[],
    existingPRs?: AzureDevOpsPullRequest[]
  ): Promise<void> {
    if (!this.config.incremental) {
      // Not using incremental updates, just cache all new data
      for (const pr of newPRs) {
        await this.cachePullRequest(pr);
      }
      return;
    }

    try {
      // Get existing PR list
      const allPRs = existingPRs || (await this.getCachedProcessedPRData(orgProject)) || [];

      // Create a map for fast lookup
      const existingPRMap = new Map<number, ProcessedPRData>();
      if (allPRs.length > 0 && 'pullRequest' in allPRs[0]) {
        // We have ProcessedPRData
        for (const prData of allPRs as ProcessedPRData[]) {
          existingPRMap.set(prData.pullRequest.pullRequestId, prData);
        }
      }

      // Update with new PRs
      for (const newPR of newPRs) {
        await this.cachePullRequest(newPR);
        // Also update processed data if we had it
        if (existingPRMap.has(newPR.pullRequestId)) {
          // Update existing entry with new data
          const existing = existingPRMap.get(newPR.pullRequestId)!;
          existing.pullRequest = newPR;
          existing.processingMetadata.processedAt = new Date();
        }
      }

      logger.debug('Incremental cache update completed', {
        orgProject,
        newPRs: newPRs.length,
        totalCached: existingPRMap.size,
      });
    } catch (error) {
      logger.error('Incremental cache update error', { orgProject, error });
      throw error;
    }
  }

  /**
   * Get default cache configuration
   */
  private getDefaultCacheConfig(): AzureDevOpsCacheConfig {
    return {
      enabled: true,
      directory: '.git-spark/cache/azure-devops',
      ttlMs: 60 * 60 * 1000, // 1 hour
      incremental: true,
      maxSizeMB: 100,
      backgroundWarmup: false,
    };
  }

  /**
   * Update average response time tracking
   */
  private updateAverageResponseTime(type: 'memory' | 'file', responseTime: number): void {
    const current = this.stats.averageResponseTime[type];
    const count = this.stats.hits[type];

    // Moving average calculation
    this.stats.averageResponseTime[type] = (current * (count - 1) + responseTime) / count;
  }

  /**
   * Start background cleanup process
   */
  private startBackgroundCleanup(): void {
    // Run cleanup every 30 minutes
    const cleanup = async () => {
      try {
        await this.cleanup();
      } catch (error) {
        logger.warn('Background cleanup error', { error });
      }
    };

    // Use setTimeout in a loop instead of setInterval for better error handling
    const scheduleNext = () => {
      setTimeout(
        async () => {
          await cleanup();
          scheduleNext();
        },
        30 * 60 * 1000
      );
    };

    scheduleNext();
    logger.debug('Background cleanup started (30 minute interval)');
  }
}

/**
 * Cache configuration specific to Azure DevOps integration
 */
export interface AzureDevOpsCacheConfig {
  enabled: boolean;
  directory: string;
  ttlMs: number;
  incremental: boolean;
  maxSizeMB: number;
  backgroundWarmup: boolean;
}

/**
 * Options for cache set operations
 */
export interface CacheSetOptions {
  memoryTtlMs?: number;
  fileTtlMs?: number;
}

/**
 * Cache manager statistics
 */
export interface CacheManagerStats {
  hits: { memory: number; file: number; total: number };
  misses: { memory: number; file: number; total: number };
  writes: { memory: number; file: number; total: number };
  errors: { memory: number; file: number; total: number };
  hitRate: { memory: number; file: number; overall: number };
  averageResponseTime: { memory: number; file: number };
}

/**
 * Comprehensive cache statistics
 */
export interface ComprehensiveCacheStats {
  enabled: boolean;
  manager: CacheManagerStats;
  memory: MemoryCacheStats;
  file: FileCacheStats;
  performance: {
    totalRequests: number;
    hitRatePercentage: number;
    averageMemoryResponseTime: number;
    averageFileResponseTime: number;
    memoryEfficiency: number;
    fileEfficiency: number;
  };
}

/**
 * Cache cleanup result
 */
export interface CacheCleanupResult {
  memoryEntriesRemoved: number;
  fileCleanup: FileCacheCleanupResult;
}
