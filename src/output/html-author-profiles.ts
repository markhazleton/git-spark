/**
 * Author profile card generation for Git Spark HTML reports
 *
 * Exports standalone functions for rendering per-author detail sections including
 * profile cards, commit size charts, file type breakdowns, and insight summaries.
 */
import { escapeHtml, getWidthClass } from './html-utils.js';

export function generateDetailedAuthorProfiles(authors: any[]): string {
  const mergedAuthors = mergeAuthorsByEmail(authors);
  return mergedAuthors.map(author => generateAuthorProfileCard(author)).join('\n');
}

export function mergeAuthorsByEmail(authors: any[]): any[] {
  const emailMap = new Map<string, any>();

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
          existing.detailed.contribution.totalLines +=
            author.detailed.contribution.totalLines || 0;
          existing.detailed.contribution.avgCommitSize =
            existing.detailed.contribution.totalLines /
            existing.detailed.contribution.totalCommits;
        }

        if (
          author.detailed.workPattern &&
          (!existing.detailed.workPattern ||
            (author.detailed.workPattern.commits || 0) >
              (existing.detailed.workPattern.commits || 0))
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

export function generateAuthorProfileCard(author: any): string {
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

export function getTopDirectories(directoryFocus: any[]): string {
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

export function generateCommitSizeChart(distribution: any): string {
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

export function generateAuthorInsightsSection(metrics: any): string {
  const insights = metrics?.insights;

  if (!insights || (!insights.strengths?.length && !insights.growthAreas?.length)) {
    return '';
  }

  const strengths = insights.strengths || [];
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

export function generateFileTypeBreakdown(fileTypeBreakdown?: any): string {
  if (!fileTypeBreakdown || !fileTypeBreakdown.byExtension?.length) {
    return '<div class="file-type-breakdown"><h4>File Type Activity</h4><p>No file type data available</p></div>';
  }

  const { byExtension, categories } = fileTypeBreakdown;
  const pctFmt = (value: number) => `${value.toFixed(1)}%`;

  const topFileTypes = byExtension
    .slice(0, 5)
    .map(
      (ft: any) =>
        `<div class="file-type-item">
        <span class="file-extension">.${ft.extension}</span>
        <span class="file-percentage">${pctFmt(ft.percentage)}</span>
      </div>`
    )
    .join('');

  const categoryItems = Object.entries(categories)
    .filter(([_, stats]: [string, any]) => stats.files > 0)
    .sort((a: any, b: any) => b[1].files - a[1].files)
    .map(
      ([name, stats]: [string, any]) =>
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
