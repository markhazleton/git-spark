import { AnalysisReport, FileFilteringConfig } from '../types';
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
 * - Repository activity and contribution patterns
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
   * @param fileFilteringConfig - Optional configuration for file filtering in hotspots
   * @throws {Error} When output directory cannot be created or file cannot be written
   * @returns Promise that resolves when export is complete
   */
  async export(
    report: AnalysisReport,
    outputPath: string,
    fileFilteringConfig?: FileFilteringConfig
  ): Promise<void> {
    try {
      const fullPath = resolve(outputPath, 'git-spark-report.html');

      // Ensure directory exists
      mkdirSync(dirname(fullPath), { recursive: true });

      // Generate HTML content
      const htmlContent = this.generateHTML(report, fileFilteringConfig);

      // Write to file
      writeFileSync(fullPath, htmlContent, 'utf-8');

      logger.info('HTML report exported successfully', { path: fullPath });
    } catch (error) {
      logger.error('Failed to export HTML report', {
        error:
          error instanceof Error
            ? {
                message: error.message,
                name: error.name,
                stack: error.stack,
              }
            : error,
      });
      throw error;
    }
  }

  /**
   * Check if a file path represents a source code file that should be included in hotspots
   * Uses the provided configuration to determine what constitutes source code vs config files
   *
   * @param filePath - The file path to check
   * @param config - File filtering configuration
   * @returns True if the file should be considered a source code hotspot
   * @private
   */
  private isSourceCodeFile(filePath: string, config: FileFilteringConfig): boolean {
    const path = filePath.toLowerCase();

    // Check exclusion patterns first
    for (const pattern of config.excludePatterns) {
      if (path.includes(pattern)) {
        return false;
      }
    }

    // Check if file has a config extension (excluded from hotspots)
    const hasConfigExtension = config.configExtensions.some(ext => path.endsWith(ext));
    if (hasConfigExtension) {
      return false;
    }

    // Check if file has a source code extension
    const hasSourceExtension = config.sourceCodeExtensions.some(ext => path.endsWith(ext));

    return hasSourceExtension;
  }

  /**
   * Get default file filtering configuration
   * @returns Default FileFilteringConfig
   * @private
   */
  private getDefaultFileFilteringConfig(): FileFilteringConfig {
    return {
      sourceCodeExtensions: [
        // Web languages
        '.js',
        '.jsx',
        '.ts',
        '.tsx',
        '.vue',
        '.svelte',
        '.css',
        '.scss',
        '.sass',
        '.less',

        // Backend/System languages
        '.cs',
        '.vb',
        '.fs', // .NET
        '.java',
        '.kt',
        '.scala', // JVM
        '.py',
        '.pyx', // Python
        '.rb',
        '.rake', // Ruby
        '.php',
        '.php3',
        '.php4',
        '.php5',
        '.php7',
        '.php8', // PHP
        '.go', // Go
        '.rs', // Rust
        '.cpp',
        '.cxx',
        '.cc',
        '.c', // C/C++
        '.h',
        '.hpp',
        '.hxx', // C/C++ headers
        '.swift', // Swift
        '.m',
        '.mm', // Objective-C
        '.dart', // Dart
        '.ex',
        '.exs', // Elixir
        '.erl',
        '.hrl', // Erlang
        '.clj',
        '.cljs',
        '.cljc', // Clojure
        '.hs',
        '.lhs', // Haskell
        '.ml',
        '.mli', // OCaml/F#
        '.elm', // Elm
        '.lua', // Lua
        '.r',
        '.rmd', // R
        '.jl', // Julia
        '.zig', // Zig
        '.nim', // Nim
        '.cr', // Crystal

        // Database and query languages
        '.sql',
        '.plsql',
        '.psql',

        // Scripting
        '.sh',
        '.bash',
        '.zsh',
        '.fish',
        '.ps1',
        '.bat',
        '.cmd',
        '.pl',
        '.pm', // Perl
        '.tcl', // Tcl

        // Graphics and markup languages (source code context)
        '.xml',
        '.xaml',
        '.graphql',
        '.gql',

        // Template languages
        '.mustache',
        '.hbs',
        '.handlebars',
        '.pug',
        '.jade',
        '.ejs',
        '.erb',
        '.twig',
        '.liquid',
        '.jinja',
        '.jinja2',
      ],
      configExtensions: [
        // Configuration and data files
        '.html',
        '.htm', // Often templates/config in backends
        '.json', // Config files, package files
        '.yaml',
        '.yml', // Config files
        '.toml', // Config files
        '.ini',
        '.conf',
        '.config', // Config files
        '.env', // Environment files
        '.properties', // Java properties
        '.plist', // macOS property lists

        // Documentation and markdown
        '.md',
        '.markdown',
        '.mdx',
        '.txt',
        '.rst',
        '.adoc',
        '.asciidoc',

        // Build and project files
        '.gradle',
        '.maven',
        '.gemfile',
        '.podfile',
        '.dockerfile',
        '.containerfile',
      ],
      excludePatterns: [
        // Lock files and package files that change frequently but aren't source
        'package-lock.json',
        'yarn.lock',
        'pnpm-lock.yaml',
        'composer.lock',
        'pipfile.lock',
        'poetry.lock',
        'requirements.txt',

        // Build outputs and artifacts
        '/dist/',
        '/build/',
        '/out/',
        '/target/',
        '/bin/',
        '/obj/',
        '.min.js',
        '.min.css',
        '.bundle.js',
        '.bundle.css',
        '.map',

        // Node modules and dependencies
        'node_modules/',
        'vendor/',

        // Configuration files that change frequently
        '.gitignore',
        '.gitattributes',
        '.editorconfig',
        '.eslintrc',
        '.prettierrc',
        'tsconfig.json',
        'jsconfig.json',
        'webpack.config',
        'vite.config',
        'rollup.config',
        'babel.config',
        '.babelrc',
        'jest.config',
        'vitest.config',
        'karma.conf',
        'cypress.config',
        'playwright.config',

        // Documentation directories
        '/docs/',
        'changelog',
        'license',
        'readme',

        // IDE and editor files
        '.vscode/',
        '.idea/',
        '.vs/',
        '*.sln',
        '*.csproj',
        '*.vcxproj',
        '*.proj',

        // Generated files
        '.generated.',
        '.g.cs',
        '.g.ts',
        '.designer.cs',
        'assemblyinfo.cs',

        // Test files (focus on production code)
        '.test.',
        '.spec.',
        '__tests__/',
        '/tests/',
        '/test/',
      ],
      maxHotspots: 20,
    };
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
   * @param fileFilteringConfig - Optional configuration for file filtering in hotspots
   * @returns Complete HTML document as string
   * @private
   */
  private generateHTML(report: AnalysisReport, fileFilteringConfig?: FileFilteringConfig): string {
    const repoName = basename(report.metadata.repoPath || '.') || 'repository';
    const generatedAt = report.metadata.generatedAt.toISOString();
    const healthPct = Math.round(report.repository.healthScore * 100);
    const numberFmt = (n: number) => new Intl.NumberFormat().format(n);
    const compactFmt = (n: number) =>
      new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(n);
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
      {
        label: 'Bus Factor',
        value: numberFmt(report.repository.busFactor),
        raw: report.repository.busFactor,
      },
    ];

    // Get file filtering configuration with defaults
    const config = fileFilteringConfig || this.getDefaultFileFilteringConfig();

    // Filter for source code files only, excluding common non-source files
    const sourceCodeFiles = report.files.filter(f => this.isSourceCodeFile(f.path, config));

    const riskRows = sourceCodeFiles
      .slice(0, config.maxHotspots)
      .map(f => {
        const riskPercent = Math.round(f.riskScore * 100);
        const authors = f.authors.length;
        return `<tr>
          <td><code title="${this.escapeHtml(f.path)}">${this.escapeHtml(this.truncatePath(f.path))}</code></td>
          <td class="num" data-sort="${f.commits}">${numberFmt(f.commits)}</td>
          <td class="num" data-sort="${f.churn}">${numberFmt(f.churn)}</td>
          <td class="num" data-sort="${authors}">${authors}</td>
          <td class="num" data-sort="${riskPercent}"><span class="activity-badge activity-${this.getRiskBand(riskPercent)}" title="Commits: ${f.commits}\nLines Changed: ${f.churn}\nAuthors: ${authors}">${riskPercent}%</span></td>
        </tr>`;
      })
      .join('');

    // Merge authors with same email (case-insensitive) for consistent display
    const mergedAuthors = this.mergeAuthorsByEmail(report.authors);
    const authorRows = mergedAuthors
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
    const ogSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='418' viewBox='0 0 800 418' role='img'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop stop-color='%230066cc' offset='0'/><stop stop-color='%2328a745' offset='1'/></linearGradient></defs><rect width='800' height='418' fill='%231e2227'/><text x='40' y='80' font-family='Segoe UI,Roboto,Arial,sans-serif' font-size='42' fill='white'>Git Activity Report</text><text x='40' y='140' font-size='26' fill='white'>${this.escapeHtml(repoName)}</text><text x='40' y='200' font-size='20' fill='white'>Commits: ${report.repository.totalCommits}</text><text x='40' y='235' font-size='20' fill='white'>Authors: ${report.repository.totalAuthors}</text><text x='40' y='270' font-size='20' fill='white'>Health: ${healthPct}%</text><text x='40' y='320' font-size='16' fill='#bbb'>Generated ${new Date(report.metadata.generatedAt).toISOString().split('T')[0]}</text><rect x='600' y='60' width='160' height='160' rx='8' fill='url(#g)' opacity='0.8'/><text x='680' y='160' text-anchor='middle' font-size='54' fill='white' font-weight='700'>${healthPct}%</text></svg>`;
    const ogImage = 'data:image/svg+xml;base64,' + Buffer.from(ogSvg).toString('base64');

    // Analysis period (based on analysis options, not just commit range)
    let analysisPeriod = '';
    try {
      const options = report.metadata.analysisOptions;

      let startDate: Date;
      let endDate: Date;

      if (options.since && options.until) {
        // Use explicit date range
        startDate = new Date(options.since);
        endDate = new Date(options.until);
      } else if (options.since) {
        // From specific date to now
        startDate = new Date(options.since);
        endDate = new Date();
      } else if (options.until) {
        // From beginning to specific date
        startDate = report.repository.firstCommit || new Date(0);
        endDate = new Date(options.until);
      } else if (options.days) {
        // Last N days from now
        endDate = new Date();
        startDate = new Date(endDate.getTime() - options.days * 24 * 60 * 60 * 1000);
      } else {
        // Fallback to actual commit range if no specific options
        startDate = report.repository.firstCommit;
        endDate = report.repository.lastCommit;
      }

      if (startDate && endDate) {
        const firstStr = startDate.toISOString().split('T')[0];
        const lastStr = endDate.toISOString().split('T')[0];
        const days = Math.max(
          1,
          Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
        );
        // Show commits within the analyzed period
        const commitsInPeriod = report.repository.totalCommits;
        analysisPeriod = `Analyzed Period: ${firstStr} → ${lastStr} (${days} day${days !== 1 ? 's' : ''}, ${commitsInPeriod} commit${commitsInPeriod !== 1 ? 's' : ''})`;
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
  <meta property="og:title" content="GitSpark Report - ${this.escapeHtml(repoName)}">
  <meta property="og:type" content="article">
  <meta property="og:description" content="${this.escapeHtml(`${report.repository.totalCommits} commits • ${report.repository.totalAuthors} contributors • Activity Index ${healthPct}%`)}">>
  <meta property="og:image" content="${ogImage}">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📊</text></svg>">
  <title>GitSpark Report - ${this.escapeHtml(repoName)}</title>
  <style>${styleContent}</style>
</head>
<body>
  <div class="theme-toggle-wrapper"><button id="themeToggle" class="theme-toggle" aria-pressed="false" aria-label="Toggle dark mode">🌙</button></div>
  <a class="skip-link" href="#summary">Skip to content</a>
  <header class="site-header">
    <div class="header-inner">
      <div class="branding">GitSpark Report <span class="repo-name">${this.escapeHtml(repoName)}</span></div>
      <nav class="main-nav" aria-label="Section navigation">
        <ul>
          <li><a href="#summary">Summary</a></li>
          <li><a href="#limitations">Limitations</a></li>
          <li><a href="#authors">Authors</a></li>
          <li><a href="#team-patterns">Team Patterns</a></li>
          <li><a href="#files">File Hotspots</a></li>
          <li><a href="#author-details">Author Details</a></li>
          ${report.dailyTrends ? '<li><a href="#daily-trends">Daily Trends</a></li>' : ''}
          <li><a href="#documentation">Documentation</a></li>
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

      <div class="health-badges" aria-label="Activity Metrics">
        <div class="health-score" data-rating="${this.getHealthRating(healthPct)}" title="Repository activity index based on commit frequency and author participation">${healthPct}% <span>Activity Index</span></div>
      </div>

      ${(() => {
        const breakdown = this.calculateActivityIndexBreakdown(report);
        return `
        <div class="activity-breakdown">
          <h3>Activity Index Calculation</h3>
          <div class="activity-explanation">
            <p><strong>Note:</strong> This index measures repository activity patterns from Git commit data only. Higher values indicate more frequent commits and broader author participation. This is not a measure of code quality, team performance, or project success.</p>
          </div>
          <div class="breakdown-components">
            <div class="component">
              <div class="component-label">Commit Frequency</div>
              <div class="component-value">${breakdown.commitFrequency}%</div>
              <div class="component-detail">${breakdown.commitFrequencyRaw.toFixed(2)} commits/day (normalized)</div>
            </div>
            <div class="component">
              <div class="component-label">Author Participation</div>
              <div class="component-value">${breakdown.authorParticipation}%</div>
              <div class="component-detail">${breakdown.authorParticipationRaw.toFixed(2)} participation ratio</div>
            </div>
            <div class="component">
              <div class="component-label">Change Consistency</div>
              <div class="component-value">${breakdown.consistencyIndex}%</div>
              <div class="component-detail">Commit size variation index</div>
            </div>
          </div>
          <div class="formula">
            <strong>Formula:</strong> <code>${breakdown.formula}</code>
          </div>
        </div>`;
      })()}
    </section>

    <section id="limitations" class="section">
      <h2>⚠️ Important: Measurement Limitations</h2>
      <div class="critical-notice">
        <h3>What Git Repository Data Can and Cannot Tell Us</h3>
        
        <div class="limitation-grid">
          <div class="limitation-category">
            <h4>✅ Available from Git Repository</h4>
            <ul>
              <li>Commit metadata (author, timestamp, message)</li>
              <li>File changes (additions, deletions, modifications)</li>
              <li>Branch and merge history</li>
              <li>Authorship and co-authorship information</li>
              <li>Commit relationships and ancestry</li>
            </ul>
          </div>
          
          <div class="limitation-category">
            <h4>❌ NOT Available from Git Repository</h4>
            <ul>
              <li><strong>Code review data:</strong> No reviewer info, approval status, or review comments</li>
              <li><strong>Pull/merge request metadata:</strong> No PR numbers, descriptions, or review workflows</li>
              <li><strong>Issue tracking:</strong> No bug reports, feature requests, or issue relationships</li>
              <li><strong>Team structure:</strong> No organizational hierarchy, roles, or responsibilities</li>
              <li><strong>Work hours/timezones:</strong> No actual working hours or availability</li>
              <li><strong>Performance metrics:</strong> No build times, test results, or runtime performance</li>
              <li><strong>Code quality:</strong> No actual defect rates, test coverage, or maintainability scores</li>
            </ul>
          </div>
        </div>
        
        <div class="honest-metrics-notice">
          <h4>📊 Our Approach: Honest, Observable Metrics Only</h4>
          <p>All metrics in this report are calculated exclusively from Git commit history. We do not guess, estimate, or infer team performance, code quality, or individual productivity from Git data alone.</p>
          
          <div class="metric-categories">
            <div class="metric-category">
              <h5>Author Metrics (Individual)</h5>
              <ul>
                <li><strong>Commit Count:</strong> Number of commits authored</li>
                <li><strong>Lines Changed:</strong> Sum of insertions and deletions</li>
                <li><strong>Commit Size Distribution:</strong> Pattern of small vs large commits</li>
                <li><strong>Active Days:</strong> Number of days with at least one commit</li>
                <li><strong>Files Touched:</strong> Number of unique files modified</li>
              </ul>
            </div>
            
            <div class="metric-category">
              <h5>Team Metrics (Aggregate)</h5>
              <ul>
                <li><strong>Commit Frequency:</strong> Total commits per time period</li>
                <li><strong>Code Churn:</strong> Total lines changed across repository</li>
                <li><strong>Batch Size Distribution:</strong> Average and variation in commit sizes</li>
                <li><strong>Active Contributors:</strong> Number of distinct authors in time window</li>
                <li><strong>File Hotspots:</strong> Files with highest number of changes</li>
              </ul>
            </div>
          </div>
          
          <div class="usage-guidelines">
            <h5>🎯 Appropriate Usage Guidelines</h5>
            <ul>
              <li><strong>DO:</strong> Use to understand activity patterns and contribution distribution</li>
              <li><strong>DO:</strong> Identify files that change frequently (maintenance hotspots)</li>
              <li><strong>DO:</strong> Track repository activity trends over time</li>
              <li><strong>DON'T:</strong> Use for performance reviews or productivity assessments</li>
              <li><strong>DON'T:</strong> Assume commit count equals productivity or value</li>
              <li><strong>DON'T:</strong> Draw conclusions about code quality from Git metrics alone</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section id="authors" class="section">
      <h2>Top Contributors (Author Metrics)</h2>
      <p class="section-description">Individual developer metrics calculated from Git commit data. These represent observable activity patterns, not productivity or performance.</p>
      <div class="table-wrapper" role="region" aria-label="Top authors table">
        <table class="data-table" data-sortable data-initial-limit="15" data-table="authors">
          <thead><tr><th scope="col">Author</th><th class="num" scope="col">Commits</th><th class="num" scope="col">Lines Changed</th><th class="num" scope="col">Avg Commit Size</th><th class="num" scope="col">Files Touched</th></tr></thead>
          <tbody>${authorRows}</tbody>
        </table>
      </div>
      <button class="show-more" data-target-table="authors" hidden>Show more</button>
    </section>

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
              <span class="metric-value">${numberFmt(report.repository.busFactor)}</span>
              <span class="metric-note">Authors for 50% of commits</span>
            </div>
          </div>
        </div>
      </div>
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

    <section id="author-details" class="section">
      <h2>Author Activity Details</h2>
      <p class="section-description">Detailed activity patterns for individual contributors. All metrics are derived from Git commit data and represent observable patterns only.</p>
      <div class="author-profiles">
        ${this.generateDetailedAuthorProfiles(report.authors)}
      </div>
    </section>

    ${report.dailyTrends ? this.generateDailyTrendsSection(report.dailyTrends) : ''}

    <section id="documentation" class="section">
      <h2>Calculation Documentation</h2>
      <p class="doc-intro">This section provides detailed explanations of the metrics and calculations used, all based exclusively on Git repository commit data.</p>
      
      <div class="measurement-principles">
        <h3>📐 Measurement Principles</h3>
        <div class="principles-grid">
          <div class="principle-card">
            <h4>Objective Data Only</h4>
            <p>All metrics are calculated from observable Git commit data without interpretation or speculation about team dynamics, productivity, or code quality.</p>
          </div>
          <div class="principle-card">
            <h4>Transparent Limitations</h4>
            <p>We clearly state what our metrics can and cannot measure, avoiding false claims about team performance or code quality assessment.</p>
          </div>
          <div class="principle-card">
            <h4>No Speculation</h4>
            <p>We do not infer work-life balance, collaboration effectiveness, or individual performance from Git commit patterns alone.</p>
          </div>
        </div>
      </div>
      
      <div class="doc-section">
        <h3>Repository Activity Index</h3>
        <p>The Activity Index provides a normalized measure of repository activity based on observable Git patterns.</p>
        
        <div class="formula-box">
          <h4>Activity Index Formula</h4>
          <code class="formula">
            Activity Index = (Commit Frequency + Author Participation + Change Consistency) ÷ 3
          </code>
          <div class="formula-explanation">
            <ul>
              <li><strong>Commit Frequency:</strong> Daily commit rate normalized to 0-1 scale</li>
              <li><strong>Author Participation:</strong> Author-to-commit ratio indicating contribution spread</li>
              <li><strong>Change Consistency:</strong> Variation in commit sizes (derived component)</li>
            </ul>
          </div>
        </div>

        <div class="limitation-notice">
          <strong>⚠️ Important:</strong> This index measures repository activity patterns, not project health, team performance, or code quality. High activity doesn't necessarily indicate good outcomes, and low activity doesn't indicate problems.
        </div>
      </div>

      <div class="doc-section">
        <h3>Author Activity Metrics</h3>
        <p>Individual contributor metrics focus on observable activity patterns from Git commit history.</p>

        <div class="metric-docs">
          <div class="metric-category">
            <h4>Core Activity Metrics</h4>
            <ul>
              <li><strong>Commit Count:</strong> Total number of commits authored in the analysis period</li>
              <li><strong>Lines Changed:</strong> Sum of all line insertions and deletions across all commits</li>
              <li><strong>Average Commit Size:</strong> Mean number of lines changed per commit</li>
              <li><strong>Files Touched:</strong> Number of unique files modified by the author</li>
              <li><strong>Active Days:</strong> Number of distinct days with at least one commit</li>
            </ul>
            <div class="formula-box">
              <code class="formula">
                Lines Changed = Total Insertions + Total Deletions
              </code>
              <code class="formula">
                Average Commit Size = Total Lines Changed ÷ Total Commits
              </code>
            </div>
          </div>

          <div class="metric-category">
            <h4>Commit Size Distribution</h4>
            <p>Classification of commits by the number of lines changed, showing different development patterns:</p>
            <ul>
              <li><strong>Micro (&lt;20 lines):</strong> Small fixes, minor changes</li>
              <li><strong>Small (20-50 lines):</strong> Focused changes, bug fixes</li>
              <li><strong>Medium (51-200 lines):</strong> Feature additions, moderate refactoring</li>
              <li><strong>Large (201-500 lines):</strong> Significant features, major changes</li>
              <li><strong>Very Large (&gt;500 lines):</strong> Major features, large refactors, or merged changes</li>
            </ul>
            <p><em>Note: Commit size alone does not indicate quality, complexity, or effort. Large commits may represent legitimate batch changes, while small commits may address complex issues.</em></p>
          </div>

          <div class="metric-category">
            <h4>Temporal Patterns</h4>
            <p>Observable timing patterns in commit history:</p>
            <ul>
              <li><strong>Commit Timing:</strong> Distribution of commits across hours and days (timestamp analysis only)</li>
              <li><strong>Activity Periods:</strong> Identification of high and low activity periods</li>
              <li><strong>Consistency:</strong> Regularity of contributions over time</li>
            </ul>
            <div class="limitation-notice">
              <strong>⚠️ Timing Limitations:</strong> Commit timestamps reflect when commits were made, not actual working hours. They can be affected by time zones, commit strategies, and development workflows. Do not use for work-life balance assessment.
            </div>
          </div>
        </div>
      </div>

      <div class="doc-section">
        <h3>Team Activity Patterns</h3>
        <div class="metric-docs">
          <div class="metric-category">
            <h4>Aggregate Repository Metrics</h4>
            <ul>
              <li><strong>Total Commits:</strong> Complete count of commits in the analysis period</li>
              <li><strong>Code Churn:</strong> Total lines inserted and deleted across all commits</li>
              <li><strong>Active Contributors:</strong> Number of unique authors with commits in the period</li>
              <li><strong>File Activity:</strong> Number of unique files modified during the period</li>
              <li><strong>Bus Factor:</strong> Minimum number of top contributors needed to account for 50% of commits</li>
            </ul>
            <div class="formula-box">
              <code class="formula">
                Bus Factor = Minimum authors needed for 50% of total commits
              </code>
              <code class="formula">
                Daily Commit Average = Total Commits ÷ Active Days
              </code>
            </div>
          </div>
        </div>
      </div>

      <div class="doc-section">
        <h3>File Activity Hotspots</h3>
        <div class="metric-docs">
          <div class="metric-category">
            <h4>File Activity Analysis</h4>
            <ul>
              <li><strong>File Commit Count:</strong> Number of commits that modified each file</li>
              <li><strong>File Line Changes:</strong> Total lines added and removed for each file</li>
              <li><strong>File Author Count:</strong> Number of different authors who modified each file</li>
              <li><strong>Activity Score:</strong> Composite score based on commit frequency and author count</li>
            </ul>
            <p><strong>Interpretation:</strong> Files with high activity scores are changed frequently and/or by many authors. This may indicate:</p>
            <ul>
              <li>Core functionality that requires frequent updates</li>
              <li>Configuration files that change with features</li>
              <li>Files that need architectural attention</li>
              <li>Areas of active development</li>
            </ul>
            <div class="limitation-notice">
              <strong>⚠️ Activity ≠ Problems:</strong> High file activity does not necessarily indicate problems, bugs, or poor code quality. Many legitimate factors can cause frequent file changes.
            </div>
          </div>
        </div>
      </div>

      <div class="methodology-note">
        <h4>Methodology and Data Sources</h4>
        <p><strong>Data Source:</strong> All metrics are calculated exclusively from Git commit history using standard Git commands (git log, git show, git diff).</p>
        <p><strong>Scope:</strong> Analysis covers the specified date range and branch(es) with all calculations based on available commit data.</p>
        <p><strong>Normalization:</strong> Some metrics are normalized to 0-100 scale for consistency and comparison across different repository sizes.</p>
        <p><strong>Accuracy:</strong> Metric accuracy depends on the completeness and quality of Git commit history. Repositories with missing history or non-standard workflows may show different patterns.</p>
        <p><strong>No External Data:</strong> We deliberately avoid integrating external data sources (issue trackers, CI/CD systems, code quality tools) to maintain transparency about what Git data alone can and cannot reveal.</p>
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
        ${report.metadata.cliArguments?.length ? `<dt>CLI Arguments</dt><dd><code>${this.escapeHtml(report.metadata.cliArguments.join(' '))}</code></dd>` : ''}
        ${warnings.length ? `<dt>Warnings</dt><dd><ul class="warnings">${warnings.map(w => `<li>${this.escapeHtml(w)}</li>`).join('')}</ul></dd>` : ''}
      </dl>
    </section>
  </main>
  <footer class="site-footer" role="contentinfo">
    <div class="footer-content">
      <p>Generated by GitSpark v${this.escapeHtml(report.metadata.version)} • ${this.escapeHtml(new Date(report.metadata.generatedAt).toLocaleString())}</p>
      <p>GitSpark is a <a href="https://markhazleton.com" target="_blank" rel="noopener noreferrer">Mark Hazleton</a> project</p>
    </div>
  </footer>
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
      .health-score[data-rating='high'] { background:var(--color-success); }
      .health-score[data-rating='moderate'] { background:var(--color-primary); }
      .health-score[data-rating='fair'] { background:var(--color-warning); }
      .health-score[data-rating='low'] { background:var(--color-danger); }
      .activity-breakdown { margin:1rem 0; padding:1rem; background:var(--color-bg); border:1px solid var(--color-border); border-radius:6px; }
      .activity-breakdown h3 { margin:0 0 .75rem; font-size:1rem; color:var(--color-text); }
      .activity-explanation { margin-bottom:1rem; padding:.75rem; background:var(--color-surface); border-left:4px solid var(--color-warning); border-radius:4px; }
      .activity-explanation p { margin:0; font-size:.9rem; color:var(--color-text); }
      .breakdown-components { display:grid; gap:.75rem; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); margin-bottom:1rem; }
      .component { background:var(--color-surface); padding:.75rem; border-radius:4px; border:1px solid var(--color-border); }
      .component-label { font-size:.75rem; color:var(--color-text-secondary); text-transform:uppercase; letter-spacing:.05em; margin-bottom:.25rem; }
      .component-value { font-size:1.1rem; font-weight:600; color:var(--color-primary); margin-bottom:.25rem; }
      .component-detail { font-size:.7rem; color:var(--color-text-secondary); }
      .formula { margin-top:.75rem; padding-top:.75rem; border-top:1px solid var(--color-border); }
      .formula code { background:var(--color-surface); padding:.25rem .4rem; border-radius:3px; font-size:.8rem; }
      .analysis-period { font-size:.8rem; margin:.25rem 0 1rem; color:var(--color-text-secondary); }
      
      /* New Limitation Section Styles */
      .critical-notice { background:#fff3cd; border:1px solid #ffeaa7; border-radius:8px; padding:1.5rem; margin-bottom:2rem; border-left:4px solid #fd7e14; }
      :root.dark .critical-notice { background:#2d2419; border-color:#635a3e; }
      .critical-notice h3 { color:#856404; margin:0 0 1rem; font-size:1.2rem; }
      :root.dark .critical-notice h3 { color:#ffeaa7; }
      .limitation-grid { display:grid; gap:1.5rem; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); margin-bottom:1.5rem; }
      .limitation-category { background:var(--color-surface); border:1px solid var(--color-border); border-radius:6px; padding:1rem; }
      .limitation-category h4 { margin:0 0 .75rem; color:var(--color-text); font-size:1rem; }
      .limitation-category ul { margin:.5rem 0; padding-left:1.2rem; }
      .limitation-category li { margin:.5rem 0; font-size:.9rem; }
      
      .honest-metrics-notice { background:var(--color-bg); border:1px solid var(--color-border); border-radius:6px; padding:1.5rem; border-left:4px solid var(--color-primary); }
      .honest-metrics-notice h4 { margin:0 0 1rem; color:var(--color-primary); }
      .honest-metrics-notice p { margin:.75rem 0; }
      .metric-categories { display:grid; gap:1rem; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); margin:1rem 0; }
      .metric-category { background:var(--color-surface); border:1px solid var(--color-border); border-radius:4px; padding:1rem; }
      .metric-category h5 { margin:0 0 .75rem; color:var(--color-text); font-size:.95rem; }
      .usage-guidelines { margin-top:1.5rem; background:var(--color-surface); border:1px solid var(--color-border); border-radius:4px; padding:1rem; }
      
      /* Team Patterns Section */
      .section-description { font-style:italic; color:var(--color-text-secondary); margin-bottom:1.5rem; font-size:.9rem; }
      .team-patterns-grid { display:grid; gap:1.5rem; grid-template-columns:repeat(auto-fit,minmax(250px,1fr)); margin-bottom:2rem; }
      .pattern-card { background:var(--color-surface); border:1px solid var(--color-border); border-radius:8px; padding:1.5rem; box-shadow:var(--shadow-sm); }
      .pattern-card h3 { margin:0 0 1rem; font-size:1.1rem; color:var(--color-text); border-bottom:2px solid var(--color-primary); padding-bottom:.5rem; }
      .pattern-metrics { display:flex; flex-direction:column; gap:.75rem; }
      .pattern-metric { display:flex; justify-content:space-between; align-items:center; padding:.5rem; background:var(--color-bg); border-radius:4px; }
      .pattern-metric .metric-label { font-size:.85rem; color:var(--color-text-secondary); }
      .pattern-metric .metric-value { font-weight:600; color:var(--color-text); }
      .pattern-metric .metric-note { font-size:.75rem; color:var(--color-text-secondary); font-style:italic; }
      
      /* Activity badge styles (renamed from risk badges) */
      .activity-badge { padding:.25rem .5rem; border-radius:4px; font-size:.65rem; font-weight:600; }
      .activity-high { background:var(--color-danger); color:#fff; }
      .activity-medium { background:var(--color-warning); color:#000; }
      .activity-low { background:var(--color-success); color:#fff; }
      .activity-minimal { background:#3b7ddd; color:#fff; }
      
      /* Measurement Principles */
      .measurement-principles { margin-bottom:2rem; }
      .principles-grid { display:grid; gap:1rem; grid-template-columns:repeat(auto-fit,minmax(250px,1fr)); margin-top:1rem; }
      .principle-card { background:var(--color-surface); border:1px solid var(--color-border); border-radius:6px; padding:1rem; border-left:4px solid var(--color-primary); }
      .principle-card h4 { margin:0 0 .75rem; color:var(--color-primary); font-size:1rem; }
      .principle-card p { margin:0; font-size:.9rem; }
      
      /* Updated formula explanations */
      .formula-explanation { margin-top:.75rem; }
      .formula-explanation ul { margin:.5rem 0; padding-left:1.2rem; }
      .formula-explanation li { font-size:.85rem; margin:.25rem 0; }
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
      .footer-content p { margin: 0.25rem 0; }
      .footer-content a { color:var(--color-primary); text-decoration:none; }
      .footer-content a:hover { text-decoration:underline; }
      .back-to-top { position:fixed; bottom:1rem; right:1rem; background:var(--color-primary); color:#fff; border:none; padding:.55rem .7rem; border-radius:4px; font-size:.85rem; cursor:pointer; box-shadow:var(--shadow-sm); }
      .back-to-top:hover, .back-to-top:focus { background:#004f99; }
      .warnings { margin:0; padding-left:1rem; }
      .warnings li { font-size:.7rem; }
      @media (max-width: 760px) { .main-nav ul { flex-wrap:wrap; gap:.5rem; } .branding { font-size:.85rem; } }
      @media print { .site-header, .back-to-top { display:none !important; } body { background:#fff; } .section { page-break-inside:avoid; } }
      @media (prefers-reduced-motion: reduce) { * { animation-duration:0.01ms !important; transition-duration:0.01ms !important; } }
      .show-more { background:var(--color-primary); color:#fff; border:1px solid var(--color-primary); padding:.4rem .7rem; border-radius:4px; cursor:pointer; font-size:.7rem; font-weight:500; box-shadow:var(--shadow-sm); }
      .show-more:hover, .show-more:focus { background:#004f99; }
      :root.dark .show-more { background:#2489ff; border-color:#2489ff; }
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
      
      .contribution-overview, .commit-patterns, .code-focus, .commit-distribution, .insights-section { margin-bottom:1.25rem; }
      .contribution-overview h4, .commit-patterns h4, .code-focus h4, .commit-distribution h4, .insights-section h4 { 
        margin:0 0 .75rem; font-size:1.1rem; color:var(--color-text); border-bottom:1px solid var(--color-border); padding-bottom:.5rem; 
      }
      
      .metrics-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(120px, 1fr)); gap:.75rem; margin-bottom:.75rem; }
      .metric-box { background:var(--color-surface); border:1px solid var(--color-border); border-radius:6px; padding:.75rem; text-align:center; color:var(--color-text); }

      /* Team Score Styles */
      .team-score-overview { margin-bottom:2rem; }
      .team-score-main { display:flex; align-items:center; gap:2rem; flex-wrap:wrap; justify-content:center; }
      .score-circle { 
        display:flex; flex-direction:column; align-items:center; justify-content:center; 
        width:120px; height:120px; border-radius:50%; 
        background:linear-gradient(135deg, var(--color-primary), #0056b3);
        color:#fff; box-shadow:0 4px 12px rgba(0,102,204,0.3);
      }
      .score-value { font-size:2.5rem; font-weight:700; line-height:1; }
      .score-label { font-size:.8rem; text-transform:uppercase; letter-spacing:.05em; opacity:.9; }
      
      .score-rating { text-align:center; }
      .rating-label { 
        font-size:1.5rem; font-weight:600; color:var(--color-primary);
        display:block; margin-bottom:.5rem;
      }
      .rating-description { font-size:.9rem; color:var(--color-text-secondary); max-width:300px; }
      
      .team-metrics-grid { 
        display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); 
        gap:1.5rem; margin-bottom:2rem; 
      }
      .team-metrics-grid .metric-card { 
        background:var(--color-surface); border:1px solid var(--color-border); 
        border-radius:8px; padding:1.5rem; box-shadow:var(--shadow-sm);
        text-align:left; display:block;
      }
      .team-metrics-grid .metric-card h3 { 
        margin:0 0 1rem; font-size:1.2rem; color:var(--color-text);
        border-bottom:2px solid var(--color-primary); padding-bottom:.5rem;
      }
      .team-metrics-grid .metric-score { 
        font-size:2rem; font-weight:700; color:var(--color-primary);
        margin-bottom:1rem; text-align:center;
      }
      
      .metric-details { display:flex; flex-direction:column; gap:.75rem; }
      .metric-item { 
        display:flex; justify-content:space-between; align-items:center;
        padding:.5rem; background:var(--color-bg); border-radius:4px;
      }
      .metric-name { font-size:.85rem; color:var(--color-text-secondary); }
      .metric-value { 
        font-weight:600; color:var(--color-text); 
        background:var(--color-primary); color:#fff; 
        padding:.25rem .5rem; border-radius:4px; font-size:.8rem;
      }
      .metric-limitations { 
        margin-top:.5rem; padding:.25rem .5rem; 
        background:var(--color-bg); border-radius:4px; 
        text-align:left; opacity:0.8;
      }
      .metric-limitations small { 
        font-size:.75rem; color:var(--color-text-secondary); 
        font-style:italic;
      }
      
      .team-insights { margin-top:2rem; }
      .insights-section h3 { margin:0 0 1rem; font-size:1.3rem; }
      .dynamic-badges { display:flex; gap:.75rem; flex-wrap:wrap; margin-bottom:1.5rem; }
      .dynamic-badge { 
        padding:.5rem 1rem; background:var(--color-primary); color:#fff; 
        border-radius:20px; font-size:.85rem; font-weight:500;
        text-transform:capitalize;
      }
      
      .insights-grid { 
        display:grid; grid-template-columns:repeat(auto-fit, minmax(250px, 1fr)); 
        gap:1.5rem; margin-bottom:2rem; 
      }
      .insight-category { 
        background:var(--color-bg); border:1px solid var(--color-border); 
        border-radius:6px; padding:1rem; 
      }
      .insight-category h4 { 
        margin:0 0 .75rem; font-size:1rem; 
        color:var(--color-text); border-bottom:1px solid var(--color-border); 
        padding-bottom:.5rem; 
      }
      .insight-category ul { margin:0; padding-left:1.2rem; }
      .insight-category li { font-size:.85rem; margin:.5rem 0; }


      /* Documentation Section Styles */
      .doc-intro { font-style:italic; color:var(--color-text-secondary); margin-bottom:2rem; }
      
      .measurement-limitations {
        background:#fff3cd; border:1px solid #ffeaa7; border-radius:8px; 
        padding:1.5rem; margin-bottom:2rem; border-left:4px solid #fdcb6e;
      }
      :root.dark .measurement-limitations {
        background:#2d2419; border-color:#635a3e; border-left-color:#fdcb6e;
      }
      .measurement-limitations h3 {
        color:#856404; margin:0 0 1rem; font-size:1.2rem;
      }
      :root.dark .measurement-limitations h3 { color:#ffeaa7; }
      .measurement-limitations p { margin:.75rem 0; }
      .measurement-limitations ul { margin:.5rem 0; padding-left:1.5rem; }
      .measurement-limitations li { margin:.25rem 0; }
      .limitation-notice {
        background:#fff3cd; border:1px solid #ffeaa7; border-radius:4px;
        padding:.75rem; margin:.75rem 0; font-size:.9rem;
        border-left:3px solid #fd7e14;
      }
      :root.dark .limitation-notice {
        background:#2d2419; border-color:#635a3e; color:#ffeaa7;
      }
      
      .doc-section { 
        margin-bottom:2.5rem; padding-bottom:1.5rem; 
        border-bottom:1px solid var(--color-border); 
      }
      .doc-section:last-child { border-bottom:none; }
      .doc-section h3 { 
        color:var(--color-primary); font-size:1.4rem; 
        margin-bottom:1rem; border-bottom:2px solid var(--color-primary); 
        padding-bottom:.5rem; 
      }
      .doc-section h4 { 
        color:var(--color-text); font-size:1.1rem; 
        margin:1.5rem 0 .75rem; 
      }
      
      .formula-box { 
        background:var(--color-bg); border:1px solid var(--color-border); 
        border-radius:6px; padding:1rem; margin:1rem 0; 
        border-left:4px solid var(--color-primary); 
      }
      .formula-box h4 { 
        margin:0 0 .75rem; font-size:1rem; 
        color:var(--color-primary); 
      }
      .formula { 
        font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; 
        font-size:.9rem; display:block; 
        background:var(--color-surface); padding:.75rem; 
        border-radius:4px; border:1px solid var(--color-border); 
        margin:.5rem 0; color:var(--color-text); 
        overflow-x:auto; 
      }
      
      .metric-docs { margin-top:1.5rem; }
      .metric-category { 
        margin-bottom:2rem; background:var(--color-surface); 
        border:1px solid var(--color-border); border-radius:6px; 
        padding:1.5rem; 
      }
      .metric-category h4 { 
        margin-top:0; color:var(--color-primary); 
        border-bottom:1px solid var(--color-border); 
        padding-bottom:.5rem; 
      }
      .metric-category ul { margin:.75rem 0; }
      .metric-category li { 
        margin:.75rem 0; line-height:1.5; 
        font-size:.9rem; 
      }
      .metric-category strong { color:var(--color-text); }
      
      .score-thresholds { 
        background:var(--color-bg); border:1px solid var(--color-border); 
        border-radius:6px; padding:1.5rem; margin-top:1.5rem; 
        border-left:4px solid var(--color-success); 
      }
      .score-thresholds h4 { 
        margin-top:0; color:var(--color-success); 
      }
      .score-thresholds ul { margin:.75rem 0; }
      .score-thresholds li { 
        margin:.5rem 0; font-size:.9rem; 
        line-height:1.4; 
      }
      
      .methodology-note { 
        background:var(--color-bg); border:1px solid var(--color-border); 
        border-radius:6px; padding:1.5rem; margin-top:2rem; 
        border-left:4px solid var(--color-warning); 
      }
      .methodology-note h4 { 
        margin-top:0; color:var(--color-warning); 
        margin-bottom:1rem; 
      }
      .methodology-note p { 
        margin:.75rem 0; font-size:.9rem; 
        line-height:1.5; 
      }
      .methodology-note strong { color:var(--color-text); }
      .metric-box .metric-value { font-size:1.2rem; font-weight:600; color:var(--color-text); }
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
      /* Width classes for commit size bars - CSP compliant */
      .size-bar-fill.w-0 { width: 0%; }
      .size-bar-fill.w-1 { width: 1%; }
      .size-bar-fill.w-2 { width: 2%; }
      .size-bar-fill.w-3 { width: 3%; }
      .size-bar-fill.w-4 { width: 4%; }
      .size-bar-fill.w-5 { width: 5%; }
      .size-bar-fill.w-10 { width: 10%; }
      .size-bar-fill.w-15 { width: 15%; }
      .size-bar-fill.w-20 { width: 20%; }
      .size-bar-fill.w-25 { width: 25%; }
      .size-bar-fill.w-30 { width: 30%; }
      .size-bar-fill.w-35 { width: 35%; }
      .size-bar-fill.w-40 { width: 40%; }
      .size-bar-fill.w-45 { width: 45%; }
      .size-bar-fill.w-50 { width: 50%; }
      .size-bar-fill.w-55 { width: 55%; }
      .size-bar-fill.w-60 { width: 60%; }
      .size-bar-fill.w-65 { width: 65%; }
      .size-bar-fill.w-70 { width: 70%; }
      .size-bar-fill.w-75 { width: 75%; }
      .size-bar-fill.w-80 { width: 80%; }
      .size-bar-fill.w-85 { width: 85%; }
      .size-bar-fill.w-90 { width: 90%; }
      .size-bar-fill.w-95 { width: 95%; }
      .size-bar-fill.w-100 { width: 100%; }
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
      
      /* Responsive design for author profiles */
      @media (max-width: 768px) { 
        .metrics-grid { grid-template-columns:repeat(2, 1fr); }
        .size-bar { flex-direction:column; align-items:flex-start; gap:.25rem; }
        .size-label { min-width:auto; }
        .size-bar-container { width:100%; }
      }

      /* Daily Trends Section Styles */
      .trends-overview { margin-bottom:2rem; }
      .trends-summary-grid { 
        display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); 
        gap:1rem; margin-bottom:1.5rem; 
      }
      .trend-summary-card { 
        background:var(--color-surface); border:1px solid var(--color-border); 
        border-radius:8px; padding:1.5rem; text-align:center; 
        box-shadow:var(--shadow-sm); 
      }
      .summary-metric .metric-value { 
        font-size:2rem; font-weight:700; color:var(--color-primary); 
        margin-bottom:.5rem; 
      }
      .summary-metric .metric-label { 
        font-size:.9rem; font-weight:600; color:var(--color-text); 
        margin-bottom:.25rem; 
      }
      .summary-metric .metric-detail { 
        font-size:.75rem; color:var(--color-text-secondary); 
      }
      
      .key-trends { margin-bottom:2rem; }
      .trend-category { 
        margin-bottom:2.5rem; background:var(--color-surface); 
        border:1px solid var(--color-border); border-radius:8px; 
        padding:1.5rem; border-left:4px solid var(--color-primary); 
      }
      .trend-category h4 { 
        margin:0 0 1rem; font-size:1.2rem; color:var(--color-primary); 
        border-bottom:1px solid var(--color-border); padding-bottom:.5rem; 
      }
      .trend-explanation { 
        margin-bottom:1.5rem; padding:.75rem; 
        background:var(--color-bg); border-radius:4px; 
        border-left:3px solid var(--color-primary); 
      }
      .trend-explanation p { margin:0; font-size:.9rem; color:var(--color-text); }
      
      .trends-table { font-size:.8rem; }
      .trends-table th, .trends-table td { padding:.4rem .6rem; }
      .table-note { 
        font-size:.75rem; color:var(--color-text-secondary); 
        margin-top:.5rem; font-style:italic; 
      }
      
      .trends-limitations { 
        background:#fff3cd; border:1px solid #ffeaa7; 
        border-radius:8px; padding:1.5rem; 
        border-left:4px solid #fd7e14; 
      }
      :root.dark .trends-limitations { 
        background:#2d2419; border-color:#635a3e; 
      }
      .trends-limitations h3 { 
        color:#856404; margin:0 0 1rem; font-size:1.2rem; 
      }
      :root.dark .trends-limitations h3 { color:#ffeaa7; }
      .trends-limitations h4 { 
        color:#856404; margin:1.5rem 0 .75rem; font-size:1rem; 
      }
      :root.dark .trends-limitations h4 { color:#ffeaa7; }
      .trends-limitations ul { margin:.5rem 0; padding-left:1.5rem; }
      .trends-limitations li { margin:.25rem 0; font-size:.9rem; }

      /* Contributions Graph Styles */
      .contributions-graph { 
        margin: 2rem 0; 
        background: var(--color-surface); 
        border: 1px solid var(--color-border); 
        border-radius: 8px; 
        padding: 1.5rem; 
        border-left: 4px solid var(--color-primary); 
      }
      .contributions-graph h3 { 
        margin: 0 0 1rem; 
        font-size: 1.2rem; 
        color: var(--color-primary); 
        border-bottom: 1px solid var(--color-border); 
        padding-bottom: .5rem; 
      }
      .contributions-calendar { 
        display: flex; 
        flex-direction: column; 
        gap: 3px; 
        max-width: 100%; 
        overflow-x: auto; 
        padding: 1rem 0; 
      }
      .contributions-header { 
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        margin-bottom: 1rem; 
        font-size: .9rem; 
        color: var(--color-text-secondary); 
      }
      .contributions-weeks { 
        display: flex; 
        gap: 3px; 
      }
      .contributions-week { 
        display: flex; 
        flex-direction: column; 
        gap: 3px; 
      }
      .contribution-day { 
        width: 10px; 
        height: 10px; 
        border-radius: 2px; 
        border: 1px solid var(--color-border); 
        cursor: pointer; 
        transition: all 0.2s ease; 
      }
      .contribution-day:hover { 
        border-color: var(--color-primary); 
        transform: scale(1.2); 
      }
      .contribution-day.intensity-0 { 
        background: var(--color-bg); 
      }
      .contribution-day.intensity-1 { 
        background: #9be9a8; 
      }
      .contribution-day.intensity-2 { 
        background: #40c463; 
      }
      .contribution-day.intensity-3 { 
        background: #30a14e; 
      }
      .contribution-day.intensity-4 { 
        background: #216e39; 
      }
      .contributions-legend { 
        display: flex; 
        align-items: center; 
        gap: .5rem; 
        margin-top: 1rem; 
        font-size: .75rem; 
        color: var(--color-text-secondary); 
      }
      .legend-scale { 
        display: flex; 
        gap: 2px; 
      }
      .legend-day { 
        width: 8px; 
        height: 8px; 
        border-radius: 1px; 
        border: 1px solid var(--color-border); 
      }
      .contribution-tooltip { 
        position: absolute; 
        background: var(--color-surface); 
        border: 1px solid var(--color-border); 
        border-radius: 4px; 
        padding: .5rem; 
        font-size: .75rem; 
        box-shadow: var(--shadow-lg); 
        z-index: 1000; 
        pointer-events: none; 
        opacity: 0; 
        transition: opacity 0.2s ease; 
      }
      .contribution-tooltip.visible { 
        opacity: 1; 
      }

      /* Visual Trends Chart Styles */
      .visual-trends { margin: 2rem 0; }
      .charts-grid { 
        display: grid; 
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); 
        gap: 2rem; 
        margin: 1.5rem 0; 
      }
      
      .chart-container { 
        background: var(--color-surface); 
        border: 1px solid var(--color-border); 
        border-radius: 8px; 
        padding: 1.5rem; 
        box-shadow: var(--shadow-sm); 
      }
      .chart-container h4 { 
        margin: 0 0 1rem; 
        font-size: 1.1rem; 
        color: var(--color-text); 
        border-bottom: 1px solid var(--color-border); 
        padding-bottom: 0.5rem; 
      }
      
      .trend-chart { 
        max-width: 100%; 
        height: auto; 
        border-radius: 4px; 
        background: var(--color-surface); 
      }
      .trend-chart .data-points circle:hover { 
        r: 5; 
        stroke: var(--color-surface); 
        stroke-width: 2; 
        cursor: pointer; 
      }
      .trend-chart .grid line { 
        stroke: var(--color-border); 
        stroke-opacity: 0.3; 
      }
      
      .chart-placeholder { 
        text-align: center; 
        color: var(--color-text-secondary); 
        font-style: italic; 
        padding: 2rem; 
        background: var(--color-bg); 
        border-radius: 4px; 
        border: 1px dashed var(--color-border); 
      }
      
      /* Sparklines Styles */
      .sparklines-container { 
        background: var(--color-surface); 
        border: 1px solid var(--color-border); 
        border-radius: 8px; 
        padding: 1.5rem; 
        box-shadow: var(--shadow-sm); 
      }
      .sparklines-container h4 { 
        margin: 0 0 1rem; 
        font-size: 1.1rem; 
        color: var(--color-text); 
        border-bottom: 1px solid var(--color-border); 
        padding-bottom: 0.5rem; 
      }
      
      .sparklines-grid { 
        display: grid; 
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
        gap: 1.5rem; 
      }
      
      .sparkline-item { 
        background: var(--color-bg); 
        border: 1px solid var(--color-border); 
        border-radius: 6px; 
        padding: 1rem; 
      }
      .sparkline-label { 
        font-size: 0.85rem; 
        font-weight: 600; 
        color: var(--color-text); 
        margin-bottom: 0.5rem; 
      }
      .sparkline-summary { 
        font-size: 0.75rem; 
        color: var(--color-text-secondary); 
        margin-top: 0.5rem; 
        text-align: center; 
      }
      
      .sparkline-chart { 
        height: 60px; 
        margin: 0.75rem 0; 
      }
      .sparkline-bars { 
        display: flex; 
        align-items: flex-end; 
        gap: 2px; 
        height: 100%; 
        padding: 0 0.25rem; 
      }
      .spark-bar { 
        flex: 1; 
        min-height: 2px; 
        background: linear-gradient(to top, var(--color-primary), #2196f3); 
        border-radius: 2px 2px 0 0; 
        transition: all 0.2s ease; 
        cursor: pointer; 
      }
      .spark-bar:hover { 
        background: var(--color-warning); 
        transform: scaleY(1.1); 
        z-index: 10; 
      }
      .sparkline-bars.files .spark-bar { 
        background: linear-gradient(to top, var(--color-success), #4caf50); 
      }
      .sparkline-bars.files .spark-bar:hover { 
        background: var(--color-warning); 
      }
      
      /* Responsive design for charts */
      @media (max-width: 768px) { 
        .charts-grid { 
          grid-template-columns: 1fr; 
        }
        .sparklines-grid { 
          grid-template-columns: 1fr; 
        }
        .trend-chart { 
          width: 100%; 
          height: auto; 
        }
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
    if (scorePercent >= 80) return 'high';
    if (scorePercent >= 60) return 'moderate';
    if (scorePercent >= 40) return 'fair';
    return 'low';
  }

  private generateDetailedAuthorProfiles(authors: any[]): string {
    // Normalize and merge authors with same email (case-insensitive)
    const mergedAuthors = this.mergeAuthorsByEmail(authors);
    return mergedAuthors.map(author => this.generateAuthorProfileCard(author)).join('\n');
  }

  private mergeAuthorsByEmail(authors: any[]): any[] {
    const emailMap = new Map<string, any>();

    for (const author of authors) {
      const normalizedEmail = author.email.toLowerCase();

      if (emailMap.has(normalizedEmail)) {
        const existing = emailMap.get(normalizedEmail)!;
        // Merge the authors by combining their data
        existing.commits += author.commits;
        existing.insertions += author.insertions;
        existing.deletions += author.deletions;
        existing.churn += author.churn;
        existing.filesChanged = Math.max(existing.filesChanged, author.filesChanged);
        existing.avgCommitSize = existing.churn / existing.commits;

        // Use the earliest first commit and latest last commit
        if (author.firstCommit < existing.firstCommit) {
          existing.firstCommit = author.firstCommit;
        }
        if (author.lastCommit > existing.lastCommit) {
          existing.lastCommit = author.lastCommit;
        }

        // Merge detailed metrics if they exist
        if (existing.detailed && author.detailed) {
          // Combine contribution metrics
          if (existing.detailed.contribution && author.detailed.contribution) {
            existing.detailed.contribution.totalCommits +=
              author.detailed.contribution.totalCommits || 0;
            existing.detailed.contribution.totalLines +=
              author.detailed.contribution.totalLines || 0;
            existing.detailed.contribution.avgCommitSize =
              existing.detailed.contribution.totalLines /
              existing.detailed.contribution.totalCommits;
          }

          // Merge work patterns - use the pattern with more data
          if (
            author.detailed.workPattern &&
            (!existing.detailed.workPattern ||
              (author.detailed.workPattern.commits || 0) >
                (existing.detailed.workPattern.commits || 0))
          ) {
            existing.detailed.workPattern = author.detailed.workPattern;
          }
        }

        // Keep the name that appears more frequently (prefer non-email names)
        if (
          author.name &&
          !author.name.includes('@') &&
          (existing.name.includes('@') || author.name.length > existing.name.length)
        ) {
          existing.name = author.name;
        }
      } else {
        // Create a copy of the author with normalized email
        const normalizedAuthor = { ...author, email: normalizedEmail };
        emailMap.set(normalizedEmail, normalizedAuthor);
      }
    }

    return Array.from(emailMap.values());
  }

  private generateAuthorProfileCard(author: any): string {
    const metrics = author.detailed;
    const authorId = this.escapeHtml(author.email.replace(/[^a-zA-Z0-9]/g, '-'));
    const numberFmt = (n: number) => new Intl.NumberFormat().format(n);
    const pctFmt = (n: number) => `${n.toFixed(1)}%`;
    const dateRange = `${author.firstCommit.toISOString().split('T')[0]} → ${author.lastCommit.toISOString().split('T')[0]}`;

    // Safely access detailed metrics with fallbacks
    const contribution = metrics?.contribution || {};
    const workPattern = metrics?.workPattern || {};

    return `
    <div class="author-profile-card" id="author-${authorId}">
      <div class="author-header">
        <h3>${this.escapeHtml(author.name)}</h3>
        <span class="author-email">${this.escapeHtml(author.email)}</span>
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
          <div>Primary Directories: ${this.getTopDirectories(contribution.filesAndScope?.directoryFocus || [])}</div>
          <div>Repository Coverage: ${pctFmt(contribution.filesAndScope?.fileDiversityScore || 0)} of total files</div>
          <div>Source Code Changes: +${numberFmt(contribution.filesAndScope?.sourceVsPublishedRatio?.sourceLines?.insertions || 0)} / 
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
            <em>"${this.escapeHtml(contribution.largestCommitDetails.message)}"</em>
          </div>`
              : ''
          }
          
          <div class="activity-summary">
            <p><strong>Activity Summary:</strong> This author contributed ${numberFmt(author.commits)} commits over ${author.activeDays} active days, 
            changing ${numberFmt(contribution.filesAndScope?.uniqueFiles || 0)} unique files with an average of 
            ${author.avgCommitSize.toFixed(1)} lines per commit.</p>
            
            <p><strong>Data Limitations:</strong> All metrics are derived from Git commit data and represent observable patterns only. 
            They do not indicate productivity, code quality, work hours, or individual performance.</p>
          </div>
        </div>
      </div>

      ${this.generateAuthorInsightsSection(metrics)}
    </div>`;
  }

  private getTopDirectories(directoryFocus: any[]): string {
    if (!directoryFocus || directoryFocus.length === 0) return 'N/A';

    // Take top directories and normalize percentages to ensure they sum to 100%
    let topDirectories = directoryFocus.slice(0, 3);

    // Calculate total percentage of selected directories
    let totalPercentage = topDirectories.reduce((sum, d) => sum + d.percentage, 0);

    // If total exceeds 100%, normalize to 100%
    if (totalPercentage > 100) {
      const scaleFactor = 100 / totalPercentage;
      topDirectories = topDirectories.map(d => ({
        ...d,
        percentage: d.percentage * scaleFactor,
      }));
      totalPercentage = 100;
    }

    // If we have less than 100% and need to show "others"
    const result = topDirectories.map(d => `${d.directory}/ (${d.percentage.toFixed(0)}%)`);

    if (totalPercentage < 100 && directoryFocus.length > 3) {
      const othersPercentage = 100 - totalPercentage;
      result.push(`others (${othersPercentage.toFixed(0)}%)`);
    }

    return result.join(', ');
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
        // Use actual percentage for width, with minimum 1% for very small but visible values
        const barWidth = hasData ? Math.max(percentage, 1) : 0;
        // Map percentage to CSS width class for CSP compliance
        const widthClass = this.getWidthClass(barWidth);

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

  private getWidthClass(percentage: number): string {
    if (percentage <= 0) return 'w-0';
    if (percentage <= 1) return 'w-1';
    if (percentage <= 2) return 'w-2';
    if (percentage <= 3) return 'w-3';
    if (percentage <= 4) return 'w-4';
    if (percentage <= 5) return 'w-5';
    if (percentage <= 10) return 'w-10';
    if (percentage <= 15) return 'w-15';
    if (percentage <= 20) return 'w-20';
    if (percentage <= 25) return 'w-25';
    if (percentage <= 30) return 'w-30';
    if (percentage <= 35) return 'w-35';
    if (percentage <= 40) return 'w-40';
    if (percentage <= 45) return 'w-45';
    if (percentage <= 50) return 'w-50';
    if (percentage <= 55) return 'w-55';
    if (percentage <= 60) return 'w-60';
    if (percentage <= 65) return 'w-65';
    if (percentage <= 70) return 'w-70';
    if (percentage <= 75) return 'w-75';
    if (percentage <= 80) return 'w-80';
    if (percentage <= 85) return 'w-85';
    if (percentage <= 90) return 'w-90';
    if (percentage <= 95) return 'w-95';
    return 'w-100';
  }

  private generateAuthorInsightsSection(metrics: any): string {
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
              ${strengths.map((strength: string) => `<li>${this.escapeHtml(strength)}</li>`).join('')}
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
              ${growthAreas.map((area: string) => `<li>${this.escapeHtml(area)}</li>`).join('')}
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

  private getBasicScript(): string {
    return `(() => {
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
      
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(() => { makeSortable(); }, 0); 
      } else {
        document.addEventListener('DOMContentLoaded', () => { makeSortable(); });
      }
      
      document.addEventListener('DOMContentLoaded', () => { 
        initPagination(); 
      });
    })();`;
  }

  /**
   * Calculate Activity Index breakdown components for display
   * @private
   */
  private calculateActivityIndexBreakdown(report: AnalysisReport): {
    commitFrequency: number;
    commitFrequencyRaw: number;
    authorParticipation: number;
    authorParticipationRaw: number;
    consistencyIndex: number;
    consistencyIndexRaw: number;
    formula: string;
  } {
    const commits = report.repository.totalCommits;
    const authors = report.repository.totalAuthors;
    const activeDays = Math.max(report.repository.activeDays, 1);

    if (commits === 0 || activeDays === 0) {
      return {
        commitFrequency: 0,
        commitFrequencyRaw: 0,
        authorParticipation: 0,
        authorParticipationRaw: 0,
        consistencyIndex: 0,
        consistencyIndexRaw: 0,
        formula: '(0.000 + 0.000 + 0.000) ÷ 3 = 0.000',
      };
    }

    // Component 1: Commit frequency (commits per day) - normalized to 0-1 scale
    const commitFrequencyRaw = commits / activeDays;
    const commitFrequency = Math.min(commitFrequencyRaw / 5, 1); // Cap at 5 commits/day for normalization

    // Component 2: Author participation ratio - normalized to 0-1 scale
    const authorParticipationRaw = authors / Math.max(commits / 20, 1); // 1 author per 20 commits baseline
    const authorParticipation = Math.min(authorParticipationRaw, 1);

    // Component 3: Change consistency - derive from final score
    // Since we don't have access to individual commit sizes in the report summary,
    // we calculate this as the remaining component to reach the final score
    const finalScore = report.repository.healthScore;
    const consistencyIndexRaw = Math.max(
      0,
      Math.min(1, finalScore * 3 - commitFrequency - authorParticipation)
    );

    const formula = `(${commitFrequency.toFixed(3)} + ${authorParticipation.toFixed(3)} + ${consistencyIndexRaw.toFixed(3)}) ÷ 3 = ${finalScore.toFixed(3)}`;

    return {
      commitFrequency: Math.round(commitFrequency * 100),
      commitFrequencyRaw,
      authorParticipation: Math.round(authorParticipation * 100),
      authorParticipationRaw,
      consistencyIndex: Math.round(consistencyIndexRaw * 100),
      consistencyIndexRaw,
      formula,
    };
  }

  /**
   * Generate daily trends section for HTML report
   * @private
   */
  private generateDailyTrendsSection(trends: any): string {
    const dateFormat = (date: Date) => date.toISOString().split('T')[0];

    const metadata = trends.analysisMetadata;
    const flowMetrics = trends.flowMetrics || [];
    const stabilityMetrics = trends.stabilityMetrics || [];
    const ownershipMetrics = trends.ownershipMetrics || [];
    const couplingMetrics = trends.couplingMetrics || [];
    const hygieneMetrics = trends.hygieneMetrics || [];

    // Calculate summary statistics
    const totalCommits = flowMetrics.reduce((sum: number, day: any) => sum + day.commitsPerDay, 0);
    const peakDay = flowMetrics.reduce(
      (peak: any, day: any) => (day.commitsPerDay > (peak?.commitsPerDay || 0) ? day : peak),
      null
    );
    const avgCommitsPerDay = flowMetrics.length > 0 ? totalCommits / flowMetrics.length : 0;

    // Stability stats
    const totalReverts = stabilityMetrics.reduce(
      (sum: number, day: any) => sum + day.revertsPerDay,
      0
    );

    return `
    <section id="daily-trends" class="section">
      <h2>📈 Daily Activity Trends</h2>
      <p class="section-description">
        Objective daily patterns computed exclusively from Git commit history. These metrics show repository activity trends 
        and do not indicate team performance, code quality, or individual productivity.
      </p>

      <!-- Trends Overview -->
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

      <!-- Contributions Graph -->
      ${this.generateContributionsGraphSection(trends.contributionsGraph, metadata)}

      <!-- Visual Trend Charts -->
      <div class="visual-trends">
        <h3>Visual Trend Analysis</h3>
        <div class="charts-grid">
          ${this.generateCommitTrendChart(flowMetrics)}
          ${this.generateAuthorTrendChart(flowMetrics)}
          ${this.generateVolumeSparklines(flowMetrics)}
        </div>
      </div>

      <!-- Key Trends -->
      <div class="key-trends">
        <h3>Key Trending Patterns</h3>
        
        <!-- Flow Trends -->
        <div class="trend-category">
          <h4>📊 Daily Flow & Throughput</h4>
          <div class="trend-explanation">
            <p>Observable patterns in commit frequency, author participation, and code volume changes.</p>
          </div>
          
          ${this.generateFlowTrendsTable(flowMetrics)}
        </div>

        <!-- Stability Trends -->
        <div class="trend-category">
          <h4>⚖️ Daily Stability Indicators</h4>
          <div class="trend-explanation">
            <p>Patterns that may indicate repository stability, including reverts, merges, and file retouch rates.</p>
          </div>
          
          ${this.generateStabilityTrendsTable(stabilityMetrics)}
        </div>

        <!-- Ownership Trends -->
        <div class="trend-category">
          <h4>👥 Daily Ownership Patterns</h4>
          <div class="trend-explanation">
            <p>File ownership distribution and knowledge spreading patterns based on authorship data.</p>
          </div>
          
          ${this.generateOwnershipTrendsTable(ownershipMetrics)}
        </div>

        <!-- Coupling Trends -->
        <div class="trend-category">
          <h4>🔗 Daily Coupling Indicators</h4>
          <div class="trend-explanation">
            <p>Patterns in file co-changes that may indicate architectural coupling or batch changes.</p>
          </div>
          
          ${this.generateCouplingTrendsTable(couplingMetrics)}
        </div>

        <!-- Hygiene Trends -->
        <div class="trend-category">
          <h4>🧹 Daily Hygiene Patterns</h4>
          <div class="trend-explanation">
            <p>Commit message quality patterns and documentation practices observed in commit data.</p>
          </div>
          
          ${this.generateHygieneTrendsTable(hygieneMetrics)}
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

  private generateFlowTrendsTable(flowMetrics: any[]): string {
    if (flowMetrics.length === 0) {
      return '<div class="no-data">No flow data available</div>';
    }

    // Show last 30 days or all data if less
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

  private generateStabilityTrendsTable(stabilityMetrics: any[]): string {
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

  private generateOwnershipTrendsTable(ownershipMetrics: any[]): string {
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

  private generateCouplingTrendsTable(couplingMetrics: any[]): string {
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

  private generateHygieneTrendsTable(hygieneMetrics: any[]): string {
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

  /**
   * Generate GitHub-style contributions graph section
   */
  private generateContributionsGraphSection(contributionsGraph: any, metadata: any): string {
    if (!contributionsGraph || !contributionsGraph.calendar) {
      return '';
    }

    const { totalCommits, weeks } = contributionsGraph;

    // Generate week columns
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
          <span>Activity over the last ${metadata.totalDays} days</span>
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

  /**
   * Generate SVG line chart for commit trends
   * @private
   */
  private generateCommitTrendChart(flowMetrics: any[]): string {
    if (!flowMetrics || flowMetrics.length === 0) {
      return '<div class="chart-placeholder">No commit trend data available</div>';
    }

    // Take last 30 days or all data if less
    const recentData = flowMetrics.slice(-30);
    const maxCommits = Math.max(...recentData.map(d => d.commitsPerDay), 1);

    // Chart dimensions
    const width = 800;
    const height = 200;
    const padding = { top: 20, right: 50, bottom: 30, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Generate points for the line
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

  /**
   * Generate SVG line chart for author trends
   * @private
   */
  private generateAuthorTrendChart(flowMetrics: any[]): string {
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

  /**
   * Generate CSS-based sparklines for volume metrics
   * @private
   */
  private generateVolumeSparklines(flowMetrics: any[]): string {
    if (!flowMetrics || flowMetrics.length === 0) {
      return '<div class="chart-placeholder">No volume data available</div>';
    }

    const recentData = flowMetrics.slice(-14); // Last 2 weeks
    const maxLines = Math.max(...recentData.map(d => d.grossLinesChangedPerDay), 1);
    const maxFiles = Math.max(...recentData.map(d => d.filesTouchedPerDay), 1);

    const linesSparkline = recentData
      .map(day => {
        const height = (day.grossLinesChangedPerDay / maxLines) * 100;
        return `<div class="spark-bar" style="height: ${height}%;" title="${day.day}: ${day.grossLinesChangedPerDay.toLocaleString()} lines"></div>`;
      })
      .join('');

    const filesSparkline = recentData
      .map(day => {
        const height = (day.filesTouchedPerDay / maxFiles) * 100;
        return `<div class="spark-bar" style="height: ${height}%;" title="${day.day}: ${day.filesTouchedPerDay} files"></div>`;
      })
      .join('');

    return `
      <div class="sparklines-container">
        <h4>Volume Trends (Last 14 Days)</h4>
        <div class="sparklines-grid">
          <div class="sparkline-item">
            <div class="sparkline-label">Lines Changed</div>
            <div class="sparkline-chart">
              <div class="sparkline-bars">
                ${linesSparkline}
              </div>
            </div>
            <div class="sparkline-summary">Peak: ${maxLines.toLocaleString()}</div>
          </div>
          
          <div class="sparkline-item">
            <div class="sparkline-label">Files Touched</div>
            <div class="sparkline-chart">
              <div class="sparkline-bars files">
                ${filesSparkline}
              </div>
            </div>
            <div class="sparkline-summary">Peak: ${maxFiles}</div>
          </div>
        </div>
      </div>
    `;
  }
}
