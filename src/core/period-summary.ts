import { CommitData } from '../types/index.js';
import { PeriodSummary } from '../types/periods.js';

/**
 * Summarize commit activity for a single period.
 *
 * @param commits - Commits already filtered to fall within [startDate, endDate)
 */
export function summarizePeriod(
  commits: CommitData[],
  startDate: Date,
  endDate: Date,
  label: string
): PeriodSummary {
  const insertions = commits.reduce((sum, c) => sum + c.insertions, 0);
  const deletions = commits.reduce((sum, c) => sum + c.deletions, 0);
  const filesChanged = new Set(commits.flatMap(c => c.files.map(f => f.path))).size;
  const activeAuthors = new Set(commits.map(c => c.authorEmail)).size;

  return {
    label,
    startDate,
    endDate,
    commits: commits.length,
    insertions,
    deletions,
    churn: insertions + deletions,
    netLines: insertions - deletions,
    filesChanged,
    activeAuthors,
  };
}

/**
 * Divide commits into `periods` consecutive, non-overlapping windows of
 * `periodDays` each, ending at `endDate`. Oldest period first.
 */
export function bucketIntoPeriods(
  commits: CommitData[],
  periodDays: number,
  periods: number,
  endDate: Date
): PeriodSummary[] {
  const dayMs = 24 * 60 * 60 * 1000;
  const summaries: PeriodSummary[] = [];

  for (let i = 0; i < periods; i += 1) {
    const periodsFromEnd = periods - i;
    const startDate = new Date(endDate.getTime() - periodsFromEnd * periodDays * dayMs);
    const windowEndDate = new Date(endDate.getTime() - (periodsFromEnd - 1) * periodDays * dayMs);

    const periodCommits = commits.filter(
      c => c.date.getTime() >= startDate.getTime() && c.date.getTime() < windowEndDate.getTime()
    );

    summaries.push(summarizePeriod(periodCommits, startDate, windowEndDate, `Period ${i + 1}`));
  }

  return summaries;
}
