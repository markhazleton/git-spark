/**
 * Daily trends, contribution calendar, SVG charts, and current-state section
 * generation for Git Spark HTML reports.
 *
 * Orchestration functions live here; chart and table renderers are in
 * html-daily-trends-charts.ts and html-daily-trends-tables.ts respectively.
 */
import { escapeHtml } from './html-utils.js';
import {
  generateContributionsGraphSection,
  generateCommitTrendChart,
  generateAuthorTrendChart,
  generateVolumeSparklines,
} from './html-daily-trends-charts.js';
import {
  generateFlowTrendsTable,
  generateStabilityTrendsTable,
  generateOwnershipTrendsTable,
  generateCouplingTrendsTable,
  generateHygieneTrendsTable,
} from './html-daily-trends-tables.js';

export {
  generateContributionsGraphSection,
  generateCommitTrendChart,
  generateAuthorTrendChart,
  generateVolumeSparklines,
  generateFlowTrendsTable,
  generateStabilityTrendsTable,
  generateOwnershipTrendsTable,
  generateCouplingTrendsTable,
  generateHygieneTrendsTable,
};

export function generateActivityVisualsForTeamPatterns(trends: any): string {
  const dateFormat = (date: Date) => date.toISOString().split('T')[0];

  const metadata = trends.analysisMetadata;
  const flowMetrics = trends.flowMetrics || [];
  const stabilityMetrics = trends.stabilityMetrics || [];

  const totalCommits = flowMetrics.reduce((sum: number, day: any) => sum + day.commitsPerDay, 0);
  const peakDay = flowMetrics.reduce(
    (peak: any, day: any) => (day.commitsPerDay > (peak?.commitsPerDay || 0) ? day : peak),
    null
  );
  const avgCommitsPerDay = flowMetrics.length > 0 ? totalCommits / flowMetrics.length : 0;

  const totalReverts = stabilityMetrics.reduce(
    (sum: number, day: any) => sum + day.revertsPerDay,
    0
  );

  return `
      <!-- Activity Period Overview -->
      <div class="trends-overview">
        <h3>Analysis Period Overview</h3>
        <div class="trends-summary-grid">
          <div class="trend-summary-card">
            <div class="summary-metric">
              <div class="metric-value">${metadata.activeDays}</div>
              <div class="metric-label">Active Days</div>
              <div class="metric-detail">out of ${metadata.totalDays} total days</div>
            </div>
          </div>
          <div class="trend-summary-card">
            <div class="summary-metric">
              <div class="metric-value">${avgCommitsPerDay.toFixed(1)}</div>
              <div class="metric-label">Avg Commits/Day</div>
              <div class="metric-detail">across active days</div>
            </div>
          </div>
          <div class="trend-summary-card">
            <div class="summary-metric">
              <div class="metric-value">${peakDay ? peakDay.commitsPerDay : 0}</div>
              <div class="metric-label">Peak Day</div>
              <div class="metric-detail">${peakDay ? dateFormat(new Date(peakDay.date)) : 'N/A'}</div>
            </div>
          </div>
          <div class="trend-summary-card">
            <div class="summary-metric">
              <div class="metric-value">${totalReverts}</div>
              <div class="metric-label">Total Reverts</div>
              <div class="metric-detail">across all days</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contributions Calendar -->
      ${generateContributionsGraphSection(trends.contributionsGraph)}

      <!-- Visual Trend Charts -->
      <div class="visual-trends">
        <h3>Visual Trend Analysis</h3>
        <div class="charts-grid">
          ${generateCommitTrendChart(flowMetrics)}
          ${generateAuthorTrendChart(flowMetrics)}
          ${generateVolumeSparklines(flowMetrics)}
        </div>
      </div>
    `;
}

export function generateDailyTrendsSection(trends: any): string {
  const flowMetrics = trends.flowMetrics || [];
  const stabilityMetrics = trends.stabilityMetrics || [];
  const ownershipMetrics = trends.ownershipMetrics || [];
  const couplingMetrics = trends.couplingMetrics || [];
  const hygieneMetrics = trends.hygieneMetrics || [];

  return `
    <section id="daily-trends" class="section">
      <h2>📅 Detailed Daily Tables</h2>
      <p class="section-description">
        Detailed day-by-day breakdowns of repository metrics computed from Git commit history. These tables provide
        granular data for analysis but should not be used for performance evaluation.
      </p>

      <div class="key-trends">
        <h3>Daily Metrics Breakdown</h3>

        <div class="trend-category">
          <h4>📊 Daily Flow &amp; Throughput</h4>
          <div class="trend-explanation">
            <p>Observable patterns in commit frequency, author participation, and code volume changes.</p>
          </div>
          ${generateFlowTrendsTable(flowMetrics)}
        </div>

        <div class="trend-category">
          <h4>⚖️ Daily Stability Indicators</h4>
          <div class="trend-explanation">
            <p>Patterns that may indicate repository stability, including reverts, merges, and file retouch rates.</p>
          </div>
          ${generateStabilityTrendsTable(stabilityMetrics)}
        </div>

        <div class="trend-category">
          <h4>👥 Daily Ownership Patterns</h4>
          <div class="trend-explanation">
            <p>File ownership distribution and knowledge spreading patterns based on authorship data.</p>
          </div>
          ${generateOwnershipTrendsTable(ownershipMetrics)}
        </div>

        <div class="trend-category">
          <h4>🔗 Daily Coupling Indicators</h4>
          <div class="trend-explanation">
            <p>Patterns in file co-changes that may indicate architectural coupling or batch changes.</p>
          </div>
          ${generateCouplingTrendsTable(couplingMetrics)}
        </div>

        <div class="trend-category">
          <h4>🧹 Daily Hygiene Patterns</h4>
          <div class="trend-explanation">
            <p>Commit message quality patterns and documentation practices observed in commit data.</p>
          </div>
          ${generateHygieneTrendsTable(hygieneMetrics)}
        </div>
      </div>

      <div class="trends-limitations">
        <h3>⚠️ Daily Trends Limitations</h3>
        <div class="limitation-notice">
          <h4>Git Data Only - No External Context</h4>
          <p>These trends are calculated exclusively from Git commit history and have significant limitations:</p>
          <ul>
            <li><strong>Timing:</strong> Commit timestamps reflect when commits were made, not actual working hours</li>
            <li><strong>Batch Operations:</strong> Large commits may represent batch changes, merges, or automated processes</li>
            <li><strong>Development Workflows:</strong> Patterns affected by branching strategies, release cycles, and team practices</li>
            <li><strong>No Quality Context:</strong> Cannot distinguish between bug fixes, features, refactoring, or maintenance</li>
            <li><strong>No External Events:</strong> Cannot correlate with releases, incidents, holidays, or business events</li>
          </ul>

          <h4>Appropriate Usage</h4>
          <ul>
            <li><strong>Activity Monitoring:</strong> Track repository activity levels and participation</li>
            <li><strong>Pattern Recognition:</strong> Identify unusual spikes, drops, or cyclical patterns</li>
            <li><strong>Planning Context:</strong> Understand historical activity patterns for capacity planning</li>
            <li><strong>Process Insights:</strong> Observe effects of workflow or tooling changes</li>
          </ul>

          <h4>Inappropriate Usage</h4>
          <ul>
            <li><strong>Performance Assessment:</strong> Do not use for individual or team performance evaluation</li>
            <li><strong>Quality Measurement:</strong> Trends do not indicate code quality or defect rates</li>
            <li><strong>Productivity Metrics:</strong> Commit patterns ≠ productivity or business value</li>
            <li><strong>Work-Life Balance:</strong> Timing patterns do not indicate actual working hours or stress</li>
          </ul>
        </div>
      </div>
    </section>`;
}

export function generateCurrentStateSection(currentState: any): string {
  if (!currentState) {
    return '<div class="alert alert-warning">Current repository state data is not available.</div>';
  }

  const { totalFiles, totalSizeBytes, byExtension, categories, topDirectories } = currentState;
  const pctFmt = (value: number) => `${value.toFixed(1)}%`;
  const sizeFmt = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  const keyMetrics = [
    { value: totalFiles.toLocaleString(), label: 'Total Files' },
    { value: sizeFmt(totalSizeBytes), label: 'Total Size' },
    { value: byExtension.length.toString(), label: 'File Types' },
    { value: topDirectories ? topDirectories.length.toString() : 'N/A', label: 'Directories' },
  ];

  const topExtensions = byExtension
    .slice(0, 10)
    .map(
      (ext: any) =>
        `<tr>
            <td><span class="file-extension">.${escapeHtml(ext.extension)}</span></td>
            <td class="num">${ext.fileCount.toLocaleString()}</td>
            <td class="num">${pctFmt(ext.percentage)}</td>
            <td class="num">${sizeFmt(ext.totalSizeBytes)}</td>
          </tr>`
    )
    .join('');

  let categoryRows = '';
  if (categories && Object.keys(categories).length > 0) {
    categoryRows = Object.entries(categories)
      .filter(([_, stats]: [string, any]) => stats.fileCount > 0)
      .sort((a: any, b: any) => b[1].fileCount - a[1].fileCount)
      .slice(0, 8)
      .map(
        ([name, stats]: [string, any]) =>
          `<tr>
              <td>${escapeHtml(name.charAt(0).toUpperCase() + name.slice(1))}</td>
              <td class="num">${stats.fileCount.toLocaleString()}</td>
              <td class="num">${pctFmt(stats.percentage)}</td>
              <td class="num">${sizeFmt(stats.totalSizeBytes)}</td>
            </tr>`
      )
      .join('');
  }

  let topDirectoriesHTML = '';
  if (topDirectories && topDirectories.length > 0) {
    topDirectoriesHTML = topDirectories
      .filter((dir: any) => dir.fileCount > 1)
      .slice(0, 8)
      .map(
        (dir: any) =>
          `<tr>
              <td><code class="directory-path">${escapeHtml(dir.path)}</code></td>
              <td class="num">${dir.fileCount.toLocaleString()}</td>
              <td class="num">${pctFmt(dir.percentage)}</td>
            </tr>`
      )
      .join('');
  }

  return `
      <div class="summary-grid">
        ${keyMetrics
          .map(
            m =>
              `<div class="metric-card" tabindex="0">
                <div class="metric-value">${m.value}</div>
                <div class="metric-label">${m.label}</div>
              </div>`
          )
          .join('')}
      </div>

      <div class="repository-details">
        <div class="table-wrapper" role="region" aria-label="File extensions breakdown">
          <h3>File Extensions</h3>
          <p class="section-description">Most common file types in the repository</p>
          <table class="data-table" data-sortable data-initial-limit="10" data-table="file-extensions">
            <thead>
              <tr>
                <th scope="col">Extension</th>
                <th class="num" scope="col">Files</th>
                <th class="num" scope="col">%</th>
                <th class="num" scope="col">Size</th>
              </tr>
            </thead>
            <tbody>${topExtensions}</tbody>
          </table>
          <button class="show-more" data-target-table="file-extensions" hidden>Show more</button>
        </div>

        ${
          categoryRows
            ? `
        <div class="table-wrapper" role="region" aria-label="File categories breakdown">
          <h3>File Categories</h3>
          <p class="section-description">Files grouped by type and purpose</p>
          <table class="data-table" data-sortable data-initial-limit="8" data-table="file-categories">
            <thead>
              <tr>
                <th scope="col">Category</th>
                <th class="num" scope="col">Files</th>
                <th class="num" scope="col">%</th>
                <th class="num" scope="col">Size</th>
              </tr>
            </thead>
            <tbody>${categoryRows}</tbody>
          </table>
          <button class="show-more" data-target-table="file-categories" hidden>Show more</button>
        </div>
        `
            : ''
        }

        ${
          topDirectoriesHTML
            ? `
        <div class="table-wrapper" role="region" aria-label="Directory breakdown">
          <h3>Directory Breakdown</h3>
          <p class="section-description">Largest directories by file count</p>
          <table class="data-table" data-sortable data-initial-limit="8" data-table="directories">
            <thead>
              <tr>
                <th scope="col">Directory</th>
                <th class="num" scope="col">Files</th>
                <th class="num" scope="col">%</th>
              </tr>
            </thead>
            <tbody>${topDirectoriesHTML}</tbody>
          </table>
          <button class="show-more" data-target-table="directories" hidden>Show more</button>
        </div>
        `
            : ''
        }
      </div>
    `;
}
