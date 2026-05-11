import { AnalysisReport, FileFilteringConfig } from '../types/index.js';
import { escapeHtml, truncatePath, getRiskBand } from './html-utils.js';
import { getCustomStyles } from './html-styles.js';
import { getBasicScript } from './html-scripts.js';
import {
  generateDetailedAuthorProfiles,
  mergeAuthorsByEmail,
} from './html-author-profiles.js';
import {
  generateActivityVisualsForTeamPatterns,
  generateDailyTrendsSection,
  generateCurrentStateSection,
} from './html-daily-trends.js';
import { isSourceCodeFile, getDefaultFileFilteringConfig } from './html-file-filter.js';
import { generateLimitationsSection, generateDocumentationSection } from './html-static-sections.js';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import { createLogger } from '../utils/logger.js';
import { createHash } from 'crypto';

const logger = createLogger('html-exporter');

/**
 * Exports analysis reports as interactive HTML with charts and visualizations.
 */
export class HTMLExporter {
  /**
   * Export analysis report as interactive HTML file.
   *
   * @param report - The complete analysis report to export
   * @param outputPath - Directory path where HTML file will be created
   * @param fileFilteringConfig - Optional configuration for file filtering in hotspots
   * @param teamwork - When true, focuses on team success by removing individual contributor sections
   */
  async export(
    report: AnalysisReport,
    outputPath: string,
    fileFilteringConfig?: FileFilteringConfig,
    teamwork?: boolean
  ): Promise<void> {
    try {
      const fullPath = resolve(outputPath, 'git-spark-report.html');
      mkdirSync(dirname(fullPath), { recursive: true });
      const htmlContent = this.generateHTML(report, fileFilteringConfig, teamwork);
      writeFileSync(fullPath, htmlContent, 'utf-8');
      logger.info('HTML report exported successfully', { path: fullPath });
    } catch (error) {
      logger.error('Failed to export HTML report', {
        error:
          error instanceof Error
            ? { message: error.message, name: error.name, stack: error.stack }
            : error,
      });
      throw error;
    }
  }

  private generateHTML(
    report: AnalysisReport,
    fileFilteringConfig?: FileFilteringConfig,
    teamwork?: boolean
  ): string {
    const repoName = basename(report.metadata.repoPath || '.') || 'repository';
    const generatedAt = report.metadata.generatedAt.toISOString();
    const numberFmt = (n: number) => new Intl.NumberFormat().format(n);
    const compactFmt = (n: number) =>
      new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(n);
    const warnings: string[] = (report as any).warnings || [];

    const keyMetrics = [
      { label: 'Commits', value: numberFmt(report.repository.totalCommits) },
      { label: 'Contributors', value: numberFmt(report.repository.totalAuthors) },
      { label: 'Files Changed', value: numberFmt(report.repository.totalFiles) },
      { label: 'Code Churn', value: compactFmt(report.repository.totalChurn) },
      {
        label: 'Bus Factor',
        value: `${Math.round((report.repository.busFactor / report.repository.totalAuthors) * 100)}%`,
      },
    ];

    const config = fileFilteringConfig ?? getDefaultFileFilteringConfig();
    const sourceCodeFiles = report.files.filter(f => isSourceCodeFile(f.path, config));

    const riskRows = sourceCodeFiles
      .slice(0, config.maxHotspots)
      .map(f => {
        const riskPercent = Math.round(f.riskScore * 100);
        const authors = f.authors.length;
        return `<tr>
          <td><code title="${escapeHtml(f.path)}">${escapeHtml(truncatePath(f.path))}</code></td>
          <td class="num" data-sort="${f.commits}">${numberFmt(f.commits)}</td>
          <td class="num" data-sort="${f.churn}">${numberFmt(f.churn)}</td>
          <td class="num" data-sort="${authors}">${authors}</td>
          <td class="num" data-sort="${riskPercent}"><span class="activity-badge activity-${getRiskBand(riskPercent)}" title="Commits: ${f.commits}\nLines Changed: ${f.churn}\nAuthors: ${authors}">${riskPercent}%</span></td>
        </tr>`;
      })
      .join('');

    const mergedAuthors = mergeAuthorsByEmail(report.authors);
    const authorRows = mergedAuthors
      .slice(0, 15)
      .map(
        a => `<tr>
        <td><a href="#author-${escapeHtml(a.email.replace(/[^a-zA-Z0-9]/g, '-'))}" class="author-link">${escapeHtml(a.name)}</a></td>
        <td class="num" data-sort="${a.commits}">${numberFmt(a.commits)}</td>
        <td class="num" data-sort="${a.churn}" title="+${a.insertions} / -${a.deletions}">+${numberFmt(a.insertions)} / -${numberFmt(a.deletions)}</td>
        <td class="num" data-sort="${a.avgCommitSize.toFixed(2)}">${a.avgCommitSize.toFixed(1)}</td>
        <td class="num" data-sort="${a.filesChanged}">${a.filesChanged}</td>
      </tr>`
      )
      .join('');

    const ogSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='418' viewBox='0 0 800 418' role='img'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop stop-color='%230066cc' offset='0'/><stop stop-color='%2328a745' offset='1'/></linearGradient></defs><rect width='800' height='418' fill='%231e2227'/><text x='40' y='80' font-family='Segoe UI,Roboto,Arial,sans-serif' font-size='42' fill='white'>Git Activity Report</text><text x='40' y='140' font-size='26' fill='white'>${escapeHtml(repoName)}</text><text x='40' y='200' font-size='20' fill='white'>Commits: ${report.repository.totalCommits}</text><text x='40' y='235' font-size='20' fill='white'>Authors: ${report.repository.totalAuthors}</text><text x='40' y='270' font-size='20' fill='white'>Files: ${report.repository.totalFiles}</text><text x='40' y='320' font-size='16' fill='#bbb'>Generated ${new Date(report.metadata.generatedAt).toISOString().split('T')[0]}</text><rect x='600' y='60' width='160' height='160' rx='8' fill='url(#g)' opacity='0.8'/><text x='680' y='160' text-anchor='middle' font-size='32' fill='white' font-weight='700'>${compactFmt(report.repository.totalChurn)}</text><text x='680' y='185' text-anchor='middle' font-size='14' fill='white'>Lines Changed</text></svg>`;
    const ogImage = 'data:image/svg+xml;base64,' + Buffer.from(ogSvg).toString('base64');

    let analysisPeriod = '';
    try {
      const options = report.metadata.analysisOptions;
      let startDate: Date;
      let endDate: Date;

      if (options.since && options.until) {
        startDate = new Date(options.since);
        endDate = new Date(options.until);
      } else if (options.since) {
        startDate = new Date(options.since);
        endDate = new Date();
      } else if (options.until) {
        startDate = report.repository.firstCommit || new Date(0);
        endDate = new Date(options.until);
      } else if (options.days) {
        endDate = new Date();
        startDate = new Date(endDate.getTime() - options.days * 24 * 60 * 60 * 1000);
      } else {
        startDate = report.repository.firstCommit;
        endDate = report.repository.lastCommit;
      }

      if (startDate && endDate) {
        if (report.repository.firstCommit && startDate < report.repository.firstCommit) {
          startDate = report.repository.firstCommit;
        }
        if (report.repository.lastCommit && endDate > report.repository.lastCommit) {
          endDate = report.repository.lastCommit;
        }

        const firstStr = startDate.toISOString().split('T')[0];
        const lastStr = endDate.toISOString().split('T')[0];
        const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const days = Math.max(1, diffDays === 0 ? 1 : diffDays + 1);
        const commitsInPeriod = report.repository.totalCommits;
        analysisPeriod = `Analyzed Period: ${firstStr} → ${lastStr} (${days} day${days !== 1 ? 's' : ''}, ${commitsInPeriod} commit${commitsInPeriod !== 1 ? 's' : ''})`;
      }
    } catch {
      /* ignore */
    }

    const styleContent = getCustomStyles();
    const styleHash = createHash('sha256').update(styleContent, 'utf8').digest('base64');
    const basicScript = getBasicScript();
    const scriptNonce = createHash('sha256').update(basicScript, 'utf8').digest('hex').substring(0, 16);

    const csp = [
      "default-src 'none'",
      "base-uri 'none'",
      "form-action 'none'",
      "img-src 'self' data:",
      "style-src 'self' 'sha256-" + styleHash + "'",
      "script-src 'self' 'nonce-" + scriptNonce + "'",
      "font-src 'self'",
    ].join('; ');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="generator" content="git-spark v${escapeHtml(report.metadata.version)}">
  <meta name="report-date" content="${generatedAt}">
  <meta name="repository" content="${escapeHtml(repoName)}">
  <meta property="og:title" content="GitSpark Report - ${escapeHtml(repoName)}">
  <meta property="og:type" content="article">
  <meta property="og:description" content="${escapeHtml(`${report.repository.totalCommits} commits • ${report.repository.totalAuthors} contributors • ${report.repository.totalFiles} files changed`)}">
  <meta property="og:image" content="${ogImage}">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📊</text></svg>">
  <title>GitSpark Report - ${escapeHtml(repoName)}</title>
  <style>${styleContent}</style>
</head>
<body>
  <div class="theme-toggle-wrapper"><button id="themeToggle" class="theme-toggle" aria-pressed="false" aria-label="Toggle dark mode">🌙</button></div>
  <a class="skip-link" href="#summary">Skip to content</a>
  <header class="site-header">
    <div class="header-inner">
      <div class="branding">GitSpark Report <span class="repo-name">${escapeHtml(repoName)}</span></div>
      <nav class="main-nav" aria-label="Section navigation">
        <ul>
          <li><a href="#summary">Summary</a></li>
          ${!teamwork ? '<li><a href="#authors">Authors</a></li>' : ''}
          <li><a href="#team-patterns">Team Patterns</a></li>
          <li><a href="#files">File Hotspots</a></li>
          ${!teamwork ? '<li><a href="#author-details">Author Details</a></li>' : ''}
          ${report.dailyTrends ? '<li><a href="#daily-trends">Detailed Daily Tables</a></li>' : ''}
          <li><a href="#limitations">Limitations</a></li>
          <li><a href="#documentation">Documentation</a></li>
          <li><a href="#meta">Metadata</a></li>
        </ul>
      </nav>
    </div>
  </header>
  <main class="report" id="top">
    <section id="summary" class="section">
      <h1>Executive Summary</h1>
      ${analysisPeriod ? `<p class="analysis-period" aria-label="Analysis date range">${escapeHtml(analysisPeriod)}</p>` : ''}
      <div class="summary-grid">
        ${keyMetrics
          .map(
            m =>
              `<div class="metric-card" tabindex="0"><div class="metric-value">${m.value}</div><div class="metric-label">${m.label}</div></div>`
          )
          .join('')}
      </div>
    </section>

    <section id="current-state" class="section">
      <h2>Current Repository State</h2>
      <p class="section-description">Current filesystem analysis showing all files present in the repository today, regardless of Git history.</p>
      ${generateCurrentStateSection(report.currentState)}
    </section>

    ${!teamwork ? `<section id="authors" class="section">
      <h2>Top Contributors (Author Metrics)</h2>
      <p class="section-description">Individual developer metrics calculated from Git commit data. These represent observable activity patterns, not productivity or performance.</p>
      <div class="table-wrapper" role="region" aria-label="Top authors table">
        <table class="data-table" data-sortable data-initial-limit="15" data-table="authors">
          <thead><tr><th scope="col">Author</th><th class="num" scope="col">Commits</th><th class="num" scope="col">Lines Changed</th><th class="num" scope="col">Avg Commit Size</th><th class="num" scope="col">Files Touched</th></tr></thead>
          <tbody>${authorRows}</tbody>
        </table>
      </div>
      <button class="show-more" data-target-table="authors" hidden>Show more</button>
    </section>` : ''}

    <section id="team-patterns" class="section">
      <h2>Team Activity Patterns (Aggregate Metrics)</h2>
      <p class="section-description">Repository-wide patterns calculated from all Git commits. These show activity distribution, not team performance or quality.</p>
      <div class="team-patterns-grid">
        <div class="pattern-card">
          <h3>Commit Distribution</h3>
          <div class="pattern-metrics">
            <div class="pattern-metric">
              <span class="metric-label">Total Commits</span>
              <span class="metric-value">${numberFmt(report.repository.totalCommits)}</span>
            </div>
            <div class="pattern-metric">
              <span class="metric-label">Avg per Day</span>
              <span class="metric-value">${report.repository.avgCommitsPerDay.toFixed(1)}</span>
            </div>
            <div class="pattern-metric">
              <span class="metric-label">Active Days</span>
              <span class="metric-value">${numberFmt(report.repository.activeDays)}</span>
            </div>
          </div>
        </div>
        <div class="pattern-card">
          <h3>Code Volume</h3>
          <div class="pattern-metrics">
            <div class="pattern-metric">
              <span class="metric-label">Total Churn</span>
              <span class="metric-value">${compactFmt(report.repository.totalChurn)}</span>
            </div>
            <div class="pattern-metric">
              <span class="metric-label">Files Changed</span>
              <span class="metric-value">${numberFmt(report.repository.totalFiles)}</span>
            </div>
          </div>
        </div>
        <div class="pattern-card">
          <h3>Contributor Patterns</h3>
          <div class="pattern-metrics">
            <div class="pattern-metric">
              <span class="metric-label">Total Authors</span>
              <span class="metric-value">${numberFmt(report.repository.totalAuthors)}</span>
            </div>
            <div class="pattern-metric">
              <span class="metric-label">Bus Factor</span>
              <span class="metric-value">${Math.round((report.repository.busFactor / report.repository.totalAuthors) * 100)}%</span>
              <span class="metric-note">Percentage of authors for 50% of commits</span>
            </div>
          </div>
        </div>
      </div>
      ${report.dailyTrends ? generateActivityVisualsForTeamPatterns(report.dailyTrends) : ''}
    </section>

    <section id="files" class="section">
      <h2>File Activity Hotspots</h2>
      <p class="section-description">Source code files with the most Git activity. High activity may indicate maintenance hotspots but does not imply code quality issues.</p>
      <div class="table-wrapper" role="region" aria-label="File activity table">
        <table class="data-table" data-sortable data-initial-limit="25" data-table="files">
          <thead><tr><th scope="col">File</th><th class="num" scope="col">Commits</th><th class="num" scope="col">Lines Changed</th><th class="num" scope="col">Authors</th><th class="num" scope="col">Activity Score</th></tr></thead>
          <tbody>${riskRows}</tbody>
        </table>
      </div>
      <button class="show-more" data-target-table="files" hidden>Show more</button>
    </section>

    ${!teamwork ? `<section id="author-details" class="section">
      <h2>Author Activity Details</h2>
      <p class="section-description">Detailed activity patterns for individual contributors. All metrics are derived from Git commit data and represent observable patterns only.</p>
      <div class="author-profiles">
        ${generateDetailedAuthorProfiles(report.authors)}
      </div>
    </section>` : ''}

    ${report.dailyTrends ? generateDailyTrendsSection(report.dailyTrends) : ''}

    ${generateLimitationsSection()}

    ${generateDocumentationSection()}

    <section id="meta" class="section">
      <h2>Report Metadata</h2>
      <dl class="meta-grid">
        <dt>Generated</dt><dd>${escapeHtml(new Date(report.metadata.generatedAt).toLocaleString())}</dd>
        <dt>Version</dt><dd>${escapeHtml(report.metadata.version)}</dd>
        <dt>Branch</dt><dd>${escapeHtml(report.metadata.branch || '')}</dd>
        <dt>Commit</dt><dd><code>${escapeHtml((report.metadata.commit || '').slice(0, 8))}</code></dd>
        <dt>Processing Time</dt><dd>${(report.metadata.processingTime / 1000).toFixed(2)}s</dd>
        <dt>Repo Path</dt><dd>${escapeHtml(report.metadata.repoPath)}</dd>
        ${report.metadata.cliArguments?.length ? `<dt>CLI Arguments</dt><dd><code>${escapeHtml(report.metadata.cliArguments.join(' '))}</code></dd>` : ''}
        ${warnings.length ? `<dt>Warnings</dt><dd><ul class="warnings">${warnings.map(w => `<li>${escapeHtml(w)}</li>`).join('')}</ul></dd>` : ''}
      </dl>
    </section>
  </main>
  <footer class="site-footer" role="contentinfo">
    <div class="footer-content">
      <p>Generated by GitSpark v${escapeHtml(report.metadata.version)} • ${escapeHtml(new Date(report.metadata.generatedAt).toLocaleString())}</p>
      <p>GitSpark is a <a href="https://markhazleton.com" target="_blank" rel="noopener noreferrer">Mark Hazleton</a> project</p>
    </div>
  </footer>
  <button id="backToTop" class="back-to-top" aria-label="Back to top" hidden>▲</button>
  <div id="liveRegion" class="sr-only" aria-live="polite" aria-atomic="true"></div>
  <script nonce="${scriptNonce}">${basicScript}</script>
</body>
</html>`;
  }
}
