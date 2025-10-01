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
      maxHotspots: 10,
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
          <td class="num" data-sort="${riskPercent}"><span class="risk-badge risk-${this.getRiskBand(riskPercent)}" title="Commits: ${f.commits}\nChurn: ${f.churn}\nAuthors: ${authors}">${riskPercent}%</span></td>
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
  <meta property="og:description" content="${this.escapeHtml(`${report.repository.totalCommits} commits • ${report.repository.totalAuthors} contributors • Health ${healthPct}%`)}">>
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
          <li><a href="#authors">Authors</a></li>
          <li><a href="#team-score">Team Score</a></li>
          <li><a href="#files">Files</a></li>
          <li><a href="#risks">Risks</a></li>
          <li><a href="#author-details">Author Details</a></li>
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
        <div class="health-score" data-rating="${this.getHealthRating(healthPct)}" title="Repository activity index">${healthPct}% <span>${this.capitalize(this.getHealthRating(healthPct))}</span></div>
      </div>

      ${(() => {
        const breakdown = this.calculateActivityIndexBreakdown(report);
        return `
        <div class="activity-breakdown">
          <h3>Activity Index Calculation</h3>
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

    <section id="team-score" class="section">
      <h2>Team Effectiveness Score</h2>
      <div class="team-score-overview">
        <div class="team-score-main">
          <div class="score-circle">
            <div class="score-value">${report.teamScore.overall}</div>
            <div class="score-label">Overall Score</div>
          </div>
          <div class="score-rating">
            <span class="rating-label">${this.getTeamScoreRating(report.teamScore.overall)}</span>
            <div class="rating-description">${this.getTeamScoreDescription(report.teamScore.overall)}</div>
          </div>
        </div>
      </div>
      
      <div class="team-metrics-grid">
        <div class="metric-card">
          <h3>Team Organization</h3>
          <div class="metric-score">${report.teamScore.collaboration.score}</div>
          <div class="metric-details">
            <div class="metric-item">
              <span class="metric-name">Developer Specialization</span>
              <span class="metric-value">${report.teamScore.collaboration.knowledgeDistribution.toFixed(1)}%</span>
            </div>
            <div class="metric-item">
              <span class="metric-name">File Ownership Clarity</span>
              <span class="metric-value">${report.teamScore.collaboration.crossTeamInteraction.toFixed(1)}%</span>
            </div>
          </div>
          <div class="metric-limitations">
            <small>📊 Higher scores indicate better team organization and specialization</small>
          </div>
        </div>

        <div class="metric-card">
          <h3>Consistency</h3>
          <div class="metric-score">${report.teamScore.consistency.score}</div>
          <div class="metric-details">
            <div class="metric-item">
              <span class="metric-name">Bus Factor Distribution</span>
              <span class="metric-value">${report.teamScore.consistency.busFactorPercentage.toFixed(1)}%</span>
            </div>
            <div class="metric-item">
              <span class="metric-name">Active Contributors</span>
              <span class="metric-value">${report.teamScore.consistency.activeContributorRatio.toFixed(1)}%</span>
            </div>
            <div class="metric-item">
              <span class="metric-name">Velocity Consistency</span>
              <span class="metric-value">${report.teamScore.consistency.velocityConsistency.toFixed(1)}%</span>
            </div>
            <div class="metric-item">
              <span class="metric-name">Delivery Cadence</span>
              <span class="metric-value">${report.teamScore.consistency.deliveryCadence.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div class="metric-card">
          <h3>Work-Life Balance</h3>
          <div class="metric-score">${report.teamScore.workLifeBalance.score}</div>
          <div class="metric-details">
            <div class="metric-item">
              <span class="metric-name">Commit Time Patterns</span>
              <span class="metric-value">${report.teamScore.workLifeBalance.commitTimePatterns.toFixed(1)}%</span>
            </div>
            <div class="metric-item">
              <span class="metric-name">After-Hours Commits</span>
              <span class="metric-value">${report.teamScore.workLifeBalance.afterHoursCommitFrequency.toFixed(1)}%</span>
            </div>
            <div class="metric-item">
              <span class="metric-name">Weekend Commits</span>
              <span class="metric-value">${report.teamScore.workLifeBalance.weekendCommitActivity.toFixed(1)}%</span>
            </div>
            <div class="metric-item">
              <span class="metric-name">Team Coverage</span>
              <span class="metric-value">${report.teamScore.workLifeBalance.teamActiveCoverage.coveragePercentage.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

    </section>

    <section id="files" class="section">
      <h2>Source Code Hotspots (Top 10)</h2>
      <div class="table-wrapper" role="region" aria-label="Top source code files table">
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
      <div id="riskFactorsChart" class="chart-container">
        <!-- Risk factors chart placeholder -->
      </div>

    </section>

    <section id="author-details" class="section">
      <h2>Detailed Author Profiles</h2>
      <div class="author-profiles">
        ${this.generateDetailedAuthorProfiles(report.authors)}
      </div>
    </section>

    <section id="documentation" class="section">
      <h2>Calculation Documentation</h2>
      <p class="doc-intro">This section provides detailed explanations of the metrics and formulas used in team and author evaluations.</p>
      
      <div class="measurement-limitations">
        <h3>⚠️ Important: Measurement Limitations</h3>
        <p><strong>What Git Stores vs. What Platforms Store:</strong></p>
        <ul>
          <li><strong>✅ Available from Git:</strong> Commit data, merge commits, co-authorship, file changes, commit messages, timestamps</li>
          <li><strong>❌ NOT Available from Git:</strong> PR/MR approvers, reviewers, review comments, approval policies, CI/CD results</li>
        </ul>
        <p><strong>Code Review Metrics:</strong> All "code review" and "review workflow" metrics are <em>estimated</em> from Git commit patterns (merge commits, commit message patterns) and may not reflect actual review practices, especially in teams using squash merges, rebase workflows, or manual reviews.</p>
        <p><strong>Platform Differences:</strong> Detection accuracy varies between GitHub, GitLab, Azure DevOps, and other Git platforms based on their merge commit patterns and message formats.</p>
      </div>
      
      <div class="doc-section">
        <h3>Team Effectiveness Score</h3>
        <p>The Team Effectiveness Score evaluates team performance across three key dimensions: organization patterns, development consistency, and work-life balance sustainability, providing insights into team structure and workflow efficiency.</p>
        
        <div class="formula-box">
          <h4>Overall Team Score Formula</h4>
          <code class="formula">
            Team Score = (Team Organization × 0.40) + (Consistency × 0.45) + (Work-Life Balance × 0.15)
          </code>
        </div>

        <div class="metric-docs">
          <div class="metric-category">
            <h4>Team Organization (40% Weight)</h4>
            <div class="limitation-notice">
              <strong>⚠️ Measurement Approach:</strong> Measures team organization and specialization patterns from Git commit data. 
              High scores indicate clear file ownership and developer specialization rather than traditional "collaboration."
            </div>
            <ul>
              <li><strong>Developer Specialization:</strong> Measures how unique each developer's file set is compared to others. Higher scores indicate developers working on distinct areas rather than overlapping work.</li>
              <li><strong>File Ownership Clarity:</strong> Percentage of files with single-author ownership. Higher scores suggest clear responsibility and reduced conflicts.</li>
              <li><strong>Organization Efficiency:</strong> Measures low file overlap between developers. Higher scores indicate better task distribution and less potential for conflicts.</li>
              <li><strong>Co-Authorship Rate:</strong> Percentage of commits with multiple authors (Co-authored-by: tags). Measured separately as intentional collaboration indicator.</li>
            </ul>
            <div class="formula-box">
              <code class="formula">
                Organization Score = (Specialization × 0.50) + (Ownership Clarity × 0.30) + (Low Overlap × 0.20)
              </code>
            </div>
            <div class="interpretation-note">
              <strong>📝 Interpretation:</strong> This metric favors teams where developers have specialized, non-overlapping areas of responsibility. 
              Very high scores may indicate knowledge silos, while very low scores may suggest unclear ownership or excessive conflicts.
            </div>
          </div>

          <div class="metric-category">
            <h4>Consistency & Velocity (45% Weight)</h4>
            <ul>
              <li><strong>Bus Factor:</strong> Number of top contributors needed to account for 50% of commits. Higher values indicate better knowledge distribution.</li>
              <li><strong>Active Contributor Ratio:</strong> Percentage of team members with commits in the last 30 days. Measures current team engagement.</li>
              <li><strong>Velocity Consistency:</strong> Inverse of coefficient of variation in daily commits. Higher values indicate steadier development pace.</li>
              <li><strong>Delivery Cadence:</strong> Regularity of commits over time, calculated using coefficient of variation of commit intervals.</li>
            </ul>
            <div class="formula-box">
              <code class="formula">
                Consistency Score = (Bus Factor Score × 0.25) + (Active Contributors × 0.25) + (Velocity Consistency × 0.25) + (Delivery Cadence × 0.25)
              </code>
            </div>
          </div>

          <div class="metric-category">
            <h4>Work-Life Balance & Sustainability (20% Weight)</h4>
            <div class="limitation-notice">
              <strong>⚠️ Important Limitations:</strong> Work patterns are estimated from commit timing only. 
              Cannot detect actual working hours, time zones, or real work-life balance.
            </div>
            <ul>
              <li><strong>Commit Time Patterns:</strong> Index score based on commit timing distribution. Values reflect temporal commit patterns across business vs non-business hours.</li>
              <li><strong>After-Hours Commit Frequency:</strong> Percentage of commits made outside business hours (before 8 AM or after 6 PM). <em>Note: Based on commit timestamps, not actual working hours.</em></li>
              <li><strong>Weekend Commit Activity:</strong> Percentage of commits made on weekends (Saturday and Sunday).</li>
              <li><strong>Team Active Coverage:</strong> Estimated team coverage patterns from commit authoring. <em>Note: Based on commit patterns, not actual vacation or availability data.</em></li>
              <li><strong>Burnout Risk Indicators:</strong> Detection of high-velocity days, consecutive commit periods, and excessive after-hours activity patterns.</li>
            </ul>
            <div class="formula-box">
              <code class="formula">
                Balance Score = (Commit Time Patterns × 0.40) + ((100 - After-Hours Frequency) × 0.30) + ((100 - Weekend Activity) × 0.20) + (Team Active Coverage × 0.10)
              </code>
            </div>
          </div>
        </div>

        <div class="score-thresholds">
          <h4>Team Score Ranges</h4>
          <ul>
            <li><strong>90-100:</strong> Excellent team organization with clear specialization and ownership</li>
            <li><strong>75-89:</strong> Good organization with well-defined areas of responsibility</li>
            <li><strong>60-74:</strong> Moderate organization with some clear ownership patterns</li>
            <li><strong>40-59:</strong> Mixed organization with moderate file overlap between developers</li>
            <li><strong>0-39:</strong> High file overlap suggesting unclear ownership or excessive conflicts</li>
          </ul>
        </div>
      </div>

      <div class="doc-section">
        <h3>Author Evaluation Metrics</h3>
        <p>Individual author metrics provide detailed insights into contribution patterns, code quality, work organization style, and work habits.</p>

        <div class="metric-docs">
          <div class="metric-category">
            <h4>Core Contribution Metrics</h4>
            <ul>
              <li><strong>Commit Frequency:</strong> Average commits per active day. Calculated as total commits divided by number of unique days with commits.</li>
              <li><strong>Commit Size Distribution:</strong> Classification of commits into categories (micro: &lt;20 lines, small: 20-50, medium: 51-200, large: 201-500, very large: &gt;500 lines).</li>
              <li><strong>Churn Rate:</strong> Total lines added plus lines deleted. Indicates volume of code changes.</li>
              <li><strong>File Diversity Score:</strong> Percentage of total repository files modified by the author.</li>
            </ul>
            <div class="formula-box">
              <code class="formula">
                Average Commit Size = Total Lines Changed ÷ Total Commits
              </code>
              <code class="formula">
                File Diversity = (Author's Unique Files ÷ Total Repository Files) × 100
              </code>
            </div>
          </div>

          <div class="metric-category">
            <h4>Author Organization Patterns</h4>
            <ul>
              <li><strong>Co-Authorship Rate:</strong> Percentage of commits with multiple authors, indicating intentional collaborative work.</li>
              <li><strong>Pull Request Integration:</strong> Ratio of merge commits to direct commits, showing adherence to review processes.</li>
              <li><strong>File Specialization Index:</strong> Ratio of exclusive files to shared files, measuring focus on specific areas.</li>
              <li><strong>File Ownership Style:</strong> Classification as specialized, shared, or balanced based on file ownership patterns.</li>
            </ul>
          </div>

          <div class="metric-category">
            <h4>Code Quality Indicators</h4>
            <ul>
              <li><strong>Commit Message Quality:</strong> Composite score based on conventional commit format, traceability references, adequate length, and descriptiveness.</li>
              <li><strong>Revert Rate:</strong> Percentage of author's commits that were later reverted, indicating code stability.</li>
              <li><strong>Refactoring Activity:</strong> Percentage of commits dedicated to code improvement and cleanup.</li>
              <li><strong>Documentation Contribution:</strong> Percentage of commits that include documentation changes.</li>
            </ul>
            <div class="formula-box">
              <code class="formula">
                Message Quality = (Conventional × 0.25) + (Traceability × 0.25) + (Length × 0.20) + (Descriptive × 0.20) + (Capitalization × 0.10)
              </code>
            </div>
          </div>

          <div class="metric-category">
            <h4>Work Pattern Analysis</h4>
            <ul>
              <li><strong>Activity Distribution:</strong> Analysis of commit timing across hours and days to identify work patterns.</li>
              <li><strong>Consistency Score:</strong> Regularity of contributions over time, calculated using coefficient of variation of daily activity.</li>
              <li><strong>Burst Detection:</strong> Identification of periods with unusually high activity that may indicate deadline pressure.</li>
              <li><strong>Work-Life Balance:</strong> Assessment of after-hours and weekend activity relative to total contributions.</li>
            </ul>
            <div class="formula-box">
              <code class="formula">
                Consistency Score = 100 - (Standard Deviation of Daily Commits ÷ Average Daily Commits) × 100
              </code>
            </div>
          </div>
        </div>
      </div>

      <div class="doc-section">
        <h3>Statistical Methods</h3>
        <div class="metric-docs">
          <div class="metric-category">
            <h4>Advanced Calculations</h4>
            <ul>
              <li><strong>Gini Coefficient:</strong> Measures inequality in contribution distribution. Values close to 0 indicate equal distribution, values close to 1 indicate high inequality.</li>
              <li><strong>Coefficient of Variation:</strong> Standard deviation divided by mean, used to measure relative variability in commit patterns.</li>
              <li><strong>Percentile Rankings:</strong> Authors are ranked against team members across multiple dimensions (commits, lines changed, files touched, message quality).</li>
              <li><strong>Temporal Coupling:</strong> Analysis of files frequently changed together, indicating architectural dependencies.</li>
            </ul>
            <div class="formula-box">
              <code class="formula">
                Gini Coefficient = (2 × Σ(rank × value)) ÷ (n × Σ(value)) - (n + 1) ÷ n
              </code>
              <code class="formula">
                Coefficient of Variation = (Standard Deviation ÷ Mean) × 100
              </code>
            </div>
          </div>
        </div>
      </div>

      <div class="doc-section">
        <h3>Risk Assessment Framework</h3>
        <div class="metric-docs">
          <div class="metric-category">
            <h4>Repository Activity Indicators</h4>
            <ul>
              <li><strong>Bus Factor:</strong> Percentage of codebase commits concentrated among top contributors (inverse measure of knowledge distribution).</li>
              <li><strong>Hotspot Analysis:</strong> Files with high churn and multiple authors, indicating potential maintenance challenges.</li>
              <li><strong>Code Ownership Distribution:</strong> Analysis of how knowledge and responsibility are distributed across the team.</li>
              <li><strong>Technical Debt Indicators:</strong> Patterns suggesting accumulating maintenance burden (large commits, frequent reverts, WIP commits).</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="methodology-note">
        <h4>Methodology Notes</h4>
        <p><strong>Data Source:</strong> All metrics are calculated from Git commit history, including commit metadata, file changes, and authorship information.</p>
        <p><strong>Time Window:</strong> Analysis covers the specified date range with temporal weighting for recent activity when applicable.</p>
        <p><strong>Normalization:</strong> Scores are normalized to 0-100 scale for consistency and interpretability across different team sizes and project characteristics.</p>
        <p><strong>Statistical Note:</strong> Metrics calculated from available Git commit data (larger datasets provide more representative patterns).</p>
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
      .breakdown-components { display:grid; gap:.75rem; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); margin-bottom:1rem; }
      .component { background:var(--color-surface); padding:.75rem; border-radius:4px; border:1px solid var(--color-border); }
      .component-label { font-size:.75rem; color:var(--color-text-secondary); text-transform:uppercase; letter-spacing:.05em; margin-bottom:.25rem; }
      .component-value { font-size:1.1rem; font-weight:600; color:var(--color-primary); margin-bottom:.25rem; }
      .component-detail { font-size:.7rem; color:var(--color-text-secondary); }
      .formula { margin-top:.75rem; padding-top:.75rem; border-top:1px solid var(--color-border); }
      .formula code { background:var(--color-surface); padding:.25rem .4rem; border-radius:3px; font-size:.8rem; }
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

  private getTeamScoreRating(score: number): string {
    if (score >= 90) return 'High';
    if (score >= 75) return 'Moderate';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'Low';
    return 'Minimal';
  }

  private getTeamScoreDescription(score: number): string {
    if (score >= 90) return 'Excellent team organization with clear specialization';
    if (score >= 75) return 'Good team organization with defined ownership';
    if (score >= 60) return 'Moderate team organization detected';
    if (score >= 40) return 'Mixed organization patterns with some overlap';
    return 'High file overlap suggests unclear ownership';
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

      <div class="commit-patterns">
        <h4>Commit Patterns</h4>
        <div class="pattern-info">
          <div>Peak Day: <strong>${workPattern.commitTiming?.mostActiveDay?.day || 'N/A'}</strong> • 
          Peak Time: <strong>${workPattern.commitTiming?.mostActiveTime?.timeRange || 'N/A'}</strong></div>
          <div>Work Pattern: <strong>${workPattern.commitTiming?.workPattern || 'N/A'}</strong> • 
          Weekend commits: <strong>${pctFmt(workPattern.workLifeBalance?.weekendPercentage || 0)}</strong></div>
          <div>After hours: <strong>${pctFmt(workPattern.workLifeBalance?.afterHoursPercentage || 0)}</strong> • 
          Consistency: <strong>${(workPattern.temporalPatterns?.consistencyScore || 0).toFixed(0)}/100</strong></div>
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

  private capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
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
}
