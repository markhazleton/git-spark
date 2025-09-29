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

    const warnings: string[] = [];

    const gitOptions: { since?: string; until?: string; branch?: string; author?: string } = {};
    if (options.since) gitOptions.since = options.since;
    if (options.until) gitOptions.until = options.until;
    if (options.branch) gitOptions.branch = options.branch;
    if (options.author) gitOptions.author = options.author;

    const totalCommits = await this.git.getCommitCount(gitOptions);
    logger.info(`Collecting up to ${totalCommits} commits (streaming)`, { options });

    // Build streaming git log command with safe delimiters
    // Use unit separator (0x1F) for fields and record separator (0x1E) for commits
    const args: string[] = [
      'log',
      '--no-merges',
      '--numstat',
      `--pretty=format:%H%x1f%h%x1f%an%x1f%ae%x1f%ai%x1f%s%x1f%b%x1f%P%x1e`,
    ];
    if (gitOptions.since) args.push(`--since=${gitOptions.since}`);
    if (gitOptions.until) args.push(`--until=${gitOptions.until}`);
    if (gitOptions.author) args.push(`--author=${gitOptions.author}`);
    if (options.path) args.push('--', options.path);
    if (gitOptions.branch) args.push(gitOptions.branch);

    const spawn = require('child_process').spawn;
    const child = spawn('git', args, { cwd: (this.git as any).repoPath });

    const commits: CommitData[] = [];
    let buffer = '';
    let processed = 0;
    let currentCommit: Partial<CommitData> | null = null;

    const finalizeCurrent = () => {
      if (currentCommit && currentCommit.hash) {
        const finalized = this.finalizeCommit(currentCommit);
        commits.push(finalized);
        currentCommit = null;
      }
    };

    child.stdout.on('data', (chunk: Buffer) => {
      buffer += chunk.toString();
      // Split on record separator (0x1E)
      let idx;
      while ((idx = buffer.indexOf('\x1e')) !== -1) {
        const record = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);
        if (!record.trim()) continue;
        // A commit record begins with header line then numstat lines until blank line
        const lines = record.split('\n');
        const header = lines.shift();
        if (!header) continue;
        const parts = header.split('\x1f');
        if (parts.length < 8) {
          warnings.push('Malformed commit header encountered');
          continue;
        }
        currentCommit = this.parseCommitHeader(parts);
        // Remaining lines could contain numstat entries
        for (const l of lines) {
          if (!l.trim()) continue;
          const fileChange = this.parseFileStats(l);
          if (fileChange) {
            currentCommit.files = currentCommit.files || [];
            currentCommit.files.push(fileChange);
          }
        }
        finalizeCurrent();
        processed++;
        if (processed % 200 === 0 || processed === totalCommits) {
          const pct = totalCommits ? Math.min(100, Math.round((processed / totalCommits) * 70)) : 0;
          this.reportProgress('Streaming commit collection', pct, 100);
        }
      }
    });

    await new Promise<void>((resolve, reject) => {
      child.on('error', (e: Error) => reject(e));
      child.on('close', () => {
        // Flush remaining buffer (rare, if no trailing separator)
        if (buffer.trim()) {
          const tailRecords = buffer.split('\x1e').filter(Boolean);
          for (const rec of tailRecords) {
            const lines = rec.split('\n');
            const header = lines.shift();
            if (!header) continue;
            const parts = header.split('\x1f');
            if (parts.length < 8) continue;
            currentCommit = this.parseCommitHeader(parts);
            for (const l of lines) {
              if (!l.trim()) continue;
              const fc = this.parseFileStats(l);
              if (fc) {
                currentCommit.files = currentCommit.files || [];
                currentCommit.files.push(fc);
              }
            }
            finalizeCurrent();
          }
        }
        resolve();
      });
    });

    this.reportProgress('Enhancing commits', 80, 100);
    for (let i = 0; i < commits.length; i++) {
      try {
        commits[i] = await this.enhanceCommit(commits[i]);
      } catch (e: any) {
        warnings.push(`Enhancement failed for ${commits[i].hash}: ${e.message || 'unknown'}`);
      }
      if (i % 250 === 0) {
        const pct = 80 + Math.min(15, Math.round((i / commits.length) * 15));
        this.reportProgress('Enhancing commits', pct, 100);
      }
    }
    this.reportProgress('Commit collection complete', 100, 100);
    if (warnings.length) {
      logger.warn(`Completed with ${warnings.length} warnings`);
    }
    return commits;
  }

  // Legacy parseCommitLog removed in favor of streaming parser above

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
