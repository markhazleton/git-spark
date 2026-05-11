/**
 * SVG chart and contributions calendar generators for the daily trends section.
 * All functions are pure — they receive data and return HTML strings.
 */
import { escapeHtml } from './html-utils.js';

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
          <g class="grid" stroke="var(--color-border)" stroke-width="1" opacity="0.3">
            ${Array.from({ length: 5 }, (_, i) => {
              const y = padding.top + (i * chartHeight) / 4;
              return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"/>`;
            }).join('')}
          </g>
          <path d="${areaData}" fill="url(#commitTrendGradient)"/>
          <path d="${pathData}" fill="none" stroke="var(--color-primary)" stroke-width="2"/>
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
          <g class="y-labels" font-size="12" fill="var(--color-text-secondary)" text-anchor="end">
            <text x="${padding.left - 10}" y="${padding.top + 5}">${maxCommits}</text>
            <text x="${padding.left - 10}" y="${height - padding.bottom + 5}">0</text>
          </g>
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
          <g class="grid" stroke="var(--color-border)" stroke-width="1" opacity="0.3">
            ${Array.from({ length: 5 }, (_, i) => {
              const y = padding.top + (i * chartHeight) / 4;
              return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"/>`;
            }).join('')}
          </g>
          <path d="${pathData}" fill="none" stroke="var(--color-success)" stroke-width="2"/>
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
          <g class="y-labels" font-size="12" fill="var(--color-text-secondary)" text-anchor="end">
            <text x="${padding.left - 10}" y="${padding.top + 5}">${maxAuthors}</text>
            <text x="${padding.left - 10}" y="${height - padding.bottom + 5}">0</text>
          </g>
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
