/**
 * Rate limiter for Azure DevOps API requests
 */
export class RateLimiter {
  private requestTimes: number[] = [];
  private readonly windowMs = 60 * 1000; // 1 minute

  constructor(private config: { requestsPerMinute: number; enabled: boolean }) {}

  /**
   * Wait if rate limit would be exceeded
   */
  async waitIfNeeded(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const now = Date.now();

    // Remove old requests outside the window
    this.requestTimes = this.requestTimes.filter(time => now - time < this.windowMs);

    // Check if we're at the limit
    if (this.requestTimes.length >= this.config.requestsPerMinute) {
      const oldestRequest = Math.min(...this.requestTimes);
      const waitTime = this.windowMs - (now - oldestRequest);

      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // Record this request
    this.requestTimes.push(now);
  }
}
