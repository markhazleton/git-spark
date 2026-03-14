/**
 * File-related types for git-spark
 * Contains metrics and analytics for files and file changes
 */

export interface FileChange {
  path: string;
  insertions: number;
  deletions: number;
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied';
  oldPath?: string;
}

export interface FileStats {
  path: string;
  commits: number;
  authors: string[];
  churn: number;
  insertions: number;
  deletions: number;
  firstChange: Date;
  lastChange: Date;
  riskScore: number;
  hotspotScore: number;
  ownership: { [author: string]: number };
  language?: string;
  size?: number;
}

export interface FileTypeBreakdown {
  /** File types by extension with activity metrics */
  byExtension: Array<{
    extension: string;
    language: string;
    commits: number;
    files: number;
    churn: number;
    percentage: number;
  }>;
  /** Summary categories */
  categories: {
    sourceCode: { files: number; commits: number; churn: number; percentage: number };
    documentation: { files: number; commits: number; churn: number; percentage: number };
    configuration: { files: number; commits: number; churn: number; percentage: number };
    tests: { files: number; commits: number; churn: number; percentage: number };
    other: { files: number; commits: number; churn: number; percentage: number };
  };
  /** Total activity for percentage calculations */
  totals: {
    files: number;
    commits: number;
    churn: number;
  };
}
