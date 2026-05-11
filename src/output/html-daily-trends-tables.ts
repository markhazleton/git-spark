/**
 * Table generators for the daily trends section.
 * All functions are pure — they receive data and return HTML strings.
 */

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
