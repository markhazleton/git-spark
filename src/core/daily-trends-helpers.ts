/**
 * Helper utilities for daily trends analysis
 * Extracted helpers for date handling, calculations, and data structures
 */

import { CommitData, DailyTrendsLimitations, ContributionGraphData, ContributionDay, ContributionWeek } from '../types/index.js';

/**
 * Convert UTC date to local timezone date
 */
export function toLocalDate(utcDate: Date, timezone: string): Date {
  // For simplicity, using local system timezone
  // In production, would use proper timezone library like date-fns-tz
  return new Date(utcDate.toLocaleString('en-US', { timeZone: timezone }));
}

/**
 * Calculate percentile value from sorted array
 */
export function percentile(sortedArray: number[], percentileValue: number): number {
  if (sortedArray.length === 0) return 0;
  const index = Math.ceil((percentileValue / 100) * sortedArray.length) - 1;
  return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
}

/**
 * Check if commit timestamp is outside working hours
 */
export function isOutOfHours(
  commitDate: Date,
  timezone: string,
  workingHours: { start: number; end: number; weekdays: boolean }
): boolean {
  const localDate = toLocalDate(commitDate, timezone);
  const hour = localDate.getHours();
  const dayOfWeek = localDate.getDay(); // 0 = Sunday, 6 = Saturday

  // Check weekend if weekdays only
  if (workingHours.weekdays && (dayOfWeek === 0 || dayOfWeek === 6)) {
    return true;
  }

  // Check hours
  return hour < workingHours.start || hour >= workingHours.end;
}

/**
 * Build file history for ownership analysis
 */
export function buildFileHistory(
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
export function getAuthorsInWindow(
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
export function createLimitations(): DailyTrendsLimitations {
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
 * Calculate intensity level (0-4) for contribution color coding
 */
export function calculateIntensity(count: number, maxCount: number): number {
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
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Generate array of date strings for a date range (inclusive)
 */
export function generateDateRange(startDate: Date, endDate: Date): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    dates.push(current.toISOString().split('T')[0]); // YYYY-MM-DD format
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Generate GitHub-style contributions graph data
 */
export function generateContributionsGraph(
  commitsByDay: Map<string, CommitData[]>,
  _startDate: Date,
  _endDate: Date
): ContributionGraphData {
  const calendar: ContributionDay[] = [];
  const weeks: ContributionWeek[] = [];
  let totalCommits = 0;
  let maxCommits = 0;

  // Find actual range of commits (first commit to last commit)
  const commitDates = Array.from(commitsByDay.keys())
    .filter(date => commitsByDay.get(date)!.length > 0)
    .sort();

  if (commitDates.length === 0) {
    // No commits, return empty calendar
    return {
      calendar: [],
      maxCommits: 0,
      totalCommits: 0,
      weeks: [],
    };
  }

  // Use actual commit range instead of requested analysis range
  const actualStartDate = new Date(commitDates[0]);
  const actualEndDate = new Date(commitDates[commitDates.length - 1]);

  // Generate calendar only for the actual commit range
  const current = new Date(actualStartDate);
  const currentWeek: ContributionDay[] = [];
  let weekNumber = getWeekNumber(current);

  while (current <= actualEndDate) {
    const dateStr = current.toISOString().split('T')[0];
    const commits = commitsByDay.get(dateStr) || [];
    const count = commits.length;

    totalCommits += count;
    maxCommits = Math.max(maxCommits, count);

    // Calculate intensity level (0-4) based on commit count
    let intensity = calculateIntensity(count, maxCommits);

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
    const nextWeekNumber = getWeekNumber(nextDate);

    if (nextWeekNumber !== weekNumber || nextDate > actualEndDate) {
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
    day.intensity = calculateIntensity(day.count, maxCommits);
  }

  return {
    calendar,
    maxCommits,
    totalCommits,
    weeks,
  };
}

/**
 * Calculate retouch rate for a given day
 * Simplified implementation - in full version would need complete file history
 */
export function calculateRetouchRate(
  todayCommits: CommitData[],
  commitsByDay: Map<string, CommitData[]>,
  today: string,
  retouchDays: number = 14
): number {
  const todayFiles = new Set<string>();
  todayCommits.forEach(c => c.files.forEach(f => todayFiles.add(f.path)));

  if (todayFiles.size === 0) return 0;

  // Look back K days
  const todayDate = new Date(today);
  let retouchedFiles = 0;

  for (const filePath of todayFiles) {
    // Check if this file was changed in the last K days
    for (let i = 1; i <= retouchDays; i++) {
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
