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

    if (report.azureDevOps) {
      this.displayAzureDevOps(report.azureDevOps);
    }

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

    const summaryData = [
      ['Metric', 'Value'],
      ['Total Commits', repository.totalCommits.toLocaleString()],
      ['Contributors', repository.totalAuthors.toString()],
      ['Files Changed', repository.totalFiles.toLocaleString()],
      ['Code Churn', repository.totalChurn.toLocaleString() + ' lines'],
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
   * Display Azure DevOps integration section
   * @private
   */
  private displayAzureDevOps(azureDevOps: any): void {
    const { summary, pullRequests, reviewProcess, gitIntegration, teamCollaboration } = azureDevOps;

    process.stdout.write(chalk.bold.cyan('🔗 AZURE DEVOPS INTEGRATION') + '\n');
    process.stdout.write(chalk.blue('─'.repeat(40)) + '\n');

    // Overview
    const overviewData = [
      ['Metric', 'Value'],
      ['Total Pull Requests', summary.totalPullRequests.toLocaleString()],
      ['Git Commit Coverage', Math.round(summary.coverage.gitCommitCoverage * 100) + '%'],
      ['Cache Hit Rate', Math.round(summary.dataFreshness.cacheHitRate * 100) + '%'],
      ['Mapping Success Rate', Math.round(gitIntegration.mappingSuccessRate * 100) + '%'],
    ];

    process.stdout.write(table(overviewData));
    process.stdout.write('\n');

    // Pull Request Metrics
    process.stdout.write(chalk.bold.yellow('📋 Pull Request Metrics:') + '\n');
    process.stdout.write(`  • Small PRs (<10 files): ${pullRequests.sizeDistribution.small}\n`);
    process.stdout.write(`  • Medium PRs (10-50 files): ${pullRequests.sizeDistribution.medium}\n`);
    process.stdout.write(`  • Large PRs (50-200 files): ${pullRequests.sizeDistribution.large}\n`);
    process.stdout.write(`  • X-Large PRs (>200 files): ${pullRequests.sizeDistribution.xlarge}\n`);
    process.stdout.write(
      `  • Avg Time to Merge: ${pullRequests.timing.averageTimeToMerge.toFixed(1)}h\n`
    );
    process.stdout.write(
      `  • Completed: ${pullRequests.statusBreakdown.completed}, Active: ${pullRequests.statusBreakdown.active}, Abandoned: ${pullRequests.statusBreakdown.abandoned}\n`
    );
    process.stdout.write('\n');

    // Review Process
    process.stdout.write(chalk.bold.yellow('👥 Review Process:') + '\n');
    process.stdout.write(
      `  • Avg Reviewers per PR: ${reviewProcess.participation.averageReviewersPerPR.toFixed(1)}\n`
    );
    process.stdout.write(
      `  • Self-Approval Rate: ${Math.round(reviewProcess.participation.selfApprovalRate * 100)}%\n`
    );
    process.stdout.write(
      `  • Approval Rate: ${Math.round(reviewProcess.quality.approvalRate * 100)}%\n`
    );
    process.stdout.write(
      `  • Thoroughness Score: ${Math.round(reviewProcess.quality.thoroughnessScore * 100)}%\n`
    );
    process.stdout.write('\n');

    // Integration Quality
    process.stdout.write(chalk.bold.yellow('🔗 Git Integration Quality:') + '\n');
    process.stdout.write(
      `  • High Confidence Associations: ${gitIntegration.integrationQuality.highConfidenceAssociations}\n`
    );
    process.stdout.write(
      `  • Medium Confidence: ${gitIntegration.integrationQuality.mediumConfidenceAssociations}\n`
    );
    process.stdout.write(
      `  • Low Confidence: ${gitIntegration.integrationQuality.lowConfidenceAssociations}\n`
    );
    process.stdout.write(
      `  • Unmapped Commits: ${gitIntegration.integrationQuality.unmappedCommits}\n`
    );
    process.stdout.write('\n');

    // Team Collaboration
    if (teamCollaboration.creationPatterns.mostActivePRCreators.length > 0) {
      process.stdout.write(chalk.bold.yellow('🤝 Top PR Creators:') + '\n');
      teamCollaboration.creationPatterns.mostActivePRCreators
        .slice(0, 5)
        .forEach((creator: { creator: string; prCount: number }) => {
          process.stdout.write(
            chalk.yellow(`  • ${creator.creator}: ${creator.prCount} PRs`) + '\n'
          );
        });
      process.stdout.write('\n');
    }

    process.stdout.write(chalk.bold.yellow('📈 Team Health:') + '\n');
    process.stdout.write(
      `  • Collaboration Score: ${Math.round(teamCollaboration.teamDynamics.collaborationScore * 100)}%\n`
    );
    process.stdout.write(
      `  • Cross-Review Rate: ${Math.round(teamCollaboration.crossTeamCollaboration.crossReviewRate * 100)}%\n`
    );
    process.stdout.write(
      `  • Knowledge Sharing: ${Math.round(teamCollaboration.crossTeamCollaboration.knowledgeSharingScore * 100)}%\n`
    );
    process.stdout.write('\n');
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
