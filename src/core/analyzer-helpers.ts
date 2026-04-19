/**
 * Helper utility functions for Git analyzer calculations
 * Pure functions for temporal analysis, consistency scoring, and pattern detection
 */

import { CommitData } from '../types/index.js';

/**
 * Calculate the longest streak of active days (with up to 2-day gaps allowed)
 *
 * @param commits - Sorted commit data
 * @returns Longest consecutive active days
 */
export function calculateLongestStreak(commits: CommitData[]): number {
  if (commits.length === 0) return 0;

  const sorted = [...commits].sort((a, b) => a.date.getTime() - b.date.getTime());
  const uniqueDates = [...new Set(sorted.map(c => c.date.toDateString()))];

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = new Date(uniqueDates[i - 1]);
    const currDate = new Date(uniqueDates[i]);
    const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays <= 2) {
      // Allow up to 2-day gaps
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
}

/**
 * Detect commit bursts (4+ commits within 5-minute windows)
 *
 * @param sortedCommits - Commits sorted chronologically
 * @returns Array of burst detection results
 */
export function detectCommitBursts(
  sortedCommits: CommitData[]
): Array<{ date: Date; commitCount: number; timeSpan: string }> {
  const bursts = [];
  const timeWindow = 5 * 60 * 1000; // 5 minutes

  let burstStart = 0;

  for (let i = 1; i < sortedCommits.length; i++) {
    const timeDiff = sortedCommits[i].date.getTime() - sortedCommits[i - 1].date.getTime();

    if (timeDiff > timeWindow) {
      if (i - burstStart >= 4) {
        // 4+ commits in burst
        const burstCommits = i - burstStart;
        const startTime = sortedCommits[burstStart].date;
        const endTime = sortedCommits[i - 1].date;
        const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60); // minutes

        bursts.push({
          date: startTime,
          commitCount: burstCommits,
          timeSpan: `${duration.toFixed(1)} minutes`,
        });
      }
      burstStart = i;
    }
  }

  return bursts;
}

/**
 * Calculate gaps between commits (periods > 1 day)
 *
 * @param sortedCommits - Commits sorted chronologically
 * @returns Array of gap information
 */
export function calculateCommitGaps(
  sortedCommits: CommitData[]
): Array<{ days: number; startDate: Date; endDate: Date }> {
  const gaps = [];

  for (let i = 1; i < sortedCommits.length; i++) {
    const prevDate = sortedCommits[i - 1].date;
    const currDate = sortedCommits[i].date;
    const gapDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

    if (gapDays > 1) {
      gaps.push({
        days: Math.round(gapDays),
        startDate: prevDate,
        endDate: currDate,
      });
    }
  }

  return gaps;
}

/**
 * Calculate consistency score (0-100) based on commit regularity
 *
 * @param commits - Author's commits
 * @param activeDays - Total active days in period
 * @returns Consistency score percentage
 */
export function calculateConsistencyScore(commits: CommitData[], activeDays: number): number {
  if (commits.length === 0 || activeDays === 0) return 0;

  const daysWithCommits = new Set(commits.map(c => c.date.toDateString())).size;
  const consistencyRatio = daysWithCommits / activeDays;

  // Factor in regularity of commit frequency
  const expectedCommitsPerActiveDay = commits.length / daysWithCommits;
  const frequencyConsistency = Math.min(expectedCommitsPerActiveDay / 5, 1); // normalize to max 5 commits/day

  return Math.min((consistencyRatio * 0.6 + frequencyConsistency * 0.4) * 100, 100);
}

/**
 * Calculate velocity trend based on commit rate changes
 *
 * @param sortedCommits - Commits sorted chronologically
 * @returns Trend direction: increasing, stable, or decreasing
 */
export function calculateVelocityTrend(
  sortedCommits: CommitData[]
): 'increasing' | 'stable' | 'decreasing' {
  if (sortedCommits.length < 10) return 'stable';

  const midpoint = Math.floor(sortedCommits.length / 2);
  const firstHalf = sortedCommits.slice(0, midpoint);
  const secondHalf = sortedCommits.slice(midpoint);

  const firstHalfDays =
    (firstHalf[firstHalf.length - 1].date.getTime() - firstHalf[0].date.getTime()) /
    (1000 * 60 * 60 * 24);
  const secondHalfDays =
    (secondHalf[secondHalf.length - 1].date.getTime() - secondHalf[0].date.getTime()) /
    (1000 * 60 * 60 * 24);

  const firstHalfRate = firstHalfDays > 0 ? firstHalf.length / firstHalfDays : 0;
  const secondHalfRate = secondHalfDays > 0 ? secondHalf.length / secondHalfDays : 0;

  const change = (secondHalfRate - firstHalfRate) / Math.max(firstHalfRate, 0.1);

  if (change > 0.2) return 'increasing';
  if (change < -0.2) return 'decreasing';
  return 'stable';
}

/**
 * Detect vacation breaks (gaps of 7+ days)
 *
 * @param sortedCommits - Commits sorted chronologically
 * @returns Array of vacation break periods
 */
export function detectVacationBreaks(
  sortedCommits: CommitData[]
): Array<{ startDate: Date; endDate: Date; days: number }> {
  const gaps = calculateCommitGaps(sortedCommits);
  return gaps
    .filter(gap => gap.days >= 7)
    .map(gap => ({
      startDate: gap.startDate,
      endDate: gap.endDate,
      days: gap.days,
    }));
}
