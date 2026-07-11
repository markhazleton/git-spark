/**
 * Summary of commit activity for a single fixed-length period.
 */
export interface PeriodSummary {
  label: string;
  startDate: Date;
  endDate: Date;
  commits: number;
  insertions: number;
  deletions: number;
  /** insertions + deletions */
  churn: number;
  /** insertions - deletions */
  netLines: number;
  filesChanged: number;
  activeAuthors: number;
}

/**
 * Multi-period churn/activity comparison report.
 */
export interface PeriodsReport {
  repoPath: string;
  periodDays: number;
  periodCount: number;
  generatedAt: Date;
  periods: PeriodSummary[];
}

export type PeriodsOutputFormat = 'console' | 'markdown' | 'html';
