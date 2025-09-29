import { AnalysisReport } from '../types';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import { createLogger } from '../utils/logger';

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
    const pctFmt = (n: number) => `${n.toFixed(1)}%`;

    const keyMetrics = [
      { label: 'Commits', value: numberFmt(report.repository.totalCommits) },
      { label: 'Contributors', value: numberFmt(report.repository.totalAuthors) },
      { label: 'Files Changed', value: numberFmt(report.repository.totalFiles) },
      { label: 'Code Churn', value: numberFmt(report.repository.totalChurn) },
      { label: 'Health', value: `${healthPct}%` },
      { label: 'Governance', value: `${governancePct}%` },
      { label: 'Bus Factor', value: numberFmt(report.repository.busFactor) },
    ];

    const riskRows = report.files
      .slice(0, 10)
      .map(f => {
        const riskPercent = Math.round(f.riskScore * 100);
        return `<tr>
          <td><code title="${this.escapeHtml(f.path)}">${this.escapeHtml(this.truncatePath(f.path))}</code></td>
          <td class="num" data-sort="${f.commits}">${numberFmt(f.commits)}</td>
          <td class="num" data-sort="${f.churn}">${numberFmt(f.churn)}</td>
          <td class="num" data-sort="${riskPercent}"><span class="risk-badge risk-${this.getRiskBand(riskPercent)}">${riskPercent}%</span></td>
        </tr>`;
      })
      .join('');

    const authorRows = report.authors
      .slice(0, 10)
      .map(
        a => `<tr>
        <td>${this.escapeHtml(a.name)}</td>
        <td class="num" data-sort="${a.commits}">${numberFmt(a.commits)}</td>
        <td class="num" data-sort="${a.churn}">+${numberFmt(a.insertions)} / -${numberFmt(a.deletions)}</td>
        <td class="num" data-sort="${a.avgCommitSize.toFixed(2)}">${a.avgCommitSize.toFixed(1)}</td>
      </tr>`
      )
      .join('');

    const timelineData = report.timeline
      .map(d => ({ x: d.date.toISOString(), y: d.commits, churn: d.churn, authors: d.authors }))
      .slice(0, 365); // basic safeguard

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
  <title>Git Activity Report - ${this.escapeHtml(repoName)}</title>
  <style>${this.getCustomStyles()}</style>
  <script defer src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js" crossorigin="anonymous"></script>
</head>
<body>
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
      <div class="summary-grid">
        ${keyMetrics
          .map(
            m =>
              `<div class="metric-card" tabindex="0"><div class="metric-value">${m.value}</div><div class="metric-label">${m.label}</div></div>`
          )
          .join('')}
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
        <table class="data-table" data-sortable>
          <thead><tr><th>Author</th><th class="num">Commits</th><th class="num">Churn</th><th class="num">Avg Size</th></tr></thead>
          <tbody>${authorRows}</tbody>
        </table>
      </div>
    </section>

    <section id="files" class="section">
      <h2>File Hotspots (Top 10)</h2>
      <div class="table-wrapper" role="region" aria-label="Top files table">
        <table class="data-table" data-sortable>
          <thead><tr><th>File</th><th class="num">Commits</th><th class="num">Churn</th><th class="num">Risk</th></tr></thead>
          <tbody>${riskRows}</tbody>
        </table>
      </div>
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
    </section>

    <section id="timeline" class="section">
      <h2>Activity Timeline</h2>
      <div class="chart-wrapper">
        <canvas id="timelineChart" height="300" aria-label="Commits per day" role="img"></canvas>
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
      </dl>
    </section>
  </main>
  <footer class="site-footer" role="contentinfo">Generated by git-spark v${this.escapeHtml(report.metadata.version)} • ${this.escapeHtml(new Date(report.metadata.generatedAt).toLocaleString())}</footer>
  <button id="backToTop" class="back-to-top" aria-label="Back to top" hidden>▲</button>
  <script>window.__GIT_SPARK_TIMELINE__ = ${JSON.stringify(timelineData)};</script>
  <script>${this.getClientScript()}</script>
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
      html { scroll-behavior: smooth; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: var(--color-bg); color: var(--color-text); margin:0; }
      .skip-link { position:absolute; left:-999px; top:auto; width:1px; height:1px; overflow:hidden; }
      .skip-link:focus { position:static; width:auto; height:auto; padding:.5rem 1rem; background:#000; color:#fff; z-index:999; }
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
      @media (max-width: 760px) { .main-nav ul { flex-wrap:wrap; gap:.5rem; } .branding { font-size:.85rem; } }
      @media print { .site-header, .back-to-top { display:none !important; } body { background:#fff; } .section { page-break-inside:avoid; } }
      @media (prefers-reduced-motion: reduce) { * { animation-duration:0.01ms !important; transition-duration:0.01ms !important; } }
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
      const backBtn = document.getElementById('backToTop');
      window.addEventListener('scroll', () => {
        if (window.scrollY > 300) backBtn?.removeAttribute('hidden'); else backBtn?.setAttribute('hidden','');
      });
      backBtn?.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));
      function initTimeline(){
        if (!('Chart' in window)) { document.getElementById('timelineFallback')?.removeAttribute('hidden'); return; }
        try {
          const ctx = document.getElementById('timelineChart');
          if(!ctx) return;
          const commits = data.map(d => ({ x: d.x, y: d.y }));
          // Basic chart config per spec foundations
          new (window as any).Chart(ctx, {
            type:'line',
            data:{ datasets:[{ label:'Commits', data: commits, tension:0.2, borderColor:'#0066cc', backgroundColor:'rgba(0,102,204,0.15)', pointRadius:0 }] },
            options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom' } }, scales:{ x:{ type:'time', time:{ unit:'day' } }, y:{ beginAtZero:true } } }
          });
        } catch(e){ document.getElementById('timelineFallback')?.removeAttribute('hidden'); }
      }
      if (document.readyState === 'complete' || document.readyState === 'interactive') setTimeout(initTimeline, 0); else document.addEventListener('DOMContentLoaded', initTimeline);
    })();`;
  }
}
