import { Command } from 'commander';
import { GitSparkOptions, LogLevel, OutputFormat } from '../types';
import { validateOptions, validateNodeVersion, validateGitInstallation } from '../utils/validation';
import { setGlobalLogLevel, createLogger } from '../utils/logger';
import { getVersion } from '../version-fallback';
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
    const versionModule = await import('../version');
    version = versionModule.VERSION;
  } catch {
    // Try to read from package.json as fallback
    try {
      const { readFileSync } = await import('fs');
      const { resolve } = await import('path');
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
    .option('--azure-devops', 'enable Azure DevOps integration')
    .option('--devops-org <org>', 'Azure DevOps organization name')
    .option('--devops-project <project>', 'Azure DevOps project name')
    .option('--devops-repo <repo>', 'Azure DevOps repository name')
    .option('--devops-pat <token>', 'Azure DevOps Personal Access Token')
    .option('--devops-config <path>', 'Azure DevOps configuration file')
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
    .command('html')
    .description('Generate comprehensive HTML report')
    .option('-r, --repo <path>', 'repository path', process.cwd())
    .option('-d, --days <number>', 'analyze last N days')
    .option('-s, --since <date>', 'start date (YYYY-MM-DD)')
    .option('-u, --until <date>', 'end date (YYYY-MM-DD)')
    .option('-o, --output <path>', 'output directory', './reports')
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

async function executeHTMLReport(options: any): Promise<void> {
  const spinner = ora('Initializing HTML report generation').start();

  try {
    // Parse and validate options
    const parsedDays = options.days ? parseInt(options.days, 10) : undefined;
    const gitSparkOptions: GitSparkOptions = {
      repoPath: options.repo || process.cwd(),
      since: options.since,
      until: options.until,
      ...(parsedDays && { days: parsedDays }),
      branch: options.branch,
      author: options.author,
      path: options.path,
      format: 'html' as OutputFormat,
      output: options.output || './reports',
      heavy: options.heavy,
      logLevel: 'info' as LogLevel,
      azureDevOps: options.azureDevops,
      devopsOrg: options.devopsOrg,
      devopsProject: options.devopsProject,
      devopsPat: options.devopsPat,
      devopsConfig: options.devopsConfig,
    };

    spinner.text = 'Validating options and repository';
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
      spinner.warn('Validation warnings detected');
      for (const warning of validation.warnings) {
        console.warn(chalk.yellow(`  • ${warning}`));
      }
    }

    // Dynamic import to load GitSpark
    spinner.text = 'Loading git-spark analysis engine';

    // Import GitSpark properly
    const { GitSpark } = await import('../index');

    spinner.text = 'Starting repository analysis';
    const gitSpark = new GitSpark(
      gitSparkOptions,
      (phase: string, current: number, total: number) => {
        const percentage = Math.round((current / total) * 100);
        spinner.text = `${phase} (${percentage}%)`;
      }
    );

    spinner.text = 'Analyzing repository data';
    const report = await gitSpark.analyze();

    spinner.text = 'Generating HTML report';
    await gitSpark.export('html', gitSparkOptions.output || './reports');

    // Construct the full path to the generated report
    const { resolve } = require('path');
    const outputPath = resolve(gitSparkOptions.output || './reports', 'git-spark-report.html');

    spinner.succeed('HTML report generated successfully!');

    // Display summary with file location
    console.log(
      '\n' +
        boxen(
          chalk.bold('📊 HTML Report Generated\n\n') +
            chalk.green(`✓ Report saved to: ${outputPath}\n`) +
            chalk.blue(`📈 Total Commits: ${report.repository.totalCommits}\n`) +
            chalk.blue(`👥 Contributors: ${report.repository.totalAuthors}\n`) +
            chalk.blue(`📁 Files Analyzed: ${report.repository.totalFiles}\n`) +
            chalk.blue(`📊 Activity Index: ${Math.round(report.repository.healthScore * 100)}%\n`) +
            chalk.blue(
              `🚌 Bus Factor: ${Math.round((report.repository.busFactor / report.repository.totalAuthors) * 100)}%`
            ),
          {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'green',
          }
        )
    );

    // Handle additional options
    if (options.serve) {
      await startHTMLServer(outputPath, options.port || 3000);
    } else if (options.open) {
      await openHTMLReport(outputPath);
    }

    // Display usage instructions
    console.log(chalk.cyan('\n💡 Next steps:'));
    console.log(chalk.cyan(`   📖 Open report: Open ${outputPath} in your browser`));
    if (!options.serve) {
      console.log(
        chalk.cyan(`   🌐 Start server: git-spark html --serve --port ${options.port || 3000}`)
      );
    }
    console.log(chalk.cyan(`   🔄 Regenerate: git-spark html --days 30 --heavy`));
  } catch (error) {
    spinner.fail('HTML report generation failed');
    if (error instanceof Error) {
      console.error(chalk.red(`Error: ${error.message}`));
      logger.error('HTML report generation failed', { error: error.message, stack: error.stack });
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

async function startHTMLServer(reportPath: string, port: number): Promise<void> {
  const spinner = ora(`Starting HTTP server on port ${port}`).start();

  try {
    const http = require('http');
    const fs = require('fs');

    const server = http.createServer((req: any, res: any) => {
      // Add CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      if (req.url === '/' || req.url === '/index.html') {
        try {
          const htmlContent = fs.readFileSync(reportPath, 'utf-8');
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(htmlContent);
        } catch (error) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Report not found');
        }
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
    });

    server.listen(port, () => {
      spinner.succeed(`HTTP server started`);
      console.log(
        boxen(
          chalk.bold('🌐 HTML Report Server Running\n\n') +
            chalk.green(`📊 Report URL: http://localhost:${port}\n`) +
            chalk.blue(`📁 Serving: ${reportPath}\n`) +
            chalk.yellow(`⚡ Press Ctrl+C to stop server`),
          {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'blue',
          }
        )
      );
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n⏹️  Shutting down server...'));
      server.close(() => {
        console.log(chalk.green('✓ Server stopped'));
        process.exit(0);
      });
    });

    // Keep the process alive
    await new Promise(() => {}); // Never resolves, keeps server running
  } catch (error) {
    spinner.fail('Failed to start server');
    console.error(chalk.red('Error starting server:'), error);
    process.exit(1);
  }
}

async function openHTMLReport(reportPath: string): Promise<void> {
  try {
    const { spawn } = require('child_process');
    const os = require('os');
    const { resolve } = require('path');

    // Sanitize the file path by resolving to absolute path
    const sanitizedPath = resolve(reportPath);

    let command: string;
    let args: string[];
    
    switch (os.platform()) {
      case 'win32':
        command = 'cmd.exe';
        args = ['/c', 'start', '', sanitizedPath];
        break;
      case 'darwin':
        command = 'open';
        args = [sanitizedPath];
        break;
      default:
        command = 'xdg-open';
        args = [sanitizedPath];
        break;
    }

    // Use spawn with argument array instead of exec with string to prevent command injection
    const child = spawn(command, args, {
      detached: true,
      stdio: 'ignore'
    });
    
    child.unref();
    
    child.on('error', () => {
      console.log(chalk.yellow(`⚠️  Could not auto-open browser. Please open: ${reportPath}`));
    });
    
    // Give it a moment to start, then assume success if no error
    setTimeout(() => {
      console.log(chalk.green('✓ Report opened in browser'));
    }, 100);
  } catch (error) {
    console.log(chalk.yellow(`⚠️  Could not auto-open browser. Please open: ${reportPath}`));
  }
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
      azureDevOps: options.azureDevops,
      devopsOrg: options.devopsOrg,
      devopsProject: options.devopsProject,
      devopsRepo: options.devopsRepo,
      devopsPat: options.devopsPat,
      devopsConfig: options.devopsConfig,
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
    const GitSpark = require('../index').GitSpark || require('../../dist/src/index').GitSpark;

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

    spinner.succeed(`Analysis completed successfully (git-spark v${getVersion()})`);

    // Display summary
    displaySummary(report);
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

    const GitSpark = require('../../dist/index').GitSpark || require('../index').GitSpark;

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
        chalk.bold(`📊 Git Spark Analysis Summary (v${getVersion()})\n\n`) +
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

export { executeAnalysis, executeHealthCheck, validateEnvironment };
