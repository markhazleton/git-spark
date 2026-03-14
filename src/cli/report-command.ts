/**
 * HTML report command implementation
 * Handles HTML report generation, HTTP server, and browser opening
 */

import chalk from 'chalk';
import boxen from 'boxen';
import ora from 'ora';
import { GitSparkOptions, OutputFormat, LogLevel } from '../types/index.js';
import { validateOptions } from '../utils/validation.js';
import { resolveOptionsWithConfig } from '../utils/config.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('cli:report');

/**
 * Execute HTML report generation
 *
 * @param options - CLI options
 */
export async function executeHTMLReport(options: any): Promise<void> {
  const spinner = ora('Initializing HTML report generation').start();

  try {
    // Parse and validate options
    const parsedDays = options.days ? parseInt(options.days, 10) : undefined;
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
      ...(parsedDays && { days: parsedDays }),
      branch: options.branch,
      author: options.author,
      path: options.path,
      format: 'html' as OutputFormat,
      output: options.output,
      config: options.config,
      heavy: options.heavy,
      logLevel: 'info' as LogLevel,
      ...(noCache !== undefined ? { noCache } : {}),
      ...(options.timezone ? { timezone: options.timezone } : {}),
      ...(excludeExtensions ? { excludeExtensions } : {}),
      teamwork: options.teamwork,
      azureDevOps: options.azureDevops,
      devopsOrg: options.devopsOrg,
      devopsProject: options.devopsProject,
      devopsPat: options.devopsPat,
      devopsConfig: options.devopsConfig,
    };

    const resolved = resolveOptionsWithConfig(gitSparkOptions);
    const resolvedOptions = resolved.options;
    resolvedOptions.output = resolvedOptions.output || './reports';
    resolvedOptions.format = resolvedOptions.format || 'html';

    spinner.text = 'Validating options and repository';
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
      spinner.warn('Validation warnings detected');
      for (const warning of validation.warnings) {
        console.warn(chalk.yellow(`  • ${warning}`));
      }
    }

    // Dynamic import to load GitSpark
    spinner.text = 'Loading git-spark analysis engine';

    // Import GitSpark properly
    const { GitSpark } = await import('../index.js');

    spinner.text = 'Starting repository analysis';
    const gitSpark = new GitSpark(
      resolvedOptions,
      (phase: string, current: number, total: number) => {
        const percentage = Math.round((current / total) * 100);
        spinner.text = `${phase} (${percentage}%)`;
      }
    );

    spinner.text = 'Analyzing repository data';
    const report = await gitSpark.analyze();

    spinner.text = 'Generating HTML report';
    await gitSpark.export('html', resolvedOptions.output, report);

    // Construct the full path to the generated report
    const { resolve } = await import('path');
    const outputPath = resolve(resolvedOptions.output, 'git-spark-report.html');

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

/**
 * Start HTTP server to serve HTML report
 *
 * @param reportPath - Path to the HTML report file
 * @param port - Port number to serve on
 */
export async function startHTMLServer(reportPath: string, port: number): Promise<void> {
  const spinner = ora(`Starting HTTP server on port ${port}`).start();

  try {
    const { createServer } = await import('http');
    const { readFileSync } = await import('fs');

    const server = createServer((req: any, res: any) => {
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
          const htmlContent = readFileSync(reportPath, 'utf-8');
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

/**
 * Open HTML report in default browser
 *
 * @param reportPath - Path to the HTML report file
 */
export async function openHTMLReport(reportPath: string): Promise<void> {
  try {
    const { spawn } = await import('child_process');
    const os = await import('os');
    const { resolve } = await import('path');

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
      stdio: 'ignore',
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
