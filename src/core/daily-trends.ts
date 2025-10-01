import {
  CommitData,
  DailyTrendsData,
  DailyTrendsMetadata,
  DailyFlowMetrics,
  DailyStabilityMetrics,
  DailyOwnershipMetrics,
  DailyCouplingMetrics,
  DailyHygieneMetrics,
  DailyTrendsLimitations,
  ContributionGraphData,
  ContributionDay,
  ContributionWeek,
  ProgressCallback,
} from '../types';
import { createLogger } from '../utils/logger';

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
      allDays = this.generateDateRange(startDate, endDate);
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
    const contributionsGraph = this.generateContributionsGraph(commitsByDay, startDate, endDate);

    const limitations = this.createLimitations();

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
      const localDate = this.toLocalDate(commit.date);
      const dayKey = localDate.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!commitsByDay.has(dayKey)) {
        commitsByDay.set(dayKey, []);
      }
      commitsByDay.get(dayKey)!.push(commit);
    }

    return commitsByDay;
  }

  /**
   * Convert UTC date to local timezone date
   */
  private toLocalDate(utcDate: Date): Date {
    // For simplicity, using local system timezone
    // In production, would use proper timezone library like date-fns-tz
    return new Date(utcDate.toLocaleString('en-US', { timeZone: this.timezone }));
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
      const p50 = this.percentile(commitSizes, 50);
      const p90 = this.percentile(commitSizes, 90);

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
      const retouchRate = this.calculateRetouchRate(commits, commitsByDay, day);

      // Renames (simplified - count file status changes)
      const renamesPerDay = commits.reduce((count, c) => {
        return count + c.files.filter(f => f.status === 'renamed').length;
      }, 0);

      // Out of hours share
      const outOfHoursCommits = commits.filter(c => this.isOutOfHours(c.date)).length;
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
    const fileHistory = this.buildFileHistory(allCommits);

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
        const authorsInWindow = this.getAuthorsInWindow(
          filePath,
          lookbackDate,
          dayDate,
          fileHistory
        );
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
      const medianCommitMessageLength = this.percentile(messageLengths, 50);

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
   * Calculate percentile value from sorted array
   */
  private percentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
  }

  /**
   * Check if commit timestamp is outside working hours
   */
  private isOutOfHours(commitDate: Date): boolean {
    const localDate = this.toLocalDate(commitDate);
    const hour = localDate.getHours();
    const dayOfWeek = localDate.getDay(); // 0 = Sunday, 6 = Saturday

    // Check weekend if weekdays only
    if (this.workingHours.weekdays && (dayOfWeek === 0 || dayOfWeek === 6)) {
      return true;
    }

    // Check hours
    return hour < this.workingHours.start || hour >= this.workingHours.end;
  }

  /**
   * Calculate retouch rate for a given day
   * Simplified implementation - in full version would need complete file history
   */
  private calculateRetouchRate(
    todayCommits: CommitData[],
    commitsByDay: Map<string, CommitData[]>,
    today: string
  ): number {
    const todayFiles = new Set<string>();
    todayCommits.forEach(c => c.files.forEach(f => todayFiles.add(f.path)));

    if (todayFiles.size === 0) return 0;

    // Look back K days
    const todayDate = new Date(today);
    const lookbackDays = this.retouchDays;
    let retouchedFiles = 0;

    for (const filePath of todayFiles) {
      // Check if this file was changed in the last K days
      for (let i = 1; i <= lookbackDays; i++) {
        const checkDate = new Date(todayDate.getTime() - i * 24 * 60 * 60 * 1000);
        const checkDay = checkDate.toISOString().split('T')[0];
        const dayCommits = commitsByDay.get(checkDay) || [];

        const fileChangedOnDay = dayCommits.some(c => c.files.some(f => f.path === filePath));

        if (fileChangedOnDay) {
          retouchedFiles++;
          break; // Found it, move to next file
        }
      }
    }

    return retouchedFiles / todayFiles.size;
  }

  /**
   * Build file history for ownership analysis
   */
  private buildFileHistory(
    commits: CommitData[]
  ): Map<string, Array<{ date: Date; author: string }>> {
    const fileHistory = new Map<string, Array<{ date: Date; author: string }>>();

    for (const commit of commits) {
      for (const file of commit.files) {
        if (!fileHistory.has(file.path)) {
          fileHistory.set(file.path, []);
        }
        fileHistory.get(file.path)!.push({
          date: commit.date,
          author: commit.authorEmail,
        });
      }
    }

    // Sort each file's history by date
    for (const [, history] of fileHistory) {
      history.sort((a, b) => a.date.getTime() - b.date.getTime());
    }

    return fileHistory;
  }

  /**
   * Get unique authors for a file within a date window
   */
  private getAuthorsInWindow(
    filePath: string,
    startDate: Date,
    endDate: Date,
    fileHistory: Map<string, Array<{ date: Date; author: string }>>
  ): Set<string> {
    const history = fileHistory.get(filePath) || [];
    const authors = new Set<string>();

    for (const entry of history) {
      if (entry.date >= startDate && entry.date <= endDate) {
        authors.add(entry.author);
      }
    }

    return authors;
  }

  /**
   * Create limitations documentation
   */
  private createLimitations(): DailyTrendsLimitations {
    return {
      dataSource: 'git-commit-history-only',
      timezoneWarnings: [
        'Commit timestamps reflect when commits were made, not actual working hours',
        'Timezone conversion is based on system locale or specified timezone',
        'Authors may work across multiple timezones',
        'Commit timing does not indicate work-life balance or overtime',
      ],
      calculationMethods: {
        'retouch-rate': 'Files changed today that were also changed within last 14 days',
        'single-owner': 'Files with only one author in trailing 90-day window',
        'out-of-hours': 'Commits outside configured working hours (default: 8am-6pm Mon-Fri)',
        'co-change-density': 'Average number of file pairs changed together per commit',
        'conventional-commits': 'Basic pattern matching for conventional commit format',
      },
      knownLimitations: [
        'No access to code review data, pull request workflows, or approval processes',
        'Cannot determine actual working hours, time zones, or availability',
        'File ownership based on commit authorship only, not actual responsibility',
        'Revert detection based on commit message content only',
        'No integration with issue tracking, CI/CD, or deployment systems',
        'Commit timing affected by development workflows and git strategies',
        'Cannot distinguish between code quality, bug fixes, or feature work',
      ],
      recommendedSupplementalData: [
        'Code review metrics from GitHub/GitLab/Azure DevOps APIs',
        'Issue tracking data for work item correlation',
        'CI/CD pipeline data for deployment and build metrics',
        'Code quality metrics from static analysis tools',
        'Test coverage data from testing frameworks',
        'Team structure and timezone information from HR systems',
        'Actual working hours and calendar data',
      ],
    };
  }

  /**
   * Generate GitHub-style contributions graph data
   */
  private generateContributionsGraph(
    commitsByDay: Map<string, CommitData[]>,
    startDate: Date,
    endDate: Date
  ): ContributionGraphData {
    const calendar: ContributionDay[] = [];
    const weeks: ContributionWeek[] = [];
    let totalCommits = 0;
    let maxCommits = 0;

    // Generate all days in the range
    const current = new Date(startDate);
    const currentWeek: ContributionDay[] = [];
    let weekNumber = this.getWeekNumber(current);

    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const commits = commitsByDay.get(dateStr) || [];
      const count = commits.length;

      totalCommits += count;
      maxCommits = Math.max(maxCommits, count);

      // Calculate intensity level (0-4) based on commit count
      const intensity = this.calculateIntensity(count, maxCommits);

      const dayOfWeek = current.getDay() === 0 ? 7 : current.getDay(); // Convert Sunday=0 to Sunday=7

      const contributionDay: ContributionDay = {
        date: dateStr,
        count,
        intensity,
        dayOfWeek,
      };

      calendar.push(contributionDay);
      currentWeek.push(contributionDay);

      // Check if we need to start a new week (start of new week or end of data)
      const nextDate = new Date(current);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextWeekNumber = this.getWeekNumber(nextDate);

      if (nextWeekNumber !== weekNumber || nextDate > endDate) {
        weeks.push({
          weekNumber,
          days: [...currentWeek],
        });
        currentWeek.length = 0;
        weekNumber = nextWeekNumber;
      }

      current.setDate(current.getDate() + 1);
    }

    // Recalculate intensities now that we know the max
    for (const day of calendar) {
      day.intensity = this.calculateIntensity(day.count, maxCommits);
    }

    return {
      calendar,
      maxCommits,
      totalCommits,
      weeks,
    };
  }

  /**
   * Calculate intensity level (0-4) for contribution color coding
   */
  private calculateIntensity(count: number, maxCount: number): number {
    if (count === 0) return 0;
    if (maxCount === 0) return 0;

    const ratio = count / maxCount;
    if (ratio >= 0.75) return 4;
    if (ratio >= 0.5) return 3;
    if (ratio >= 0.25) return 2;
    return 1;
  }

  /**
   * Get ISO week number for a date
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  /**
   * Generate array of date strings for a date range (inclusive)
   */
  private generateDateRange(startDate: Date, endDate: Date): string[] {
    const dates: string[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      dates.push(current.toISOString().split('T')[0]); // YYYY-MM-DD format
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  /**
   * Create empty trends data for repositories with no commits
   */
  private createEmptyTrendsData(): DailyTrendsData {
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
      limitations: this.createLimitations(),
    };
  }
}
