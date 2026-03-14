import {
  CommitData,
  DailyTrendsData,
  DailyTrendsMetadata,
  DailyFlowMetrics,
  DailyStabilityMetrics,
  DailyOwnershipMetrics,
  DailyCouplingMetrics,
  DailyHygieneMetrics,
  ProgressCallback,
} from '../types/index.js';
import { createLogger } from '../utils/logger.js';
import {
  toLocalDate,
  percentile,
  isOutOfHours,
  buildFileHistory,
  getAuthorsInWindow,
  createLimitations,
  generateContributionsGraph,
  calculateRetouchRate,
  generateDateRange,
} from './daily-trends-helpers.js';

const logger = createLogger('daily-trends');

/**
 * Daily trends analyzer for Git repository activity patterns
 *
 * Computes comprehensive daily trending metrics exclusively from Git commit data.
 * All metrics are objective, observable patterns with no speculation about
 * team performance, code quality, or individual productivity.
 *
 * Key principles:
 * - Git-only data sources (no external APIs or tools)
 * - Objective measurements only (no subjective interpretation)
 * - Transparent limitations documentation
 * - Timezone-aware day grouping
 */
export class DailyTrendsAnalyzer {
  private readonly timezone: string;
  private readonly workingHours: { start: number; end: number; weekdays: boolean };
  private readonly retouchDays: number = 14; // Days to look back for retouch analysis

  constructor(
    timezone: string = 'America/Chicago',
    workingHours: { start: number; end: number; weekdays: boolean } = {
      start: 8,
      end: 18,
      weekdays: true,
    }
  ) {
    this.timezone = timezone;
    this.workingHours = workingHours;
  }

  /**
   * Analyze daily trends from commit data
   *
   * @param commits - All commits to analyze
   * @param progressCallback - Optional progress reporting
   * @param analysisRange - Optional date range to analyze (includes days with zero commits)
   * @returns Complete daily trends analysis
   */
  public async analyzeDailyTrends(
    commits: CommitData[],
    progressCallback?: ProgressCallback,
    analysisRange?: { startDate: Date; endDate: Date }
  ): Promise<DailyTrendsData> {
    logger.info('Starting daily trends analysis', {
      totalCommits: commits.length,
      timezone: this.timezone,
      analysisRange,
    });

    if (commits.length === 0 && !analysisRange) {
      return this.createEmptyTrendsData();
    }

    // Progress tracking
    const reportProgress = (phase: string, current: number, total: number) => {
      progressCallback?.(phase, current, total);
    };

    // Group commits by local date
    reportProgress('Grouping commits by date', 0, 5);
    const commitsByDay = this.groupCommitsByDay(commits);

    // Determine date range - use analysisRange if provided, otherwise use commit dates
    let startDate: Date;
    let endDate: Date;
    let allDays: string[];

    if (analysisRange) {
      startDate = analysisRange.startDate;
      endDate = analysisRange.endDate;
      // Generate all days in the range, including days with zero commits
      allDays = generateDateRange(startDate, endDate);
    } else {
      const commitDays = Array.from(commitsByDay.keys()).sort();
      if (commitDays.length === 0) {
        return this.createEmptyTrendsData();
      }
      startDate = new Date(commitDays[0]);
      endDate = new Date(commitDays[commitDays.length - 1]);
      allDays = commitDays;
    }

    const totalDays = allDays.length;
    const activeDays = Array.from(commitsByDay.keys()).length;

    const metadata: DailyTrendsMetadata = {
      timezone: this.timezone,
      startDate,
      endDate,
      totalDays,
      activeDays,
      workingHours: this.workingHours,
    };

    // Analyze each metric category
    reportProgress('Calculating flow metrics', 1, 5);
    const flowMetrics = this.calculateFlowMetrics(commitsByDay, allDays);

    reportProgress('Calculating stability metrics', 2, 5);
    const stabilityMetrics = this.calculateStabilityMetrics(commitsByDay, allDays);

    reportProgress('Calculating ownership metrics', 3, 5);
    const ownershipMetrics = this.calculateOwnershipMetrics(commitsByDay, allDays, commits);

    reportProgress('Calculating coupling metrics', 4, 5);
    const couplingMetrics = this.calculateCouplingMetrics(commitsByDay, allDays);

    reportProgress('Calculating hygiene metrics', 5, 5);
    const hygieneMetrics = this.calculateHygieneMetrics(commitsByDay, allDays);

    // Generate contributions graph
    const contributionsGraph = generateContributionsGraph(commitsByDay, startDate, endDate);

    const limitations = createLimitations();

    logger.info('Daily trends analysis completed', {
      daysAnalyzed: allDays.length,
      totalDays,
      activeDays,
    });

    return {
      analysisMetadata: metadata,
      flowMetrics,
      stabilityMetrics,
      ownershipMetrics,
      couplingMetrics,
      hygieneMetrics,
      contributionsGraph,
      limitations,
    };
  }

  /**
   * Group commits by local calendar day
   */
  private groupCommitsByDay(commits: CommitData[]): Map<string, CommitData[]> {
    const commitsByDay = new Map<string, CommitData[]>();

    for (const commit of commits) {
      // Convert to local timezone and extract day
      const localDate = toLocalDate(commit.date, this.timezone);
      const dayKey = localDate.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!commitsByDay.has(dayKey)) {
        commitsByDay.set(dayKey, []);
      }
      commitsByDay.get(dayKey)!.push(commit);
    }

    return commitsByDay;
  }

  /**
   * Calculate daily flow and throughput metrics
   */
  private calculateFlowMetrics(
    commitsByDay: Map<string, CommitData[]>,
    allDays: string[]
  ): DailyFlowMetrics[] {
    return allDays.map(day => {
      const commits = commitsByDay.get(day) || [];
      const date = new Date(day);

      // Basic counts
      const commitsPerDay = commits.length;
      const uniqueAuthors = new Set(commits.map(c => c.authorEmail)).size;

      // Line changes
      const insertionsPerDay = commits.reduce((sum, c) => sum + c.insertions, 0);
      const deletionsPerDay = commits.reduce((sum, c) => sum + c.deletions, 0);
      const grossLinesChangedPerDay = insertionsPerDay + deletionsPerDay;

      // Files touched
      const allFiles = new Set<string>();
      commits.forEach(c => c.files.forEach(f => allFiles.add(f.path)));
      const filesTouchedPerDay = allFiles.size;

      // Commit size distribution
      const commitSizes = commits.map(c => c.insertions + c.deletions).sort((a, b) => a - b);
      const p50 = percentile(commitSizes, 50);
      const p90 = percentile(commitSizes, 90);

      return {
        date,
        day,
        commitsPerDay,
        uniqueAuthorsPerDay: uniqueAuthors,
        grossLinesChangedPerDay,
        insertionsPerDay,
        deletionsPerDay,
        filesTouchedPerDay,
        commitSizeDistribution: { p50, p90 },
      };
    });
  }

  /**
   * Calculate daily stability and risk metrics
   */
  private calculateStabilityMetrics(
    commitsByDay: Map<string, CommitData[]>,
    allDays: string[]
  ): DailyStabilityMetrics[] {
    return allDays.map(day => {
      const commits = commitsByDay.get(day) || [];
      const date = new Date(day);

      // Reverts (commits with 'revert' in message - case insensitive)
      const revertsPerDay = commits.filter(c => c.message.toLowerCase().includes('revert')).length;

      // Merge ratio
      const mergeCommits = commits.filter(c => c.isMerge).length;
      const mergeRatioPerDay = commits.length > 0 ? mergeCommits / commits.length : 0;

      // Retouch rate - files changed today that were also changed in last K days
      // Note: This is a simplified calculation - in full implementation would need
      // access to historical file changes across the full commit set
      const retouchRate = calculateRetouchRate(commits, commitsByDay, day, this.retouchDays);

      // Renames (simplified - count file status changes)
      const renamesPerDay = commits.reduce((count, c) => {
        return count + c.files.filter(f => f.status === 'renamed').length;
      }, 0);

      // Out of hours share
      const outOfHoursCommits = commits.filter(c =>
        isOutOfHours(c.date, this.timezone, this.workingHours)
      ).length;
      const outOfHoursShare = commits.length > 0 ? outOfHoursCommits / commits.length : 0;

      return {
        date,
        day,
        revertsPerDay,
        mergeRatioPerDay,
        retouchRate,
        renamesPerDay,
        outOfHoursShare,
      };
    });
  }

  /**
   * Calculate daily ownership and knowledge metrics
   */
  private calculateOwnershipMetrics(
    commitsByDay: Map<string, CommitData[]>,
    allDays: string[],
    allCommits: CommitData[]
  ): DailyOwnershipMetrics[] {
    // Build file history for ownership analysis
    const fileHistory = buildFileHistory(allCommits);

    return allDays.map(day => {
      const commits = commitsByDay.get(day) || [];
      const date = new Date(day);

      // Files touched today
      const filesTouchedToday = new Set<string>();
      commits.forEach(c => c.files.forEach(f => filesTouchedToday.add(f.path)));

      // New files created (first appearance in history)
      const newFilesCreatedPerDay = commits.reduce((count, c) => {
        return count + c.files.filter(f => f.status === 'added').length;
      }, 0);

      // Single owner files analysis (files with only 1 author in trailing 90 days)
      const dayDate = new Date(day);
      const lookbackDate = new Date(dayDate.getTime() - 90 * 24 * 60 * 60 * 1000);

      let singleOwnerFilesTouched = 0;
      let totalAuthorsAcrossFiles = 0;

      for (const filePath of filesTouchedToday) {
        const authorsInWindow = getAuthorsInWindow(filePath, lookbackDate, dayDate, fileHistory);
        if (authorsInWindow.size === 1) {
          singleOwnerFilesTouched++;
        }
        totalAuthorsAcrossFiles += authorsInWindow.size;
      }

      const filesTouchedTodayCount = filesTouchedToday.size;
      const singleOwnerShare =
        filesTouchedTodayCount > 0 ? singleOwnerFilesTouched / filesTouchedTodayCount : 0;
      const avgAuthorsPerFile =
        filesTouchedTodayCount > 0 ? totalAuthorsAcrossFiles / filesTouchedTodayCount : 0;

      return {
        date,
        day,
        newFilesCreatedPerDay,
        singleOwnerFilesTouched,
        filesTouchedToday: filesTouchedTodayCount,
        singleOwnerShare,
        avgAuthorsPerFile,
      };
    });
  }

  /**
   * Calculate daily architectural coupling metrics
   */
  private calculateCouplingMetrics(
    commitsByDay: Map<string, CommitData[]>,
    allDays: string[]
  ): DailyCouplingMetrics[] {
    return allDays.map(day => {
      const commits = commitsByDay.get(day) || [];
      const date = new Date(day);

      let totalCoChangePairs = 0;
      let multiFileCommits = 0;

      for (const commit of commits) {
        const fileCount = commit.files.length;
        if (fileCount > 1) {
          multiFileCommits++;
          // Calculate pairs: n choose 2 = n * (n-1) / 2
          const pairs = (fileCount * (fileCount - 1)) / 2;
          totalCoChangePairs += pairs;
        }
      }

      const coChangeDensityPerDay = commits.length > 0 ? totalCoChangePairs / commits.length : 0;

      return {
        date,
        day,
        coChangeDensityPerDay,
        totalCoChangePairs,
        multiFileCommits,
      };
    });
  }

  /**
   * Calculate daily hygiene and documentation metrics
   */
  private calculateHygieneMetrics(
    commitsByDay: Map<string, CommitData[]>,
    allDays: string[]
  ): DailyHygieneMetrics[] {
    return allDays.map(day => {
      const commits = commitsByDay.get(day) || [];
      const date = new Date(day);

      // Message lengths
      const messageLengths = commits
        .map(c => (c.subject + ' ' + c.body).length)
        .sort((a, b) => a - b);
      const medianCommitMessageLength = percentile(messageLengths, 50);

      // Short messages (less than 20 characters - arbitrary but reasonable threshold)
      const shortMessages = commits.filter(c => c.subject.length < 20).length;

      // Conventional commits (basic pattern detection)
      const conventionalCommits = commits.filter(c =>
        /^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .+/.test(c.subject)
      ).length;

      return {
        date,
        day,
        medianCommitMessageLength,
        shortMessages,
        conventionalCommits,
      };
    });
  }

  /**
   * Create empty trends data for repositories with no commits
   */
  private createEmptyTrendsData() {
    const now = new Date();
    return {
      analysisMetadata: {
        timezone: this.timezone,
        startDate: now,
        endDate: now,
        totalDays: 0,
        activeDays: 0,
        workingHours: this.workingHours,
      },
      flowMetrics: [],
      stabilityMetrics: [],
      ownershipMetrics: [],
      couplingMetrics: [],
      hygieneMetrics: [],
      contributionsGraph: {
        calendar: [],
        maxCommits: 0,
        totalCommits: 0,
        weeks: [],
      },
      limitations: createLimitations(),
    };
  }
}
