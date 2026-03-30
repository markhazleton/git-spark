/**
 * Author profile card generation for Git Spark HTML reports
 *
 * Exports standalone functions for rendering per-author detail sections including
 * profile cards, commit size charts, file type breakdowns, and insight summaries.
 */
import { escapeHtml, getWidthClass } from './html-utils.js';
import type { AuthorStats, AuthorDetailedMetrics } from '../types/author.js';
import type { FileTypeBreakdown } from '../types/file.js';

/**
 * Renders all author profile cards for the HTML report.
 * Merges authors by email before generating individual cards.
 *
 * @param authors - Array of author statistics from the analysis report
 * @returns HTML string containing all author profile cards
 */
export function generateDetailedAuthorProfiles(authors: AuthorStats[]): string {
  const mergedAuthors = mergeAuthorsByEmail(authors);
  return mergedAuthors.map(author => generateAuthorProfileCard(author)).join('\n');
}

/**
 * Merges author records that share the same email address (case-insensitive).
 * Aggregates commit counts, churn, and detailed metrics across all matching records.
 * Retains the most human-readable display name when duplicates differ.
 *
 * @param authors - Array of author statistics, potentially containing duplicate emails
 * @returns De-duplicated array of author statistics merged by normalised email
 */
export function mergeAuthorsByEmail(authors: AuthorStats[]): AuthorStats[] {
  const emailMap = new Map<string, AuthorStats>();

  for (const author of authors) {
    const normalizedEmail = author.email.toLowerCase();

    if (emailMap.has(normalizedEmail)) {
      const existing = emailMap.get(normalizedEmail)!;
      existing.commits += author.commits;
      existing.insertions += author.insertions;
      existing.deletions += author.deletions;
      existing.churn += author.churn;
      existing.filesChanged = Math.max(existing.filesChanged, author.filesChanged);
      existing.avgCommitSize = existing.churn / existing.commits;

      if (author.firstCommit < existing.firstCommit) {
        existing.firstCommit = author.firstCommit;
      }
      if (author.lastCommit > existing.lastCommit) {
        existing.lastCommit = author.lastCommit;
      }

      if (existing.detailed && author.detailed) {
        if (existing.detailed.contribution && author.detailed.contribution) {
          existing.detailed.contribution.totalCommits +=
            author.detailed.contribution.totalCommits || 0;
          // totalLines and avgCommitSize are runtime-computed properties not in AuthorContributionMetrics;
          // they are carried by the merge logic as extra denormalized fields.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const ec = existing.detailed.contribution as any;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const ac = author.detailed.contribution as any;
          ec.totalLines = (ec.totalLines ?? 0) + (ac.totalLines ?? 0);
          if (existing.detailed.contribution.totalCommits > 0) {
            ec.avgCommitSize = ec.totalLines / existing.detailed.contribution.totalCommits;
          }
        }

        if (
          author.detailed.workPattern &&
          (!existing.detailed.workPattern ||
            // commits is a runtime denormalized field on workPattern, not in AuthorWorkPatternMetrics
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ((author.detailed.workPattern as any).commits || 0) >
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ((existing.detailed.workPattern as any).commits || 0))
        ) {
          existing.detailed.workPattern = author.detailed.workPattern;
        }
      }

      if (
        author.name &&
        !author.name.includes('@') &&
        (existing.name.includes('@') || author.name.length > existing.name.length)
      ) {
        existing.name = author.name;
      }
    } else {
      const normalizedAuthor = { ...author, email: normalizedEmail };
      emailMap.set(normalizedEmail, normalizedAuthor);
    }
  }

  return Array.from(emailMap.values());
}

/**
 * Renders a single author profile card HTML section.
 * Includes observable activity metrics, commit timing patterns, file focus,
 * commit size distribution chart, and insights.
 *
 * @param author - Author statistics object with optional detailed metrics
 * @returns HTML string for one author profile card
 */
export function generateAuthorProfileCard(author: AuthorStats): string {
  const metrics = author.detailed;
  const authorId = escapeHtml(author.email.replace(/[^a-zA-Z0-9]/g, '-'));
  const numberFmt = (n: number) => new Intl.NumberFormat().format(n);
  const pctFmt = (n: number) => `${n.toFixed(1)}%`;
  const dateRange = `${author.firstCommit.toISOString().split('T')[0]} → ${author.lastCommit.toISOString().split('T')[0]}`;

  const contribution = metrics?.contribution || {};
  const workPattern = metrics?.workPattern || {};

  return `
    <div class="author-profile-card" id="author-${authorId}">
      <div class="author-header">
        <h3>${escapeHtml(author.name)}</h3>
        <span class="author-email">${escapeHtml(author.email)}</span>
        <div class="author-period">Active: ${dateRange} (${author.activeDays} days)</div>
      </div>

      <div class="contribution-overview">
        <h4>Observable Activity Metrics</h4>
        <div class="metrics-grid">
          <div class="metric-box">
            <div class="metric-value">${numberFmt(author.commits)}</div>
            <div class="metric-label">Commits</div>
          </div>
          <div class="metric-box">
            <div class="metric-value">${numberFmt(contribution.filesAndScope?.uniqueFiles || 0)}</div>
            <div class="metric-label">Files</div>
          </div>
          <div class="metric-box">
            <div class="metric-value">+${numberFmt(author.insertions)}</div>
            <div class="metric-label">Lines Added</div>
          </div>
          <div class="metric-box">
            <div class="metric-value">-${numberFmt(author.deletions)}</div>
            <div class="metric-label">Lines Deleted</div>
          </div>
          <div class="metric-box">
            <div class="metric-value">${numberFmt(author.churn)}</div>
            <div class="metric-label">Code Churn</div>
          </div>
        </div>
        <div class="summary-stats">
          Avg: ${author.avgCommitSize.toFixed(1)} lines/commit • 
          ${(contribution.filesAndScope?.avgFilesPerCommit || 0).toFixed(1)} files/commit • 
          ${(contribution.commitFrequency || 0).toFixed(2)} commits/day
        </div>
      </div>

      <div class="commit-patterns">
        <h4>Commit Timing Patterns</h4>
        <div class="pattern-info">
          <p><strong>⚠️ Note:</strong> Timing patterns reflect when commits were made, not actual working hours or availability.</p>
          <div>Most Active Day: <strong>${workPattern.commitTiming?.mostActiveDay?.day || 'N/A'}</strong> (${pctFmt(workPattern.commitTiming?.mostActiveDay?.percentage || 0)} of commits)</div>
          <div>Most Active Time: <strong>${workPattern.commitTiming?.mostActiveTime?.timeRange || 'N/A'}</strong></div>
          <div>Weekend Commits: <strong>${pctFmt(workPattern.workLifeBalance?.weekendPercentage || 0)}</strong></div>
          <div>After-Hours Commits: <strong>${pctFmt(workPattern.workLifeBalance?.afterHoursPercentage || 0)}</strong></div>
        </div>
      </div>

      <div class="code-focus">
        <h4>File Activity Focus</h4>
        <div class="focus-info">
          <div>Primary Directories: ${getTopDirectories(contribution.filesAndScope?.directoryFocus || [])}</div>
          <div>Repository Coverage: ${pctFmt(contribution.filesAndScope?.fileDiversityScore || 0)} of total files</div>
          <div>Source Code Changes: +${numberFmt(contribution.filesAndScope?.sourceVsPublishedRatio?.sourceLines?.insertions || 0)} / 
          -${numberFmt(contribution.filesAndScope?.sourceVsPublishedRatio?.sourceLines?.deletions || 0)} 
          (${numberFmt(contribution.filesAndScope?.sourceVsPublishedRatio?.sourceCommits || 0)} commits)</div>
        </div>

        ${generateFileTypeBreakdown(contribution.filesAndScope?.fileTypeBreakdown)}
      </div>

      <div class="commit-distribution">
        <h4>Commit Size Distribution</h4>
        <div class="size-distribution">
          ${generateCommitSizeChart(contribution.commitSizeDistribution || {})}
        </div>
      </div>

      <div class="activity-details">
        <h4>Activity Details</h4>
        <div class="activity-content">
          ${
            contribution.largestCommitDetails?.size > 0
              ? `
          <div class="largest-commit">
            <strong>Largest Single Change:</strong> ${numberFmt(contribution.largestCommitDetails.size)} lines 
            (${contribution.largestCommitDetails.hash.substring(0, 7)}) on 
            ${contribution.largestCommitDetails.date.toLocaleDateString()}<br>
            <em>"${escapeHtml(contribution.largestCommitDetails.message)}"</em>
          </div>`
              : ''
          }
          
          <div class="activity-summary">
            <p><strong>Activity Summary:</strong> This author contributed ${numberFmt(author.commits)} commits over ${author.activeDays} active days, 
            changing ${numberFmt(contribution.filesAndScope?.uniqueFiles || 0)} unique files with an average of 
            ${author.avgCommitSize.toFixed(1)} lines per commit.</p>
          </div>
        </div>
      </div>

      ${generateAuthorInsightsSection(metrics)}
    </div>`;
}

/**
 * Formats the top three directory focus entries as a readable comma-separated string.
 * Scales percentages to sum to 100% when the top-three total exceeds that value.
 * Appends an "others" bucket when the top three do not account for all activity.
 *
 * @param directoryFocus - Ordered array of directory/percentage pairs from author analysis
 * @returns Human-readable string such as "src/core/ (60%), src/utils/ (25%), others (15%)"
 */
export function getTopDirectories(directoryFocus: Array<{ directory: string; percentage: number }>): string {
  if (!directoryFocus || directoryFocus.length === 0) return 'N/A';

  let topDirectories = directoryFocus.slice(0, 3);
  let totalPercentage = topDirectories.reduce((sum, d) => sum + d.percentage, 0);

  if (totalPercentage > 100) {
    const scaleFactor = 100 / totalPercentage;
    topDirectories = topDirectories.map(d => ({
      ...d,
      percentage: d.percentage * scaleFactor,
    }));
    totalPercentage = 100;
  }

  const result = topDirectories.map(d => `${d.directory}/ (${d.percentage.toFixed(0)}%)`);

  if (totalPercentage < 100 && directoryFocus.length > 3) {
    const othersPercentage = 100 - totalPercentage;
    result.push(`others (${othersPercentage.toFixed(0)}%)`);
  }

  return result.join(', ');
}

/**
 * Renders a proportional bar chart for commit size distribution as an HTML string.
 * Each bar's width reflects the percentage of commits in that size bucket.
 *
 * @param distribution - Commit size bucket counts (micro/small/medium/large/veryLarge); all fields are optional
 * @returns HTML string containing the bar chart, or a "No data available" placeholder
 */
export function generateCommitSizeChart(
  distribution: Partial<{ micro: number; small: number; medium: number; large: number; veryLarge: number }>
): string {
  const total =
    (distribution.micro || 0) +
    (distribution.small || 0) +
    (distribution.medium || 0) +
    (distribution.large || 0) +
    (distribution.veryLarge || 0);

  if (total === 0) return '<div class="no-data">No data available</div>';

  const bars = [
    { label: 'Micro (&lt;20)', count: distribution.micro || 0, class: 'micro' },
    { label: 'Small (20-50)', count: distribution.small || 0, class: 'small' },
    { label: 'Medium (51-200)', count: distribution.medium || 0, class: 'medium' },
    { label: 'Large (201-500)', count: distribution.large || 0, class: 'large' },
    { label: 'Very Large (&gt;500)', count: distribution.veryLarge || 0, class: 'very-large' },
  ];

  return bars
    .map(bar => {
      const percentage = total > 0 ? (bar.count / total) * 100 : 0;
      const hasData = bar.count > 0;
      const barWidth = hasData ? Math.max(percentage, 1) : 0;
      const widthClass = getWidthClass(barWidth);

      return `
        <div class="size-bar">
          <div class="size-label">${bar.label}</div>
          <div class="size-bar-container">
            <div class="size-bar-fill ${bar.class} ${widthClass}" ${hasData ? `data-actual="${percentage.toFixed(1)}"` : ''}></div>
            <span class="size-percentage ${hasData ? 'has-data' : 'no-data'}">${bar.count} (${percentage.toFixed(1)}%)</span>
          </div>
        </div>`;
    })
    .join('');
}

/**
 * Renders the observable patterns and insights section for an author profile.
 * Returns an empty string when no insights data is available.
 *
 * @param metrics - Detailed author metrics object; accepts null or undefined gracefully
 * @returns HTML string for the insights section, or empty string if no insights exist
 */
export function generateAuthorInsightsSection(metrics: AuthorDetailedMetrics | null | undefined): string {
  const insights = metrics?.insights;

  if (!insights || (!insights.positivePatterns?.length && !insights.growthAreas?.length)) {
    return '';
  }

  const strengths = insights.positivePatterns || [];
  const growthAreas = insights.growthAreas || [];

  return `
      <div class="insights-section">
        <h4>Observable Patterns & Insights</h4>
        <div class="insights-content">
          ${
            strengths.length > 0
              ? `
          <div class="insight-category">
            <h5>Strengths</h5>
            <ul>
              ${strengths.map((strength: string) => `<li>${escapeHtml(strength)}</li>`).join('')}
            </ul>
          </div>`
              : ''
          }
          
          ${
            growthAreas.length > 0
              ? `
          <div class="insight-category">
            <h5>Growth Areas</h5>
            <ul>
              ${growthAreas.map((area: string) => `<li>${escapeHtml(area)}</li>`).join('')}
            </ul>
          </div>`
              : ''
          }
        </div>
        
        <div class="limitation-notice">
          <strong>⚠️ Pattern Recognition:</strong> These insights are derived from Git commit patterns only and represent observable behaviors, not performance evaluations or personal assessments.
        </div>
      </div>`;
}

/**
 * Renders a file type activity breakdown table for an author profile.
 * Shows the top five file extensions and a category summary.
 *
 * @param fileTypeBreakdown - File type breakdown data; returns placeholder when absent
 * @returns HTML string for the file type activity section
 */
export function generateFileTypeBreakdown(fileTypeBreakdown?: FileTypeBreakdown): string {
  if (!fileTypeBreakdown || !fileTypeBreakdown.byExtension?.length) {
    return '<div class="file-type-breakdown"><h4>File Type Activity</h4><p>No file type data available</p></div>';
  }

  const { byExtension, categories } = fileTypeBreakdown;
  const pctFmt = (value: number) => `${value.toFixed(1)}%`;

  const topFileTypes = byExtension
    .slice(0, 5)
    .map(
      ft =>
        `<div class="file-type-item">
        <span class="file-extension">.${ft.extension}</span>
        <span class="file-percentage">${pctFmt(ft.percentage)}</span>
      </div>`
    )
    .join('');

  const categoryItems = Object.entries(categories)
    .filter(([, stats]) => stats.files > 0)
    .sort((a, b) => b[1].files - a[1].files)
    .map(
      ([name, stats]) =>
        `<div class="category-item">
          <div class="category-name">${name.charAt(0).toUpperCase() + name.slice(1)}</div>
          <div class="category-percentage">${pctFmt(stats.percentage)}</div>
        </div>`
    )
    .join('');

  return `
      <div class="file-type-breakdown">
        <h4>File Type Activity</h4>
        <div class="file-type-categories">
          ${categoryItems}
        </div>
        <div class="file-type-extensions">
          <h5>Top File Extensions</h5>
          <div class="extensions-grid">
            ${topFileTypes}
          </div>
        </div>
      </div>
    `;
}
