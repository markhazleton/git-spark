import { Command } from 'commander';
import { GitSparkOptions, LogLevel, OutputFormat } from '../types';
import { validateOptions, validateNodeVersion, validateGitInstallation } from '../utils/validation';
import { setGlobalLogLevel, createLogger } from '../utils/logger';
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
export function createCLI(): Command {
  const program = new Command();

  program
    .name('git-spark')
    .description('Enterprise-grade Git repository analytics and reporting tool')
    .version('1.0.0')
    .option('-d, --days <number>', 'analyze last N days', parseNumber)
    .option('-s, --since <date>', 'start date (YYYY-MM-DD)')
    .option('-u, --until <date>', 'end date (YYYY-MM-DD)')
    .option('-f, --format <format>', 'output format (html|json|console|markdown|csv)', 'html')
    .option('-o, --output <path>', 'output directory', './reports')
    .option('-c, --config <path>', 'configuration file')
    .option('-b, --branch <name>', 'analyze specific branch')
    .option('-a, --author <name>', 'filter by author')
    .option('-p, --path <glob>', 'filter by file path pattern')
    .option('--heavy', 'enable expensive analyses')
    .option('--log-level <level>', 'logging verbosity (error|warn|info|debug|verbose)', 'info')
    .option('--no-cache', 'disable caching')
    .option('--compare <branch>', 'compare with another branch')
    .option('--watch', 'continuous monitoring mode')
    .option('--redact-emails', 'redact email addresses in reports')
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
      noCache: !options.cache,
      compare: options.compare,
      watch: options.watch,
    };

    spinner.text = 'Validating options';
    const validation = validateOptions(gitSparkOptions);
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
    const { GitSpark } = await import('../index');

    spinner.text = 'Starting analysis';
    const gitSpark = new GitSpark(
      gitSparkOptions,
      (phase: string, current: number, total: number) => {
        const percentage = Math.round((current / total) * 100);
        spinner.text = `${phase} (${percentage}%)`;
      }
    );

    const report = await gitSpark.analyze();

    spinner.text = 'Generating output';
    await gitSpark.export(gitSparkOptions.format || 'html', gitSparkOptions.output || './reports');

    spinner.succeed('Analysis completed successfully');

    // Display summary
    displaySummary(report);
  } catch (error) {
    spinner.fail('Analysis failed');
    if (error instanceof Error) {
      console.error(chalk.red(`Error: ${error.message}`));
      logger.error('Analysis failed', { error: error.message, stack: error.stack });
    } else {
      console.error(chalk.red('Unknown error occurred'));
      logger.error('Unknown error occurred', { error });
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

    const { GitSpark } = await import('../index');

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

function displaySummary(report: any): void {
  const summary = report.summary;
  const repository = report.repository;

  console.log(
    '\n' +
      boxen(
        chalk.bold('📊 Git Spark Analysis Summary\n\n') +
          chalk.cyan(`Health Rating: ${summary.healthRating.toUpperCase()}\n`) +
          chalk.blue(`Total Commits: ${repository.totalCommits}\n`) +
          chalk.blue(`Active Contributors: ${repository.totalAuthors}\n`) +
          chalk.blue(`Files Changed: ${repository.totalFiles}\n`) +
          chalk.blue(`Health Score: ${Math.round(repository.healthScore * 100)}%\n`) +
          chalk.blue(`Bus Factor: ${repository.busFactor}`),
        {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor:
            summary.healthRating === 'excellent'
              ? 'green'
              : summary.healthRating === 'good'
                ? 'blue'
                : summary.healthRating === 'fair'
                  ? 'yellow'
                  : 'red',
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
          chalk.blue(`Bus Factor: ${repository.busFactor}\n`) +
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

export { executeAnalysis, executeHealthCheck, validateEnvironment };
