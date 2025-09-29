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
        <td><a href="#author-${this.escapeHtml(a.email.replace(/[^a-zA-Z0-9]/g, '-'))}" class="author-link">${this.escapeHtml(a.name)}</a></td>
        <td class="num" data-sort="${a.commits}">${numberFmt(a.commits)}</td>
        <td class="num" data-sort="${a.churn}" title="+${a.insertions} / -${a.deletions}">+${numberFmt(a.insertions)} / -${numberFmt(a.deletions)}</td>
        <td class="num" data-sort="${a.avgCommitSize.toFixed(2)}">${a.avgCommitSize.toFixed(1)}</td>
        <td class="num" data-sort="${a.filesChanged}">${a.filesChanged}</td>
      </tr>`
      )
      .join('');

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

    // Prepare standalone styles without external dependencies
    const styleContent = this.getCustomStyles();
    const styleHash = createHash('sha256').update(styleContent, 'utf8').digest('base64');
    const basicScript = this.getBasicScript();

    // Generate a deterministic nonce based on script content hash
    const scriptNonce = createHash('sha256')
      .update(basicScript, 'utf8')
      .digest('hex')
      .substring(0, 16);

    const csp = [
      "default-src 'none'",
      "base-uri 'none'",
      "form-action 'none'",
      "img-src 'self' data:",
      "style-src 'self' 'sha256-" + styleHash + "'",
      "script-src 'self' 'nonce-" + scriptNonce + "'",
      "font-src 'self'",
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
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📊</text></svg>">
  <title>Git Activity Report - ${this.escapeHtml(repoName)}</title>
  <style>${styleContent}</style>
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
          <li><a href="#author-details">Author Details</a></li>
          <li><a href="#files">Files</a></li>
          <li><a href="#risks">Risks</a></li>
          <li><a href="#governance">Governance</a></li>
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

    <section id="author-details" class="section">
      <h2>Detailed Author Profiles</h2>
      <div class="author-profiles">
        ${this.generateDetailedAuthorProfiles(report.authors.slice(0, 10))}
      </div>
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
      <div class="dataset-toggles">
        <button class="dataset-toggle active" data-toggle="risk-overview">Overview</button>
        <button class="dataset-toggle" data-toggle="risk-details">Details</button>
      </div>
      <div id="riskFactorsChart" class="chart-container">
        <!-- Risk factors chart placeholder -->
      </div>
      <div class="recommendations">
        <h3>Recommendations</h3>
        <ul>${report.risks.recommendations.map(r => `<li>${this.escapeHtml(r)}</li>`).join('') || '<li>No recommendations</li>'}</ul>
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
      <div id="governanceChart" class="chart-container">
        <!-- Governance chart placeholder -->
      </div>
      <h3>Governance Recommendations</h3>
      <ul>${report.governance.recommendations.map(r => `<li>${this.escapeHtml(r)}</li>`).join('') || '<li>No governance recommendations</li>'}</ul>
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
  <script nonce="${scriptNonce}">${basicScript}</script>
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
      .export-actions { display:flex; gap:.6rem; flex-wrap:wrap; margin:.4rem 0 1rem; }
      .btn, .show-more { background:var(--color-primary); color:#fff; border:1px solid var(--color-primary); padding:.4rem .7rem; border-radius:4px; cursor:pointer; font-size:.7rem; font-weight:500; box-shadow:var(--shadow-sm); }
      .btn:hover, .btn:focus, .show-more:hover, .show-more:focus { background:#004f99; }
      :root.dark .btn, :root.dark .show-more { background:#2489ff; border-color:#2489ff; }
      .show-more { margin-top:.6rem; }
      .hidden-row { display:none; }
      
      /* Author Profile Styles */
      .author-link { color:var(--color-primary); text-decoration:none; font-weight:500; }
      .author-link:hover { text-decoration:underline; }
      .author-profiles { display:flex; flex-direction:column; gap:1.5rem; }
      .author-profile-card { background:var(--color-surface); border:1px solid var(--color-border); border-radius:8px; padding:1.5rem; box-shadow:var(--shadow-sm); }
      .author-header { margin-bottom:1rem; border-bottom:1px solid var(--color-border); padding-bottom:1rem; }
      .author-header h3 { margin:0; font-size:1.4rem; color:var(--color-text); }
      .author-email { color:var(--color-text-secondary); font-size:.85rem; font-family:ui-monospace, monospace; }
      .author-period { color:var(--color-text-secondary); font-size:.8rem; margin-top:.25rem; }
      
      .contribution-overview, .work-patterns, .collaboration, .code-focus, .commit-distribution, .insights-section { margin-bottom:1.25rem; }
      .contribution-overview h4, .work-patterns h4, .collaboration h4, .code-focus h4, .commit-distribution h4, .insights-section h4 { 
        margin:0 0 .75rem; font-size:1.1rem; color:var(--color-text); border-bottom:1px solid var(--color-border); padding-bottom:.5rem; 
      }
      
      .metrics-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(120px, 1fr)); gap:.75rem; margin-bottom:.75rem; }
      .metric-box { background:var(--color-bg); border:1px solid var(--color-border); border-radius:6px; padding:.75rem; text-align:center; }
      .metric-box .metric-value { font-size:1.2rem; font-weight:600; color:var(--color-primary); }
      .metric-box .metric-label { font-size:.7rem; color:var(--color-text-secondary); text-transform:uppercase; margin-top:.25rem; }
      
      .summary-stats { font-size:.85rem; color:var(--color-text-secondary); text-align:center; padding:.5rem; background:var(--color-bg); border-radius:4px; }
      .pattern-info, .collab-stats, .focus-info { font-size:.85rem; line-height:1.4; }
      .pattern-info div, .collab-stats div, .focus-info div { margin:.25rem 0; }
      
      .size-distribution { background:var(--color-bg); padding:.75rem; border-radius:6px; border:1px solid var(--color-border); }
      .size-bar { display:flex; align-items:center; margin:.5rem 0; gap:.75rem; }
      .size-label { min-width:120px; font-size:.75rem; color:var(--color-text-secondary); }
      .size-bar-container { flex:1; position:relative; background:var(--color-border); height:24px; border-radius:12px; overflow:hidden; }
      .size-bar-fill { height:100%; border-radius:12px; transition:width 0.3s ease; min-width:0; }
      .size-bar-fill.micro { background:#28a745; }
      .size-bar-fill.small { background:#20c997; }
      .size-bar-fill.medium { background:#ffc107; }
      .size-bar-fill.large { background:#fd7e14; }
      .size-bar-fill.very-large { background:#dc3545; }
      .size-percentage { position:absolute; right:.5rem; top:50%; transform:translateY(-50%); font-size:.7rem; font-weight:500; color:var(--color-text); background:var(--color-surface); padding:.1rem .4rem; border-radius:10px; border:1px solid var(--color-border); }
      .size-percentage.no-data { background:transparent; border:none; color:var(--color-text-secondary); }
      
      .insights-content { display:flex; flex-direction:column; gap:.5rem; }
      .insight { padding:.5rem .75rem; border-radius:4px; font-size:.85rem; }
      .insight.positive { background:#d4edda; color:#155724; border-left:4px solid #28a745; }
      .insight.growth { background:#fff3cd; color:#856404; border-left:4px solid #ffc107; }
      .largest-commit { background:var(--color-bg); padding:.75rem; border-radius:4px; font-size:.85rem; margin-top:.5rem; }
      .largest-commit strong { color:var(--color-primary); }
      .largest-commit em { color:var(--color-text-secondary); }
      .no-data { text-align:center; color:var(--color-text-secondary); font-size:.85rem; padding:1rem; }
      
      /* Dataset toggle functionality */
      .dataset-toggles { display:flex; gap:.5rem; margin:.5rem 0; }
      .dataset-toggle { background:var(--color-surface); border:1px solid var(--color-border); padding:.3rem .6rem; border-radius:4px; cursor:pointer; font-size:.75rem; }
      .dataset-toggle.active { background:var(--color-primary); color:#fff; }
      
      /* Responsive design for author profiles */
      @media (max-width: 768px) { 
        .metrics-grid { grid-template-columns:repeat(2, 1fr); }
        .size-bar { flex-direction:column; align-items:flex-start; gap:.25rem; }
        .size-label { min-width:auto; }
        .size-bar-container { width:100%; }
      }
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

  private generateDetailedAuthorProfiles(authors: any[]): string {
    return authors.map(author => this.generateAuthorProfileCard(author)).join('\n');
  }

  private generateAuthorProfileCard(author: any): string {
    const metrics = author.detailed;
    const authorId = this.escapeHtml(author.email.replace(/[^a-zA-Z0-9]/g, '-'));
    const numberFmt = (n: number) => new Intl.NumberFormat().format(n);
    const pctFmt = (n: number) => `${n.toFixed(1)}%`;
    const dateRange = `${author.firstCommit.toISOString().split('T')[0]} → ${author.lastCommit.toISOString().split('T')[0]}`;

    // Safely access detailed metrics with fallbacks
    const contribution = metrics?.contribution || {};
    const collaboration = metrics?.collaboration || {};
    const workPattern = metrics?.workPattern || {};
    const quality = metrics?.quality || {};
    const insights = metrics?.insights || {
      positivePatterns: [],
      growthAreas: [],
      recommendations: [],
    };

    return `
    <div class="author-profile-card" id="author-${authorId}">
      <div class="author-header">
        <h3>${this.escapeHtml(author.name)}</h3>
        <span class="author-email">${this.escapeHtml(author.email)}</span>
        <div class="author-period">Active: ${dateRange} (${author.activeDays} days)</div>
      </div>

      <div class="contribution-overview">
        <h4>Contribution Overview</h4>
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
        </div>
        <div class="summary-stats">
          Avg: ${author.avgCommitSize.toFixed(1)} lines/commit • 
          ${(contribution.filesAndScope?.avgFilesPerCommit || 0).toFixed(1)} files/commit • 
          ${(contribution.commitFrequency || 0).toFixed(2)}/day
        </div>
      </div>

      <div class="work-patterns">
        <h4>Work Patterns</h4>
        <div class="pattern-info">
          <div><strong>${workPattern.commitTiming?.mostActiveDay?.day || 'N/A'}</strong> Peak Day • 
          <strong>${workPattern.commitTiming?.mostActiveTime?.timeRange || 'N/A'}</strong> Peak Time</div>
          <div><strong>${workPattern.commitTiming?.workPattern || 'N/A'}</strong> ${pctFmt(workPattern.workLifeBalance?.weekendPercentage || 0)} weekends</div>
          <div>After hours: ${pctFmt(workPattern.workLifeBalance?.afterHoursPercentage || 0)} • 
          Consistency: ${(workPattern.temporalPatterns?.consistencyScore || 0).toFixed(0)}/100</div>
        </div>
      </div>

      <div class="collaboration">
        <h4>Collaboration</h4>
        <div class="collab-stats">
          <div>PR Integration: ${pctFmt(collaboration.prIntegrationRate || 0)} • 
          Issue refs: ${pctFmt(quality.commitMessageQuality?.issueTraceabilityRate || 0)} • 
          Co-authored: ${pctFmt(collaboration.coAuthorshipRate || 0)}</div>
          <div>Message Quality: ${(quality.commitMessageQuality?.overallScore || 0).toFixed(0)}/100</div>
          <div>Knowledge sharing: ${pctFmt(collaboration.knowledgeSharingIndex || 0)}</div>
        </div>
      </div>

      <div class="code-focus">
        <h4>Code Focus</h4>
        <div class="focus-info">
          <div>Primary areas: ${this.getTopDirectories(contribution.filesAndScope?.directoryFocus || [])}</div>
          <div>File diversity: ${pctFmt(contribution.filesAndScope?.fileDiversityScore || 0)} of codebase</div>
          <div>Source: +${numberFmt(contribution.filesAndScope?.sourceVsPublishedRatio?.sourceLines?.insertions || 0)} / 
          -${numberFmt(contribution.filesAndScope?.sourceVsPublishedRatio?.sourceLines?.deletions || 0)} 
          (${numberFmt(contribution.filesAndScope?.sourceVsPublishedRatio?.sourceCommits || 0)} commits)</div>
        </div>
      </div>

      <div class="commit-distribution">
        <h4>Commit Size Distribution</h4>
        <div class="size-distribution">
          ${this.generateCommitSizeChart(contribution.commitSizeDistribution || {})}
        </div>
      </div>

      <div class="insights-section">
        <h4>Insights & Details</h4>
        <div class="insights-content">
          ${
            insights.positivePatterns?.length > 0
              ? insights.positivePatterns
                  .map((p: string) => `<div class="insight positive">✓ ${this.escapeHtml(p)}</div>`)
                  .join('')
              : ''
          }
          ${
            insights.growthAreas?.length > 0
              ? insights.growthAreas
                  .map((g: string) => `<div class="insight growth">→ ${this.escapeHtml(g)}</div>`)
                  .join('')
              : ''
          }
          
          ${
            contribution.largestCommitDetails?.size > 0
              ? `
          <div class="largest-commit">
            <strong>Biggest commit:</strong> ${numberFmt(contribution.largestCommitDetails.size)} lines 
            (${contribution.largestCommitDetails.hash.substring(0, 7)}) on 
            ${contribution.largestCommitDetails.date.toLocaleDateString()}<br>
            <em>"${this.escapeHtml(contribution.largestCommitDetails.message)}"</em>
          </div>`
              : ''
          }
        </div>
      </div>
    </div>`;
  }

  private getTopDirectories(directoryFocus: any[]): string {
    if (!directoryFocus || directoryFocus.length === 0) return 'N/A';

    return directoryFocus
      .slice(0, 3)
      .map(d => `${d.directory}/ (${d.percentage.toFixed(0)}%)`)
      .join(', ');
  }

  private generateCommitSizeChart(distribution: any): string {
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
        const minWidth = hasData ? Math.max(percentage, 5) : 0; // Minimum 5% width for visibility when there's data

        return `
        <div class="size-bar">
          <div class="size-label">${bar.label}</div>
          <div class="size-bar-container">
            <div class="size-bar-fill ${bar.class}" style="width: ${minWidth}%" ${hasData ? `data-actual="${percentage.toFixed(1)}"` : ''}></div>
            <span class="size-percentage ${hasData ? 'has-data' : 'no-data'}">${bar.count} (${percentage.toFixed(1)}%)</span>
          </div>
        </div>`;
      })
      .join('');
  }

  private capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  private getBasicScript(): string {
    return `(() => {
      const exportData = {
        repository: {
          totalCommits: ${JSON.stringify('TODO')},
          totalAuthors: ${JSON.stringify('TODO')},
          totalFiles: ${JSON.stringify('TODO')},
          healthScore: ${JSON.stringify('TODO')},
          governanceScore: ${JSON.stringify('TODO')},
          busFactor: ${JSON.stringify('TODO')},
        },
        authors: [],
        files: [],
        risks: {},
        governance: {},
      };
      
      const backBtn = document.getElementById('backToTop');
      const root = document.documentElement;
      const themeToggle = document.getElementById('themeToggle');
      const savedTheme = localStorage.getItem('gitSparkTheme');
      
      if (savedTheme === 'dark') {
        root.classList.add('dark');
        themeToggle?.setAttribute('aria-pressed','true');
        if (themeToggle) themeToggle.textContent = '☀️';
      }
      
      themeToggle?.addEventListener('click', () => {
        const isDark = root.classList.toggle('dark');
        themeToggle?.setAttribute('aria-pressed', isDark ? 'true' : 'false');
        if (themeToggle) themeToggle.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('gitSparkTheme', isDark ? 'dark' : 'light');
      });
      
      window.addEventListener('scroll', () => {
        if (window.scrollY > 300) backBtn?.removeAttribute('hidden'); 
        else backBtn?.setAttribute('hidden','');
      });
      
      backBtn?.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));
      
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
              if(live) live.textContent = 'Sorted column ' + th.innerText + ' ' + dir;
            });
          });
        });
      }
      
      function initPagination(){
        document.querySelectorAll('table[data-initial-limit]')?.forEach(table => {
          const limit = parseInt(table.dataset.initialLimit || '0');
          if(!limit) return;
          const rows = Array.from(table.querySelectorAll('tbody tr'));
          if(rows.length <= limit) return;
          rows.slice(limit).forEach(r => r.classList.add('hidden-row'));
          const name = table.dataset.table;
          const btn = document.querySelector('button.show-more[data-target-table="' + name + '"]');
          if(btn){
            btn.hidden = false;
            btn?.addEventListener('click', () => {
              rows.slice(limit).forEach(r => r.classList.toggle('hidden-row'));
              const expanded = rows.slice(limit)[0].classList.contains('hidden-row') === false;
              btn.textContent = expanded ? 'Show less' : 'Show more';
            });
          }
        });
      }
      
      function initExport(){
        document.querySelectorAll('.export-actions button[data-export]')?.forEach(btn => {
          btn.addEventListener('click', () => {
            const kind = btn.getAttribute('data-export');
            if(kind === 'json') {
              const blob = new Blob([JSON.stringify(exportData, null, 2)], { type:'application/json' });
              triggerDownload(blob, 'git-spark-summary.json');
            } else if (kind === 'authors-csv') {
              const header = 'name,commits,churn,files_changed,avg_commit_size,largest_commit\\n';
              const rows = (exportData.authors||[]).map((a)=> [a.name,a.commits,a.churn,a.filesChanged,a.avgCommitSize,a.largestCommit].join(','));
              const blob = new Blob([ header + rows.join('\\n') ], { type:'text/csv' });
              triggerDownload(blob, 'git-spark-authors.csv');
            } else if (kind === 'files-csv') {
              const header = 'path,commits,authors,churn,riskScore\\n';
              const rows = (exportData.files||[]).map((f)=> [f.path,f.commits,f.authors,f.churn,f.riskScore].join(','));
              const blob = new Blob([ header + rows.join('\\n') ], { type:'text/csv' });
              triggerDownload(blob, 'git-spark-files.csv');
            }
          });
        });
      }
      
      function initDatasetToggles(){
        document.querySelectorAll('.dataset-toggles')?.forEach(container => {
          const toggles = container.querySelectorAll('.dataset-toggle');
          toggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
              toggles.forEach(t => t.classList.remove('active'));
              toggle.classList.add('active');
              // Dataset toggle functionality can be expanded here
            });
          });
        });
      }
      
      function triggerDownload(blob, filename){
        const url = URL.createObjectURL(blob); 
        const a = document.createElement('a'); 
        a.href = url; 
        a.download = filename; 
        document.body.appendChild(a); 
        a.click(); 
        setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 200); 
      }
      
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(() => { makeSortable(); }, 0); 
      } else {
        document.addEventListener('DOMContentLoaded', () => { makeSortable(); });
      }
      
      document.addEventListener('DOMContentLoaded', () => { 
        initPagination(); 
        initExport(); 
        initDatasetToggles(); 
      });
    })();`;
  }
}
