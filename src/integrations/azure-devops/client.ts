import {
  AzureDevOpsConfig,
  AzureDevOpsPullRequest,
  AzureDevOpsError,
  AzureDevOpsFilters,
  ProgressCallback,
} from '../../types/index.js';
import { createLogger } from '../../utils/logger.js';
import { RateLimiter } from './rate-limiter.js';
import { PaginationManager } from './pagination.js';

const logger = createLogger('azure-devops-client');

/**
 * Azure DevOps REST API client with comprehensive error handling and pagination
 */
class AzureDevOpsClient {
  private readonly baseUrl: string;
  private readonly rateLimiter: RateLimiter;
  private readonly paginationManager: PaginationManager;
  private readonly headers: Record<string, string>;

  constructor(
    private config: AzureDevOpsConfig,
    private progressCallback?: ProgressCallback
  ) {
    // Handle different Azure DevOps URL formats
    let baseUrl: string;
    if (config.organization.startsWith('http://') || config.organization.startsWith('https://')) {
      // Full URL format - validate it's an Azure DevOps domain
      const url = new URL(config.organization);
      const validDomains = ['dev.azure.com', 'visualstudio.com'];
      const isValidAzureDomain = validDomains.some(domain => 
        url.hostname === domain || url.hostname.endsWith(`.${domain}`)
      );
      if (!isValidAzureDomain) {
        throw new Error(`Invalid Azure DevOps URL: ${config.organization}`);
      }
      baseUrl = `${url.protocol}//${url.host}/${config.project}/_apis`;
    } else {
      // Organization name only - use detected base URL format
      const apiBaseUrl = config.api?.baseUrl || 'https://dev.azure.com';
      const url = new URL(apiBaseUrl);
      if (url.hostname.endsWith('.visualstudio.com')) {
        // Legacy format: organization.visualstudio.com
        baseUrl = `${apiBaseUrl}/${config.project}/_apis`;
      } else if (url.hostname === 'dev.azure.com') {
        // Modern format: dev.azure.com/organization
        baseUrl = `${apiBaseUrl}/${config.organization}/${config.project}/_apis`;
      } else {
        throw new Error(`Invalid Azure DevOps base URL: ${apiBaseUrl}`);
      }
    }
    this.baseUrl = baseUrl;

    // Initialize rate limiter
    this.rateLimiter = new RateLimiter(
      config.api?.rateLimit || { requestsPerMinute: 180, enabled: true }
    );

    // Initialize pagination managers
    this.paginationManager = new PaginationManager(config);

    // Setup authentication headers
    this.headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'git-spark-azure-devops-integration/1.0',
    };

    if (config.personalAccessToken) {
      // Use PAT authentication
      const auth = Buffer.from(`:${config.personalAccessToken}`).toString('base64');
      this.headers['Authorization'] = `Basic ${auth}`;
    }
    // If no PAT, rely on default credentials (Azure CLI, managed identity, etc.)

    logger.info('Azure DevOps client initialized', {
      organization: config.organization,
      project: config.project,
      baseUrl: this.baseUrl,
      hasToken: !!config.personalAccessToken,
    });
  }

  /**
   * Fetch all pull requests with intelligent pagination and filtering
   */
  async fetchPullRequests(filters?: AzureDevOpsFilters): Promise<AzureDevOpsPullRequest[]> {
    const startTime = Date.now();
    logger.info('Starting pull request fetch', { filters });

    try {
      // Estimate total count if possible
      const estimatedTotal = await this.estimatePullRequestCount(filters);

      // Choose appropriate strategy based on estimated volume
      if (estimatedTotal > 5000) {
        logger.info('Large dataset detected, using time partitioning strategy', { estimatedTotal });
        return this.fetchPullRequestsWithTimePartitioning(filters);
      } else {
        logger.info('Using standard pagination strategy', { estimatedTotal });
        return this.fetchPullRequestsWithStandardPagination(filters);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Pull request fetch failed', { error, duration });
      throw this.wrapError(error, 'Failed to fetch pull requests');
    }
  }

  /**
   * Standard pagination for moderate datasets
   */
  private async fetchPullRequestsWithStandardPagination(
    filters?: AzureDevOpsFilters
  ): Promise<AzureDevOpsPullRequest[]> {
    const allPullRequests: AzureDevOpsPullRequest[] = [];
    let continuationToken: string | undefined;
    let pageCount = 0;
    const maxPages = 100; // Safety limit

    const pageSize = this.paginationManager.calculateOptimalPageSize(
      'pullrequests',
      -1, // Unknown total
      200 // Assume reasonable latency
    );

    do {
      try {
        await this.rateLimiter.waitIfNeeded();

        const url = this.buildPullRequestUrl(filters, pageSize, continuationToken);
        logger.info('Making Azure DevOps API request', { url });
        const response = await this.makeRequest<PaginatedResponse<AzureDevOpsPullRequest>>(url);

        allPullRequests.push(...response.value);
        continuationToken = response.continuationToken;
        pageCount++;

        // Progress reporting
        if (this.progressCallback) {
          this.progressCallback(
            'Fetching pull requests',
            allPullRequests.length,
            response.count || -1
          );
        }

        logger.debug('Fetched pull request page', {
          page: pageCount,
          pageSize: response.value.length,
          total: allPullRequests.length,
          hasMore: !!continuationToken,
        });

        // Safety check
        if (pageCount >= maxPages) {
          logger.warn('Reached maximum page limit, results may be incomplete', {
            maxPages,
            fetched: allPullRequests.length,
          });
          break;
        }
      } catch (error) {
        // Retry logic for transient errors
        if (this.isRetryableError(error) && pageCount < 3) {
          logger.warn('Retrying failed page request', { page: pageCount, error });
          await this.delay(Math.pow(2, pageCount) * 1000); // Exponential backoff
          continue;
        }
        throw error;
      }
    } while (continuationToken);

    logger.info('Pull request fetch completed', {
      totalFetched: allPullRequests.length,
      pages: pageCount,
    });

    return allPullRequests;
  }

  /**
   * Time partitioning strategy for large datasets
   */
  private async fetchPullRequestsWithTimePartitioning(
    filters?: AzureDevOpsFilters
  ): Promise<AzureDevOpsPullRequest[]> {
    const allPullRequests: AzureDevOpsPullRequest[] = [];

    // Calculate time partitions
    const timeRanges = this.calculateTimePartitions(filters);

    logger.info('Using time partitioning strategy', {
      partitions: timeRanges.length,
      ranges: timeRanges.map(r => ({ start: r.start.toISOString(), end: r.end.toISOString() })),
    });

    for (let i = 0; i < timeRanges.length; i++) {
      const timeRange = timeRanges[i];

      // Create partition-specific filters
      const partitionFilters: AzureDevOpsFilters = {
        ...filters,
        minCreatedDate: timeRange.start,
        maxCreatedDate: timeRange.end,
      };

      if (this.progressCallback) {
        this.progressCallback(
          `Fetching partition ${i + 1}/${timeRanges.length}`,
          i,
          timeRanges.length
        );
      }

      logger.info('Fetching partition', {
        partition: `${i + 1}/${timeRanges.length}`,
        start: timeRange.start.toISOString(),
        end: timeRange.end.toISOString(),
      });

      const partitionResults = await this.fetchPullRequestsWithStandardPagination(partitionFilters);
      allPullRequests.push(...partitionResults);

      // Add delay between partitions
      if (i < timeRanges.length - 1) {
        await this.delay(1000);
      }
    }

    logger.info('Time partitioned fetch completed', {
      totalFetched: allPullRequests.length,
      partitions: timeRanges.length,
    });

    return allPullRequests;
  }

  /**
   * Estimate total pull request count (best effort)
   */
  private async estimatePullRequestCount(filters?: AzureDevOpsFilters): Promise<number> {
    try {
      // Make a small query to get count estimate
      const url = this.buildPullRequestUrl(filters, 1); // Just get 1 item
      const response = await this.makeRequest<PaginatedResponse<AzureDevOpsPullRequest>>(url);

      // Azure DevOps doesn't always provide total count, so this is best effort
      return response.count || -1;
    } catch (error) {
      logger.debug('Could not estimate PR count', { error });
      return -1;
    }
  }

  /**
   * Calculate time partitions for large date ranges
   */
  private calculateTimePartitions(filters?: AzureDevOpsFilters): Array<{ start: Date; end: Date }> {
    const ranges: Array<{ start: Date; end: Date }> = [];

    const startDate = filters?.minCreatedDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
    const endDate = filters?.maxCreatedDate || new Date();

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));

    if (totalDays > 90) {
      // Monthly partitions for very large ranges
      let currentDate = new Date(startDate);
      while (currentDate < endDate) {
        const partitionEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        ranges.push({
          start: new Date(currentDate),
          end: partitionEnd > endDate ? endDate : partitionEnd,
        });
        currentDate = partitionEnd;
      }
    } else if (totalDays > 30) {
      // Weekly partitions for moderate ranges
      let currentDate = new Date(startDate);
      while (currentDate < endDate) {
        const partitionEnd = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        ranges.push({
          start: new Date(currentDate),
          end: partitionEnd > endDate ? endDate : partitionEnd,
        });
        currentDate = partitionEnd;
      }
    } else {
      // Single range for small datasets
      ranges.push({ start: startDate, end: endDate });
    }

    return ranges;
  }

  /**
   * Build pull request API URL with filters and pagination
   */
  private buildPullRequestUrl(
    filters?: AzureDevOpsFilters,
    pageSize?: number,
    continuationToken?: string
  ): string {
    const apiVersion = this.config.api?.version || '7.0';
    let url = `${this.baseUrl}/git/repositories/${this.config.repository || 'default'}/pullrequests?api-version=${apiVersion}`;

    // Add pagination parameters
    if (pageSize) {
      url += `&$top=${pageSize}`;
    }

    if (continuationToken) {
      url += `&continuationToken=${encodeURIComponent(continuationToken)}`;
    }

    // Add filters
    if (filters) {
      if (filters.pullRequestStates && filters.pullRequestStates.length > 0) {
        // Try without quotes around status values
        const stateFilter = filters.pullRequestStates.join(',');
        url += `&searchCriteria.status=${stateFilter}`;
      }

      if (filters.minCreatedDate) {
        url += `&searchCriteria.createdAfter=${filters.minCreatedDate.toISOString()}`;
      }

      if (filters.maxCreatedDate) {
        url += `&searchCriteria.createdBefore=${filters.maxCreatedDate.toISOString()}`;
      }

      if (filters.sourceBranchPatterns && filters.sourceBranchPatterns.length > 0) {
        // Note: Azure DevOps API has limited pattern matching for branches
        url += `&searchCriteria.sourceRefName=${encodeURIComponent(filters.sourceBranchPatterns[0])}`;
      }

      if (filters.targetBranchPatterns && filters.targetBranchPatterns.length > 0) {
        url += `&searchCriteria.targetRefName=${encodeURIComponent(filters.targetBranchPatterns[0])}`;
      }
    }

    return url;
  }

  /**
   * Make HTTP request with error handling and retries
   */
  private async makeRequest<T>(url: string, options: any = {}): Promise<T> {
    const maxRetries = this.config.api?.maxRetries || 3;
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Use Node.js built-in https module for now
        const https = await import('https');
        const { URL } = await import('url');

        const parsedUrl = new URL(url);
        const requestOptions = {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || 443,
          path: parsedUrl.pathname + parsedUrl.search,
          method: options.method || 'GET',
          headers: { ...this.headers, ...options.headers },
          timeout: this.config.api?.timeoutMs || 30000,
        };

        const data = await new Promise<string>((resolve, reject) => {
          const req = https.request(requestOptions, res => {
            let responseData = '';
            res.on('data', chunk => (responseData += chunk));
            res.on('end', () => {
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                resolve(responseData);
              } else {
                reject(
                  new AzureDevOpsError(
                    `HTTP ${res.statusCode}: ${res.statusMessage}`,
                    `HTTP_${res.statusCode}`,
                    res.statusCode
                  )
                );
              }
            });
          });

          req.on('error', reject);
          req.on('timeout', () => reject(new Error('Request timeout')));

          if (options.body) {
            req.write(options.body);
          }

          req.end();
        });

        return JSON.parse(data) as T;
      } catch (error) {
        lastError = error as Error;

        if (this.isRetryableError(error) && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          logger.warn(`Request failed, retrying in ${delay}ms`, {
            attempt,
            maxRetries,
            error: error instanceof Error ? error.message : error,
          });
          await this.delay(delay);
          continue;
        }

        break;
      }
    }

    throw this.wrapError(lastError!, `Request failed after ${maxRetries} attempts`);
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Network errors
    if (error.name === 'AbortError' || error.name === 'TimeoutError') return true;
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') return true;

    // HTTP status codes that are retryable
    if (error instanceof AzureDevOpsError) {
      const retryableStatuses = [429, 500, 502, 503, 504];
      return retryableStatuses.includes(error.statusCode || 0);
    }

    return false;
  }

  /**
   * Wrap errors in AzureDevOpsError
   */
  private wrapError(error: any, context: string): AzureDevOpsError {
    if (error instanceof AzureDevOpsError) {
      return error;
    }

    return new AzureDevOpsError(
      `${context}: ${error instanceof Error ? error.message : String(error)}`,
      'CLIENT_ERROR',
      undefined,
      error instanceof Error ? error : undefined
    );
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test API connectivity
   */
  async testConnection(): Promise<{ success: boolean; error?: string; responseTime?: number }> {
    const startTime = Date.now();

    try {
      // Simple API call to test connectivity
      const url = `${this.baseUrl}/git/repositories?api-version=${this.config.api?.version || '7.0'}&$top=1`;
      await this.makeRequest(url);

      const responseTime = Date.now() - startTime;
      logger.info('Azure DevOps connectivity test successful', { responseTime });

      return { success: true, responseTime };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.error('Azure DevOps connectivity test failed', { error: errorMessage, responseTime });

      return { success: false, error: errorMessage, responseTime };
    }
  }
}

/**
 * Interface for paginated API responses
 */
interface PaginatedResponse<T> {
  count: number;
  value: T[];
  continuationToken?: string;
}

export { AzureDevOpsClient };
