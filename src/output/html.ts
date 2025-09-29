import { AnalysisReport } from '../types';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import { createLogger } from '../utils/logger';
import { createHash } from 'crypto';

const logger = createLogger('html-exporter');

/**
 * Exports analysis reports as interactive HTML with charts and visualizations
 *
 * The HTMLExporter generates comprehensive HTML reports featuring:
 * - Executive summary with health metrics
 * - Interactive charts using Chart.js
 * - Detailed author and file analysis tables
 * - Risk assessment with color-coded indicators
 * - Governance scoring and recommendations
 * - Responsive design with modern CSS styling
 *
 * @example
 * ```typescript
 * const exporter = new HTMLExporter();
 * await exporter.export(analysisReport, './reports');
 * // Creates: ./reports/git-spark-report.html
 * ```
 */
export class HTMLExporter {
  /**
   * Export analysis report as interactive HTML file
   *
   * Creates a self-contained HTML file with embedded CSS and JavaScript
   * for interactive charts and visualizations. The file includes all
   * necessary dependencies via CDN links.
   *
   * @param report - The complete analysis report to export
   * @param outputPath - Directory path where HTML file will be created
   * @throws {Error} When output directory cannot be created or file cannot be written
   * @returns Promise that resolves when export is complete
   */
  async export(report: AnalysisReport, outputPath: string): Promise<void> {
    try {
      const fullPath = resolve(outputPath, 'git-spark-report.html');

      // Ensure directory exists
      mkdirSync(dirname(fullPath), { recursive: true });

      // Generate HTML content
      const htmlContent = this.generateHTML(report);

      // Write to file
      writeFileSync(fullPath, htmlContent, 'utf-8');

      logger.info('HTML report exported successfully', { path: fullPath });
    } catch (error) {
      logger.error('Failed to export HTML report', { error });
      throw error;
    }
  }

  /**
   * Generate complete HTML document with embedded styles and scripts
   *
   * Creates a self-contained HTML file with:
   * - Bootstrap CSS for responsive layout
   * - Chart.js for interactive visualizations
   * - Custom CSS for git-spark branding
   * - JavaScript for chart rendering and interactions
   *
   * @param report - Analysis report data to render
   * @returns Complete HTML document as string
   * @private
   */
  private generateHTML(report: AnalysisReport): string {
    const repoName = basename(report.metadata.repoPath || '.') || 'repository';
    const generatedAt = report.metadata.generatedAt.toISOString();
    const healthPct = Math.round(report.repository.healthScore * 100);
    const governancePct = Math.round(report.governance.score * 100);
    const numberFmt = (n: number) => new Intl.NumberFormat().format(n);
    const compactFmt = (n: number) =>
      new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(n);
    const pctFmt = (n: number) => `${n.toFixed(1)}%`;
    const warnings: string[] = (report as any).warnings || [];

    const keyMetrics = [
      {
        label: 'Commits',
        value: numberFmt(report.repository.totalCommits),
        raw: report.repository.totalCommits,
      },
      {
        label: 'Contributors',
        value: numberFmt(report.repository.totalAuthors),
        raw: report.repository.totalAuthors,
      },
      {
        label: 'Files Changed',
        value: numberFmt(report.repository.totalFiles),
        raw: report.repository.totalFiles,
      },
      {
        label: 'Code Churn',
        value: compactFmt(report.repository.totalChurn),
        raw: report.repository.totalChurn,
      },
      { label: 'Health', value: `${healthPct}%`, raw: healthPct },
      { label: 'Governance', value: `${governancePct}%`, raw: governancePct },
      {
        label: 'Bus Factor',
        value: numberFmt(report.repository.busFactor),
        raw: report.repository.busFactor,
      },
    ];

    const riskRows = report.files
      .slice(0, 25)
      .map(f => {
        const riskPercent = Math.round(f.riskScore * 100);
        const authors = f.authors.length;
        return `<tr>
          <td><code title="${this.escapeHtml(f.path)}">${this.escapeHtml(this.truncatePath(f.path))}</code></td>
          <td class="num" data-sort="${f.commits}">${numberFmt(f.commits)}</td>
          <td class="num" data-sort="${f.churn}">${numberFmt(f.churn)}</td>
          <td class="num" data-sort="${authors}">${authors}</td>
          <td class="num" data-sort="${riskPercent}"><span class="risk-badge risk-${this.getRiskBand(riskPercent)}" title="Commits: ${f.commits}\nChurn: ${f.churn}\nAuthors: ${authors}">${riskPercent}%</span></td>
        </tr>`;
      })
      .join('');

    const authorRows = report.authors
      .slice(0, 15)
      .map(
        a => `<tr>
        <td>${this.escapeHtml(a.name)}</td>
        <td class="num" data-sort="${a.commits}">${numberFmt(a.commits)}</td>
        <td class="num" data-sort="${a.churn}" title="+${a.insertions} / -${a.deletions}">+${numberFmt(a.insertions)} / -${numberFmt(a.deletions)}</td>
        <td class="num" data-sort="${a.avgCommitSize.toFixed(2)}">${a.avgCommitSize.toFixed(1)}</td>
        <td class="num" data-sort="${a.filesChanged}">${a.filesChanged}</td>
      </tr>`
      )
      .join('');

    const timelineData = report.timeline
      .map(d => ({
        x: d.date.toISOString(),
        commits: d.commits,
        churn: d.churn,
        authors: d.authors,
      }))
      .slice(0, 365); // basic safeguard

    // Build lightweight data object for client-side exports (omit large commit bodies)
    const exportData = {
      repository: {
        totalCommits: report.repository.totalCommits,
        totalAuthors: report.repository.totalAuthors,
        totalFiles: report.repository.totalFiles,
        healthScore: report.repository.healthScore,
        governanceScore: report.repository.governanceScore,
        busFactor: report.repository.busFactor,
      },
      authors: report.authors.map(a => ({
        name: a.name,
        commits: a.commits,
        churn: a.churn,
        filesChanged: a.filesChanged,
        avgCommitSize: a.avgCommitSize,
        largestCommit: a.largestCommit,
      })),
      files: report.files.slice(0, 250).map(f => ({
        path: f.path,
        commits: f.commits,
        authors: f.authors.length,
        churn: f.churn,
        riskScore: f.riskScore,
      })),
      risks: report.risks.riskFactors,
      governance: {
        conventionalCommits: report.governance.conventionalCommits,
        traceabilityScore: report.governance.traceabilityScore,
        avgMessageLength: report.governance.avgMessageLength,
        wipCommits: report.governance.wipCommits,
        revertCommits: report.governance.revertCommits,
        shortMessages: report.governance.shortMessages,
        score: report.governance.score,
      },
      timeline: timelineData,
    };

    // Risk factors & governance metric arrays for charts
    const riskFactorEntries = Object.entries(report.risks.riskFactors);
    const governanceMetrics = [
      ['Conventional', report.governance.conventionalCommits],
      ['Traceability', Math.round(report.governance.traceabilityScore * 100)],
      ['Avg Msg Len', report.governance.avgMessageLength],
      ['WIP', report.governance.wipCommits],
      ['Reverts', report.governance.revertCommits],
      ['Short Msg', report.governance.shortMessages],
    ];

    // Simple SVG OG image summarizing key stats
    const ogSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='418' viewBox='0 0 800 418' role='img'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop stop-color='%230066cc' offset='0'/><stop stop-color='%2328a745' offset='1'/></linearGradient></defs><rect width='800' height='418' fill='%231e2227'/><text x='40' y='80' font-family='Segoe UI,Roboto,Arial,sans-serif' font-size='42' fill='white'>Git Activity Report</text><text x='40' y='140' font-size='26' fill='white'>${this.escapeHtml(repoName)}</text><text x='40' y='200' font-size='20' fill='white'>Commits: ${report.repository.totalCommits}</text><text x='40' y='235' font-size='20' fill='white'>Authors: ${report.repository.totalAuthors}</text><text x='40' y='270' font-size='20' fill='white'>Health: ${healthPct}%</text><text x='40' y='305' font-size='20' fill='white'>Governance: ${governancePct}%</text><text x='40' y='350' font-size='16' fill='#bbb'>Generated ${new Date(report.metadata.generatedAt).toISOString().split('T')[0]}</text><rect x='600' y='60' width='160' height='160' rx='8' fill='url(#g)' opacity='0.8'/><text x='680' y='160' text-anchor='middle' font-size='54' fill='white' font-weight='700'>${healthPct}%</text></svg>`;
    const ogImage = 'data:image/svg+xml;base64,' + Buffer.from(ogSvg).toString('base64');

    // Analysis period (based on repository stats)
    let analysisPeriod = '';
    try {
      const first = report.repository.firstCommit;
      const last = report.repository.lastCommit;
      if (first && last) {
        const firstStr = first.toISOString().split('T')[0];
        const lastStr = last.toISOString().split('T')[0];
        const days = Math.max(
          1,
          Math.ceil((last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24)) + 1
        );
        analysisPeriod = `Analyzed Period: ${firstStr} → ${lastStr} (${days} day${days !== 1 ? 's' : ''})`;
      }
    } catch {
      /* ignore */
    }

    // Prepare style and scripts; compute hashes for CSP (no unsafe-inline for scripts or styles)
    const styleContent = this.getCustomStyles();
    const styleHash = createHash('sha256').update(styleContent, 'utf8').digest('base64');
    const timelineScript = `window.__GIT_SPARK_TIMELINE__ = ${JSON.stringify(timelineData)};\nwindow.__GIT_SPARK_DATA__ = ${JSON.stringify(exportData)};\nwindow.__GIT_SPARK_RISK_FACTORS__ = ${JSON.stringify(riskFactorEntries)};\nwindow.__GIT_SPARK_GOV_METRICS__ = ${JSON.stringify(governanceMetrics)};`;
    const clientScript = this.getClientScript();
    const combinedScript = `${timelineScript}\n${clientScript}`;
    const scriptHash = createHash('sha256').update(combinedScript, 'utf8').digest('base64');
    const csp = [
      "default-src 'none'",
      "base-uri 'none'",
      "form-action 'none'",
      "img-src 'self' data:",
      "style-src 'self' 'sha256-" + styleHash + "'",
      "script-src 'self' https://cdn.jsdelivr.net 'sha256-" + scriptHash + "'",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join('; ');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="generator" content="git-spark v${this.escapeHtml(report.metadata.version)}">
  <meta name="report-date" content="${generatedAt}">
  <meta name="repository" content="${this.escapeHtml(repoName)}">
  <meta property="og:title" content="Git Activity Report - ${this.escapeHtml(repoName)}">
  <meta property="og:type" content="article">
  <meta property="og:description" content="${this.escapeHtml(`${report.repository.totalCommits} commits • ${report.repository.totalAuthors} contributors • Health ${healthPct}% • Gov ${governancePct}%`)}">
  <meta property="og:image" content="${ogImage}">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <title>Git Activity Report - ${this.escapeHtml(repoName)}</title>
  <style>${styleContent}</style>
  <script defer src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js" crossorigin="anonymous" integrity="sha384-QZ2d5E1hLN7FQErJg4InENcy+XUG6uHgnIY7qDpiRnwZ0wOYAV/QXpVZl8vGeO3O"></script>
</head>
<body>
  <div class="theme-toggle-wrapper"><button id="themeToggle" class="theme-toggle" aria-pressed="false" aria-label="Toggle dark mode">🌙</button></div>
  <a class="skip-link" href="#summary">Skip to content</a>
  <header class="site-header">
    <div class="header-inner">
      <div class="branding">Git Activity Report <span class="repo-name">${this.escapeHtml(repoName)}</span></div>
      <nav class="main-nav" aria-label="Section navigation">
        <ul>
          <li><a href="#summary">Summary</a></li>
          <li><a href="#authors">Authors</a></li>
          <li><a href="#files">Files</a></li>
          <li><a href="#risks">Risks</a></li>
          <li><a href="#governance">Governance</a></li>
          <li><a href="#timeline">Timeline</a></li>
          <li><a href="#meta">Metadata</a></li>
        </ul>
      </nav>
    </div>
  </header>
  <main class="report" id="top">
    <section id="summary" class="section">
      <h1>Executive Summary</h1>
      ${analysisPeriod ? `<p class="analysis-period" aria-label="Analysis date range">${this.escapeHtml(analysisPeriod)}</p>` : ''}
      <div class="summary-grid">
        ${keyMetrics
          .map(
            m =>
              `<div class="metric-card" tabindex="0"><div class="metric-value">${m.value}</div><div class="metric-label">${m.label}</div></div>`
          )
          .join('')}
      </div>
      <div class="export-actions" aria-label="Data export controls">
        <button class="btn" data-export="json" aria-label="Download JSON summary">Download JSON</button>
        <button class="btn" data-export="authors-csv" aria-label="Download authors CSV">Authors CSV</button>
        <button class="btn" data-export="files-csv" aria-label="Download files CSV">Files CSV</button>
      </div>
      <div class="health-badges" aria-label="Health Scores">
        <div class="health-score" data-rating="${this.getHealthRating(healthPct)}" title="Repository health score">${healthPct}% <span>${this.capitalize(this.getHealthRating(healthPct))}</span></div>
        <div class="gov-score" title="Governance score">${governancePct}% Governance</div>
      </div>
      <div class="insights">
        <h2>Key Insights</h2>
        <ul>
          ${report.summary.insights.map(i => `<li>${this.escapeHtml(i)}</li>`).join('') || '<li>No notable insights</li>'}
        </ul>
      </div>
      <div class="actions">
        <h2>Action Items</h2>
        <ul>${report.summary.actionItems.map(a => `<li>${this.escapeHtml(a)}</li>`).join('') || '<li>No critical actions</li>'}</ul>
      </div>
    </section>

    <section id="authors" class="section">
      <h2>Top Contributors</h2>
      <div class="table-wrapper" role="region" aria-label="Top authors table">
        <table class="data-table" data-sortable data-initial-limit="15" data-table="authors">
          <thead><tr><th scope="col">Author</th><th class="num" scope="col">Commits</th><th class="num" scope="col">Churn</th><th class="num" scope="col">Avg Size</th><th class="num" scope="col">Files</th></tr></thead>
          <tbody>${authorRows}</tbody>
        </table>
      </div>
      <button class="show-more" data-target-table="authors" hidden>Show more</button>
    </section>

    <section id="files" class="section">
      <h2>File Hotspots (Top 10)</h2>
      <div class="table-wrapper" role="region" aria-label="Top files table">
        <table class="data-table" data-sortable data-initial-limit="25" data-table="files">
          <thead><tr><th scope="col">File</th><th class="num" scope="col">Commits</th><th class="num" scope="col">Churn</th><th class="num" scope="col">Authors</th><th class="num" scope="col">Risk</th></tr></thead>
          <tbody>${riskRows}</tbody>
        </table>
      </div>
      <button class="show-more" data-target-table="files" hidden>Show more</button>
    </section>

    <section id="risks" class="section">
      <h2>Risk Overview</h2>
      <p class="risk-level-label">Overall Risk: <strong>${this.capitalize(report.risks.overallRisk)}</strong></p>
      <ul class="risk-factors">
        <li>High Churn Files: ${report.risks.riskFactors.highChurnFiles}</li>
        <li>Many Author Files: ${report.risks.riskFactors.manyAuthorFiles}</li>
        <li>Large Commits: ${report.risks.riskFactors.largeCommits}</li>
        <li>Recent Changes: ${report.risks.riskFactors.recentChanges}</li>
      </ul>
      <div class="recommendations">
        <h3>Recommendations</h3>
        <ul>${report.risks.recommendations.map(r => `<li>${this.escapeHtml(r)}</li>`).join('') || '<li>No recommendations</li>'}</ul>
      </div>
      <div class="chart-row">
        <div class="chart-box">
          <h3 class="chart-title">Risk Factors</h3>
          <canvas id="riskFactorsChart" height="220" aria-label="Risk factor distribution" role="img"></canvas>
          <div id="riskFactorsFallback" class="fallback" hidden>Risk factors chart unavailable</div>
        </div>
      </div>
    </section>

    <section id="governance" class="section">
      <h2>Governance & Code Quality</h2>
      <div class="gov-grid">
        <div class="gov-card">Conventional Commits: ${numberFmt(report.governance.conventionalCommits)}</div>
        <div class="gov-card">Traceability: ${pctFmt(report.governance.traceabilityScore * 100)}</div>
        <div class="gov-card">Avg Message Length: ${report.governance.avgMessageLength.toFixed(1)}</div>
        <div class="gov-card">WIP Commits: ${numberFmt(report.governance.wipCommits)}</div>
        <div class="gov-card">Reverts: ${numberFmt(report.governance.revertCommits)}</div>
        <div class="gov-card">Short Messages: ${numberFmt(report.governance.shortMessages)}</div>
      </div>
      <h3>Governance Recommendations</h3>
      <ul>${report.governance.recommendations.map(r => `<li>${this.escapeHtml(r)}</li>`).join('') || '<li>No governance recommendations</li>'}</ul>
      <div class="chart-row">
        <div class="chart-box">
          <h3 class="chart-title">Governance Metrics</h3>
          <canvas id="governanceChart" height="240" aria-label="Governance metrics visualization" role="img"></canvas>
          <div id="governanceFallback" class="fallback" hidden>Governance chart unavailable</div>
        </div>
      </div>
    </section>

    <section id="timeline" class="section">
      <h2>Activity Timeline</h2>
      <fieldset class="dataset-toggles" aria-label="Timeline dataset toggles">
        <legend class="sr-only">Datasets</legend>
        <label><input type="checkbox" data-dataset="commits" checked> Commits</label>
        <label><input type="checkbox" data-dataset="churn" checked> Churn</label>
        <label><input type="checkbox" data-dataset="authors" checked> Authors</label>
      </fieldset>
      <div class="chart-wrapper">
        <canvas id="timelineChart" height="320" aria-label="Activity timeline" role="img"></canvas>
        <div id="timelineFallback" class="fallback" hidden>Timeline unavailable (Chart library not loaded).</div>
      </div>
    </section>

    <section id="meta" class="section">
      <h2>Report Metadata</h2>
      <dl class="meta-grid">
        <dt>Generated</dt><dd>${this.escapeHtml(new Date(report.metadata.generatedAt).toLocaleString())}</dd>
        <dt>Version</dt><dd>${this.escapeHtml(report.metadata.version)}</dd>
        <dt>Branch</dt><dd>${this.escapeHtml(report.metadata.branch || '')}</dd>
        <dt>Commit</dt><dd><code>${this.escapeHtml((report.metadata.commit || '').slice(0, 8))}</code></dd>
        <dt>Processing Time</dt><dd>${(report.metadata.processingTime / 1000).toFixed(2)}s</dd>
        <dt>Repo Path</dt><dd>${this.escapeHtml(report.metadata.repoPath)}</dd>
        ${warnings.length ? `<dt>Warnings</dt><dd><ul class="warnings">${warnings.map(w => `<li>${this.escapeHtml(w)}</li>`).join('')}</ul></dd>` : ''}
      </dl>
    </section>
  </main>
  <footer class="site-footer" role="contentinfo">Generated by git-spark v${this.escapeHtml(report.metadata.version)} • ${this.escapeHtml(new Date(report.metadata.generatedAt).toLocaleString())}</footer>
  <button id="backToTop" class="back-to-top" aria-label="Back to top" hidden>▲</button>
  <div id="liveRegion" class="sr-only" aria-live="polite" aria-atomic="true"></div>
  <script>${combinedScript}</script>
</body>
</html>`;
    return html;
  }

  /**
   * Get custom CSS styles for the HTML report
   *
   * @returns CSS styles as string
   * @private
   */
  private getCustomStyles(): string {
    return `
      :root {
        --color-primary: #0066cc;
        --color-success: #28a745;
        --color-warning: #fd7e14;
        --color-danger: #dc3545;
        --color-bg: #f5f7fb;
        --color-surface: #ffffff;
        --color-border: #dde3ea;
        --color-text: #222222;
        --color-text-secondary: #6c757d;
        --shadow-sm: 0 2px 4px rgba(0,0,0,0.08);
      }
      :root.dark {
        --color-bg: #121417;
        --color-surface: #1e2227;
        --color-border: #2c3239;
        --color-text: #e6e8ea;
        --color-text-secondary: #97a0ab;
      }
      html { scroll-behavior: smooth; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: var(--color-bg); color: var(--color-text); margin:0; }
      .skip-link { position:absolute; left:-999px; top:auto; width:1px; height:1px; overflow:hidden; }
      .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0; }
      .skip-link:focus { position:static; width:auto; height:auto; padding:.5rem 1rem; background:#000; color:#fff; z-index:999; }
      .theme-toggle-wrapper { position:fixed; top:.5rem; right:.5rem; z-index:150; }
      .theme-toggle { background:var(--color-surface); color:var(--color-text); border:1px solid var(--color-border); padding:.4rem .6rem; border-radius:4px; cursor:pointer; box-shadow:var(--shadow-sm); font-size:.85rem; }
      .theme-toggle:hover, .theme-toggle:focus { border-color: var(--color-primary); }
      .site-header { position:sticky; top:0; background:var(--color-surface); border-bottom:1px solid var(--color-border); z-index:100; box-shadow:var(--shadow-sm); }
      .header-inner { display:flex; align-items:center; justify-content:space-between; max-width:1200px; margin:0 auto; padding:.5rem 1rem; }
      .branding { font-weight:600; font-size:1rem; }
      .repo-name { color:var(--color-primary); font-weight:700; }
      .main-nav ul { list-style:none; display:flex; gap:1rem; margin:0; padding:0; }
      .main-nav a { text-decoration:none; color:var(--color-text-secondary); font-size:.9rem; }
      .main-nav a:hover, .main-nav a:focus { color:var(--color-primary); }
      .report { max-width:1200px; margin:0 auto; padding:1rem; }
      .section { background:var(--color-surface); padding:1.2rem 1.4rem; margin:1.2rem 0; border:1px solid var(--color-border); border-radius:8px; box-shadow:var(--shadow-sm); }
      h1 { font-size:2rem; margin:.2rem 0 1rem; }
      h2 { font-size:1.4rem; margin:0 0 .75rem; }
      h3 { font-size:1.15rem; margin:1rem 0 .5rem; }
      .summary-grid { display:grid; gap:.75rem; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); margin-bottom:1rem; }
      .metric-card { background:var(--color-surface); border:1px solid var(--color-border); border-radius:6px; padding:.6rem .75rem; text-align:center; display:flex; flex-direction:column; gap:.25rem; box-shadow:var(--shadow-sm); }
      .metric-card:focus { outline:2px solid var(--color-primary); outline-offset:2px; }
      .metric-value { font-size:1.2rem; font-weight:600; }
      .metric-label { font-size:.7rem; text-transform:uppercase; letter-spacing:.05em; color:var(--color-text-secondary); }
      .health-badges { display:flex; gap:1rem; align-items:center; flex-wrap:wrap; margin:.5rem 0 1rem; }
      .health-score, .gov-score { padding:.6rem .9rem; border-radius:6px; font-weight:600; background:var(--color-primary); color:#fff; display:inline-flex; align-items:center; gap:.5rem; }
      .health-score[data-rating='excellent'] { background:var(--color-success); }
      .health-score[data-rating='good'] { background:var(--color-primary); }
      .health-score[data-rating='fair'] { background:var(--color-warning); }
      .health-score[data-rating='poor'] { background:var(--color-danger); }
  .analysis-period { font-size:.8rem; margin:.25rem 0 1rem; color:var(--color-text-secondary); }
      ul { padding-left:1.1rem; }
      li { margin:.25rem 0; }
      .table-wrapper { overflow:auto; border:1px solid var(--color-border); border-radius:6px; }
      table.data-table { width:100%; border-collapse:collapse; font-size:.85rem; }
      table.data-table th, table.data-table td { padding:.5rem .6rem; border-bottom:1px solid var(--color-border); text-align:left; }
      table.data-table th.num, table.data-table td.num { text-align:right; }
      table.data-table tbody tr:hover { background:#f2f6fa; }
      code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace; font-size:.75rem; }
      .risk-badge { padding:.25rem .5rem; border-radius:4px; font-size:.65rem; font-weight:600; }
      .risk-high { background:var(--color-danger); color:#fff; }
      .risk-medium { background:var(--color-warning); color:#000; }
      .risk-low { background:var(--color-success); color:#fff; }
      .risk-minimal { background:#3b7ddd; color:#fff; }
      .gov-grid { display:grid; gap:.5rem; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); margin-bottom:.75rem; }
      .gov-card { background:var(--color-bg); border:1px solid var(--color-border); padding:.6rem .7rem; border-radius:4px; font-size:.7rem; font-weight:500; }
      .chart-wrapper { position:relative; min-height:320px; }
      .fallback { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:.85rem; color:var(--color-text-secondary); }
      .meta-grid { display:grid; grid-template-columns: 120px 1fr; gap:.35rem .75rem; font-size:.75rem; }
      .meta-grid dt { font-weight:600; }
      .site-footer { text-align:center; padding:1.5rem .5rem 3rem; font-size:.7rem; color:var(--color-text-secondary); }
      .back-to-top { position:fixed; bottom:1rem; right:1rem; background:var(--color-primary); color:#fff; border:none; padding:.55rem .7rem; border-radius:4px; font-size:.85rem; cursor:pointer; box-shadow:var(--shadow-sm); }
      .back-to-top:hover, .back-to-top:focus { background:#004f99; }
      .warnings { margin:0; padding-left:1rem; }
      .warnings li { font-size:.7rem; }
      @media (max-width: 760px) { .main-nav ul { flex-wrap:wrap; gap:.5rem; } .branding { font-size:.85rem; } }
      @media print { .site-header, .back-to-top { display:none !important; } body { background:#fff; } .section { page-break-inside:avoid; } }
      @media (prefers-reduced-motion: reduce) { * { animation-duration:0.01ms !important; transition-duration:0.01ms !important; } }
      .dataset-toggles { display:flex; gap:1rem; font-size:.7rem; margin:.25rem 0 .75rem; border:1px solid var(--color-border); padding:.5rem .75rem; border-radius:6px; }
      .dataset-toggles label { display:flex; align-items:center; gap:.35rem; cursor:pointer; }
      .export-actions { display:flex; gap:.6rem; flex-wrap:wrap; margin:.4rem 0 1rem; }
      .btn, .show-more { background:var(--color-primary); color:#fff; border:1px solid var(--color-primary); padding:.4rem .7rem; border-radius:4px; cursor:pointer; font-size:.7rem; font-weight:500; box-shadow:var(--shadow-sm); }
      .btn:hover, .btn:focus, .show-more:hover, .show-more:focus { background:#004f99; }
      :root.dark .btn, :root.dark .show-more { background:#2489ff; border-color:#2489ff; }
      .show-more { margin-top:.6rem; }
      .hidden-row { display:none; }
    `;
  }

  /**
   * Escape HTML special characters
   *
   * @param text - Text to escape
   * @returns Escaped HTML text
   * @private
   */
  private escapeHtml(text: string): string {
    return (text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private truncatePath(p: string, max = 40): string {
    if (p.length <= max) return p;
    const half = Math.floor((max - 3) / 2);
    return p.slice(0, half) + '...' + p.slice(-half);
  }

  private getRiskBand(riskPercent: number): string {
    if (riskPercent >= 70) return 'high';
    if (riskPercent >= 50) return 'medium';
    if (riskPercent >= 30) return 'low';
    return 'minimal';
  }

  private getHealthRating(scorePercent: number): string {
    if (scorePercent >= 80) return 'excellent';
    if (scorePercent >= 60) return 'good';
    if (scorePercent >= 40) return 'fair';
    return 'poor';
  }

  private capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  private getClientScript(): string {
    return `(() => {
      const data = window.__GIT_SPARK_TIMELINE__ || [];
      const exportData = (window as any).__GIT_SPARK_DATA__ || {};
      const riskFactors = (window as any).__GIT_SPARK_RISK_FACTORS__ || [];
      const govMetrics = (window as any).__GIT_SPARK_GOV_METRICS__ || [];
      const backBtn = document.getElementById('backToTop');
      const root = document.documentElement;
      const themeToggle = document.getElementById('themeToggle');
      const savedTheme = localStorage.getItem('gitSparkTheme');
      if (savedTheme === 'dark') {
        root.classList.add('dark');
        themeToggle?.setAttribute('aria-pressed','true');
        (themeToggle as any).textContent = '☀️';
      }
      themeToggle?.addEventListener('click', () => {
        const isDark = root.classList.toggle('dark');
        themeToggle?.setAttribute('aria-pressed', isDark ? 'true' : 'false');
        (themeToggle as any).textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('gitSparkTheme', isDark ? 'dark' : 'light');
        // Update chart colors on theme change
        if ((window as any).__gitSparkCharts) {
          (window as any).__gitSparkCharts.forEach((c: any) => { try { adaptChartColors(c); c.update(); } catch(e){} });
        }
      });
      window.addEventListener('scroll', () => {
        if (window.scrollY > 300) backBtn?.removeAttribute('hidden'); else backBtn?.setAttribute('hidden','');
      });
      backBtn?.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));
      function adaptChartColors(chart: any){
        const dark = root.classList.contains('dark');
        const text = dark ? '#e6e8ea' : '#222';
        const grid = dark ? '#333b44' : '#dde3ea';
        if (chart.options?.scales) {
          Object.values(chart.options.scales).forEach((s: any) => { if(!s) return; s.grid = { color: grid }; s.ticks = { color: text }; });
        }
        if (chart.options?.plugins?.legend?.labels) chart.options.plugins.legend.labels.color = text;
      }
      function initTimeline(){
        if (!('Chart' in window)) { document.getElementById('timelineFallback')?.removeAttribute('hidden'); return; }
        try {
          const ctx = document.getElementById('timelineChart') as any;
          if(!ctx) return;
          const commits = data.map((d:any) => ({ x: d.x, y: d.commits }));
          const churn = data.map((d:any) => ({ x: d.x, y: d.churn }));
          const authors = data.map((d:any) => ({ x: d.x, y: d.authors }));
          const chart = new (window as any).Chart(ctx, {
            type:'line',
            data:{ datasets:[
              { label:'Commits', data: commits, yAxisID:'y', tension:0.25, borderWidth:2, pointRadius:0, borderColor:'#0066cc', backgroundColor:'rgba(0,102,204,0.15)', fill:true },
              { label:'Churn', data: churn, yAxisID:'y1', tension:0.25, borderWidth:2, pointRadius:0, borderDash:[4,3], borderColor:'#fd7e14', backgroundColor:'rgba(253,126,20,0.12)', fill:true },
              { label:'Authors', data: authors, yAxisID:'y', tension:0.25, borderWidth:2, pointRadius:0, borderColor:'#28a745', backgroundColor:'rgba(40,167,69,0.15)', fill:false }
            ] },
            options:{
              responsive:true,
              maintainAspectRatio:false,
              interaction:{ mode:'index', intersect:false },
              plugins:{
                legend:{ position:'bottom' },
                tooltip:{ callbacks:{ label:(pt:any)=> pt.dataset.label + ': ' + pt.parsed.y } }
              },
              scales:{
                x:{ type:'time', time:{ unit:'day' } },
                y:{ beginAtZero:true, title:{ display:true, text:'Commits / Authors' } },
                y1:{ beginAtZero:true, position:'right', grid:{ drawOnChartArea:false }, title:{ display:true, text:'Churn' } }
              }
            }
          });
          adaptChartColors(chart);
          (window as any).__gitSparkCharts = (window as any).__gitSparkCharts || []; (window as any).__gitSparkCharts.push(chart);
          // Dataset toggle
          document.querySelectorAll('.dataset-toggles input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', () => {
              const ds = (cb as HTMLInputElement).dataset.dataset;
              chart.data.datasets.forEach((d:any) => { if (d.label.toLowerCase() === ds) d.hidden = !(cb as HTMLInputElement).checked; });
              chart.update();
            });
          });
        } catch(e){ document.getElementById('timelineFallback')?.removeAttribute('hidden'); }
      }
      function initRiskFactors(){
        if (!('Chart' in window)) { document.getElementById('riskFactorsFallback')?.removeAttribute('hidden'); return; }
        try {
          const ctx = document.getElementById('riskFactorsChart') as any; if(!ctx) return;
          const labels = riskFactors.map((r:any)=> r[0]);
          const values = riskFactors.map((r:any)=> r[1]);
          const chart = new (window as any).Chart(ctx, { type:'bar', data:{ labels, datasets:[{ label:'Count', data: values, backgroundColor:'#dc3545' }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } } } });
          adaptChartColors(chart); (window as any).__gitSparkCharts.push(chart);
        } catch(e){ document.getElementById('riskFactorsFallback')?.removeAttribute('hidden'); }
      }
      function initGovernance(){
        if (!('Chart' in window)) { document.getElementById('governanceFallback')?.removeAttribute('hidden'); return; }
        try {
          const ctx = document.getElementById('governanceChart') as any; if(!ctx) return;
          const labels = govMetrics.map((g:any)=>g[0]);
          const values = govMetrics.map((g:any)=>g[1]);
          const chart = new (window as any).Chart(ctx, { type:'radar', data:{ labels, datasets:[{ label:'Governance', data: values, fill:true, backgroundColor:'rgba(0,102,204,0.25)', borderColor:'#0066cc', pointBackgroundColor:'#0066cc' }] }, options:{ responsive:true, maintainAspectRatio:false, scales:{ r:{ beginAtZero:true, ticks:{ precision:0 } } } } });
          adaptChartColors(chart); (window as any).__gitSparkCharts.push(chart);
        } catch(e){ document.getElementById('governanceFallback')?.removeAttribute('hidden'); }
      }
      function makeSortable(){
        document.querySelectorAll('table[data-sortable]')?.forEach(table => {
          table.querySelectorAll('th')?.forEach((th, idx) => {
            th.addEventListener('click', () => {
              const tbody = table.querySelector('tbody');
              if(!tbody) return;
              const rows = Array.from(tbody.querySelectorAll('tr'));
              const dir = th.getAttribute('data-sort-dir') === 'asc' ? 'desc' : 'asc';
              table.querySelectorAll('th').forEach(h => h.removeAttribute('aria-sort'));
              th.setAttribute('aria-sort', dir === 'asc' ? 'ascending' : 'descending');
              th.setAttribute('data-sort-dir', dir);
              rows.sort((a,b) => {
                const av = (a.querySelectorAll('td')[idx] || {}).getAttribute?.('data-sort') || '0';
                const bv = (b.querySelectorAll('td')[idx] || {}).getAttribute?.('data-sort') || '0';
                const na = parseFloat(av); const nb = parseFloat(bv);
                if(!isNaN(na) && !isNaN(nb)) return dir==='asc'? na-nb : nb-na;
                return dir==='asc'? av.localeCompare(bv) : bv.localeCompare(av);
              });
              rows.forEach(r => tbody.appendChild(r));
              const live = document.getElementById('liveRegion');
              if(live) live.textContent = 'Sorted column ' + (th as HTMLElement).innerText + ' ' + dir;
            });
          });
        });
      }
      function initPagination(){
        document.querySelectorAll('table[data-initial-limit]')?.forEach(table => {
          const limit = parseInt((table as HTMLElement).dataset.initialLimit || '0');
          if(!limit) return;
            const rows = Array.from(table.querySelectorAll('tbody tr'));
            if(rows.length <= limit) return;
            rows.slice(limit).forEach(r => r.classList.add('hidden-row'));
            const name = (table as HTMLElement).dataset.table;
            const btn = document.querySelector('button.show-more[data-target-table="' + name + '"]');
            if(btn){
              (btn as HTMLButtonElement).hidden = false;
              btn?.addEventListener('click', () => {
                rows.slice(limit).forEach(r => r.classList.toggle('hidden-row'));
                const expanded = rows.slice(limit)[0].classList.contains('hidden-row') === false;
                (btn as HTMLButtonElement).textContent = expanded ? 'Show less' : 'Show more';
              });
            }
        });
      }
      function initExport(){
        document.querySelectorAll('.export-actions button[data-export]')?.forEach(btn => {
          btn.addEventListener('click', () => {
            const kind = (btn as HTMLElement).getAttribute('data-export');
            if(kind === 'json') {
              const blob = new Blob([JSON.stringify(exportData, null, 2)], { type:'application/json' });
              triggerDownload(blob, 'git-spark-summary.json');
            } else if (kind === 'authors-csv') {
              const header = 'name,commits,churn,files_changed,avg_commit_size,largest_commit';
              const rows = (exportData.authors||[]).map((a:any)=> [a.name,a.commits,a.churn,a.filesChanged,a.avgCommitSize,a.largestCommit].join(','));
              const blob = new Blob([ [header].concat(rows).join('\n') ], { type:'text/csv' });
              triggerDownload(blob, 'git-spark-authors.csv');
            } else if (kind === 'files-csv') {
              const header = 'path,commits,authors,churn,riskScore';
              const rows = (exportData.files||[]).map((f:any)=> [f.path,f.commits,f.authors,f.churn,f.riskScore].join(','));
              const blob = new Blob([ [header].concat(rows).join('\n') ], { type:'text/csv' });
              triggerDownload(blob, 'git-spark-files.csv');
            }
          });
        });
      }
      function triggerDownload(blob: Blob, filename: string){
        const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 200); }
      if (document.readyState === 'complete' || document.readyState === 'interactive') setTimeout(() => { initTimeline(); makeSortable(); }, 0); else document.addEventListener('DOMContentLoaded', () => { initTimeline(); makeSortable(); });
      document.addEventListener('DOMContentLoaded', () => { initRiskFactors(); initGovernance(); initPagination(); initExport(); });
    })();`;
  }
}
