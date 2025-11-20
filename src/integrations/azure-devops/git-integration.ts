import {
  AzureDevOpsPullRequest,
  CommitData,
  AzureDevOpsConfig,
  GitCommitAssociation,
} from '../../types';
import { createLogger } from '../../utils/logger';

const logger = createLogger('azure-devops-git-integration');

/**
 * Associates Azure DevOps pull requests with Git commits
 * Uses multiple strategies to find correlations between PR and Git data
 */
export class GitCommitAssociator {
  private readonly gitCommitsByAuthor: Map<string, CommitData[]>;
  private readonly gitCommitsByDate: Map<string, CommitData[]>;

  constructor(
    private gitData: CommitData[],
    _config: AzureDevOpsConfig
  ) {
    // Group commits by author for author-based matching
    this.gitCommitsByAuthor = new Map();
    for (const commit of gitData) {
      const email = commit.authorEmail;
      if (!this.gitCommitsByAuthor.has(email)) {
        this.gitCommitsByAuthor.set(email, []);
      }
      this.gitCommitsByAuthor.get(email)!.push(commit);
    }

    // Group commits by date for temporal matching
    this.gitCommitsByDate = new Map();
    for (const commit of gitData) {
      const dateKey = commit.date.toISOString().split('T')[0]; // YYYY-MM-DD
      if (!this.gitCommitsByDate.has(dateKey)) {
        this.gitCommitsByDate.set(dateKey, []);
      }
      this.gitCommitsByDate.get(dateKey)!.push(commit);
    }

    logger.info('Git commit associator initialized', {
      totalCommits: gitData.length,
      uniqueAuthors: this.gitCommitsByAuthor.size,
      dateRange: {
        oldest: gitData.length > 0 ? Math.min(...gitData.map(c => c.date.getTime())) : null,
        newest: gitData.length > 0 ? Math.max(...gitData.map(c => c.date.getTime())) : null,
      },
    });
  }

  /**
   * Find Git commits associated with an Azure DevOps pull request
   */
  async findAssociatedCommits(pr: AzureDevOpsPullRequest): Promise<GitCommitAssociation[]> {
    const associations: GitCommitAssociation[] = [];

    try {
      // Strategy 1: Direct merge commit matching
      const mergeCommitAssociations = await this.findByMergeCommit(pr);
      associations.push(...mergeCommitAssociations);

      // Strategy 2: Squash commit matching (if no merge commit found)
      if (associations.length === 0) {
        const squashCommitAssociations = await this.findBySquashCommit(pr);
        associations.push(...squashCommitAssociations);
      }

      // Strategy 3: Branch analysis (if neither merge nor squash found)
      if (associations.length === 0) {
        const branchAssociations = await this.findByBranchAnalysis(pr);
        associations.push(...branchAssociations);
      }

      // Strategy 4: Temporal and author matching (fallback)
      if (associations.length === 0) {
        const temporalAssociations = await this.findByTemporalMatching(pr);
        associations.push(...temporalAssociations);
      }

      logger.debug('Git commit associations found', {
        prId: pr.pullRequestId,
        prTitle: pr.title,
        associationsFound: associations.length,
        methods: associations.map(a => a.method),
      });

      return associations;
    } catch (error) {
      logger.warn('Failed to find Git associations for PR', {
        prId: pr.pullRequestId,
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Strategy 1: Find commits by merge commit message patterns
   */
  private async findByMergeCommit(pr: AzureDevOpsPullRequest): Promise<GitCommitAssociation[]> {
    const associations: GitCommitAssociation[] = [];

    // Escape special regex characters to prevent ReDoS attacks
    const escapedPrId = String(pr.pullRequestId).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedSourceRef = pr.sourceRefName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Common merge commit message patterns with escaped user input
    const mergePatterns = [
      new RegExp(`Merged PR ${escapedPrId}`, 'i'),
      new RegExp(`Merge pull request #${escapedPrId}`, 'i'),
      new RegExp(`Merged in ${escapedSourceRef}`, 'i'),
      new RegExp(`Merge branch '${escapedSourceRef}'`, 'i'),
    ];

    // Look for merge commits around the PR completion time
    const searchWindow = this.getSearchWindow(pr);

    for (const commit of this.gitData) {
      if (!this.isInTimeWindow(commit.date, searchWindow)) {
        continue;
      }

      // Check if commit message matches merge patterns
      const isMatch = mergePatterns.some(pattern => pattern.test(commit.message));

      if (isMatch) {
        associations.push({
          commitHash: commit.hash,
          confidence: 0.95,
          method: 'merge-commit',
          metadata: {
            mergeCommitPattern: true,
            timeWindow: this.calculateTimeDistance(commit.date, pr.closedDate || pr.creationDate),
            authorMatch: this.checkAuthorMatch(commit, pr),
            matchedPattern:
              mergePatterns.find(p => p.test(commit.message))?.toString() || 'unknown',
            searchWindow,
          },
        });
      }
    }

    return associations;
  }

  /**
   * Strategy 2: Find commits by squash commit patterns
   */
  private async findBySquashCommit(pr: AzureDevOpsPullRequest): Promise<GitCommitAssociation[]> {
    const associations: GitCommitAssociation[] = [];

    // Look for commits that match PR title or have PR reference
    const searchWindow = this.getSearchWindow(pr);

    for (const commit of this.gitData) {
      if (!this.isInTimeWindow(commit.date, searchWindow)) {
        continue;
      }

      let confidence = 0;
      const evidence: any = {
        timeWindow: this.calculateTimeDistance(commit.date, pr.closedDate || pr.creationDate),
        authorMatch: this.checkAuthorMatch(commit, pr),
      };

      // Check if commit message contains PR title
      if (this.similarity(commit.message, pr.title) > 0.8) {
        confidence += 0.7;
        evidence.titleMatch = true;
      }

      // Check if commit message references PR ID
      if (
        commit.message.includes(`#${pr.pullRequestId}`) ||
        commit.message.includes(`PR ${pr.pullRequestId}`)
      ) {
        confidence += 0.8;
        evidence.prReference = true;
      }

      // Check author match
      if (evidence.authorMatch) {
        confidence += 0.2;
      }

      // Squash commits typically have only one parent (but we don't have parent info in CommitData)
      // Using merge flag as a proxy
      if (!commit.isMerge) {
        confidence += 0.1;
        evidence.singleParent = true;
      }

      if (confidence > 0.6) {
        associations.push({
          commitHash: commit.hash,
          confidence,
          method: 'squash-commit',
          metadata: {
            titleSimilarity: this.similarity(commit.message, pr.title),
            searchWindow,
            evidence,
          },
        });
      }
    }

    return associations;
  }

  /**
   * Strategy 3: Find commits by branch analysis
   */
  private async findByBranchAnalysis(pr: AzureDevOpsPullRequest): Promise<GitCommitAssociation[]> {
    const associations: GitCommitAssociation[] = [];

    // This would require more sophisticated Git branch analysis
    // For now, return empty array as this requires additional Git operations
    // In a full implementation, this would:
    // 1. Check if source branch exists in Git history
    // 2. Find commits unique to the source branch
    // 3. Match those commits to the PR timeframe

    logger.debug('Branch analysis strategy not fully implemented', {
      prId: pr.pullRequestId,
      sourceBranch: pr.sourceRefName,
      targetBranch: pr.targetRefName,
    });

    return associations;
  }

  /**
   * Strategy 4: Find commits by temporal and author matching
   */
  private async findByTemporalMatching(
    pr: AzureDevOpsPullRequest
  ): Promise<GitCommitAssociation[]> {
    const associations: GitCommitAssociation[] = [];

    // Get commits from the PR author around the PR timeframe
    const authorEmail = pr.createdBy.uniqueName || '';
    const authorCommits = this.gitCommitsByAuthor.get(authorEmail) || [];
    const searchWindow = this.getSearchWindow(pr, 7 * 24 * 60 * 60 * 1000); // 7 days

    for (const commit of authorCommits) {
      if (!this.isInTimeWindow(commit.date, searchWindow)) {
        continue;
      }

      let confidence = 0;
      const evidence: any = {
        timeWindow: this.calculateTimeDistance(commit.date, pr.creationDate),
        authorMatch: true,
      };

      // Time proximity scoring
      const creationDate = new Date(pr.creationDate);
      const timeDistance = Math.abs(commit.date.getTime() - creationDate.getTime());
      const maxDistance = 7 * 24 * 60 * 60 * 1000; // 7 days
      const timeScore = Math.max(0, 1 - timeDistance / maxDistance);
      confidence += timeScore * 0.5;

      // Message similarity scoring
      const messageSimilarity = Math.max(
        this.similarity(commit.message, pr.title),
        this.similarity(commit.message, pr.description || '')
      );
      confidence += messageSimilarity * 0.3;

      // File change patterns (placeholder - would need file analysis)
      confidence += 0.1;

      if (confidence > 0.3) {
        associations.push({
          commitHash: commit.hash,
          confidence,
          method: 'manual-link',
          metadata: {
            timeDistance,
            messageSimilarity,
            searchWindow,
            evidence,
          },
        });
      }
    }

    // Sort by confidence and return top matches
    return associations.sort((a, b) => b.confidence - a.confidence).slice(0, 5); // Limit to top 5 matches
  }

  /**
   * Get search time window for commit matching
   */
  private getSearchWindow(
    pr: AzureDevOpsPullRequest,
    windowMs = 3 * 24 * 60 * 60 * 1000
  ): { start: Date; end: Date } {
    const prDateRaw = pr.closedDate || pr.creationDate;
    const prDate = new Date(prDateRaw);
    return {
      start: new Date(prDate.getTime() - windowMs),
      end: new Date(prDate.getTime() + windowMs),
    };
  }

  /**
   * Check if date is within time window
   */
  private isInTimeWindow(date: Date, window: { start: Date; end: Date }): boolean {
    return date >= window.start && date <= window.end;
  }

  /**
   * Calculate time distance between two dates in milliseconds
   */
  private calculateTimeDistance(date1: Date, date2: Date | string): number {
    const d1 = date1 instanceof Date ? date1 : new Date(date1);
    const d2 = date2 instanceof Date ? date2 : new Date(date2);
    return Math.abs(d1.getTime() - d2.getTime());
  }

  /**
   * Check if Git commit author matches PR creator
   */
  private checkAuthorMatch(commit: CommitData, pr: AzureDevOpsPullRequest): boolean {
    // Try multiple matching strategies
    const commitEmail = commit.authorEmail.toLowerCase();
    const prEmail = (pr.createdBy.uniqueName || '').toLowerCase();
    const prDisplayName = pr.createdBy.displayName.toLowerCase();

    // Direct email match
    if (commitEmail === prEmail) {
      return true;
    }

    // Display name in commit author
    if (commit.author.toLowerCase().includes(prDisplayName)) {
      return true;
    }

    // Handle domain differences (e.g., internal vs external email)
    const commitEmailUser = commitEmail.split('@')[0];
    const prEmailUser = prEmail.split('@')[0];
    if (commitEmailUser === prEmailUser) {
      return true;
    }

    return false;
  }

  /**
   * Calculate string similarity (simple implementation)
   */
  private similarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;

    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}
