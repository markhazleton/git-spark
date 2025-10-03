import { AnalysisReport } from '../types';
import chalk from 'chalk';
import { table } from 'table';
import { createLogger } from '../utils/logger';
const logger = createLogger('console-exporter');

/**
 * Exports analysis reports to console with rich formatting and colors
 * Provides terminal-friendly output with tables, colors, and structured data
 */
export class ConsoleExporter {
  /**
   * Export analysis report to console with formatted output
   * @param report - The analysis report to display
   */
  export(report: AnalysisReport): void {
    logger.info('Console report displayed');
    this.displayHeader(report);
    this.displaySummary(report);
    this.displayTopAuthors(report.authors);
    this.displayHotspots(report.files);
    this.displayRisks(report.risks);
    this.displayGovernance(report.governance);
    this.displayFooter(report);
  }

  /**
   * Display report header with title and metadata
   * @private
   */
  private displayHeader(report: AnalysisReport): void {
    process.stdout.write('\n' + chalk.blue('═'.repeat(60)) + '\n');
    process.stdout.write(chalk.bold.blue('🔥 GIT SPARK ANALYSIS REPORT') + '\n');
    process.stdout.write(chalk.blue('═'.repeat(60)) + '\n');
    process.stdout.write(
      chalk.gray(`Generated: ${report.metadata.generatedAt.toLocaleString()}`) + '\n'
    );
    process.stdout.write(chalk.gray(`Repository: ${report.metadata.repoPath}`) + '\n');
    process.stdout.write(chalk.gray(`Branch: ${report.metadata.branch}`) + '\n');
    process.stdout.write('\n');
  }

  /**
   * Display executive summary with key metrics
   * @private
   */
  private displaySummary(report: AnalysisReport): void {
    const { repository, summary } = report;

    process.stdout.write(chalk.bold.cyan('📊 EXECUTIVE SUMMARY') + '\n');
    process.stdout.write(chalk.blue('─'.repeat(40)) + '\n');

    const healthColor = this.getHealthColor(summary.healthRating);
    process.stdout.write(
      `${chalk.bold('Repository Health:')} ${healthColor(summary.healthRating.toUpperCase())}\n`
    );

    const summaryData = [
      ['Metric', 'Value'],
      ['Total Commits', repository.totalCommits.toLocaleString()],
      ['Contributors', repository.totalAuthors.toString()],
      ['Files Changed', repository.totalFiles.toLocaleString()],
      ['Code Churn', repository.totalChurn.toLocaleString() + ' lines'],
      ['Activity Index', Math.round(repository.healthScore * 100) + '%'],
      ['Bus Factor', Math.round((repository.busFactor / repository.totalAuthors) * 100) + '%'],
      ['Active Days', repository.activeDays.toString()],
    ];

    process.stdout.write(table(summaryData));

    // Display insights and action items
    if (summary.insights && summary.insights.length > 0) {
      process.stdout.write(chalk.bold.yellow('💡 Key Insights:') + '\n');
      summary.insights.forEach((insight: string) => {
        process.stdout.write(chalk.yellow(`  • ${insight}`) + '\n');
      });
      process.stdout.write('\n');
    }

    if (summary.actionItems && summary.actionItems.length > 0) {
      process.stdout.write(chalk.bold.red('🚨 Action Items:') + '\n');
      summary.actionItems.forEach((item: string) => {
        process.stdout.write(chalk.red(`  • ${item}`) + '\n');
      });
      process.stdout.write('\n');
    }
  }

  /**
   * Display top contributors table
   * @private
   */
  private displayTopAuthors(authors: any[]): void {
    process.stdout.write(chalk.bold.cyan('👥 TOP CONTRIBUTORS') + '\n');
    process.stdout.write(chalk.blue('─'.repeat(40)) + '\n');

    const authorData = [
      ['Author', 'Commits', 'Churn', 'Files', 'Avg Size'],
      ...authors
        .slice(0, 10)
        .map(author => [
          author.name,
          author.commits.toString(),
          author.churn.toString(),
          author.filesChanged.toString(),
          Math.round(author.avgCommitSize).toString(),
        ]),
    ];

    process.stdout.write(
      table(authorData, { border: { bodyLeft: '║', bodyRight: '║', bodyJoin: '│' } })
    );
    process.stdout.write('\n');
  }

  /**
   * Display file hotspots table
   * @private
   */
  private displayHotspots(files: any[]): void {
    process.stdout.write(chalk.bold.cyan('🔥 FILE HOTSPOTS') + '\n');
    process.stdout.write(chalk.blue('─'.repeat(40)) + '\n');

    const fileData = [
      ['File', 'Commits', 'Authors', 'Risk'],
      ...files
        .slice(0, 10)
        .map(file => [
          file.path.split('/').pop() || file.path,
          file.commits.toString(),
          file.authors.toString(),
          Math.round(file.riskScore * 100) + '%',
        ]),
    ];

    process.stdout.write(
      table(fileData, { border: { bodyLeft: '║', bodyRight: '║', bodyJoin: '│' } })
    );
    process.stdout.write('\n');
  }

  /**
   * Display risk analysis section
   * @private
   */
  private displayRisks(risks: any): void {
    process.stdout.write(chalk.bold.cyan('⚠️  RISK ANALYSIS') + '\n');
    process.stdout.write(chalk.blue('─'.repeat(40)) + '\n');

    const riskLevel = risks?.overallRisk || 'unknown';
    const riskColor = this.getRiskColor(riskLevel);
    process.stdout.write(
      `${chalk.bold('Overall Risk Level:')} ${riskColor(riskLevel.toUpperCase())}\n`
    );
    process.stdout.write('\n');

    process.stdout.write(chalk.bold('Risk Factors:') + '\n');
    process.stdout.write(`  • High churn files: ${risks.riskFactors.highChurnFiles}\n`);
    process.stdout.write(`  • Files with many authors: ${risks.riskFactors.manyAuthorFiles}\n`);
    process.stdout.write(`  • Large commits: ${risks.riskFactors.largeCommits}\n`);
    process.stdout.write(`  • Recently changed files: ${risks.riskFactors.recentChanges}\n`);
    process.stdout.write('\n');

    if (risks.recommendations && risks.recommendations.length > 0) {
      process.stdout.write(chalk.bold('Recommendations:') + '\n');
      risks.recommendations.forEach((rec: string) => {
        process.stdout.write(chalk.yellow(`  • ${rec}`) + '\n');
      });
      process.stdout.write('\n');
    }
  }

  /**
   * Display governance analysis section
   * @private
   */
  private displayGovernance(governance: any): void {
    process.stdout.write(chalk.bold.cyan('📋 GOVERNANCE ANALYSIS') + '\n');
    process.stdout.write(chalk.blue('─'.repeat(40)) + '\n');

    process.stdout.write(
      `${chalk.bold('Governance Score:')} ${Math.round(governance.score * 100)}%\n`
    );
    process.stdout.write('\n');

    const governanceData = [
      ['Metric', 'Value'],
      ['Conventional Commits', governance.conventionalCommits?.toString() || '0'],
      ['Traceability Score', Math.round((governance.traceabilityScore || 0) * 100) + '%'],
      ['Avg Message Length', governance.avgMessageLength?.toString() || '0'],
      ['WIP Commits', governance.wipCommits?.toString() || '0'],
      ['Revert Commits', governance.revertCommits?.toString() || '0'],
      ['Short Messages', governance.shortMessages?.toString() || '0'],
    ];

    process.stdout.write(table(governanceData));

    if (governance.recommendations && governance.recommendations.length > 0) {
      process.stdout.write(chalk.bold('Recommendations:') + '\n');
      governance.recommendations.forEach((rec: string) => {
        process.stdout.write(chalk.yellow(`  • ${rec}`) + '\n');
      });
      process.stdout.write('\n');
    }
  }

  /**
   * Display report footer
   * @private
   */
  private displayFooter(report: AnalysisReport): void {
    process.stdout.write(chalk.blue('═'.repeat(60)) + '\n');
    process.stdout.write(chalk.gray(`Generated by git-spark v${report.metadata.version}`) + '\n');
    process.stdout.write(
      chalk.gray(`Analysis completed in ${report.metadata.processingTime}ms`) + '\n'
    );
    process.stdout.write(chalk.blue('═'.repeat(60)) + '\n');
    process.stdout.write('\n');
  }

  /**
   * Get color function based on health rating
   * @private
   */
  private getHealthColor(rating: string): (text: string) => string {
    switch (rating.toLowerCase()) {
      case 'excellent':
        return chalk.green;
      case 'good':
        return chalk.yellow;
      case 'poor':
        return chalk.red;
      default:
        return chalk.gray;
    }
  }

  /**
   * Get color function based on risk level
   * @private
   */
  private getRiskColor(level: string): (text: string) => string {
    if (!level) return chalk.gray;
    switch (level.toLowerCase()) {
      case 'low':
        return chalk.green;
      case 'medium':
        return chalk.yellow;
      case 'high':
        return chalk.red;
      default:
        return chalk.gray;
    }
  }
}
