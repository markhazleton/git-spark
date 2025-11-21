import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  unlinkSync,
} from 'fs';
import { join, dirname } from 'path';
import { createHash } from 'crypto';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('azure-devops-file-cache');

/**
 * Persistent file-based cache for Azure DevOps data
 * Provides persistence across sessions with configurable TTL and size management
 */
export class FileCache {
  private readonly cacheDir: string;
  private readonly maxSizeMB: number;
  private readonly defaultTtlMs: number;
  private readonly compressionEnabled: boolean;

  constructor(options: FileCacheOptions) {
    this.cacheDir = options.cacheDir;
    this.maxSizeMB = options.maxSizeMB || 100;
    this.defaultTtlMs = options.defaultTtlMs || 60 * 60 * 1000; // 1 hour
    this.compressionEnabled = options.compressionEnabled || false;

    // Ensure cache directory exists
    this.ensureCacheDirectory();

    logger.info('File cache initialized', {
      cacheDir: this.cacheDir,
      maxSizeMB: this.maxSizeMB,
      defaultTtlMs: this.defaultTtlMs,
      compressionEnabled: this.compressionEnabled,
    });
  }

  /**
   * Get data from file cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const filePath = this.getFilePath(key);

      if (!existsSync(filePath)) {
        logger.debug('File cache miss (file not found)', { key, filePath });
        return null;
      }

      const rawData = readFileSync(filePath, 'utf-8');
      const cacheEntry: FileCacheEntry = JSON.parse(rawData);

      // Check if entry has expired
      if (Date.now() > cacheEntry.expiresAt) {
        logger.debug('File cache entry expired', {
          key,
          expiresAt: new Date(cacheEntry.expiresAt).toISOString(),
          age: Date.now() - cacheEntry.createdAt,
        });

        // Clean up expired file
        this.deleteFile(filePath);
        return null;
      }

      // Update access information
      cacheEntry.lastAccessedAt = Date.now();
      cacheEntry.accessCount++;
      writeFileSync(filePath, JSON.stringify(cacheEntry), 'utf-8');

      logger.debug('File cache hit', {
        key,
        dataSize: JSON.stringify(cacheEntry.data).length,
        age: Date.now() - cacheEntry.createdAt,
        accessCount: cacheEntry.accessCount,
      });

      return cacheEntry.data as T;
    } catch (error) {
      logger.warn('File cache read error', { key, error });
      return null;
    }
  }

  /**
   * Store data in file cache
   */
  async set<T>(key: string, data: T, ttlMs?: number): Promise<void> {
    try {
      const filePath = this.getFilePath(key);
      const now = Date.now();
      const expiresAt = now + (ttlMs || this.defaultTtlMs);

      const cacheEntry: FileCacheEntry = {
        key,
        data,
        createdAt: now,
        expiresAt,
        lastAccessedAt: now,
        accessCount: 1,
        dataSize: JSON.stringify(data).length,
      };

      // Ensure directory exists
      mkdirSync(dirname(filePath), { recursive: true });

      // Write cache entry
      writeFileSync(filePath, JSON.stringify(cacheEntry), 'utf-8');

      logger.debug('File cache set', {
        key,
        filePath,
        dataSize: cacheEntry.dataSize,
        ttlMs: ttlMs || this.defaultTtlMs,
      });

      // Check if we need to clean up old files
      await this.cleanupIfNeeded();
    } catch (error) {
      logger.error('File cache write error', { key, error });
      throw error;
    }
  }

  /**
   * Check if key exists in cache (without updating access time)
   */
  async has(key: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(key);

      if (!existsSync(filePath)) {
        return false;
      }

      const rawData = readFileSync(filePath, 'utf-8');
      const cacheEntry: FileCacheEntry = JSON.parse(rawData);

      // Check expiration
      if (Date.now() > cacheEntry.expiresAt) {
        this.deleteFile(filePath);
        return false;
      }

      return true;
    } catch (error) {
      logger.debug('File cache has() error', { key, error });
      return false;
    }
  }

  /**
   * Remove specific key from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(key);

      if (existsSync(filePath)) {
        this.deleteFile(filePath);
        logger.debug('File cache entry deleted', { key, filePath });
        return true;
      }

      return false;
    } catch (error) {
      logger.warn('File cache delete error', { key, error });
      return false;
    }
  }

  /**
   * Clear all cache files
   */
  async clear(): Promise<void> {
    try {
      if (!existsSync(this.cacheDir)) {
        return;
      }

      const files = this.getAllCacheFiles();
      let deletedCount = 0;

      for (const file of files) {
        try {
          this.deleteFile(file.path);
          deletedCount++;
        } catch (error) {
          logger.warn('Failed to delete cache file during clear', { file: file.path, error });
        }
      }

      logger.info('File cache cleared', { deletedCount, totalFiles: files.length });
    } catch (error) {
      logger.error('File cache clear error', { error });
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<FileCacheStats> {
    try {
      const files = this.getAllCacheFiles();
      const now = Date.now();

      let totalSize = 0;
      let totalDataSize = 0;
      let expiredCount = 0;
      let oldestFile = now;
      let newestFile = 0;
      let totalAccessCount = 0;

      for (const file of files) {
        totalSize += file.size;

        try {
          const rawData = readFileSync(file.path, 'utf-8');
          const entry: FileCacheEntry = JSON.parse(rawData);

          totalDataSize += entry.dataSize;
          totalAccessCount += entry.accessCount;

          if (now > entry.expiresAt) {
            expiredCount++;
          }

          if (entry.createdAt < oldestFile) {
            oldestFile = entry.createdAt;
          }

          if (entry.createdAt > newestFile) {
            newestFile = entry.createdAt;
          }
        } catch (error) {
          // File might be corrupted, count as expired
          expiredCount++;
        }
      }

      return {
        totalFiles: files.length,
        expiredFiles: expiredCount,
        activeFiles: files.length - expiredCount,
        totalSizeBytes: totalSize,
        totalDataSizeBytes: totalDataSize,
        totalSizeMB: Math.round((totalSize / (1024 * 1024)) * 100) / 100,
        averageFileSizeBytes: files.length > 0 ? Math.round(totalSize / files.length) : 0,
        oldestFileAge: files.length > 0 ? now - oldestFile : 0,
        newestFileAge: files.length > 0 ? now - newestFile : 0,
        totalAccessCount,
        maxSizeMB: this.maxSizeMB,
        utilizationPercentage: Math.round((totalSize / (1024 * 1024) / this.maxSizeMB) * 100),
      };
    } catch (error) {
      logger.error('File cache stats error', { error });
      return this.getEmptyStats();
    }
  }

  /**
   * Cleanup expired files and enforce size limits
   */
  async cleanup(): Promise<FileCacheCleanupResult> {
    try {
      const files = this.getAllCacheFiles();
      const now = Date.now();

      let expiredDeleted = 0;
      let sizeDeleted = 0;
      let totalBytesFreed = 0;

      // First pass: Delete expired files
      for (const file of files) {
        try {
          const rawData = readFileSync(file.path, 'utf-8');
          const entry: FileCacheEntry = JSON.parse(rawData);

          if (now > entry.expiresAt) {
            totalBytesFreed += file.size;
            this.deleteFile(file.path);
            expiredDeleted++;
          }
        } catch (error) {
          // Corrupted file, delete it
          totalBytesFreed += file.size;
          this.deleteFile(file.path);
          expiredDeleted++;
        }
      }

      // Second pass: Check size limits and delete least recently used files
      const remainingFiles = this.getAllCacheFiles();
      const currentSizeMB = remainingFiles.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024);

      if (currentSizeMB > this.maxSizeMB) {
        // Sort by last access time (oldest first)
        const filesWithAccess = remainingFiles
          .map(file => {
            try {
              const rawData = readFileSync(file.path, 'utf-8');
              const entry: FileCacheEntry = JSON.parse(rawData);
              return { ...file, lastAccessedAt: entry.lastAccessedAt };
            } catch {
              return { ...file, lastAccessedAt: 0 };
            }
          })
          .sort((a, b) => a.lastAccessedAt - b.lastAccessedAt);

        let deletedSizeMB = 0;
        const targetSizeMB = this.maxSizeMB * 0.8; // Delete to 80% of max size

        for (const file of filesWithAccess) {
          if (currentSizeMB - deletedSizeMB <= targetSizeMB) {
            break;
          }

          totalBytesFreed += file.size;
          deletedSizeMB += file.size / (1024 * 1024);
          this.deleteFile(file.path);
          sizeDeleted++;
        }
      }

      const result: FileCacheCleanupResult = {
        expiredFilesDeleted: expiredDeleted,
        sizeConstraintFilesDeleted: sizeDeleted,
        totalFilesDeleted: expiredDeleted + sizeDeleted,
        bytesFreed: totalBytesFreed,
        mbFreed: Math.round((totalBytesFreed / (1024 * 1024)) * 100) / 100,
      };

      if (result.totalFilesDeleted > 0) {
        logger.info('File cache cleanup completed', result);
      }

      return result;
    } catch (error) {
      logger.error('File cache cleanup error', { error });
      return {
        expiredFilesDeleted: 0,
        sizeConstraintFilesDeleted: 0,
        totalFilesDeleted: 0,
        bytesFreed: 0,
        mbFreed: 0,
      };
    }
  }

  /**
   * Update existing cache entry
   */
  async update<T>(key: string, updater: (current: T | null) => T): Promise<void> {
    const existing = await this.get<T>(key);
    const updated = updater(existing);

    // Preserve original TTL if updating existing entry
    let ttl = this.defaultTtlMs;

    if (existing !== null) {
      try {
        const filePath = this.getFilePath(key);
        const rawData = readFileSync(filePath, 'utf-8');
        const entry: FileCacheEntry = JSON.parse(rawData);
        ttl = Math.max(0, entry.expiresAt - Date.now());
      } catch {
        // Use default TTL if we can't read existing
      }
    }

    await this.set(key, updated, ttl);
  }

  /**
   * Generate safe file path for cache key
   */
  private getFilePath(key: string): string {
    const hash = createHash('sha256').update(key).digest('hex');
    const subDir = hash.substring(0, 2); // Use first 2 chars for subdirectory
    return join(this.cacheDir, subDir, `${hash}.json`);
  }

  /**
   * Ensure cache directory exists
   */
  private ensureCacheDirectory(): void {
    if (!existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true });
      logger.debug('Created cache directory', { cacheDir: this.cacheDir });
    }
  }

  /**
   * Get all cache files with their metadata
   */
  private getAllCacheFiles(): CacheFileInfo[] {
    const files: CacheFileInfo[] = [];

    if (!existsSync(this.cacheDir)) {
      return files;
    }

    const scanDirectory = (dir: string) => {
      try {
        const entries = readdirSync(dir);

        for (const entry of entries) {
          const fullPath = join(dir, entry);
          const stats = statSync(fullPath);

          if (stats.isDirectory()) {
            scanDirectory(fullPath);
          } else if (stats.isFile() && entry.endsWith('.json')) {
            files.push({
              path: fullPath,
              size: stats.size,
              mtime: stats.mtime.getTime(),
            });
          }
        }
      } catch (error) {
        logger.warn('Error scanning cache directory', { dir, error });
      }
    };

    scanDirectory(this.cacheDir);
    return files;
  }

  /**
   * Safely delete a file
   */
  private deleteFile(filePath: string): void {
    try {
      unlinkSync(filePath);
    } catch (error) {
      logger.debug('Failed to delete cache file', { filePath, error });
    }
  }

  /**
   * Check if cleanup is needed and perform it
   */
  private async cleanupIfNeeded(): Promise<void> {
    // Perform cleanup every 100 writes (roughly)
    if (Math.random() < 0.01) {
      await this.cleanup();
    }
  }

  /**
   * Get empty stats object
   */
  private getEmptyStats(): FileCacheStats {
    return {
      totalFiles: 0,
      expiredFiles: 0,
      activeFiles: 0,
      totalSizeBytes: 0,
      totalDataSizeBytes: 0,
      totalSizeMB: 0,
      averageFileSizeBytes: 0,
      oldestFileAge: 0,
      newestFileAge: 0,
      totalAccessCount: 0,
      maxSizeMB: this.maxSizeMB,
      utilizationPercentage: 0,
    };
  }
}

/**
 * File cache configuration options
 */
export interface FileCacheOptions {
  /** Cache directory path */
  cacheDir: string;
  /** Maximum cache size in MB (default: 100) */
  maxSizeMB?: number;
  /** Default TTL in milliseconds (default: 1 hour) */
  defaultTtlMs?: number;
  /** Enable data compression (default: false) */
  compressionEnabled?: boolean;
}

/**
 * File cache entry structure
 */
interface FileCacheEntry {
  key: string;
  data: any;
  createdAt: number;
  expiresAt: number;
  lastAccessedAt: number;
  accessCount: number;
  dataSize: number;
}

/**
 * Cache file information
 */
interface CacheFileInfo {
  path: string;
  size: number;
  mtime: number;
}

/**
 * File cache statistics
 */
export interface FileCacheStats {
  totalFiles: number;
  expiredFiles: number;
  activeFiles: number;
  totalSizeBytes: number;
  totalDataSizeBytes: number;
  totalSizeMB: number;
  averageFileSizeBytes: number;
  oldestFileAge: number;
  newestFileAge: number;
  totalAccessCount: number;
  maxSizeMB: number;
  utilizationPercentage: number;
}

/**
 * Cache cleanup result
 */
export interface FileCacheCleanupResult {
  expiredFilesDeleted: number;
  sizeConstraintFilesDeleted: number;
  totalFilesDeleted: number;
  bytesFreed: number;
  mbFreed: number;
}
