import { CommitData, FileChange, GitSparkOptions, ProgressCallback } from '../types/index.js';
import { GitExecutor } from '../utils/git.js';
import { validateGitOptions } from '../utils/input-validation.js';
import { createLogger } from '../utils/logger.js';
import { expandRenamePath, unquoteGitPath } from './git-paths.js';
// import { validateCommitMessage } from '../utils/validation.js';

const logger = createLogger('collector');

/** A file entry from `git log --raw`: Git's change status and the full old/new paths. */
interface RawChange {
  status: FileChange['status'];
  path: string;
  oldPath?: string;
}

/** Git raw status letters. Type changes (T) and anything unrecognized count as modified. */
const RAW_STATUS: Record<string, FileChange['status']> = {
  A: 'added',
  M: 'modified',
  D: 'deleted',
  R: 'renamed',
  C: 'copied',
  T: 'modified',
};

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
  private lastWarnings: string[] = [];
  private repoPath: string;

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
    this.repoPath = repoPath;
    this.git = new GitExecutor(repoPath);
    this.progressCallback = progressCallback;
  }

  /**
   * Get the repository path
   * @returns The absolute path to the Git repository
   */
  getRepositoryPath(): string {
    return this.repoPath;
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

    // Get the first commit date in the repository to cap the analysis range
    const firstCommitDate = await this.git.getFirstCommitDate(options.branch);
    logger.debug(`Repository first commit date: ${firstCommitDate?.toISOString() || 'null'}`);

    // Derive since date from --days if user supplied days but not an explicit since
    if (!options.since && options.days && options.days > 0) {
      const d = new Date();
      d.setDate(d.getDate() - options.days);
      // Use ISO date (no time) to let git interpret midnight boundary
      options.since = d.toISOString().split('T')[0];
      logger.debug(`Calculated since date from --days=${options.days}: ${options.since}`);
    }

    // Cap the analysis range to repository lifetime
    if (options.since && firstCommitDate) {
      const requestedStartDate = new Date(options.since);
      logger.debug(
        `Comparing dates: requested=${requestedStartDate.toISOString()}, firstCommit=${firstCommitDate.toISOString()}`
      );
      if (requestedStartDate < firstCommitDate) {
        // Start one day before the first commit, as a full UTC timestamp: git reads a
        // bare YYYY-MM-DD as that date at the current time of day, which drops recent
        // commits whenever the local and UTC dates differ
        const adjustedDate = new Date(firstCommitDate);
        adjustedDate.setDate(adjustedDate.getDate() - 1);
        options.since = adjustedDate.toISOString();
        logger.info(
          `Analysis start date is before repository first commit. Adjusting range to start from ${options.since}.`
        );
      }
    }

    const gitOptions: { since?: string; until?: string; branch?: string; author?: string } = {};
    if (options.since) gitOptions.since = options.since;
    if (options.until) gitOptions.until = options.until;
    if (options.branch) gitOptions.branch = options.branch;
    if (options.author) gitOptions.author = options.author;

    const totalCommits = await this.git.getCommitCount(gitOptions);
    logger.info(`Collecting up to ${totalCommits} commits (streaming)`, { options });

    // Build streaming git log command with safe delimiters
    // Use unit separator (0x1F) for fields and record separator (0x1E) for commits
    // Validate and sanitize all input parameters to prevent command injection
    const gitParams: Record<string, string> = {};
    if (gitOptions.since) gitParams.since = gitOptions.since;
    if (gitOptions.until) gitParams.until = gitOptions.until;
    if (gitOptions.author) gitParams.author = gitOptions.author;
    if (gitOptions.branch) gitParams.branch = gitOptions.branch;
    if (options.path) gitParams.path = options.path;

    const validation = validateGitOptions(gitParams);

    if (!validation.isValid) {
      throw new Error(`Invalid Git parameters: ${validation.errors.join(', ')}`);
    }

    const safeOptions = validation.sanitized!;

    // We prefix each commit with a record separator so we can split reliably even for large bodies.
    // Format: \x1e<fields...> then raw lines, then numstat lines; the next commit begins with \x1e.
    // --raw supplies Git's own change status and full old/new paths (numstat abbreviates renames
    // as `dir/{old => new}/file`); numstat supplies line counts in the same file order.
    // core.quotePath=false keeps non-ASCII filenames readable instead of octal-escaped.
    const args: string[] = [
      '-c',
      'core.quotePath=false',
      'log',
      '--no-merges',
      '--raw',
      '--numstat',
      `--pretty=format:%x1e%H%x1f%h%x1f%an%x1f%ae%x1f%ai%x1f%s%x1f%b%x1f%P`,
    ];

    if (safeOptions.since) args.push('--since', safeOptions.since);
    if (safeOptions.until) args.push('--until', safeOptions.until);
    if (safeOptions.author) args.push('--author', safeOptions.author);
    // The revision must come before `--`; anything after it is read as a pathspec.
    if (safeOptions.branch) args.push(safeOptions.branch);
    if (safeOptions.path) args.push('--', safeOptions.path);

    const { spawn } = await import('child_process');
    const child = spawn('git', args, { cwd: this.repoPath });

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

    // Parse one \x1e-delimited record. Returns false when the record is still incomplete.
    // The header has 8 \x1f-separated fields (hash..parents); the body (%b) may contain
    // newlines, so the header ends at the first newline after the 7th separator, not the
    // first newline in the record. Numstat lines follow the header.
    const processRecord = (record: string, isFinal: boolean): boolean => {
      let sepIdx = -1;
      let sepCount = 0;
      for (let i = 0; i < record.length; i++) {
        if (record.charCodeAt(i) === 0x1f && ++sepCount === 7) {
          sepIdx = i;
          break;
        }
      }
      if (sepIdx === -1) {
        if (isFinal) warnings.push('Malformed commit header encountered (insufficient fields)');
        return isFinal;
      }

      let headerEnd = record.indexOf('\n', sepIdx + 1);
      if (headerEnd === -1) {
        // Parents field not terminated yet; at end of stream the record ends here
        if (!isFinal) return false;
        headerEnd = record.length;
      }

      currentCommit = this.parseCommitHeader(record.slice(0, headerEnd).split('\x1f'));
      const rawEntries: RawChange[] = [];
      const statEntries: FileChange[] = [];
      for (const rawLine of record.slice(headerEnd + 1).split('\n')) {
        const line = rawLine.replace(/\r$/, '');
        if (!line.trim()) continue;
        if (line.startsWith(':')) {
          const raw = this.parseRawLine(line);
          if (raw) rawEntries.push(raw);
          continue;
        }
        const fileChange = this.parseFileStats(line);
        if (fileChange) statEntries.push(fileChange);
      }
      currentCommit.files = this.mergeFileChanges(
        rawEntries,
        statEntries,
        currentCommit.hash || '',
        warnings
      );
      finalizeCurrent();
      processed++;
      if (processed % 200 === 0 || processed === totalCommits) {
        const pct = totalCommits ? Math.min(100, Math.round((processed / totalCommits) * 70)) : 0;
        this.reportProgress('Streaming commit collection', pct, 100);
      }
      return true;
    };

    // Decode as a stream so a multi-byte UTF-8 character split across chunks stays intact
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      buffer += chunk;
      // Split on record separator (each commit starts with \x1e)
      const records = buffer.split('\x1e');
      buffer = records.pop() || '';
      for (const record of records) {
        if (!record.trim()) continue;
        if (!processRecord(record, false)) {
          // Incomplete record - re-buffer until more data arrives
          buffer = '\x1e' + record + buffer;
        }
      }
    });

    await new Promise<void>((resolve, reject) => {
      child.on('error', (e: Error) => reject(e));
      child.on('close', () => {
        // The last record (the oldest commit) has no following \x1e, so it is still buffered
        for (const record of buffer.split('\x1e')) {
          if (record.trim()) processRecord(record, true);
        }
        resolve();
      });
    });

    this.reportProgress('Enhancing commits', 80, 100);
    for (let i = 0; i < commits.length; i++) {
      try {
        commits[i] = await this.enhanceCommit(commits[i]);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'unknown';
        warnings.push(`Enhancement failed for ${commits[i].hash}: ${message}`);
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
    this.lastWarnings = warnings.slice();
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

  /**
   * Parse a `--raw` line: `:<srcmode> <dstmode> <srcsha> <dstsha> <status>[score]\t<path>[\t<path>]`.
   * Renames and copies carry the old path then the new path.
   */
  private parseRawLine(line: string): RawChange | null {
    const tab = line.indexOf('\t');
    if (tab === -1) return null;
    const meta = line.slice(1, tab).split(' ');
    const code = meta[4]?.charAt(0);
    if (!code) return null;
    const paths = line
      .slice(tab + 1)
      .split('\t')
      .map(p => unquoteGitPath(p));

    const status = RAW_STATUS[code] ?? 'modified';
    if ((status === 'renamed' || status === 'copied') && paths.length >= 2) {
      return { status, path: paths[1], oldPath: paths[0] };
    }
    return { status, path: paths[0] };
  }

  /**
   * Parse a `--numstat` line for its line counts. The path is only used as a fallback when raw
   * entries are unavailable; rename forms (`old => new`, `dir/{old => new}/file`) are expanded.
   */
  private parseFileStats(line: string): FileChange | null {
    const match = line.match(/^(\d+|-)\t(\d+|-)\t(.+)$/);
    if (!match) return null;

    const [, insertions, deletions, path] = match;

    // Binary files report '-' for both counts
    const ins = insertions === '-' ? 0 : parseInt(insertions, 10);
    const dels = deletions === '-' ? 0 : parseInt(deletions, 10);

    const rename = expandRenamePath(path);
    const result: FileChange = {
      path: rename ? rename.path : unquoteGitPath(path),
      insertions: ins,
      deletions: dels,
      status: rename ? 'renamed' : 'modified',
    };
    if (rename) result.oldPath = rename.oldPath;
    return result;
  }

  /**
   * Combine Git's raw entries (status and paths) with numstat entries (line counts). Git emits
   * both for the same files in the same order. If the counts ever disagree, keep the numstat
   * entries, whose status is limited to renamed/modified, and record a warning.
   */
  private mergeFileChanges(
    rawEntries: RawChange[],
    statEntries: FileChange[],
    hash: string,
    warnings: string[]
  ): FileChange[] {
    if (rawEntries.length !== statEntries.length) {
      if (statEntries.length > 0) {
        warnings.push(
          `File status unavailable for ${hash.slice(0, 7)}: ${rawEntries.length} raw vs ${statEntries.length} numstat entries`
        );
      }
      return statEntries;
    }
    return statEntries.map((stat, i) => {
      const raw = rawEntries[i];
      const merged: FileChange = {
        path: raw.path,
        insertions: stat.insertions,
        deletions: stat.deletions,
        status: raw.status,
      };
      if (raw.oldPath) merged.oldPath = raw.oldPath;
      return merged;
    });
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

  async getGitVersion(): Promise<string> {
    return this.git.getVersion();
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

  /**
   * Get warnings from the most recent collection run
   */
  getWarnings(): string[] {
    return this.lastWarnings.slice();
  }
}
