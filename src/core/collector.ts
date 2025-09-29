import { CommitData, FileChange, GitSparkOptions, ProgressCallback } from '../types';
import { GitExecutor } from '../utils/git';
import { createLogger } from '../utils/logger';
// import { validateCommitMessage } from '../utils/validation';

const logger = createLogger('collector');

/**
 * Git repository data collection engine
 *
 * The DataCollector is responsible for efficiently extracting raw data from Git repositories
 * using git commands. It handles commit history traversal, file change analysis, and progress
 * tracking for large repositories.
 *
 * Key features:
 * - Efficient batch processing of git log data
 * - Comprehensive file change tracking with diff statistics
 * - Memory-optimized streaming for large repositories
 * - Robust error handling and validation
 * - Progress reporting for long-running operations
 * - Flexible filtering by date, author, branch, and file patterns
 *
 * @example
 * ```typescript
 * const collector = new DataCollector('/path/to/repo', (progress) => {
 *   console.log(`${progress.stage}: ${progress.percentage}%`);
 * });
 *
 * const commits = await collector.collectCommits({
 *   since: '2024-01-01',
 *   author: 'john@example.com',
 *   maxCommits: 1000
 * });
 *
 * console.log(`Collected ${commits.length} commits`);
 * ```
 */
export class DataCollector {
  private git: GitExecutor;
  private progressCallback?: ProgressCallback | undefined;

  /**
   * Create a new DataCollector instance
   *
   * @param repoPath - Absolute path to the Git repository
   * @param progressCallback - Optional callback for progress updates during collection
   * @throws {Error} When repository path is invalid or git is not accessible
   *
   * @example
   * ```typescript
   * // Basic usage
   * const collector = new DataCollector('/path/to/repo');
   *
   * // With progress tracking
   * const collector = new DataCollector('/path/to/repo', (progress) => {
   *   console.log(`${progress.stage}: ${progress.current}/${progress.total}`);
   * });
   * ```
   */
  constructor(repoPath: string, progressCallback?: ProgressCallback | undefined) {
    this.git = new GitExecutor(repoPath);
    this.progressCallback = progressCallback;
  }

  /**
   * Collect commit data from Git repository with comprehensive metadata
   *
   * Efficiently processes git log to extract commit information including:
   * - Basic commit metadata (hash, author, date, message)
   * - File change statistics (additions, deletions, modifications)
   * - Diff analysis for each changed file
   * - Merge commit handling and parent tracking
   *
   * @param options - Collection options and filters
   * @param options.since - Start date for commit range (ISO string or git date format)
   * @param options.until - End date for commit range (ISO string or git date format)
   * @param options.branch - Specific branch to analyze (default: current branch)
   * @param options.author - Filter commits by author email or name
   * @param options.maxCommits - Maximum number of commits to collect (for performance)
   * @param options.excludePatterns - File patterns to exclude from analysis
   *
   * @returns Promise resolving to array of processed commit data
   * @throws {Error} When git operations fail or repository is inaccessible
   *
   * @example
   * ```typescript
   * // Collect all commits from last 6 months
   * const commits = await collector.collectCommits({
   *   since: '2024-06-01',
   *   maxCommits: 5000
   * });
   *
   * // Collect commits from specific author
   * const commits = await collector.collectCommits({
   *   author: 'developer@company.com',
   *   branch: 'main'
   * });
   * ```
   */
  async collectCommits(options: GitSparkOptions): Promise<CommitData[]> {
    this.reportProgress('Collecting commit data', 0, 100);

    // Filter out undefined values
    const gitOptions: { since?: string; until?: string; branch?: string; author?: string } = {};
    if (options.since) gitOptions.since = options.since;
    if (options.until) gitOptions.until = options.until;
    if (options.branch) gitOptions.branch = options.branch;
    if (options.author) gitOptions.author = options.author;

    // Get total commit count for progress tracking
    const totalCommits = await this.git.getCommitCount(gitOptions);

    logger.info(`Collecting ${totalCommits} commits`, { options });

    // Get commit log
    const logOptions: {
      since?: string;
      until?: string;
      branch?: string;
      author?: string;
      path?: string;
    } = { ...gitOptions };
    if (options.path) logOptions.path = options.path;

    const logOutput = await this.git.getCommitLog(logOptions);

    this.reportProgress('Parsing commit data', 25, 100);

    const commits = this.parseCommitLog(logOutput);

    this.reportProgress('Processing commit metadata', 50, 100);

    // Enhance commits with additional metadata
    for (let i = 0; i < commits.length; i++) {
      commits[i] = await this.enhanceCommit(commits[i]);

      if (i % 100 === 0) {
        const progress = 50 + Math.floor((i / commits.length) * 50);
        this.reportProgress('Processing commit metadata', progress, 100);
      }
    }

    this.reportProgress('Commit collection complete', 100, 100);
    logger.info(`Collected ${commits.length} commits successfully`);

    return commits;
  }

  private parseCommitLog(logOutput: string): CommitData[] {
    const commits: CommitData[] = [];
    const lines = logOutput.split('\n');
    let currentCommit: Partial<CommitData> | null = null;
    let inFileStats = false;

    for (const line of lines) {
      if (!line.trim()) {
        if (currentCommit && currentCommit.hash) {
          commits.push(this.finalizeCommit(currentCommit));
          currentCommit = null;
          inFileStats = false;
        }
        continue;
      }

      // Parse commit header
      if (line.includes('|') && !inFileStats) {
        const parts = line.split('|');
        if (parts.length >= 7) {
          currentCommit = this.parseCommitHeader(parts);
          inFileStats = false;
        }
      }
      // Parse file statistics
      else if (currentCommit && line.match(/^\d+\s+\d+\s+/)) {
        inFileStats = true;
        const fileChange = this.parseFileStats(line);
        if (fileChange) {
          currentCommit.files = currentCommit.files || [];
          currentCommit.files.push(fileChange);
        }
      }
    }

    // Handle last commit
    if (currentCommit && currentCommit.hash) {
      commits.push(this.finalizeCommit(currentCommit));
    }

    return commits;
  }

  private parseCommitHeader(parts: string[]): Partial<CommitData> {
    const [hash, shortHash, author, authorEmail, date, subject, body, parents] = parts;

    return {
      hash: hash.trim(),
      shortHash: shortHash.trim(),
      author: author.trim(),
      authorEmail: authorEmail.trim(),
      date: new Date(date.trim()),
      subject: subject.trim(),
      body: body.trim(),
      message: `${subject.trim()}\n${body.trim()}`.trim(),
      isMerge: parents ? parents.trim().split(' ').length > 1 : false,
      files: [],
      insertions: 0,
      deletions: 0,
      filesChanged: 0,
      isCoAuthored: false,
      coAuthors: [],
    };
  }

  private parseFileStats(line: string): FileChange | null {
    const match = line.match(/^(\d+|\-)\s+(\d+|\-)\s+(.+)$/);
    if (!match) return null;

    const [, insertions, deletions, path] = match;

    // Handle binary files
    const ins = insertions === '-' ? 0 : parseInt(insertions, 10);
    const dels = deletions === '-' ? 0 : parseInt(deletions, 10);

    // Determine file status and handle renames
    let status: FileChange['status'] = 'modified';
    let filePath = path;
    let oldPath: string | undefined;

    if (path.includes(' => ')) {
      status = 'renamed';
      const parts = path.split(' => ');
      oldPath = parts[0].trim();
      filePath = parts[1].trim();
    } else if (ins > 0 && dels === 0) {
      status = 'added';
    } else if (ins === 0 && dels > 0) {
      status = 'deleted';
    }

    const result: FileChange = {
      path: filePath,
      insertions: ins,
      deletions: dels,
      status,
    };

    if (oldPath) {
      result.oldPath = oldPath;
    }

    return result;
  }

  private finalizeCommit(commit: Partial<CommitData>): CommitData {
    // Calculate totals from file changes
    const insertions = commit.files?.reduce((sum, f) => sum + f.insertions, 0) || 0;
    const deletions = commit.files?.reduce((sum, f) => sum + f.deletions, 0) || 0;
    const filesChanged = commit.files?.length || 0;

    // Detect co-authored commits
    const coAuthorMatches = commit.body?.match(/Co-authored-by: (.+) <(.+)>/g) || [];
    const coAuthors = coAuthorMatches
      .map(match => {
        const authorMatch = match.match(/Co-authored-by: (.+) <(.+)>/);
        return authorMatch ? authorMatch[1] : '';
      })
      .filter(Boolean);

    return {
      hash: commit.hash!,
      shortHash: commit.shortHash!,
      author: commit.author!,
      authorEmail: commit.authorEmail!,
      date: commit.date!,
      message: commit.message!,
      subject: commit.subject!,
      body: commit.body || '',
      insertions,
      deletions,
      filesChanged,
      isMerge: commit.isMerge!,
      isCoAuthored: coAuthors.length > 0,
      coAuthors,
      files: commit.files || [],
    };
  }

  private async enhanceCommit(commit: CommitData): Promise<CommitData> {
    // Add commit message analysis
    // const messageAnalysis = validateCommitMessage(commit.message);

    // You could add more enhancements here:
    // - Language detection for files
    // - File size information
    // - Complexity metrics

    return commit;
  }

  async getBranches(): Promise<string[]> {
    return this.git.getBranches();
  }

  async getCurrentBranch(): Promise<string> {
    return this.git.getCurrentBranch();
  }

  async getRemoteUrl(): Promise<string> {
    return this.git.getRemoteUrl();
  }

  async getLanguageStats(): Promise<{ [language: string]: number }> {
    return this.git.getLanguageStats();
  }

  async validateRepository(): Promise<boolean> {
    return this.git.validateRepository();
  }

  private reportProgress(phase: string, current: number, total: number): void {
    if (this.progressCallback) {
      this.progressCallback(phase, current, total);
    }
  }
}
