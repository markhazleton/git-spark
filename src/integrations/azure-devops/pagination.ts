import { AzureDevOpsConfig } from '../../types/index.js';

/**
 * Manages optimal page sizes for different API endpoints
 */
export class PaginationManager {
  private static readonly DEFAULT_PAGE_SIZE = 100;
  private static readonly MAX_PAGE_SIZE = 1000;

  constructor(private config: AzureDevOpsConfig) {}

  /**
   * Calculate optimal page size based on conditions
   */
  calculateOptimalPageSize(
    _endpoint: string,
    estimatedTotal: number,
    networkLatency: number
  ): number {
    let pageSize = PaginationManager.DEFAULT_PAGE_SIZE;

    // Adjust based on network performance
    if (networkLatency > 1000) {
      pageSize = Math.min(500, PaginationManager.MAX_PAGE_SIZE);
    } else if (networkLatency < 200) {
      pageSize = Math.min(50, PaginationManager.MAX_PAGE_SIZE);
    }

    // Adjust based on estimated total
    if (estimatedTotal > 10000) {
      pageSize = Math.min(1000, PaginationManager.MAX_PAGE_SIZE);
    } else if (estimatedTotal < 100) {
      pageSize = Math.max(estimatedTotal, 10);
    }

    return Math.min(
      pageSize,
      this.config.api?.pagination?.maxPageSize || PaginationManager.MAX_PAGE_SIZE
    );
  }
}

/**
 * Manages continuation tokens for pagination
 */
export class ContinuationTokenManager {
  private tokenCache = new Map<string, any>();

  /**
   * Generate cache key for a query
   */
  private generateCacheKey(baseQuery: any): string {
    return JSON.stringify(baseQuery);
  }

  /**
   * Store token information
   */
  storeTokenInfo(query: any, tokenInfo: any): void {
    const key = this.generateCacheKey(query);
    this.tokenCache.set(key, tokenInfo);
  }

  /**
   * Get token information
   */
  getTokenInfo(query: any): any {
    const key = this.generateCacheKey(query);
    return this.tokenCache.get(key);
  }

  /**
   * Clear token cache
   */
  clearCache(): void {
    this.tokenCache.clear();
  }
}
