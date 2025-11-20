import {
  AzureDevOpsConfig,
  ProcessedPRData,
  CommitData,
  AzureDevOpsAnalytics,
  AzureDevOpsSummary,
  PullRequestAnalytics,
  ReviewProcessAnalytics,
  GitIntegrationAnalytics,
  TeamCollaborationInsights,
  DataQualityReport,
} from '../../types';
import { createLogger } from '../../utils/logger';

const logger = createLogger('azure-devops-analytics');

/**
 * Processes and analyzes Azure DevOps data to generate comprehensive insights
 */
export class AzureDevOpsAnalyticsProcessor {
  constructor(_config: AzureDevOpsConfig) {
    logger.info('Azure DevOps analytics processor initialized', {
      organization: _config.organization,
      project: _config.project,
    });
  }

  /**
   * Process comprehensive analytics from Azure DevOps and Git data
   */
  async processAnalytics(
    processedData: ProcessedPRData[],
    gitData: CommitData[]
  ): Promise<AzureDevOpsAnalytics> {
    const startTime = Date.now();

    try {
      logger.info('Processing Azure DevOps analytics', {
        prCount: processedData.length,
        gitCommits: gitData.length,
      });

      // Generate summary metrics
      const summary = this.generateSummary(processedData, gitData);

      // Analyze pull requests
      const pullRequests = this.analyzePullRequests(processedData);

      // Analyze review process
      const reviewProcess = this.analyzeReviewProcess(processedData);

      // Analyze Git integration
      const gitIntegration = this.analyzeGitIntegration(processedData, gitData);

      // Generate team collaboration insights
      const teamCollaboration = this.analyzeTeamCollaboration(processedData);

      // Assess data quality
      const dataQuality = this.assessDataQuality(processedData, gitData);

      const analytics: AzureDevOpsAnalytics = {
        summary,
        pullRequests,
        reviewProcess,
        gitIntegration,
        teamCollaboration,
        dataQuality,
      };

      const duration = Date.now() - startTime;
      logger.info('Azure DevOps analytics processing complete', {
        duration,
        totalPRs: summary.totalPullRequests,
        gitCommitCoverage: summary.coverage.gitCommitCoverage,
      });

      return analytics;
    } catch (error) {
      logger.error('Azure DevOps analytics processing failed', { error });
      throw error;
    }
  }

  /**
   * Generate summary metrics
   */
  private generateSummary(
    processedData: ProcessedPRData[],
    gitData: CommitData[]
  ): AzureDevOpsSummary {
    const prs = processedData.map(p => p.pullRequest);

    // Use Git data range for consistent analysis period across the report
    // This ensures Azure DevOps analysis period matches the overall Git analysis
    const gitDates = gitData
      .map(commit => commit.date)
      .filter(date => date)
      .sort((a, b) => a.getTime() - b.getTime());

    const dateRange = {
      start: gitDates[0] || new Date(),
      end: gitDates[gitDates.length - 1] || new Date(),
    };

    // Calculate coverage metrics
    const totalGitCommitsInRange = gitData.filter(
      commit => commit.date >= dateRange.start && commit.date <= dateRange.end
    ).length;

    const associatedCommits = processedData.reduce(
      (acc, pr) => acc + pr.gitCommitAssociations.length,
      0
    );

    const gitCommitCoverage =
      totalGitCommitsInRange > 0 ? associatedCommits / totalGitCommitsInRange : 0;

    return {
      totalPullRequests: prs.length,
      dateRange,
      dataFreshness: {
        cacheHitRate: 0.8, // Placeholder
        oldestDataAge: 0,
        newestDataAge: 0,
      },
      coverage: {
        gitCommitCoverage,
        prStatesIncluded: ['completed', 'active'],
      },
    };
  }

  /**
   * Analyze pull request patterns and metrics
   */
  private analyzePullRequests(processedData: ProcessedPRData[]): PullRequestAnalytics {
    const prs = processedData.map(p => p.pullRequest);

    // Size distribution
    const sizes = processedData.map(p => p.metrics?.size?.totalChurn || 0);
    const sizeDistribution = {
      small: sizes.filter(s => s < 10).length,
      medium: sizes.filter(s => s >= 10 && s < 50).length,
      large: sizes.filter(s => s >= 50 && s < 200).length,
      xlarge: sizes.filter(s => s >= 200).length,
    };

    // Time to merge analysis
    const timeToMerge = processedData
      .map(p => p.metrics?.timeToMerge)
      .filter(time => time !== undefined) as number[];

    const avgTimeToMerge =
      timeToMerge.length > 0
        ? timeToMerge.reduce((sum, time) => sum + time, 0) / timeToMerge.length
        : 0;

    // Status distribution
    const statusCounts = prs.reduce(
      (acc, pr) => {
        acc[pr.status] = (acc[pr.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      sizeDistribution,
      timing: {
        averageTimeToMerge: avgTimeToMerge,
        medianTimeToMerge: this.calculateMedian(timeToMerge),
        averageTimeToFirstReview: 0, // Placeholder
        percentileMetrics: {
          p50TimeToMerge: this.calculatePercentile(timeToMerge, 50),
          p90TimeToMerge: this.calculatePercentile(timeToMerge, 90),
          p50TimeToReview: 0, // Placeholder
          p90TimeToReview: 0, // Placeholder
        },
      },
      statusBreakdown: {
        completed: statusCounts.completed || 0,
        active: statusCounts.active || 0,
        abandoned: statusCounts.abandoned || 0,
      },
      mergeStrategies: {
        merge: 0, // Placeholder
        squash: 0, // Placeholder
        rebase: 0, // Placeholder
        rebaseMerge: 0, // Placeholder
      },
    };
  }

  /**
   * Analyze review process effectiveness
   */
  private analyzeReviewProcess(processedData: ProcessedPRData[]): ReviewProcessAnalytics {
    const prs = processedData.map(p => p.pullRequest);

    // Review participation
    const reviewerCounts = prs.map(pr => pr.reviewers.length);
    const avgReviewers =
      reviewerCounts.length > 0
        ? reviewerCounts.reduce((sum, count) => sum + count, 0) / reviewerCounts.length
        : 0;

    // Approval rates
    const approvalStats = prs.map(pr => {
      const approvals = pr.reviewers.filter(r => r.vote > 0).length;
      const rejections = pr.reviewers.filter(r => r.vote < 0).length;
      return { approvals, rejections, total: pr.reviewers.length };
    });

    const avgApprovals =
      approvalStats.length > 0
        ? approvalStats.reduce((sum, stat) => sum + stat.approvals, 0) / approvalStats.length
        : 0;

    return {
      participation: {
        averageReviewersPerPR: avgReviewers,
        reviewCoverageDistribution: [0, 0, 0, 0, 0], // Placeholder
        selfApprovalRate: 0, // Placeholder
      },
      quality: {
        approvalRate: avgApprovals / (avgReviewers || 1),
        rejectionRate: 0, // Placeholder
        averageReviewCycles: 1, // Placeholder
        thoroughnessScore: this.calculateReviewThoroughness(processedData),
      },
      workload: {
        topReviewers: [], // Placeholder
        workloadDistribution: 0.5, // Placeholder
      },
    };
  }

  /**
   * Analyze Git integration effectiveness
   */
  private analyzeGitIntegration(
    processedData: ProcessedPRData[],
    _gitData: CommitData[]
  ): GitIntegrationAnalytics {
    const totalAssociations = processedData.reduce(
      (acc, pr) => acc + pr.gitCommitAssociations.length,
      0
    );

    // Association method distribution
    const methodCounts = processedData
      .flatMap(pr => pr.gitCommitAssociations)
      .reduce(
        (acc, assoc) => {
          acc[assoc.method] = (acc[assoc.method] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

    // Confidence distribution
    const confidences = processedData
      .flatMap(pr => pr.gitCommitAssociations)
      .map(assoc => assoc.confidence);

    return {
      mappingSuccessRate: totalAssociations / processedData.length,
      integrationMethods: {
        mergeCommit: methodCounts['merge-commit'] || 0,
        squashCommit: methodCounts['squash-commit'] || 0,
        branchAnalysis: methodCounts['branch-analysis'] || 0,
        manualLink: methodCounts['manual-link'] || 0,
      },
      integrationQuality: {
        highConfidenceAssociations: confidences.filter(c => c > 0.8).length,
        mediumConfidenceAssociations: confidences.filter(c => c > 0.5 && c <= 0.8).length,
        lowConfidenceAssociations: confidences.filter(c => c <= 0.5).length,
        unmappedCommits: processedData.filter(pr => pr.gitCommitAssociations.length === 0).length,
      },
      branchStrategy: {
        featureBranchPattern: 'feature/*', // Placeholder
        commonSourceBranches: [], // Placeholder
        commonTargetBranches: ['main', 'master'], // Placeholder
        branchLifetime: {
          average: 0, // Placeholder
          median: 0, // Placeholder
        },
      },
    };
  }

  /**
   * Analyze team collaboration patterns
   */
  private analyzeTeamCollaboration(processedData: ProcessedPRData[]): TeamCollaborationInsights {
    const prs = processedData.map(p => p.pullRequest);

    // Creator analysis
    const creatorCounts = prs.reduce(
      (acc, pr) => {
        const creator = pr.createdBy.displayName;
        acc[creator] = (acc[creator] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const mostActivePRCreators = Object.entries(creatorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({
        creator: name,
        prCount: count,
        averagePRSize: 0, // Placeholder
      }));

    // Cross-team collaboration (placeholder - would need team mapping)
    const crossReviewRate = 0.5; // Placeholder
    const knowledgeSharingScore = 0.7; // Placeholder

    return {
      creationPatterns: {
        mostActivePRCreators,
        creationDistribution: this.calculateGiniCoefficient(Object.values(creatorCounts)),
      },
      crossTeamCollaboration: {
        crossReviewRate,
        knowledgeSharingScore,
        mentorshipIndicators: {
          seniorToJuniorReviews: 0, // Placeholder
          juniorToSeniorPRs: 0, // Placeholder
        },
      },
      teamDynamics: {
        collaborationScore: (crossReviewRate + knowledgeSharingScore) / 2,
        bottleneckIndicators: [], // Placeholder
        teamHealthScore: 0.75, // Placeholder
      },
    };
  }

  /**
   * Assess data quality and limitations
   */
  private assessDataQuality(
    processedData: ProcessedPRData[],
    gitData: CommitData[]
  ): DataQualityReport {
    const qualityIssues: string[] = [];
    const recommendations: string[] = [];

    // Check for missing data
    const prsWithoutDescription = processedData.filter(p => !p.pullRequest.description).length;
    if (prsWithoutDescription > 0) {
      qualityIssues.push(`${prsWithoutDescription} PRs missing descriptions`);
    }

    const prsWithoutReviewers = processedData.filter(
      p => p.pullRequest.reviewers.length === 0
    ).length;
    if (prsWithoutReviewers > processedData.length * 0.2) {
      qualityIssues.push(`High number of PRs without reviewers (${prsWithoutReviewers})`);
    }

    // Check Git association quality
    const prsWithoutGitAssociations = processedData.filter(
      p => p.gitCommitAssociations.length === 0
    ).length;
    if (prsWithoutGitAssociations > 0) {
      qualityIssues.push(`${prsWithoutGitAssociations} PRs without Git commit associations`);
      recommendations.push('Review merge strategies and commit message patterns');
    }

    // Check temporal alignment
    const temporalMisalignments = this.detectTemporalMisalignments(processedData, gitData);
    if (temporalMisalignments > 0) {
      qualityIssues.push(`${temporalMisalignments} temporal misalignments detected`);
    }

    return {
      completeness: {
        prDataCompleteness: this.calculatePRDataCompleteness(processedData),
        reviewDataCompleteness: 0.8, // Placeholder
        commitAssociationRate:
          (processedData.length - prsWithoutGitAssociations) / processedData.length,
      },
      recommendations,
      limitations: {
        apiLimitations: [
          'Azure DevOps API data only - no build/deployment integration',
          'Review timing data not available',
        ],
        dataSourceLimitations: [
          'Git associations based on heuristics',
          'Team structure not integrated',
        ],
        calculationLimitations: [
          'Some metrics are placeholder implementations',
          'Cross-team analysis limited without org chart',
        ],
      },
      confidence: {
        timingMetrics: 'medium' as const,
        reviewMetrics: 'high' as const,
        collaborationMetrics: 'low' as const,
      },
    };
  }

  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private calculateReviewThoroughness(_processedData: ProcessedPRData[]): number {
    // Placeholder implementation
    return 0.7;
  }

  private calculateGiniCoefficient(values: number[]): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);

    if (sum === 0) return 0;

    let gini = 0;
    for (let i = 0; i < n; i++) {
      gini += (2 * (i + 1) - n - 1) * sorted[i];
    }

    return gini / (n * sum);
  }

  private calculatePRDataCompleteness(processedData: ProcessedPRData[]): number {
    if (processedData.length === 0) return 0;

    let completenessScore = 0;
    const fields = ['description', 'reviewers', 'closedDate'];

    for (const data of processedData) {
      const pr = data.pullRequest;
      let fieldScore = 0;

      if (pr.description && pr.description.length > 0) fieldScore++;
      if (pr.reviewers && pr.reviewers.length > 0) fieldScore++;
      if (pr.status === 'completed' && pr.closedDate) fieldScore++;

      completenessScore += fieldScore / fields.length;
    }

    return completenessScore / processedData.length;
  }

  private detectTemporalMisalignments(
    _processedData: ProcessedPRData[],
    _gitData: CommitData[]
  ): number {
    // Placeholder implementation
    return 0;
  }
}
