/**
 * Daily trends, contribution calendar, SVG charts, and current-state section
 * generation for Git Spark HTML reports.
 *
 * All functions are pure — they receive data and return HTML strings.
 * Tightly coupled chart helpers (commit trend, author trend, volume sparklines)
 * are co-located here because generateActivityVisualsForTeamPatterns calls them.
 */
import { escapeHtml } from './html-utils.js';

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

      <!-- Key Trends -->
      <div class="key-trends">
        <h3>Daily Metrics Breakdown</h3>
        
        <!-- Flow Trends -->
        <div class="trend-category">
          <h4>📊 Daily Flow & Throughput</h4>
          <div class="trend-explanation">
            <p>Observable patterns in commit frequency, author participation, and code volume changes.</p>
          </div>
          ${generateFlowTrendsTable(flowMetrics)}
        </div>

        <!-- Stability Trends -->
        <div class="trend-category">
          <h4>⚖️ Daily Stability Indicators</h4>
          <div class="trend-explanation">
            <p>Patterns that may indicate repository stability, including reverts, merges, and file retouch rates.</p>
          </div>
          ${generateStabilityTrendsTable(stabilityMetrics)}
        </div>

        <!-- Ownership Trends -->
        <div class="trend-category">
          <h4>👥 Daily Ownership Patterns</h4>
          <div class="trend-explanation">
            <p>File ownership distribution and knowledge spreading patterns based on authorship data.</p>
          </div>
          ${generateOwnershipTrendsTable(ownershipMetrics)}
        </div>

        <!-- Coupling Trends -->
        <div class="trend-category">
          <h4>🔗 Daily Coupling Indicators</h4>
          <div class="trend-explanation">
            <p>Patterns in file co-changes that may indicate architectural coupling or batch changes.</p>
          </div>
          ${generateCouplingTrendsTable(couplingMetrics)}
        </div>

        <!-- Hygiene Trends -->
        <div class="trend-category">
          <h4>🧹 Daily Hygiene Patterns</h4>
          <div class="trend-explanation">
            <p>Commit message quality patterns and documentation practices observed in commit data.</p>
          </div>
          ${generateHygieneTrendsTable(hygieneMetrics)}
        </div>
      </div>

      <!-- Limitations and Context -->
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

export function generateFlowTrendsTable(flowMetrics: any[]): string {
  if (flowMetrics.length === 0) {
    return '<div class="no-data">No flow data available</div>';
  }

  const recentMetrics = flowMetrics.slice(-30);

  const rows = recentMetrics
    .map(
      day => `
      <tr>
        <td>${day.day}</td>
        <td class="num">${day.commitsPerDay}</td>
        <td class="num">${day.uniqueAuthorsPerDay}</td>
        <td class="num">${new Intl.NumberFormat().format(day.grossLinesChangedPerDay)}</td>
        <td class="num">${day.filesTouchedPerDay}</td>
        <td class="num">${day.commitSizeDistribution.p50}</td>
        <td class="num">${day.commitSizeDistribution.p90}</td>
      </tr>
    `
    )
    .join('');

  return `
      <div class="table-wrapper">
        <table class="data-table trends-table" data-sortable>
          <thead>
            <tr>
              <th>Date</th>
              <th class="num">Commits</th>
              <th class="num">Authors</th>
              <th class="num">Lines Changed</th>
              <th class="num">Files Touched</th>
              <th class="num">P50 Commit Size</th>
              <th class="num">P90 Commit Size</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      ${flowMetrics.length > 30 ? '<p class="table-note">Showing last 30 days. Complete data available in exported reports.</p>' : ''}
    `;
}

export function generateStabilityTrendsTable(stabilityMetrics: any[]): string {
  if (stabilityMetrics.length === 0) {
    return '<div class="no-data">No stability data available</div>';
  }

  const recentMetrics = stabilityMetrics.slice(-30);

  const rows = recentMetrics
    .map(
      day => `
      <tr>
        <td>${day.day}</td>
        <td class="num">${day.revertsPerDay}</td>
        <td class="num">${(day.mergeRatioPerDay * 100).toFixed(1)}%</td>
        <td class="num">${(day.retouchRate * 100).toFixed(1)}%</td>
        <td class="num">${day.renamesPerDay}</td>
        <td class="num">${(day.outOfHoursShare * 100).toFixed(1)}%</td>
      </tr>
    `
    )
    .join('');

  return `
      <div class="table-wrapper">
        <table class="data-table trends-table" data-sortable>
          <thead>
            <tr>
              <th>Date</th>
              <th class="num">Reverts</th>
              <th class="num">Merge Ratio</th>
              <th class="num">Retouch Rate</th>
              <th class="num">Renames</th>
              <th class="num">Out of Hours</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      ${stabilityMetrics.length > 30 ? '<p class="table-note">Showing last 30 days. Complete data available in exported reports.</p>' : ''}
    `;
}

export function generateOwnershipTrendsTable(ownershipMetrics: any[]): string {
  if (ownershipMetrics.length === 0) {
    return '<div class="no-data">No ownership data available</div>';
  }

  const recentMetrics = ownershipMetrics.slice(-30);

  const rows = recentMetrics
    .map(
      day => `
      <tr>
        <td>${day.day}</td>
        <td class="num">${day.newFilesCreatedPerDay}</td>
        <td class="num">${day.singleOwnerFilesTouched}</td>
        <td class="num">${day.filesTouchedToday}</td>
        <td class="num">${(day.singleOwnerShare * 100).toFixed(1)}%</td>
        <td class="num">${day.avgAuthorsPerFile.toFixed(1)}</td>
      </tr>
    `
    )
    .join('');

  return `
      <div class="table-wrapper">
        <table class="data-table trends-table" data-sortable>
          <thead>
            <tr>
              <th>Date</th>
              <th class="num">New Files</th>
              <th class="num">Single Owner Files</th>
              <th class="num">Total Files Touched</th>
              <th class="num">Single Owner %</th>
              <th class="num">Avg Authors/File</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      ${ownershipMetrics.length > 30 ? '<p class="table-note">Showing last 30 days. Complete data available in exported reports.</p>' : ''}
    `;
}

export function generateCouplingTrendsTable(couplingMetrics: any[]): string {
  if (couplingMetrics.length === 0) {
    return '<div class="no-data">No coupling data available</div>';
  }

  const recentMetrics = couplingMetrics.slice(-30);

  const rows = recentMetrics
    .map(
      day => `
      <tr>
        <td>${day.day}</td>
        <td class="num">${day.coChangeDensityPerDay.toFixed(2)}</td>
        <td class="num">${day.totalCoChangePairs}</td>
        <td class="num">${day.multiFileCommits}</td>
      </tr>
    `
    )
    .join('');

  return `
      <div class="table-wrapper">
        <table class="data-table trends-table" data-sortable>
          <thead>
            <tr>
              <th>Date</th>
              <th class="num">Co-change Density</th>
              <th class="num">Total Co-change Pairs</th>
              <th class="num">Multi-file Commits</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      ${couplingMetrics.length > 30 ? '<p class="table-note">Showing last 30 days. Complete data available in exported reports.</p>' : ''}
    `;
}

export function generateHygieneTrendsTable(hygieneMetrics: any[]): string {
  if (hygieneMetrics.length === 0) {
    return '<div class="no-data">No hygiene data available</div>';
  }

  const recentMetrics = hygieneMetrics.slice(-30);

  const rows = recentMetrics
    .map(
      day => `
      <tr>
        <td>${day.day}</td>
        <td class="num">${day.medianCommitMessageLength}</td>
        <td class="num">${day.shortMessages}</td>
        <td class="num">${day.conventionalCommits}</td>
      </tr>
    `
    )
    .join('');

  return `
      <div class="table-wrapper">
        <table class="data-table trends-table" data-sortable>
          <thead>
            <tr>
              <th>Date</th>
              <th class="num">Median Message Length</th>
              <th class="num">Short Messages</th>
              <th class="num">Conventional Commits</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      ${hygieneMetrics.length > 30 ? '<p class="table-note">Showing last 30 days. Complete data available in exported reports.</p>' : ''}
    `;
}

export function generateContributionsGraphSection(contributionsGraph: any): string {
  if (!contributionsGraph || !contributionsGraph.calendar) {
    return '';
  }

  const { totalCommits, weeks, calendar } = contributionsGraph;

  const datesWithCommits = calendar.filter((day: any) => day.count > 0);
  const actualDays = datesWithCommits.length > 0 ? datesWithCommits.length : calendar.length;
  const dateRangeText =
    datesWithCommits.length > 0
      ? `${datesWithCommits[0].date} to ${datesWithCommits[datesWithCommits.length - 1].date}`
      : `${calendar[0]?.date || ''} to ${calendar[calendar.length - 1]?.date || ''}`;

  const weekColumns = weeks
    .map((week: any) => {
      const days = week.days
        .map((day: any) => {
          const classes = `contribution-day intensity-${day.intensity}`;
          const title = `${day.date}: ${day.count} commit${day.count !== 1 ? 's' : ''}`;
          return `<div class="${classes}" title="${title}" data-count="${day.count}" data-date="${day.date}"></div>`;
        })
        .join('');

      return `<div class="contributions-week">${days}</div>`;
    })
    .join('');

  return `
      <div class="contributions-graph">
        <h3>🗓️ Contributions Calendar</h3>
        <div class="contributions-header">
          <span>Activity from ${escapeHtml(dateRangeText)} (${actualDays} active days)</span>
          <span>${totalCommits} total commits</span>
        </div>
        <div class="contributions-calendar">
          <div class="contributions-weeks">
            ${weekColumns}
          </div>
        </div>
        <div class="contributions-legend">
          <span>Less</span>
          <div class="legend-scale">
            <div class="legend-day intensity-0"></div>
            <div class="legend-day intensity-1"></div>
            <div class="legend-day intensity-2"></div>
            <div class="legend-day intensity-3"></div>
            <div class="legend-day intensity-4"></div>
          </div>
          <span>More</span>
        </div>
      </div>
    `;
}

export function generateCommitTrendChart(flowMetrics: any[]): string {
  if (!flowMetrics || flowMetrics.length === 0) {
    return '<div class="chart-placeholder">No commit trend data available</div>';
  }

  const recentData = flowMetrics.slice(-30);
  const maxCommits = Math.max(...recentData.map(d => d.commitsPerDay), 1);

  const width = 800;
  const height = 200;
  const padding = { top: 20, right: 50, bottom: 30, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const points = recentData.map((day, index) => {
    const x = padding.left + (index * chartWidth) / (recentData.length - 1 || 1);
    const y = padding.top + chartHeight - (day.commitsPerDay * chartHeight) / maxCommits;
    return { x, y, value: day.commitsPerDay, date: day.day };
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaData = `M ${padding.left} ${height - padding.bottom} L ${pathData.substring(2)} L ${points[points.length - 1]?.x || padding.left} ${height - padding.bottom} Z`;

  return `
      <div class="chart-container">
        <h4>Daily Commits Trend</h4>
        <svg class="trend-chart" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
          <defs>
            <linearGradient id="commitTrendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:var(--color-primary);stop-opacity:0.6" />
              <stop offset="100%" style="stop-color:var(--color-primary);stop-opacity:0.1" />
            </linearGradient>
          </defs>
          
          <!-- Grid lines -->
          <g class="grid" stroke="var(--color-border)" stroke-width="1" opacity="0.3">
            ${Array.from({ length: 5 }, (_, i) => {
              const y = padding.top + (i * chartHeight) / 4;
              return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"/>`;
            }).join('')}
          </g>
          
          <!-- Area fill -->
          <path d="${areaData}" fill="url(#commitTrendGradient)"/>
          
          <!-- Trend line -->
          <path d="${pathData}" fill="none" stroke="var(--color-primary)" stroke-width="2"/>
          
          <!-- Data points -->
          <g class="data-points">
            ${points
              .map(
                p =>
                  `<circle cx="${p.x}" cy="${p.y}" r="3" fill="var(--color-primary)" 
                      title="${p.date}: ${p.value} commits">
                 <title>${p.date}: ${p.value} commits</title>
               </circle>`
              )
              .join('')}
          </g>
          
          <!-- Y-axis labels -->
          <g class="y-labels" font-size="12" fill="var(--color-text-secondary)" text-anchor="end">
            <text x="${padding.left - 10}" y="${padding.top + 5}">${maxCommits}</text>
            <text x="${padding.left - 10}" y="${height - padding.bottom + 5}">0</text>
          </g>
          
          <!-- Chart title -->
          <text x="${width / 2}" y="15" text-anchor="middle" font-size="14" font-weight="600" fill="var(--color-text)">
            Last ${recentData.length} Days
          </text>
        </svg>
      </div>
    `;
}

export function generateAuthorTrendChart(flowMetrics: any[]): string {
  if (!flowMetrics || flowMetrics.length === 0) {
    return '<div class="chart-placeholder">No author trend data available</div>';
  }

  const recentData = flowMetrics.slice(-30);
  const maxAuthors = Math.max(...recentData.map(d => d.uniqueAuthorsPerDay), 1);

  const width = 800;
  const height = 200;
  const padding = { top: 20, right: 50, bottom: 30, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const points = recentData.map((day, index) => {
    const x = padding.left + (index * chartWidth) / (recentData.length - 1 || 1);
    const y = padding.top + chartHeight - (day.uniqueAuthorsPerDay * chartHeight) / maxAuthors;
    return { x, y, value: day.uniqueAuthorsPerDay, date: day.day };
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return `
      <div class="chart-container">
        <h4>Active Authors Trend</h4>
        <svg class="trend-chart" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
          <defs>
            <linearGradient id="authorTrendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:var(--color-success);stop-opacity:0.6" />
              <stop offset="100%" style="stop-color:var(--color-success);stop-opacity:0.1" />
            </linearGradient>
          </defs>
          
          <!-- Grid lines -->
          <g class="grid" stroke="var(--color-border)" stroke-width="1" opacity="0.3">
            ${Array.from({ length: 5 }, (_, i) => {
              const y = padding.top + (i * chartHeight) / 4;
              return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"/>`;
            }).join('')}
          </g>
          
          <!-- Trend line -->
          <path d="${pathData}" fill="none" stroke="var(--color-success)" stroke-width="2"/>
          
          <!-- Data points -->
          <g class="data-points">
            ${points
              .map(
                p =>
                  `<circle cx="${p.x}" cy="${p.y}" r="3" fill="var(--color-success)" 
                      title="${p.date}: ${p.value} authors">
                 <title>${p.date}: ${p.value} authors</title>
               </circle>`
              )
              .join('')}
          </g>
          
          <!-- Y-axis labels -->
          <g class="y-labels" font-size="12" fill="var(--color-text-secondary)" text-anchor="end">
            <text x="${padding.left - 10}" y="${padding.top + 5}">${maxAuthors}</text>
            <text x="${padding.left - 10}" y="${height - padding.bottom + 5}">0</text>
          </g>
          
          <!-- Chart title -->
          <text x="${width / 2}" y="15" text-anchor="middle" font-size="14" font-weight="600" fill="var(--color-text)">
            Last ${recentData.length} Days
          </text>
        </svg>
      </div>
    `;
}

export function generateVolumeSparklines(flowMetrics: any[]): string {
  if (!flowMetrics || flowMetrics.length === 0) {
    return '<div class="chart-placeholder">No volume data available</div>';
  }

  const recentData = flowMetrics.slice(-14);
  const maxLines = Math.max(...recentData.map(d => d.grossLinesChangedPerDay), 1);
  const maxFiles = Math.max(...recentData.map(d => d.filesTouchedPerDay), 1);

  const barWidth = 100 / recentData.length;
  const chartHeight = 50;

  const linesSparkline = recentData
    .map((day, index) => {
      const heightPercent = (day.grossLinesChangedPerDay / maxLines) * 100;
      const height = (heightPercent / 100) * chartHeight;
      const x = index * barWidth;
      const y = chartHeight - height;
      return `<rect x="${x}%" y="${y}" width="${barWidth * 0.8}%" height="${height}" fill="url(#lines-gradient)" rx="1">
          <title>${day.day}: ${day.grossLinesChangedPerDay.toLocaleString()} lines</title>
        </rect>`;
    })
    .join('');

  const filesSparkline = recentData
    .map((day, index) => {
      const heightPercent = (day.filesTouchedPerDay / maxFiles) * 100;
      const height = (heightPercent / 100) * chartHeight;
      const x = index * barWidth;
      const y = chartHeight - height;
      return `<rect x="${x}%" y="${y}" width="${barWidth * 0.8}%" height="${height}" fill="url(#files-gradient)" rx="1">
          <title>${day.day}: ${day.filesTouchedPerDay} files</title>
        </rect>`;
    })
    .join('');

  return `
      <div class="sparklines-container">
        <h4>Volume Trends (Last 14 Days)</h4>
        <div class="sparklines-grid">
          <div class="sparkline-item">
            <div class="sparkline-label">Lines Changed</div>
            <div class="sparkline-chart">
              <svg width="100%" height="50" viewBox="0 0 100 50" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="lines-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" style="stop-color:var(--color-primary);stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#2196f3;stop-opacity:1" />
                  </linearGradient>
                </defs>
                ${linesSparkline}
              </svg>
            </div>
            <div class="sparkline-summary">Peak: ${maxLines.toLocaleString()}</div>
          </div>
          
          <div class="sparkline-item">
            <div class="sparkline-label">Files Touched</div>
            <div class="sparkline-chart">
              <svg width="100%" height="50" viewBox="0 0 100 50" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="files-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" style="stop-color:var(--color-success);stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#4caf50;stop-opacity:1" />
                  </linearGradient>
                </defs>
                ${filesSparkline}
              </svg>
            </div>
            <div class="sparkline-summary">Peak: ${maxFiles}</div>
          </div>
        </div>
      </div>
    `;
}

export function generateCurrentStateSection(currentState: any): string {
  if (!currentState) {
    return '<div class="alert alert-warning">Current repository state data is not available.</div>';
  }

  const { totalFiles, totalSizeBytes, byExtension, categories, topDirectories } = currentState;
  const pctFmt = (value: number) => `${value.toFixed(1)}%`;
  const sizeFmt = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    } else if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    } else if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${bytes} B`;
  };

  const keyMetrics = [
    { value: totalFiles.toLocaleString(), label: 'Total Files' },
    { value: sizeFmt(totalSizeBytes), label: 'Total Size' },
    { value: byExtension.length.toString(), label: 'File Types' },
    {
      value: topDirectories ? topDirectories.length.toString() : 'N/A',
      label: 'Directories',
    },
  ];

  const topExtensions = byExtension
    .slice(0, 10)
    .map(
      (ext: any) =>
        `<tr>
            <td><span class="file-extension">.${ext.extension}</span></td>
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
              <td>${name.charAt(0).toUpperCase() + name.slice(1)}</td>
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
              <td><code class="directory-path">${dir.path}</code></td>
              <td class="num">${dir.fileCount.toLocaleString()}</td>
              <td class="num">${pctFmt(dir.percentage)}</td>
            </tr>`
      )
      .join('');
  }

  return `
      <!-- Executive Summary style metrics grid -->
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

      <!-- Repository details in clean table layout -->
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
