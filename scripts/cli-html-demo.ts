#!/usr/bin/env ts-node

/**
 * Comprehensive HTML Report CLI Demo
 *
 * This script demonstrates how to generate comprehensive HTML reports
 * from the command line using git-spark's TypeScript API.
 *
 * Usage examples:
 * - Basic report:     npx ts-node scripts/cli-html-demo.ts
 * - Last 30 days:     npx ts-node scripts/cli-html-demo.ts --days 30
 * - Heavy analysis:   npx ts-node scripts/cli-html-demo.ts --heavy
 * - Open in browser:  npx ts-node scripts/cli-html-demo.ts --open
 * - Start server:     npx ts-node scripts/cli-html-demo.ts --serve
 * - Custom output:    npx ts-node scripts/cli-html-demo.ts --output ./my-reports
 */

import { GitSpark, GitSparkOptions, exportReport } from '../src/index';
import chalk from 'chalk';
import boxen from 'boxen';
import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { exec } from 'child_process';
import * as os from 'os';

interface CLIOptions {
  repo?: string;
  days?: number;
  since?: string;
  until?: string;
  output?: string;
  branch?: string;
  author?: string;
  pathPattern?: string;
  heavy?: boolean;
  open?: boolean;
  serve?: boolean;
  port?: number;
  reuse?: boolean; // reuse existing analysis when exporting
  noReanalyze?: boolean; // alias for reuse
}

/**
 * Generate comprehensive HTML report with CLI interface
 */
async function generateHTMLReport(options: CLIOptions): Promise<void> {
  console.log(chalk.blue('🚀 Starting Git Spark HTML Report Generation...\n'));

  try {
    // Configure git-spark options
    const gitSparkOptions: GitSparkOptions = {
      repoPath: options.repo || process.cwd(),
      ...(options.days && { days: options.days }),
      ...(options.since && { since: options.since }),
      ...(options.until && { until: options.until }),
      ...(options.branch && { branch: options.branch }),
      ...(options.author && { author: options.author }),
      ...(options.pathPattern && { path: options.pathPattern }),
      format: 'html',
      output: options.output || './reports',
      ...(options.heavy && { heavy: options.heavy }),
      logLevel: 'info',
    };

    console.log(chalk.cyan('📋 Analysis Configuration:'));
    console.log(chalk.gray(`   Repository: ${gitSparkOptions.repoPath}`));
    if (gitSparkOptions.days)
      console.log(chalk.gray(`   Time Period: Last ${gitSparkOptions.days} days`));
    if (gitSparkOptions.since) console.log(chalk.gray(`   Since: ${gitSparkOptions.since}`));
    if (gitSparkOptions.until) console.log(chalk.gray(`   Until: ${gitSparkOptions.until}`));
    if (gitSparkOptions.branch) console.log(chalk.gray(`   Branch: ${gitSparkOptions.branch}`));
    if (gitSparkOptions.author)
      console.log(chalk.gray(`   Author Filter: ${gitSparkOptions.author}`));
    if (gitSparkOptions.path) console.log(chalk.gray(`   Path Pattern: ${gitSparkOptions.path}`));
    console.log(chalk.gray(`   Output Directory: ${gitSparkOptions.output}`));
    console.log(chalk.gray(`   Heavy Analysis: ${gitSparkOptions.heavy ? 'Enabled' : 'Disabled'}`));
    console.log('');

    // Initialize git-spark with progress tracking
    console.log(chalk.yellow('⚡ Initializing analysis engine...'));
    const gitSpark = new GitSpark(
      gitSparkOptions,
      (phase: string, current: number, total: number) => {
        const percentage = Math.round((current / total) * 100);
        process.stdout.write(
          `\r${chalk.yellow('📊')} ${phase}: ${percentage}% (${current}/${total})`
        );
      }
    );

    // Run analysis (first and only unless user opts out of second pass)
    console.log(chalk.yellow('\n🔍 Analyzing repository...'));
    const report = await gitSpark.analyze();
    console.log(''); // New line after progress

    // Export HTML report (optionally reuse existing analysis without a second run)
    console.log(chalk.yellow('📄 Generating HTML report...'));
    const outDir = gitSparkOptions.output || './reports';
    if (options.reuse || options.noReanalyze) {
      await exportReport(report, 'html', outDir);
    } else {
      await gitSpark.export('html', outDir);
    }

    // Construct output path
    const outputPath = path.resolve(gitSparkOptions.output || './reports', 'git-spark-report.html');

    // Display success message
    console.log(
      '\n' +
        boxen(
          chalk.bold('📊 HTML Report Generated Successfully!\n\n') +
            chalk.green(`✓ Report Location: ${outputPath}\n`) +
            chalk.blue(`📈 Total Commits: ${report.repository.totalCommits.toLocaleString()}\n`) +
            chalk.blue(`👥 Contributors: ${report.repository.totalAuthors.toLocaleString()}\n`) +
            chalk.blue(`📁 Files Analyzed: ${report.repository.totalFiles.toLocaleString()}\n`) +
            chalk.blue(`🏥 Health Score: ${Math.round(report.repository.healthScore * 100)}%\n`) +
            chalk.blue(
              `🔧 Governance Score: ${Math.round(report.repository.governanceScore * 100)}%\n`
            ) +
            chalk.blue(`🚌 Bus Factor: ${report.repository.busFactor}\n`) +
            chalk.blue(`📊 File Size: ${getFileSize(outputPath)}`),
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
    console.log(chalk.cyan('\n💡 What you can do next:'));
    console.log(chalk.cyan(`   📖 View Report: Open ${outputPath} in your browser`));
    console.log(chalk.cyan(`   🌐 Start Server: npm run html-report:serve`));
    console.log(chalk.cyan(`   🔄 Regenerate (heavy): npm run html-report:heavy -- --days 60`));
    console.log(
      chalk.cyan(`   📱 Share: The HTML file is self-contained and can be shared directly`)
    );
  } catch (error) {
    console.error(
      boxen(
        chalk.red('❌ HTML Report Generation Failed\n\n') +
          chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`),
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

/**
 * Start HTTP server to serve the HTML report
 */
async function startHTMLServer(reportPath: string, port: number): Promise<void> {
  console.log(chalk.yellow(`\n🌐 Starting HTTP server on port ${port}...`));

  const server = http.createServer((req, res) => {
    // Add CORS headers for local development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Serve the HTML report
    if (req.url === '/' || req.url === '/index.html') {
      try {
        const htmlContent = fs.readFileSync(reportPath, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(htmlContent);
      } catch (error) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('HTML Report not found');
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found - Use / to view the report');
    }
  });

  server.listen(port, () => {
    console.log(
      boxen(
        chalk.bold('🌐 HTML Report Server Started\n\n') +
          chalk.green(`📊 Report URL: http://localhost:${port}\n`) +
          chalk.blue(`📁 Serving: ${reportPath}\n`) +
          chalk.yellow(`⚡ Press Ctrl+C to stop the server\n`) +
          chalk.gray(`💡 Tip: Open the URL in your browser to view the report`),
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
      console.log(chalk.green('✓ Server stopped gracefully'));
      process.exit(0);
    });
  });

  // Keep the process alive
  await new Promise(() => {}); // Never resolves - keeps server running
}

/**
 * Open HTML report in the default browser
 */
async function openHTMLReport(reportPath: string): Promise<void> {
  try {
    let command: string;

    switch (os.platform()) {
      case 'win32':
        command = `start "" "${reportPath}"`;
        break;
      case 'darwin':
        command = `open "${reportPath}"`;
        break;
      default: // Linux and others
        command = `xdg-open "${reportPath}"`;
        break;
    }

    exec(command, error => {
      if (error) {
        console.log(
          chalk.yellow(`⚠️  Could not auto-open browser. Please manually open: ${reportPath}`)
        );
      } else {
        console.log(chalk.green('✓ Report opened in your default browser'));
      }
    });
  } catch (error) {
    console.log(
      chalk.yellow(`⚠️  Could not auto-open browser. Please manually open: ${reportPath}`)
    );
  }
}

/**
 * Get human-readable file size
 */
function getFileSize(filePath: string): string {
  try {
    const stats = fs.statSync(filePath);
    const bytes = stats.size;

    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  } catch {
    return 'Unknown size';
  }
}

/**
 * Parse number from string
 */
function parseNumber(value: string): number {
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`'${value}' is not a valid number`);
  }
  return parsed;
}

/**
 * Main CLI setup and execution
 */
async function main() {
  const program = new Command();

  program
    .name('cli-html-demo')
    .description('Generate comprehensive HTML reports for Git repositories')
    .version('1.0.0')
    .option('-r, --repo <path>', 'repository path to analyze', process.cwd())
    .option('-d, --days <number>', 'analyze last N days', parseNumber)
    .option('-s, --since <date>', 'start date for analysis (YYYY-MM-DD format)')
    .option('-u, --until <date>', 'end date for analysis (YYYY-MM-DD format)')
    .option('-o, --output <path>', 'output directory for the HTML report', './reports')
    .option('-b, --branch <name>', 'analyze specific branch only')
    .option('-a, --author <name>', 'filter commits by author name or email')
    .option('-p, --path-pattern <glob>', 'filter files by path pattern (glob syntax)')
    .option('--heavy', 'enable expensive analyses for detailed insights')
    .option('--open', 'automatically open the HTML report in browser')
    .option('--serve', 'start HTTP server to serve the report (includes --open)')
    .option('--port <number>', 'port for HTTP server (default: 3000)', parseNumber, 3000)
    .option('--reuse', 'reuse first analysis when exporting (skip second analysis)')
    .option('--no-reanalyze', 'alias of --reuse')
    .action(async options => {
      await generateHTMLReport(options);
    });

  // Display help with examples
  program.addHelpText(
    'after',
    `
Examples:
  Basic report for current repository:
    npx ts-node scripts/cli-html-demo.ts

  Analyze last 30 days with heavy analysis:
    npx ts-node scripts/cli-html-demo.ts --days 30 --heavy

  Generate report and open in browser:
    npx ts-node scripts/cli-html-demo.ts --open

  Start server to serve report (after build):
    npm run html-report:serve -- --port 8080

  Analyze specific branch with custom output:
    npx ts-node scripts/cli-html-demo.ts --branch main --output ./custom-reports

  Filter by author and date range:
    npx ts-node scripts/cli-html-demo.ts --author john@example.com --since 2024-01-01

  Analyze TypeScript files only:
    npx ts-node scripts/cli-html-demo.ts --path-pattern "**/*.ts"

  Complete analysis with all options (single build reuse):
    npm run html-report -- \\
      --repo /path/to/repo \\
      --days 60 \\
      --branch develop \\
      --heavy \\
      --output ./detailed-reports \\
      --reuse \\
      --serve
`
  );

  // Parse command line arguments
  program.parse();
}

// Run the CLI
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}

export { generateHTMLReport, startHTMLServer, openHTMLReport };
