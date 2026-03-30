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
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import { createLogger } from '../utils/logger.js';
import { createHash } from 'crypto';

const logger = createLogger('html-exporter');

/**
 * Exports analysis reports as interactive HTML with charts and visualizations
 *
 * The HTMLExporter generates comprehensive HTML reports featuring:
 * - Executive summary with health metrics
 * - Interactive native SVG charts
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
   * @param teamwork - When true, focuses on team success by removing individual contributor sections
   * @throws {Error} When output directory cannot be created or file cannot be written
   * @returns Promise that resolves when export is complete
   */
  async export(
    report: AnalysisReport,
    outputPath: string,
    fileFilteringConfig?: FileFilteringConfig,
    teamwork?: boolean
  ): Promise<void> {
    try {
      const fullPath = resolve(outputPath, 'git-spark-report.html');

      // Ensure directory exists
      mkdirSync(dirname(fullPath), { recursive: true });

      // Generate HTML content
      const htmlContent = this.generateHTML(report, fileFilteringConfig, teamwork);

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
   * - Native SVG charts for visualizations
   * - Custom CSS for git-spark branding
   * - JavaScript for dark mode toggle and interactions
   *
   * @param report - Analysis report data to render
   * @param fileFilteringConfig - Optional configuration for file filtering in hotspots
   * @returns Complete HTML document as string
   * @private
   */
  private generateHTML(report: AnalysisReport, fileFilteringConfig?: FileFilteringConfig, teamwork?: boolean): string {
    const repoName = basename(report.metadata.repoPath || '.') || 'repository';
    const generatedAt = report.metadata.generatedAt.toISOString();
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
      {
        label: 'Bus Factor',
        value: `${Math.round((report.repository.busFactor / report.repository.totalAuthors) * 100)}%`,
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
          <td><code title="${escapeHtml(f.path)}">${escapeHtml(truncatePath(f.path))}</code></td>
          <td class="num" data-sort="${f.commits}">${numberFmt(f.commits)}</td>
          <td class="num" data-sort="${f.churn}">${numberFmt(f.churn)}</td>
          <td class="num" data-sort="${authors}">${authors}</td>
          <td class="num" data-sort="${riskPercent}"><span class="activity-badge activity-${getRiskBand(riskPercent)}" title="Commits: ${f.commits}\nLines Changed: ${f.churn}\nAuthors: ${authors}">${riskPercent}%</span></td>
        </tr>`;
      })
      .join('');

    // Merge authors with same email (case-insensitive) for consistent display
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

    // Simple SVG OG image summarizing key stats
    const ogSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='418' viewBox='0 0 800 418' role='img'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop stop-color='%230066cc' offset='0'/><stop stop-color='%2328a745' offset='1'/></linearGradient></defs><rect width='800' height='418' fill='%231e2227'/><text x='40' y='80' font-family='Segoe UI,Roboto,Arial,sans-serif' font-size='42' fill='white'>Git Activity Report</text><text x='40' y='140' font-size='26' fill='white'>${escapeHtml(repoName)}</text><text x='40' y='200' font-size='20' fill='white'>Commits: ${report.repository.totalCommits}</text><text x='40' y='235' font-size='20' fill='white'>Authors: ${report.repository.totalAuthors}</text><text x='40' y='270' font-size='20' fill='white'>Files: ${report.repository.totalFiles}</text><text x='40' y='320' font-size='16' fill='#bbb'>Generated ${new Date(report.metadata.generatedAt).toISOString().split('T')[0]}</text><rect x='600' y='60' width='160' height='160' rx='8' fill='url(#g)' opacity='0.8'/><text x='680' y='160' text-anchor='middle' font-size='32' fill='white' font-weight='700'>${compactFmt(report.repository.totalChurn)}</text><text x='680' y='185' text-anchor='middle' font-size='14' fill='white'>Lines Changed</text></svg>`;
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
        // Cap the analysis period to the repository's actual lifetime
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
        // Show commits within the analyzed period
        const commitsInPeriod = report.repository.totalCommits;
        analysisPeriod = `Analyzed Period: ${firstStr} → ${lastStr} (${days} day${days !== 1 ? 's' : ''}, ${commitsInPeriod} commit${commitsInPeriod !== 1 ? 's' : ''})`;
      }
    } catch {
      /* ignore */
    }

    // Prepare standalone styles without external dependencies
    const styleContent = getCustomStyles();
    const styleHash = createHash('sha256').update(styleContent, 'utf8').digest('base64');
    const basicScript = getBasicScript();

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
              <li><strong>Bus Factor:</strong> Percentage of contributors needed to account for 50% of commits</li>
            </ul>
            <div class="formula-box">
              <code class="formula">
                Bus Factor = (Minimum authors needed for 50% of total commits ÷ Total authors) × 100%
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
    return html;
  }
}
