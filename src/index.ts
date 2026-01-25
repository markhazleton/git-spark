/**
 * git-spark: Enterprise-grade Git repository analytics and reporting tool
 * Main entry point for the library
 */

export * from './types/index.js';
export * from './core/analyzer.js';
export * from './core/collector.js';
export * from './utils/git.js';
export * from './utils/logger.js';
export * from './utils/validation.js';
export * from './integrations/azure-devops/collector.js';
export * from './integrations/azure-devops/config.js';
export * from './integrations/azure-devops/client.js';

import {
  GitSparkOptions,
  AnalysisReport,
  GitSparkConfig,
  OutputFormat,
  ProgressCallback,
} from './types/index.js';
import { GitAnalyzer } from './core/analyzer.js';
import { validateOptions } from './utils/validation.js';
import { createLogger } from './utils/logger.js';
import { resolveOptionsWithConfig } from './utils/config.js';

const logger = createLogger('git-spark');

/**
 * Main GitSpark class for enterprise-grade Git repository analysis
 *
 * Provides a high-level interface for analyzing Git repositories and generating
 * comprehensive reports. Handles the complete analysis pipeline from data
 * collection through export in multiple formats.
 *
 * Key features:
 * - Comprehensive commit and author analysis
 * - Risk assessment and governance scoring
 * - Multiple export formats (HTML, JSON, Markdown, CSV, Console)
 * - Progress tracking for long-running operations
 * - Extensive configuration options and validation
 * - Enterprise-grade error handling and logging
 *
 * @example
 * ```typescript
 * // Basic analysis
 * const gitSpark = new GitSpark({
 *   repoPath: '/path/to/repo',
 *   since: '2024-01-01'
 * });
 *
 * const report = await gitSpark.analyze();
 * await gitSpark.export('html', './reports');
 *
 * // With progress tracking
 * const gitSpark = new GitSpark({
 *   repoPath: '/path/to/repo'
 * }, (progress) => {
 *   console.log(`${progress.stage}: ${progress.percentage}%`);
 * });
 * ```
 */
export class GitSpark {
  private analyzer: GitAnalyzer;
  private options: GitSparkOptions;
  private resolvedConfig?: Partial<GitSparkConfig>;

  constructor(options: GitSparkOptions, progressCallback?: ProgressCallback) {
    const resolved = resolveOptionsWithConfig(options);

    // Validate options
    const validation = validateOptions(resolved.options);
    if (!validation.isValid) {
      throw new Error(`Invalid options: ${validation.errors.join(', ')}`);
    }

    const cleanOptions = { ...resolved.options };
    delete (cleanOptions as Partial<GitSparkOptions>).resolvedConfig;
    delete (cleanOptions as Partial<GitSparkOptions>).configResolved;
    this.options = cleanOptions;
    const configToStore = resolved.resolvedConfig ?? resolved.options.resolvedConfig;
    if (configToStore) {
      this.resolvedConfig = configToStore;
    }
    this.analyzer = new GitAnalyzer(this.options.repoPath || process.cwd(), progressCallback);

    logger.info('GitSpark initialized', { options: this.options });
  }

  /**
   * Perform complete repository analysis
   */
  async analyze(): Promise<AnalysisReport> {
    logger.info('Starting repository analysis');

    try {
      const report = await this.analyzer.analyze(this.options);
      if (this.resolvedConfig) {
        report.metadata.resolvedConfig = this.resolvedConfig;
      }
      logger.info('Analysis completed successfully', {
        commits: report.repository.totalCommits,
        authors: report.repository.totalAuthors,
        files: report.repository.totalFiles,
        azureDevOpsEnabled: !!report.azureDevOps,
      });

      return report;
    } catch (error) {
      logger.error('Analysis failed', {
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
    } finally {
      // Cleanup resources
      await this.cleanup();
    }
  }

  /**
   * Cleanup analyzer resources
   */
  async cleanup(): Promise<void> {
    await this.analyzer.cleanup();
  }

  /**
   * Export analysis report in specified format
   */
  async export(
    format: OutputFormat,
    outputPath: string,
    report?: AnalysisReport
  ): Promise<void> {
    const exportReport = report ?? (await this.analyze());

    switch (format) {
      case 'html':
        await this.exportHTML(exportReport, outputPath);
        break;
      case 'json':
        await this.exportJSON(exportReport, outputPath);
        break;
      case 'markdown':
        await this.exportMarkdown(exportReport, outputPath);
        break;
      case 'csv':
        await this.exportCSV(exportReport, outputPath);
        break;
      case 'console':
        await this.exportConsole(exportReport);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Export as HTML report
   */
  private async exportHTML(report: AnalysisReport, outputPath: string): Promise<void> {
    const { HTMLExporter } = await import('./output/html.js');
    const exporter = new HTMLExporter();
    const defaultConfig = GitSpark.getDefaultConfig();
    const fileFiltering =
      this.resolvedConfig?.output?.fileFiltering || defaultConfig.output.fileFiltering;
    await exporter.export(report, outputPath, fileFiltering, this.options.teamwork);
    logger.info('HTML report exported', { outputPath });
  }

  /**
   * Export as JSON
   */
  private async exportJSON(report: AnalysisReport, outputPath: string): Promise<void> {
    const { JSONExporter } = await import('./output/json.js');
    const exporter = new JSONExporter();
    await exporter.export(report, outputPath);
    logger.info('JSON report exported', { outputPath });
  }

  /**
   * Export as Markdown
   */
  private async exportMarkdown(report: AnalysisReport, outputPath: string): Promise<void> {
    const { MarkdownExporter } = await import('./output/markdown.js');
    const exporter = new MarkdownExporter();
    await exporter.export(report, outputPath);
    logger.info('Markdown report exported', { outputPath });
  }

  /**
   * Export as CSV
   */
  private async exportCSV(report: AnalysisReport, outputPath: string): Promise<void> {
    const { CSVExporter } = await import('./output/csv.js');
    const exporter = new CSVExporter();
    await exporter.export(report, outputPath);
    logger.info('CSV report exported', { outputPath });
  }

  /**
   * Export to console
   */
  private async exportConsole(report: AnalysisReport): Promise<void> {
    const { ConsoleExporter } = await import('./output/console.js');
    const exporter = new ConsoleExporter();
    exporter.export(report);
    logger.info('Console report displayed');
  }

  /**
   * Get default configuration
   */
  static getDefaultConfig(): GitSparkConfig {
    return {
      version: '1.0',
      analysis: {
        excludePaths: ['node_modules/**', 'dist/**', 'build/**', '.git/**'],
        excludeExtensions: [],
        includeAuthors: [],
        excludeAuthors: [],
        timezone: 'America/Chicago',
        thresholds: {
          largeCommitLines: 500,
          smallCommitLines: 50,
          staleBranchDays: 30,
          largeFileKB: 300,
          hotspotAuthorThreshold: 3,
        },
        weights: {
          risk: {
            churn: 0.35,
            recency: 0.25,
            ownership: 0.2,
            entropy: 0.1,
            coupling: 0.1,
          },
          governance: {
            conventional: 0.4,
            traceability: 0.25,
            length: 0.15,
            wipPenalty: 0.1,
            revertPenalty: 0.05,
            shortPenalty: 0.05,
          },
        },
      },
      output: {
        defaultFormat: 'html',
        outputDir: './reports',
        includeCharts: true,
        redactEmails: false,
        theme: 'default',
        fileFiltering: {
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
        },
      },
      performance: {
        maxBuffer: 200,
        enableCaching: true,
        cacheDir: '.git-spark-cache',
        chunkSize: 1000,
      },
    };
  }
}

/**
 * Quick analysis function for simple use cases
 */
export async function analyze(
  repoPath?: string,
  options?: Partial<GitSparkOptions>
): Promise<AnalysisReport> {
  const gitSpark = new GitSpark({
    repoPath: repoPath || process.cwd(),
    ...options,
  });

  return gitSpark.analyze();
}

/**
 * Quick export function
 */
export async function exportReport(
  report: AnalysisReport,
  format: OutputFormat,
  outputPath: string,
  teamwork?: boolean
): Promise<void> {
  // const gitSpark = new GitSpark({ repoPath: process.cwd() });
  // This is a simplified export that doesn't re-analyze
  switch (format) {
    case 'html':
      const { HTMLExporter } = await import('./output/html.js');
      const defaultConfig = GitSpark.getDefaultConfig();
      await new HTMLExporter().export(report, outputPath, defaultConfig.output.fileFiltering, teamwork);
      break;
    case 'json':
      const { JSONExporter } = await import('./output/json.js');
      await new JSONExporter().export(report, outputPath);
      break;
    default:
      throw new Error(`Format ${format} not supported in quick export`);
  }
}
