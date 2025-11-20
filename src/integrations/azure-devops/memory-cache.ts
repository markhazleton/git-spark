import { createLogger } from '../../utils/logger';

const logger = createLogger('azure-devops-memory-cache');

/**
 * High-performance in-memory cache for Azure DevOps data
 * Provides sub-millisecond access times for frequently accessed data
 */
export class MemoryCache {
  private cache = new Map<string, CacheEntry>();
  private accessTimes = new Map<string, number>();
  private readonly maxEntries: number;
  private readonly defaultTtlMs: number;

  constructor(options: MemoryCacheOptions = {}) {
    this.maxEntries = options.maxEntries || 1000;
    this.defaultTtlMs = options.defaultTtlMs || 30 * 60 * 1000; // 30 minutes

    logger.debug('Memory cache initialized', {
      maxEntries: this.maxEntries,
      defaultTtlMs: this.defaultTtlMs,
    });
  }

  /**
   * Get data from memory cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      logger.debug('Memory cache miss', { key });
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      logger.debug('Memory cache entry expired', { key, expiresAt: entry.expiresAt });
      this.cache.delete(key);
      this.accessTimes.delete(key);
      return null;
    }

    // Update access time for LRU tracking
    this.accessTimes.set(key, Date.now());

    logger.debug('Memory cache hit', {
      key,
      dataSize: JSON.stringify(entry.data).length,
      age: Date.now() - entry.createdAt,
    });

    return entry.data as T;
  }

  /**
   * Store data in memory cache
   */
  set<T>(key: string, data: T, ttlMs?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttlMs || this.defaultTtlMs);

    // Ensure we don't exceed max entries
    if (this.cache.size >= this.maxEntries && !this.cache.has(key)) {
      this.evictLeastRecentlyUsed();
    }

    const entry: CacheEntry = {
      data,
      createdAt: now,
      expiresAt,
      accessCount: 1,
    };

    this.cache.set(key, entry);
    this.accessTimes.set(key, now);

    logger.debug('Memory cache set', {
      key,
      dataSize: JSON.stringify(data).length,
      ttlMs: ttlMs || this.defaultTtlMs,
      cacheSize: this.cache.size,
    });
  }

  /**
   * Check if key exists in cache (without updating access time)
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.accessTimes.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Remove specific key from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    this.accessTimes.delete(key);

    if (deleted) {
      logger.debug('Memory cache entry deleted', { key });
    }

    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.accessTimes.clear();

    logger.info('Memory cache cleared', { previousSize: size });
  }

  /**
   * Get cache statistics
   */
  getStats(): MemoryCacheStats {
    const now = Date.now();
    let expiredCount = 0;
    let totalDataSize = 0;
    let oldestEntry = now;
    let newestEntry = 0;

    for (const [, entry] of this.cache) {
      if (now > entry.expiresAt) {
        expiredCount++;
      }

      totalDataSize += JSON.stringify(entry.data).length;

      if (entry.createdAt < oldestEntry) {
        oldestEntry = entry.createdAt;
      }

      if (entry.createdAt > newestEntry) {
        newestEntry = entry.createdAt;
      }
    }

    return {
      totalEntries: this.cache.size,
      expiredEntries: expiredCount,
      activeEntries: this.cache.size - expiredCount,
      totalDataSizeBytes: totalDataSize,
      averageDataSizeBytes: this.cache.size > 0 ? Math.round(totalDataSize / this.cache.size) : 0,
      oldestEntryAge: this.cache.size > 0 ? now - oldestEntry : 0,
      newestEntryAge: this.cache.size > 0 ? now - newestEntry : 0,
      maxEntries: this.maxEntries,
      utilizationPercentage: Math.round((this.cache.size / this.maxEntries) * 100),
    };
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        this.accessTimes.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug('Memory cache cleanup completed', {
        cleanedCount,
        remainingEntries: this.cache.size,
      });
    }

    return cleanedCount;
  }

  /**
   * Generate cache keys for Azure DevOps data
   */
  static generateKey(type: 'pr' | 'config' | 'analytics', ...components: string[]): string {
    return `azure-devops:${type}:${components.join(':')}`;
  }

  /**
   * Evict least recently used entry to make room for new data
   */
  private evictLeastRecentlyUsed(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, accessTime] of this.accessTimes) {
      if (accessTime < oldestTime) {
        oldestTime = accessTime;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey);
      this.cache.delete(oldestKey);
      this.accessTimes.delete(oldestKey);

      logger.debug('Memory cache LRU eviction', {
        evictedKey: oldestKey,
        age: Date.now() - oldestTime,
        dataSize: entry ? JSON.stringify(entry.data).length : 0,
      });
    }
  }

  /**
   * Update cache entry without changing expiration
   */
  update<T>(key: string, updater: (current: T | null) => T): void {
    const existing = this.get<T>(key);
    const updated = updater(existing);

    // Keep original TTL if updating existing entry
    const entry = this.cache.get(key);
    const remainingTtl = entry ? Math.max(0, entry.expiresAt - Date.now()) : this.defaultTtlMs;

    this.set(key, updated, remainingTtl);
  }

  /**
   * Get multiple keys at once
   */
  multiGet<T>(keys: string[]): Map<string, T> {
    const results = new Map<string, T>();

    for (const key of keys) {
      const value = this.get<T>(key);
      if (value !== null) {
        results.set(key, value);
      }
    }

    return results;
  }

  /**
   * Set multiple key-value pairs at once
   */
  multiSet<T>(entries: Array<{ key: string; value: T; ttlMs?: number }>): void {
    for (const entry of entries) {
      this.set(entry.key, entry.value, entry.ttlMs);
    }
  }
}

/**
 * Memory cache configuration options
 */
export interface MemoryCacheOptions {
  /** Maximum number of entries to store (default: 1000) */
  maxEntries?: number;
  /** Default TTL in milliseconds (default: 30 minutes) */
  defaultTtlMs?: number;
}

/**
 * Cache entry structure
 */
interface CacheEntry {
  data: any;
  createdAt: number;
  expiresAt: number;
  accessCount: number;
}

/**
 * Memory cache statistics
 */
export interface MemoryCacheStats {
  totalEntries: number;
  expiredEntries: number;
  activeEntries: number;
  totalDataSizeBytes: number;
  averageDataSizeBytes: number;
  oldestEntryAge: number;
  newestEntryAge: number;
  maxEntries: number;
  utilizationPercentage: number;
}
