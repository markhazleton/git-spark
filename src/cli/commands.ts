import { Command } from 'commander';
import { GitSparkOptions, LogLevel, OutputFormat } from '../types/index.js';
import {
  validateOptions,
  validateNodeVersion,
  validateGitInstallation,
} from '../utils/validation.js';
import { setGlobalLogLevel, createLogger } from '../utils/logger.js';
import { getVersion } from '../version-fallback.js';
import { resolveOptionsWithConfig } from '../utils/config.js';
import { executeHTMLReport, openHTMLReport } from './report-command.js';
import chalk from 'chalk';
import boxen from 'boxen';
import ora from 'ora';

const logger = createLogger('cli');

/**
 * Create and configure the main CLI application
 *
 * Sets up the complete command-line interface for git-spark with all available
 * options, validation, and subcommands. Handles argument parsing, environment
 * setup, and error handling for the CLI application.
 *
 * @returns Configured Commander.js program instance
 *
 * @example
 * ```typescript
 * // Create and run CLI
 * const program = createCLI();
 * program.parse(process.argv);
 *
 * // Example usage:
 * // git-spark --days 30 --format html --output ./reports
 * // git-spark --since 2024-01-01 --author john@example.com
 * ```
 */
export async function createCLI(): Promise<Command> {
  const program = new Command();

  // Get version dynamically
  let version = '1.0.0';
  try {
    const versionModule = await import('../version.js');
    version = versionModule.VERSION;
  } catch {
    // Try to read from package.json as fallback
    try {
      const { readFileSync } = await import('fs');
      const { resolve, dirname } = await import('path');
      const { fileURLToPath } = await import('url');
      const __dirname = dirname(fileURLToPath(import.meta.url));
      const pkgPath = resolve(__dirname, '../../package.json');
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      version = pkg.version || version;
    } catch {
      // Use default version if all else fails
    }
  }

  program
    .name('git-spark')
    .description('Enterprise-grade Git repository analytics and reporting tool')
    .version(version)
    .option('-d, --days <number>', 'analyze last N days', parseNumber)
    .option('-s, --since <date>', 'start date (YYYY-MM-DD)')
    .option('-u, --until <date>', 'end date (YYYY-MM-DD)')
    .option('-f, --format <format>', 'output format (html|json|console|markdown|csv)')
    .option('-o, --output <path>', 'output directory')
    .option('-c, --config <path>', 'configuration file')
    .option('-b, --branch <name>', 'analyze specific branch')
    .option('-a, --author <name>', 'filter by author')
    .option('-p, --path <glob>', 'filter by file path pattern')
    .option('--heavy', 'enable expensive analyses')
    .option('--open', 'open HTML report in browser after generation')
    .option('--log-level <level>', 'logging verbosity (error|warn|info|debug|verbose)', 'info')
    .option('--no-cache', 'disable caching')
    .option('--compare <branch>', 'compare with another branch')
    .option('--watch', 'continuous monitoring mode')
    .option('--timezone <tz>', 'IANA timezone for daily trends (e.g., America/Chicago)')
    .option('--redact-emails', 'redact email addresses in reports')
    .option(
      '--exclude-extensions <extensions>',
      'comma-separated list of file extensions to exclude (e.g., .md,.txt)'
    )
    .option('--teamwork', 'focus on team success - removes individual contributor sections')
    .action(async options => {
      await executeAnalysis(options);
    });

  // Add subcommands
  program
    .command('analyze')
    .description('Run detailed analysis')
    .option('-r, --repo <path>', 'repository path', process.cwd())
    .action(async options => {
      await executeAnalysis({ ...options, repoPath: options.repo });
    });

  program
    .command('health')
    .description('Quick health check')
    .option('-r, --repo <path>', 'repository path', process.cwd())
    .action(async options => {
      await executeHealthCheck({ ...options, repoPath: options.repo });
    });

  program
    .command('validate')
    .description('Validate environment and requirements')
    .action(async () => {
      await validateEnvironment();
    });

  program
    .command('init')
    .description('Create a .git-spark.json configuration file interactively')
    .option('-r, --repo <path>', 'repository path', process.cwd())
    .option('-y, --yes', 'use defaults without prompting')
    .action(async options => {
      await executeInit(options);
    });

  program
    .command('html')
    .description('Generate comprehensive HTML report')
    .option('-r, --repo <path>', 'repository path', process.cwd())
    .option('-d, --days <number>', 'analyze last N days')
    .option('-s, --since <date>', 'start date (YYYY-MM-DD)')
    .option('-u, --until <date>', 'end date (YYYY-MM-DD)')
    .option('-o, --output <path>', 'output directory')
    .option('-b, --branch <name>', 'analyze specific branch')
    .option('-a, --author <name>', 'filter by author')
    .option('-p, --path <glob>', 'filter by file path pattern')
    .option('--open', 'open HTML report in browser after generation')
    .option('--serve', 'start HTTP server to serve the report')
    .option('--port <number>', 'port for HTTP server (default: 3000)', parseNumber, 3000)
    .option('--heavy', 'enable expensive analyses for detailed insights')
    .action(async (options, command) => {
      // Merge options from parent command (where global options like --days and --heavy are stored)
      const parentOptions = command.parent?.opts() || {};
      const mergedOptions = { ...parentOptions, ...options };

      await executeHTMLReport(mergedOptions);
    });

  return program;
}

async function executeAnalysis(options: any): Promise<void> {
  const spinner = ora('Initializing git-spark').start();

  try {
    // Set log level
    if (options.logLevel) {
      setGlobalLogLevel(options.logLevel as LogLevel);
    }

    // Parse and validate options
    const excludeExtensions = options.excludeExtensions
      ? options.excludeExtensions
          .split(',')
          .map((ext: string) => (ext.trim().startsWith('.') ? ext.trim() : '.' + ext.trim()))
      : undefined;
    const noCache = options.cache === false ? true : undefined;
    const gitSparkOptions: GitSparkOptions = {
      repoPath: options.repo || process.cwd(),
      since: options.since,
      until: options.until,
      days: options.days,
      branch: options.branch,
      author: options.author,
      path: options.path,
      format: options.format as OutputFormat,
      output: options.output,
      config: options.config,
      heavy: options.heavy,
      logLevel: options.logLevel as LogLevel,
      ...(noCache !== undefined ? { noCache } : {}),
      compare: options.compare,
      watch: options.watch,
      ...(options.timezone ? { timezone: options.timezone } : {}),
      ...(excludeExtensions ? { excludeExtensions } : {}),
      teamwork: options.teamwork,
    };

    const resolved = resolveOptionsWithConfig(gitSparkOptions);
    const resolvedOptions = resolved.options;
    resolvedOptions.output = resolvedOptions.output || './reports';
    resolvedOptions.format = resolvedOptions.format || 'html';

    spinner.text = 'Validating options';
    const validation = validateOptions(resolvedOptions);
    if (!validation.isValid) {
      spinner.fail('Validation failed');
      console.error(chalk.red('✗ Validation errors:'));
      for (const error of validation.errors) {
        console.error(chalk.red(`  • ${error}`));
      }
      process.exit(1);
    }

    if (validation.warnings.length > 0) {
      spinner.warn('Validation warnings:');
      for (const warning of validation.warnings) {
        console.warn(chalk.yellow(`  • ${warning}`));
      }
    }

    // Dynamic import to avoid circular dependencies
    const { GitSpark } = await import('../index.js');

    spinner.text = 'Starting analysis';
    const gitSpark = new GitSpark(
      resolvedOptions,
      (phase: string, current: number, total: number) => {
        const percentage = Math.round((current / total) * 100);
        spinner.text = `${phase} (${percentage}%)`;
      }
    );

    const report = await gitSpark.analyze();

    spinner.text = 'Generating output';
    await gitSpark.export(resolvedOptions.format, resolvedOptions.output, report);

    const version = await getVersion();

    spinner.succeed(`Analysis completed successfully (git-spark v${version})`);

    // Display summary
    displaySummary(report, version);

    // Handle --open flag for HTML reports
    if (options.open && (resolvedOptions.format === 'html' || !resolvedOptions.format)) {
      const { resolve } = await import('path');
      const outputPath = resolve(resolvedOptions.output, 'git-spark-report.html');
      await openHTMLReport(outputPath);
    }
  } catch (error) {
    spinner.fail('Analysis failed');
    if (error instanceof Error) {
      console.error(chalk.red(`Error: ${error.message}`));
      logger.error('Analysis failed', { error: error.message, stack: error.stack });
    } else {
      console.error(chalk.red('Unknown error occurred'));
      logger.error('Unknown error occurred', {
        error:
          error instanceof Error
            ? {
                message: error.message,
                name: error.name,
                stack: error.stack,
              }
            : error,
      });
    }
    process.exit(1);
  }
}

async function executeHealthCheck(options: any): Promise<void> {
  const spinner = ora('Running health check').start();

  try {
    const gitSparkOptions: GitSparkOptions = {
      repoPath: options.repo || process.cwd(),
      days: 30, // Last 30 days for health check
      format: 'console',
    };

    const { GitSpark } = await import('../index.js');

    const gitSpark = new GitSpark(
      gitSparkOptions,
      (phase: string, current: number, total: number) => {
        const percentage = Math.round((current / total) * 100);
        spinner.text = `${phase} (${percentage}%)`;
      }
    );

    const report = await gitSpark.analyze();

    spinner.succeed('Health check completed');

    // Display health summary
    displayHealthSummary(report);
  } catch (error) {
    spinner.fail('Health check failed');
    if (error instanceof Error) {
      console.error(chalk.red(`Error: ${error.message}`));
    }
    process.exit(1);
  }
}

async function validateEnvironment(): Promise<void> {
  console.log(chalk.blue('🔍 Validating git-spark environment...\n'));

  // Check Node.js version
  const nodeValidation = validateNodeVersion();
  if (nodeValidation.isValid) {
    console.log(chalk.green('✓ Node.js version is compatible'));
  } else {
    console.log(chalk.red('✗ Node.js version check failed'));
    for (const error of nodeValidation.errors) {
      console.log(chalk.red(`  • ${error}`));
    }
  }

  // Check Git installation
  const gitValidation = await validateGitInstallation();
  if (gitValidation.isValid) {
    console.log(chalk.green('✓ Git is installed and compatible'));
  } else {
    console.log(chalk.red('✗ Git installation check failed'));
    for (const error of gitValidation.errors) {
      console.log(chalk.red(`  • ${error}`));
    }
  }

  // Check current directory is a Git repository
  try {
    const { GitExecutor } = await import('../utils/git');
    const git = new GitExecutor(process.cwd());
    const isValid = await git.validateRepository();

    if (isValid) {
      console.log(chalk.green('✓ Current directory is a valid Git repository'));

      const branch = await git.getCurrentBranch();
      console.log(chalk.blue(`  Current branch: ${branch}`));

      const remoteUrl = await git.getRemoteUrl();
      if (remoteUrl) {
        console.log(chalk.blue(`  Remote URL: ${remoteUrl}`));
      }
    } else {
      console.log(chalk.yellow('⚠ Current directory is not a Git repository'));
    }
  } catch (error) {
    console.log(chalk.red('✗ Failed to validate Git repository'));
  }

  const allValid = nodeValidation.isValid && gitValidation.isValid;

  if (allValid) {
    console.log(
      boxen(chalk.green("🎉 Environment validation passed!\nYou're ready to use git-spark."), {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green',
      })
    );
  } else {
    console.log(
      boxen(
        chalk.red(
          '❌ Environment validation failed!\nPlease fix the issues above before using git-spark.'
        ),
        {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'red',
        }
      )
    );
    process.exit(1);
  }
}

function displaySummary(report: any, version: string): void {
  const summary = report.summary;
  const repository = report.repository;

  console.log(
    '\n' +
      boxen(
        chalk.bold(`📊 Git Spark Analysis Summary (v${version})\n\n`) +
          chalk.blue(`Total Commits: ${repository.totalCommits}\n`) +
          chalk.blue(`Active Contributors: ${repository.totalAuthors}\n`) +
          chalk.blue(`Files Changed: ${repository.totalFiles}\n`) +
          chalk.blue(
            `Bus Factor: ${Math.round((repository.busFactor / repository.totalAuthors) * 100)}%`
          ),
        {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'blue',
        }
      )
  );

  if (summary.insights.length > 0) {
    console.log(chalk.yellow('\n💡 Key Insights:'));
    for (const insight of summary.insights) {
      console.log(chalk.yellow(`  • ${insight}`));
    }
  }

  if (summary.actionItems.length > 0) {
    console.log(chalk.red('\n🚨 Action Items:'));
    for (const action of summary.actionItems) {
      console.log(chalk.red(`  • ${action}`));
    }
  }
}

function displayHealthSummary(report: any): void {
  const repository = report.repository;
  const governance = report.governance;

  console.log(
    '\n' +
      boxen(
        chalk.bold('🏥 Repository Health Check\n\n') +
          chalk.cyan(`Overall Health: ${Math.round(repository.healthScore * 100)}%\n`) +
          chalk.blue(`Governance Score: ${Math.round(governance.score * 100)}%\n`) +
          chalk.blue(`Risk Level: ${report.risks.overallRisk.toUpperCase()}\n`) +
          chalk.blue(
            `Bus Factor: ${Math.round((repository.busFactor / repository.totalAuthors) * 100)}%\n`
          ) +
          chalk.blue(`Active Days: ${repository.activeDays}`),
        {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor:
            repository.healthScore > 0.7
              ? 'green'
              : repository.healthScore > 0.5
                ? 'yellow'
                : 'red',
        }
      )
  );
}

function parseNumber(value: string): number {
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`'${value}' is not a valid number`);
  }
  return parsed;
}

async function executeInit(options: any): Promise<void> {
  const { existsSync, writeFileSync } = await import('fs');
  const { resolve } = await import('path');
  const { createInterface } = await import('readline');

  const repoPath = options.repo || process.cwd();
  const configPath = resolve(repoPath, '.git-spark.json');

  // Check if config already exists
  if (existsSync(configPath)) {
    console.log(chalk.yellow(`⚠️  Configuration file already exists: ${configPath}`));
    if (!options.yes) {
      const rl = createInterface({ input: process.stdin, output: process.stdout });
      const answer = await new Promise<string>(res => {
        rl.question(chalk.cyan('Overwrite? (y/N): '), res);
      });
      rl.close();
      if (answer.toLowerCase() !== 'y') {
        console.log(chalk.blue('Aborted.'));
        return;
      }
    }
  }

  console.log(
    boxen(chalk.bold('🔧 Git Spark Configuration Wizard\n\n') + chalk.blue('Create a .git-spark.json file to customize your analysis'), {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
    })
  );

  let config: any = {
    version: '1.0',
    analysis: {
      excludePaths: ['node_modules/**', 'dist/**', 'build/**', '.git/**'],
      excludeExtensions: [],
      excludeAuthors: [],
      timezone: 'America/Chicago',
      thresholds: {
        largeCommitLines: 500,
        smallCommitLines: 50,
        staleBranchDays: 30,
        largeFileKB: 300,
        hotspotAuthorThreshold: 3,
      },
    },
    output: {
      defaultFormat: 'html',
      outputDir: './reports',
      redactEmails: false,
    },
    performance: {
      maxBuffer: 200,
      enableCaching: true,
      cacheDir: '.git-spark-cache',
      chunkSize: 1000,
    },
  };

  if (!options.yes) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });

    const ask = (question: string, defaultVal: string): Promise<string> => {
      return new Promise(res => {
        rl.question(chalk.cyan(`${question} [${defaultVal}]: `), answer => {
          res(answer.trim() || defaultVal);
        });
      });
    };

    const askBool = (question: string, defaultVal: boolean): Promise<boolean> => {
      const defStr = defaultVal ? 'Y/n' : 'y/N';
      return new Promise(res => {
        rl.question(chalk.cyan(`${question} (${defStr}): `), answer => {
          if (!answer.trim()) {
            res(defaultVal);
          } else {
            res(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
          }
        });
      });
    };

    console.log(chalk.bold('\n📁 Output Settings\n'));
    config.output.defaultFormat = await ask('Default output format (html/json/csv/markdown)', 'html');
    config.output.outputDir = await ask('Output directory', './reports');
    config.output.redactEmails = await askBool('Redact email addresses in reports?', false);

    console.log(chalk.bold('\n🔍 Analysis Settings\n'));
    config.analysis.timezone = await ask('Timezone for daily trends (IANA format)', 'America/Chicago');

    const excludeExtsInput = await ask('File extensions to exclude (comma-separated, e.g., .md,.txt)', '');
    if (excludeExtsInput) {
      config.analysis.excludeExtensions = excludeExtsInput.split(',').map((e: string) => {
        const trimmed = e.trim();
        return trimmed.startsWith('.') ? trimmed : `.${trimmed}`;
      });
    }

    const excludeAuthorsInput = await ask('Authors to exclude (comma-separated, e.g., dependabot[bot])', '');
    if (excludeAuthorsInput) {
      config.analysis.excludeAuthors = excludeAuthorsInput.split(',').map((a: string) => a.trim());
    }

    console.log(chalk.bold('\n⚡ Performance Settings\n'));
    config.performance.enableCaching = await askBool('Enable caching?', true);

    rl.close();
  }

  // Write config file
  try {
    writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
    console.log(
      '\n' +
        boxen(
          chalk.bold('✅ Configuration Created!\n\n') +
            chalk.green(`📄 File: ${configPath}\n\n`) +
            chalk.blue('Next steps:\n') +
            chalk.blue('  • Edit the file to customize further\n') +
            chalk.blue('  • Run: git-spark --days 30\n') +
            chalk.blue('  • Or:  git-spark html --days 30 --open'),
          {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'green',
          }
        )
    );
  } catch (error) {
    console.error(chalk.red(`Failed to write config file: ${error instanceof Error ? error.message : 'Unknown error'}`));
    process.exit(1);
  }
}

export { executeAnalysis, executeHealthCheck, validateEnvironment, executeInit };
