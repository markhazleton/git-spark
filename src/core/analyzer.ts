import {
  GitSparkOptions,
  AnalysisReport,
  CommitData,
  AuthorStats,
  FileStats,
  RepositoryStats,
  TimelineData,
  ReportMetadata,
  RiskAnalysis,
  GovernanceAnalysis,
  ReportSummary,
  ProgressCallback,
  TeamScore,
  TeamCollaborationMetrics,
  TeamConsistencyMetrics,
  TeamWorkLifeBalanceMetrics,
  TeamInsights,
  CurrentRepositoryState,
  AzureDevOpsAnalytics,
} from '../types/index.js';
import { DataCollector } from './collector.js';
import { GitIgnore } from '../utils/gitignore.js';
import { DailyTrendsAnalyzer } from './daily-trends.js';
import { AzureDevOpsCollector } from '../integrations/azure-devops/collector.js';
import { createLogger } from '../utils/logger.js';
import { validateCommitMessage, sanitizeEmail } from '../utils/validation.js';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('analyzer');

/**
 * Core Git repository analysis engine
 *
 * The GitAnalyzer is the primary engine for analyzing Git repositories and generating
 * comprehensive reports. It orchestrates data collection, statistical analysis, risk
 * assessment, and governance evaluation to provide enterprise-grade insights.
 *
 * Key capabilities:
 * - Commit history analysis with author attribution
 * - File change tracking and hot spot identification
 * - Risk assessment for code quality and maintenance
 * - Governance scoring based on best practices
 * - Timeline analysis for project velocity tracking
 * - Comprehensive reporting with multiple export formats
 *
 * @example
 * ```typescript
 * const analyzer = new GitAnalyzer('/path/to/repo', (progress) => {
 *   console.log(`Analysis ${progress.percentage}% complete`);
 * });
 *
 * const report = await analyzer.analyze({
 *   includeFileDetails: true,
 *   analyzeRisk: true,
 *   dateRange: { since: '2024-01-01', until: '2024-12-31' }
 * });
 *
 * console.log(`Found ${report.summary.totalCommits} commits by ${report.summary.totalAuthors} authors`);
 * ```
 */
export class GitAnalyzer {
  private collector: DataCollector;
  private progressCallback?: ProgressCallback | undefined;
  private azureDevOpsCollector?: AzureDevOpsCollector;

  /**
   * Check if a file should be excluded based on extension
   */
  private shouldExcludeFile(filePath: string, excludeExtensions: string[]): boolean {
    if (!excludeExtensions || excludeExtensions.length === 0) {
      return false;
    }
    const ext = path.extname(filePath).toLowerCase();
    if (!ext) {
      return false;
    }
    return excludeExtensions.some(excl => excl.toLowerCase() === ext);
  }

  /**
   * Filter excluded files from commits
   */
  private filterCommitFiles(commits: CommitData[], excludeExtensions: string[]): CommitData[] {
    if (!excludeExtensions || excludeExtensions.length === 0) {
      return commits;
    }

    return commits.map(commit => {
      const filteredFiles = commit.files.filter(
        file => !this.shouldExcludeFile(file.path, excludeExtensions)
      );

      // Recalculate insertions, deletions, and filesChanged based on filtered files
      const insertions = filteredFiles.reduce((sum, f) => sum + f.insertions, 0);
      const deletions = filteredFiles.reduce((sum, f) => sum + f.deletions, 0);

      return {
        ...commit,
        files: filteredFiles,
        insertions,
        deletions,
        filesChanged: filteredFiles.length,
      };
    });
  }

  /**
   * Create a new GitAnalyzer instance
   *
   * @param repoPath - Absolute path to the Git repository to analyze
   * @param progressCallback - Optional callback for tracking analysis progress
   * @throws {Error} When repository path is invalid or inaccessible
   *
   * @example
   * ```typescript
   * // Basic usage
   * const analyzer = new GitAnalyzer('/path/to/repo');
   *
   * // With progress tracking
   * const analyzer = new GitAnalyzer('/path/to/repo', (progress) => {
   *   console.log(`${progress.stage}: ${progress.percentage}%`);
   * });
   * ```
   */
  constructor(repoPath: string, progressCallback?: ProgressCallback | undefined) {
    this.collector = new DataCollector(repoPath, progressCallback);
    this.progressCallback = progressCallback;
  }

  /**
   * Perform comprehensive Git repository analysis
   *
   * Executes full analysis pipeline including:
   * - Commit data collection and author statistics
   * - File change analysis and hot spot identification
   * - Risk assessment for maintenance and quality concerns
   * - Governance evaluation based on industry best practices
   * - Timeline generation for velocity and trend analysis
   *
   * @param options - Analysis configuration options
   * @param options.includeFileDetails - Whether to include detailed file-level statistics
   * @param options.analyzeRisk - Whether to perform risk assessment analysis
   * @param options.dateRange - Optional date range filter for commits
   * @param options.maxCommits - Maximum number of commits to analyze (for performance)
   * @param options.excludePatterns - File patterns to exclude from analysis
   *
   * @returns Promise resolving to comprehensive analysis report
   * @throws {Error} When repository access fails or analysis encounters critical errors
   *
   * @example
   * ```typescript
   * // Full analysis with all features
   * const report = await analyzer.analyze({
   *   includeFileDetails: true,
   *   analyzeRisk: true,
   *   dateRange: { since: '2024-01-01' },
   *   excludePatterns: ['node_modules/**', '*.log']
   * });
   *
   * // Quick analysis for large repositories
   * const report = await analyzer.analyze({
   *   includeFileDetails: false,
   *   maxCommits: 1000
   * });
   * ```
   */
  async analyze(options: GitSparkOptions): Promise<AnalysisReport> {
    const startTime = Date.now();

    this.reportProgress('Starting analysis', 0, 100);
    logger.info('Starting Git analysis', { options });

    // Validate repository
    const isValid = await this.collector.validateRepository();
    if (!isValid) {
      throw new Error('Invalid Git repository');
    }

    // Collect commit data
    this.reportProgress('Collecting commits', 10, 100);
    let commits = await this.collector.collectCommits(options);

    // Filter excluded file extensions from all commits
    if (options.excludeExtensions && options.excludeExtensions.length > 0) {
      this.reportProgress('Filtering excluded file extensions', 20, 100);
      commits = this.filterCommitFiles(commits, options.excludeExtensions);
      logger.info('Filtered excluded extensions from commits', {
        excludeExtensions: options.excludeExtensions,
        totalCommits: commits.length,
      });
    }

    // Generate analysis components
    this.reportProgress('Analyzing repository stats', 30, 100);
    const repositoryStats = await this.analyzeRepository(commits, options);

    this.reportProgress('Analyzing authors', 40, 100);
    const authors = this.analyzeAuthors(commits, this.collector.getRepositoryPath());

    this.reportProgress('Analyzing files', 50, 100);
    const files = this.analyzeFiles(commits, this.collector.getRepositoryPath());

    this.reportProgress('Generating timeline', 60, 100);
    const timeline = this.generateTimeline(commits);

    this.reportProgress('Calculating risks', 70, 100);
    const risks = this.analyzeRisk(files, commits);

    this.reportProgress('Analyzing governance', 80, 100);
    const governance = this.analyzeGovernance(commits);

    this.reportProgress('Calculating team score', 85, 100);
    const teamScore = this.calculateTeamScore(commits, authors, files);

    // Calculate daily trends if there are commits
    this.reportProgress('Analyzing daily trends', 88, 100);
    const dailyTrends =
      commits.length > 0 ? await this.analyzeDailyTrends(commits, options) : undefined;

    this.reportProgress('Analyzing current repository state', 92, 100);
    const currentState = await this.analyzeCurrentRepositoryState(options.repoPath || '.', options);

    // Azure DevOps integration (if enabled)
    let azureDevOpsAnalytics: AzureDevOpsAnalytics | undefined;
    if (options.azureDevOps) {
      this.reportProgress('Collecting Azure DevOps data', 94, 100);
      azureDevOpsAnalytics = await this.analyzeAzureDevOps(options, commits);
    }

    this.reportProgress('Generating report', 95, 100);

    // Generate metadata
    const metadata = await this.generateMetadata(options, Date.now() - startTime);

    // Generate summary
    const summary = this.generateSummary(repositoryStats, authors, files, risks, governance);

    // Identify hotspots
    const hotspots = this.identifyHotspots(files);

    const report: AnalysisReport = {
      metadata,
      repository: repositoryStats,
      currentState,
      timeline,
      authors,
      files,
      hotspots,
      risks,
      governance,
      teamScore,
      summary,
      dailyTrends,
      azureDevOps: azureDevOpsAnalytics,
    };

    // Attach any warnings emitted during collection for downstream exporters (HTML etc.)
    try {
      const collectorWarnings = (this.collector as any).getWarnings?.() || [];
      if (collectorWarnings.length) {
        (report as any).warnings = collectorWarnings;
      }
    } catch {
      // non-fatal
    }

    this.reportProgress('Analysis complete', 100, 100);
    logger.info('Analysis completed successfully', {
      commits: commits.length,
      authors: authors.length,
      files: files.length,
      processingTime: Date.now() - startTime,
    });

    return report;
  }

  private async analyzeRepository(
    commits: CommitData[],
    _options: GitSparkOptions
  ): Promise<RepositoryStats> {
    const totalCommits = commits.length;
    if (totalCommits === 0) {
      const now = new Date();
      return {
        totalCommits: 0,
        totalAuthors: 0,
        totalFiles: 0,
        totalChurn: 0,
        firstCommit: now,
        lastCommit: now,
        activeDays: 0,
        avgCommitsPerDay: 0,
        languages: {},
        busFactor: 0,
        healthScore: 0,
        governanceScore: 0,
      };
    }
    const totalAuthors = new Set(commits.map(c => c.authorEmail)).size;
    const totalFiles = new Set(commits.flatMap(c => c.files.map(f => f.path))).size;
    const totalChurn = commits.reduce((sum, c) => sum + c.insertions + c.deletions, 0);

    const dates = commits.map(c => c.date).sort((a, b) => a.getTime() - b.getTime());
    const firstCommit = dates[0] || new Date();
    const lastCommit = dates[dates.length - 1] || new Date();

    const timeDiff = lastCommit.getTime() - firstCommit.getTime();
    const activeDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    const avgCommitsPerDay = activeDays > 0 ? totalCommits / activeDays : 0;

    // Get language statistics
    const languages = await this.collector.getLanguageStats();

    // Calculate bus factor (knowledge concentration)
    const busFactor = this.calculateBusFactor(commits);

    // Calculate repository activity index (objective metrics only)
    const healthScore = this.calculateHealthScore(commits, totalAuthors, activeDays);

    // Calculate governance score
    const governanceScore = this.calculateGovernanceScore(commits);

    return {
      totalCommits,
      totalAuthors,
      totalFiles,
      totalChurn,
      firstCommit,
      lastCommit,
      activeDays,
      avgCommitsPerDay,
      languages,
      busFactor,
      healthScore,
      governanceScore,
    };
  }

  private analyzeAuthors(commits: CommitData[], repoPath?: string): AuthorStats[] {
    const authorMap = new Map<string, AuthorStats>();
    const filesByAuthor = new Map<string, Set<string>>();
    const commitsByAuthor = new Map<string, CommitData[]>();

    // First pass: collect basic data
    for (const commit of commits) {
      const email = (this as any).options?.redactEmails
        ? sanitizeEmail(commit.authorEmail, true)
        : commit.authorEmail;

      if (!authorMap.has(email)) {
        authorMap.set(email, {
          name: commit.author,
          email,
          commits: 0,
          insertions: 0,
          deletions: 0,
          churn: 0,
          filesChanged: 0,
          firstCommit: commit.date,
          lastCommit: commit.date,
          activeDays: 0,
          avgCommitSize: 0,
          largestCommit: 0,
          workPatterns: {
            hourDistribution: new Array(24).fill(0),
            dayDistribution: new Array(7).fill(0),
            burstDays: 0,
            afterHours: 0,
            weekends: 0,
          },
          detailed: this.initializeDetailedMetrics(),
        });
        filesByAuthor.set(email, new Set());
        commitsByAuthor.set(email, []);
      }

      const author = authorMap.get(email)!;
      author.commits++;
      author.insertions += commit.insertions;
      author.deletions += commit.deletions;
      author.churn += commit.insertions + commit.deletions;
      author.filesChanged += commit.filesChanged;

      if (commit.date < author.firstCommit) {
        author.firstCommit = commit.date;
      }
      if (commit.date > author.lastCommit) {
        author.lastCommit = commit.date;
      }

      const commitSize = commit.insertions + commit.deletions;
      if (commitSize > author.largestCommit) {
        author.largestCommit = commitSize;
      }

      // Work pattern analysis
      const hour = commit.date.getHours();
      const day = commit.date.getDay();

      author.workPatterns.hourDistribution[hour]++;
      author.workPatterns.dayDistribution[day]++;

      if (hour < 8 || hour > 18) {
        author.workPatterns.afterHours++;
      }

      if (day === 0 || day === 6) {
        author.workPatterns.weekends++;
      }

      // Collect files for this author
      commit.files.forEach(file => filesByAuthor.get(email)!.add(file.path));
      commitsByAuthor.get(email)!.push(commit);
    }

    // Second pass: calculate detailed metrics
    for (const [email, author] of authorMap) {
      author.avgCommitSize = author.commits > 0 ? author.churn / author.commits : 0;

      const timeDiff = author.lastCommit.getTime() - author.firstCommit.getTime();
      author.activeDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) || 1;

      // Calculate detailed metrics
      const authorCommits = commitsByAuthor.get(email) || [];
      const authorFiles = filesByAuthor.get(email) || new Set();

      this.calculateDetailedAuthorMetrics(author, authorCommits, authorFiles, commits, repoPath);
    }

    // Third pass: calculate comparative metrics (requires all authors to be processed first)
    const allAuthors = Array.from(authorMap.values());
    for (const author of allAuthors) {
      this.calculateComparativeMetrics(author, allAuthors, commits);
    }

    return allAuthors.sort((a, b) => b.commits - a.commits);
  }

  private initializeDetailedMetrics(): any {
    return {
      contribution: {
        totalCommits: 0,
        commitFrequency: 0,
        activeDaysCount: 0,
        longestStreak: 0,
        commitSizeDistribution: {
          micro: 0,
          small: 0,
          medium: 0,
          large: 0,
          veryLarge: 0,
        },
        largestCommitDetails: {
          size: 0,
          hash: '',
          date: new Date(),
          message: '',
          filesCount: 0,
        },
        codeVolumeMetrics: {
          totalLinesChanged: 0,
          netChange: 0,
          churnTotal: 0,
          avgCommitSize: 0,
        },
        filesAndScope: {
          uniqueFiles: 0,
          avgFilesPerCommit: 0,
          fileDiversityScore: 0,
          mostModifiedFiles: [],
          directoryFocus: [],
          sourceVsPublishedRatio: {
            sourceCommits: 0,
            sourceLines: { insertions: 0, deletions: 0 },
            publishedCommits: 0,
            publishedLines: { insertions: 0, deletions: 0 },
          },
        },
      },
      collaboration: {
        coAuthorshipRate: 0,
        coAuthors: [],
        prIntegrationRate: 0,
        prBreakdown: {
          mergeCommits: 0,
          squashMerges: 0,
          directCommits: 0,
        },
        fileOwnership: {
          exclusiveFiles: 0,
          sharedFiles: 0,
          highTrafficFiles: 0,
          ownershipStyle: 'balanced' as const,
        },
        knowledgeSharingIndex: 0,
      },
      workPattern: {
        commitTiming: {
          mostActiveDay: { day: '', percentage: 0 },
          mostActiveTime: { timeRange: '', percentage: 0 },
          workPattern: 'weekday-focused' as const,
          afterHoursRate: 0,
        },
        temporalPatterns: {
          burstDetection: [],
          longestGap: { days: 0, startDate: new Date(), endDate: new Date() },
          averageGap: 0,
          consistencyScore: 0,
          velocityTrend: 'stable' as const,
        },
        workLifeBalance: {
          afterHoursPercentage: 0,
          weekendPercentage: 0,
          lateNightCommits: 0,
          vacationBreaks: [],
        },
      },
      quality: {
        codeQuality: {
          revertRate: 0,
          fixToFeatureRatio: 0,
          wipCommitFrequency: 0,
          refactoringActivity: {
            refactorCommits: 0,
            linesRefactored: 0,
            percentage: 0,
          },
          documentationContributions: {
            docCommits: 0,
            docLinesChanged: 0,
            percentage: 0,
          },
        },
        riskAndOwnership: {
          highRiskFileContributions: 0,
          ownershipDominance: 0,
          hotspotInvolvement: 0,
          legacyCodeInteraction: 0,
        },
      },
      comparative: {
        teamContext: {
          relativeContribution: 0,
          commitRank: 0,
          linesChangedRank: 0,
          filesRank: 0,
          messageQualityRank: 0,
          percentileRankings: {
            commits: 0,
            linesChanged: 0,
            filesTouched: 0,
            messageQuality: 0,
          },
        },
        specialization: {
          focusIndex: 0,
          specializationLevel: 'moderate' as const,
        },
        growth: {
          periodOverPeriodGrowth: {
            commits: 0,
            linesChanged: 0,
            filesTouched: 0,
            messageQuality: 0,
          },
          complexityTrajectory: {
            avgLinesPerCommitGrowth: 0,
            avgFilesPerCommitGrowth: 0,
          },
          technologyBreadth: {
            languages: [],
            diversityScore: 0,
            trend: 'stable' as const,
          },
        },
      },
      insights: {
        positivePatterns: [],
        growthAreas: [],
        neutralObservations: [],
        concerningPatterns: [],
        automatedInsights: {
          workLifeBalance: 'healthy' as const,
          collaboration: 'moderate' as const,
          codeQuality: 'good' as const,
          consistency: 'consistent' as const,
          expertise: 'mid-level' as const,
        },
        recommendations: [],
      },
    };
  }

  private calculateDetailedAuthorMetrics(
    author: AuthorStats,
    authorCommits: CommitData[],
    authorFiles: Set<string>,
    allCommits: CommitData[],
    repoPath?: string
  ): void {
    const metrics = author.detailed;

    // Contribution metrics
    this.calculateContributionMetrics(
      metrics.contribution,
      author,
      authorCommits,
      authorFiles,
      allCommits,
      repoPath
    );

    // Collaboration metrics
    this.calculateCollaborationMetrics(metrics.collaboration, author, authorCommits, allCommits);

    // Work pattern metrics
    this.calculateWorkPatternMetrics(metrics.workPattern, author, authorCommits);

    // Quality metrics
    this.calculateQualityMetrics(metrics.quality, author, authorCommits);

    // Generate insights
    this.generateAuthorInsights(metrics.insights, author, metrics);
  }

  private calculateContributionMetrics(
    metrics: any,
    author: AuthorStats,
    authorCommits: CommitData[],
    authorFiles: Set<string>,
    allCommits: CommitData[],
    repoPath?: string
  ): void {
    metrics.totalCommits = author.commits;
    metrics.commitFrequency = author.activeDays > 0 ? author.commits / author.activeDays : 0;
    metrics.activeDaysCount = author.activeDays;

    // Calculate longest streak
    metrics.longestStreak = this.calculateLongestStreak(authorCommits);

    // Commit size distribution
    const distribution = { micro: 0, small: 0, medium: 0, large: 0, veryLarge: 0 };
    let largestCommit = { size: 0, hash: '', date: new Date(), message: '', filesCount: 0 };

    for (const commit of authorCommits) {
      const size = commit.insertions + commit.deletions;

      if (size < 20) distribution.micro++;
      else if (size < 50) distribution.small++;
      else if (size < 200) distribution.medium++;
      else if (size < 500) distribution.large++;
      else distribution.veryLarge++;

      if (size > largestCommit.size) {
        largestCommit = {
          size,
          hash: commit.hash,
          date: commit.date,
          message: commit.subject,
          filesCount: commit.filesChanged,
        };
      }
    }

    metrics.commitSizeDistribution = distribution;
    metrics.largestCommitDetails = largestCommit;

    // Code volume metrics
    metrics.codeVolumeMetrics = {
      totalLinesChanged: author.churn,
      netChange: author.insertions - author.deletions,
      churnTotal: author.churn,
      avgCommitSize: author.avgCommitSize,
    };

    // Files and scope metrics
    const totalRepoFiles = new Set(allCommits.flatMap(c => c.files.map(f => f.path))).size;
    const fileCommitCounts = new Map<string, number>();
    const directoryCommitCounts = new Map<string, number>();

    for (const commit of authorCommits) {
      for (const file of commit.files) {
        fileCommitCounts.set(file.path, (fileCommitCounts.get(file.path) || 0) + 1);

        const pathParts = file.path.split('/');
        const dir =
          pathParts.length >= 2 ? `${pathParts[0]}/${pathParts[1]}` : pathParts[0] || 'root';
        directoryCommitCounts.set(dir, (directoryCommitCounts.get(dir) || 0) + 1);
      }
    }

    const mostModifiedFiles = Array.from(fileCommitCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([path, commits]) => ({
        path,
        commits,
        percentage: (commits / author.commits) * 100,
      }));

    const directoryFocus = Array.from(directoryCommitCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([directory, commits]) => ({
        directory,
        percentage: (commits / author.commits) * 100,
      }));

    // Source vs published classification (simple heuristic)
    let sourceCommits = 0,
      publishedCommits = 0;
    let sourceLines = { insertions: 0, deletions: 0 };
    let publishedLines = { insertions: 0, deletions: 0 };

    for (const commit of authorCommits) {
      const hasPublishedFiles = commit.files.some(
        f =>
          f.path.includes('dist/') ||
          f.path.includes('build/') ||
          f.path.includes('.min.') ||
          f.path.endsWith('.map') ||
          f.path.includes('node_modules/') ||
          f.path.includes('package-lock.json')
      );

      if (hasPublishedFiles) {
        publishedCommits++;
        publishedLines.insertions += commit.insertions;
        publishedLines.deletions += commit.deletions;
      } else {
        sourceCommits++;
        sourceLines.insertions += commit.insertions;
        sourceLines.deletions += commit.deletions;
      }
    }

    metrics.filesAndScope = {
      uniqueFiles: authorFiles.size,
      avgFilesPerCommit: author.commits > 0 ? author.filesChanged / author.commits : 0,
      fileDiversityScore: totalRepoFiles > 0 ? (authorFiles.size / totalRepoFiles) * 100 : 0,
      mostModifiedFiles,
      directoryFocus,
      sourceVsPublishedRatio: {
        sourceCommits,
        sourceLines,
        publishedCommits,
        publishedLines,
      },
      fileTypeBreakdown: this.calculateFileTypeBreakdown(authorCommits, repoPath),
    };
  }

  private calculateCollaborationMetrics(
    metrics: any,
    author: AuthorStats,
    authorCommits: CommitData[],
    allCommits: CommitData[]
  ): void {
    // Co-authorship analysis
    const coAuthoredCommits = authorCommits.filter(c => c.isCoAuthored);
    metrics.coAuthorshipRate =
      author.commits > 0 ? (coAuthoredCommits.length / author.commits) * 100 : 0;

    const coAuthorMap = new Map<string, number>();
    for (const commit of coAuthoredCommits) {
      for (const coAuthor of commit.coAuthors) {
        coAuthorMap.set(coAuthor, (coAuthorMap.get(coAuthor) || 0) + 1);
      }
    }

    metrics.coAuthors = Array.from(coAuthorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    // PR integration analysis (simple heuristic based on merge commits)
    const mergeCommits = authorCommits.filter(c => c.isMerge);
    metrics.prIntegrationRate =
      author.commits > 0 ? (mergeCommits.length / author.commits) * 100 : 0;

    metrics.prBreakdown = {
      mergeCommits: mergeCommits.length,
      squashMerges: 0, // Would need more sophisticated detection
      directCommits: author.commits - mergeCommits.length,
    };

    // File ownership analysis
    const fileOwnership = new Map<string, Set<string>>();

    for (const commit of allCommits) {
      const authorKey = commit.authorEmail;
      for (const file of commit.files) {
        if (!fileOwnership.has(file.path)) {
          fileOwnership.set(file.path, new Set());
        }
        fileOwnership.get(file.path)!.add(authorKey);
      }
    }

    let exclusiveFiles = 0;
    let sharedFiles = 0;
    let highTrafficFiles = 0;

    for (const [, authors] of fileOwnership) {
      if (authors.has(author.email)) {
        if (authors.size === 1) exclusiveFiles++;
        else if (authors.size >= 5) highTrafficFiles++;
        else sharedFiles++;
      }
    }

    const totalAuthorFiles = exclusiveFiles + sharedFiles + highTrafficFiles;
    let ownershipStyle: 'collaborative' | 'specialized' | 'balanced' = 'balanced';

    if (totalAuthorFiles > 0) {
      const exclusiveRatio = exclusiveFiles / totalAuthorFiles;
      if (exclusiveRatio > 0.7) ownershipStyle = 'specialized';
      else if (exclusiveRatio < 0.3) ownershipStyle = 'collaborative';
    }

    metrics.fileOwnership = {
      exclusiveFiles,
      sharedFiles,
      highTrafficFiles,
      ownershipStyle,
    };

    metrics.knowledgeSharingIndex =
      totalAuthorFiles > 0 ? ((sharedFiles + highTrafficFiles) / totalAuthorFiles) * 100 : 0;
  }

  private calculateWorkPatternMetrics(
    metrics: any,
    author: AuthorStats,
    authorCommits: CommitData[]
  ): void {
    // Commit timing analysis
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayDistribution = author.workPatterns.dayDistribution;
    const hourDistribution = author.workPatterns.hourDistribution;

    const maxDayIndex = dayDistribution.indexOf(Math.max(...dayDistribution));
    const mostActiveDay = {
      day: dayNames[maxDayIndex],
      percentage: author.commits > 0 ? (dayDistribution[maxDayIndex] / author.commits) * 100 : 0,
    };

    // Find most active time range
    let maxHourRange = { range: '', percentage: 0 };
    const timeRanges = [
      { name: 'Early Morning (6-9am)', start: 6, end: 9 },
      { name: 'Morning (9am-12pm)', start: 9, end: 12 },
      { name: 'Afternoon (12-3pm)', start: 12, end: 15 },
      { name: 'Late Afternoon (3-6pm)', start: 15, end: 18 },
      { name: 'Evening (6-9pm)', start: 18, end: 21 },
      { name: 'Night (9pm-12am)', start: 21, end: 24 },
    ];

    for (const range of timeRanges) {
      const commits = hourDistribution.slice(range.start, range.end).reduce((a, b) => a + b, 0);
      const percentage = author.commits > 0 ? (commits / author.commits) * 100 : 0;
      if (percentage > maxHourRange.percentage) {
        maxHourRange = { range: range.name, percentage };
      }
    }

    const weekdayCommits = dayDistribution.slice(1, 6).reduce((a, b) => a + b, 0);
    const weekendCommits = dayDistribution[0] + dayDistribution[6];
    const workPattern =
      weekendCommits > weekdayCommits * 0.3
        ? 'weekend-warrior'
        : weekdayCommits > author.commits * 0.8
          ? 'weekday-focused'
          : 'distributed';

    metrics.commitTiming = {
      mostActiveDay,
      mostActiveTime: { timeRange: maxHourRange.range, percentage: maxHourRange.percentage },
      workPattern,
      afterHoursRate:
        author.commits > 0 ? (author.workPatterns.afterHours / author.commits) * 100 : 0,
    };

    // Temporal patterns
    const sortedCommits = authorCommits.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Burst detection
    const burstDetection = this.detectCommitBursts(sortedCommits);

    // Gap analysis
    const gaps = this.calculateCommitGaps(sortedCommits);
    const longestGap =
      gaps.length > 0
        ? gaps.reduce((max, gap) => (gap.days > max.days ? gap : max))
        : { days: 0, startDate: new Date(), endDate: new Date() };

    const averageGap =
      gaps.length > 0 ? gaps.reduce((sum, gap) => sum + gap.days, 0) / gaps.length : 0;

    // Consistency score
    const consistencyScore = this.calculateConsistencyScore(authorCommits, author.activeDays);

    // Velocity trend (simplified)
    const velocityTrend = this.calculateVelocityTrend(sortedCommits);

    metrics.temporalPatterns = {
      burstDetection,
      longestGap,
      averageGap,
      consistencyScore,
      velocityTrend,
    };

    // Work-life balance
    const lateNightCommits = authorCommits.filter(c => {
      const hour = c.date.getHours();
      return hour >= 22 || hour <= 6;
    }).length;

    const vacationBreaks = this.detectVacationBreaks(sortedCommits);

    metrics.workLifeBalance = {
      afterHoursPercentage:
        author.commits > 0 ? (author.workPatterns.afterHours / author.commits) * 100 : 0,
      weekendPercentage: author.commits > 0 ? (weekendCommits / author.commits) * 100 : 0,
      lateNightCommits,
      vacationBreaks,
    };
  }

  private calculateQualityMetrics(
    metrics: any,
    author: AuthorStats,
    authorCommits: CommitData[]
  ): void {
    // Code quality indicators
    let featCommits = 0;
    let fixCommits = 0;
    let refactorCommits = 0;
    let docCommits = 0;
    let refactorLines = 0;
    let docLines = 0;
    let revertCount = 0;
    let wipCount = 0;

    for (const commit of authorCommits) {
      const msg = commit.message.toLowerCase();

      // Count commit types
      if (msg.startsWith('feat:')) featCommits++;
      else if (msg.startsWith('fix:')) fixCommits++;
      else if (msg.startsWith('refactor:')) {
        refactorCommits++;
        refactorLines += commit.insertions + commit.deletions;
      } else if (
        msg.startsWith('docs:') ||
        commit.files.some(f => f.path.includes('README') || f.path.endsWith('.md'))
      ) {
        docCommits++;
        docLines += commit.insertions + commit.deletions;
      }

      // Count other types
      if (msg.includes('revert')) revertCount++;
      if (msg.includes('wip') || msg.includes('work in progress')) wipCount++;
    }

    metrics.codeQuality = {
      revertRate: author.commits > 0 ? (revertCount / author.commits) * 100 : 0,
      fixToFeatureRatio: featCommits > 0 ? fixCommits / featCommits : 0,
      wipCommitFrequency: author.commits > 0 ? (wipCount / author.commits) * 100 : 0,
      refactoringActivity: {
        refactorCommits,
        linesRefactored: refactorLines,
        percentage: author.commits > 0 ? (refactorCommits / author.commits) * 100 : 0,
      },
      documentationContributions: {
        docCommits,
        docLinesChanged: docLines,
        percentage: author.commits > 0 ? (docCommits / author.commits) * 100 : 0,
      },
    };

    // Risk and ownership metrics - calculated from available data
    const authorFileCount = authorCommits.reduce((acc, commit) => {
      commit.files.forEach(file => acc.add(file.path));
      return acc;
    }, new Set()).size;

    metrics.riskAndOwnership = {
      highRiskFileContributions: 0, // Would require file risk scoring implementation
      ownershipDominance: authorFileCount > 0 ? author.commits / authorFileCount : 0,
      hotspotInvolvement: 0, // Would require hotspot analysis implementation
      legacyCodeInteraction: 0, // Would require file age analysis implementation
    };
  }

  private generateAuthorInsights(insights: any, _author: AuthorStats, _metrics: any): void {
    insights.positivePatterns = [];
    insights.growthAreas = [];
    insights.neutralObservations = [];
    insights.concerningPatterns = [];

    // Analyze patterns and generate insights
    // Removed all subjective insights - only report measurable data
    insights.positivePatterns = [];
    insights.growthAreas = [];

    // Calculate automated insights based on actual metrics
    const afterHoursRatio = _author.workPatterns.afterHours / _author.commits;
    const weekendRatio = _author.workPatterns.weekends / _author.commits;
    const avgCommitSize = _author.avgCommitSize;
    const activeDaysRatio =
      _author.activeDays /
      Math.max(
        1,
        Math.ceil(
          (_author.lastCommit.getTime() - _author.firstCommit.getTime()) / (1000 * 60 * 60 * 24)
        )
      );

    insights.automatedInsights = {
      workLifeBalance: afterHoursRatio > 0.3 || weekendRatio > 0.3 ? 'concerning' : 'healthy',
      collaboration: _author.commits < 5 ? 'isolated' : 'moderate', // Based on commit frequency
      codeQuality:
        avgCommitSize > 500 ? 'needs-improvement' : avgCommitSize > 200 ? 'good' : 'excellent',
      consistency:
        activeDaysRatio > 0.5
          ? 'very-consistent'
          : activeDaysRatio > 0.2
            ? 'consistent'
            : 'irregular',
      expertise: _author.commits > 100 ? 'senior' : _author.commits > 20 ? 'mid-level' : 'junior',
    };

    insights.recommendations = [];
  }

  // Helper methods for detailed calculations
  private calculateLongestStreak(commits: CommitData[]): number {
    if (commits.length === 0) return 0;

    const dates = commits.map(c => c.date.toDateString()).sort();
    const uniqueDates = [...new Set(dates)];

    let maxStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = new Date(uniqueDates[i - 1]);
      const currDate = new Date(uniqueDates[i]);
      const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

      if (diffDays <= 2) {
        // Allow up to 2-day gaps
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    return maxStreak;
  }

  private detectCommitBursts(sortedCommits: CommitData[]): Array<any> {
    const bursts = [];
    const timeWindow = 5 * 60 * 1000; // 5 minutes

    let burstStart = 0;

    for (let i = 1; i < sortedCommits.length; i++) {
      const timeDiff = sortedCommits[i].date.getTime() - sortedCommits[i - 1].date.getTime();

      if (timeDiff > timeWindow) {
        if (i - burstStart >= 4) {
          // 4+ commits in burst
          const burstCommits = i - burstStart;
          const startTime = sortedCommits[burstStart].date;
          const endTime = sortedCommits[i - 1].date;
          const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60); // minutes

          bursts.push({
            date: startTime,
            commitCount: burstCommits,
            timeSpan: `${duration.toFixed(1)} minutes`,
          });
        }
        burstStart = i;
      }
    }

    return bursts;
  }

  private calculateCommitGaps(sortedCommits: CommitData[]): Array<any> {
    const gaps = [];

    for (let i = 1; i < sortedCommits.length; i++) {
      const prevDate = sortedCommits[i - 1].date;
      const currDate = sortedCommits[i].date;
      const gapDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

      if (gapDays > 1) {
        gaps.push({
          days: Math.round(gapDays),
          startDate: prevDate,
          endDate: currDate,
        });
      }
    }

    return gaps;
  }

  private calculateConsistencyScore(commits: CommitData[], activeDays: number): number {
    if (commits.length === 0 || activeDays === 0) return 0;

    const daysWithCommits = new Set(commits.map(c => c.date.toDateString())).size;
    const consistencyRatio = daysWithCommits / activeDays;

    // Factor in regularity of commit frequency
    const expectedCommitsPerActiveDay = commits.length / daysWithCommits;
    const frequencyConsistency = Math.min(expectedCommitsPerActiveDay / 5, 1); // normalize to max 5 commits/day

    return Math.min((consistencyRatio * 0.6 + frequencyConsistency * 0.4) * 100, 100);
  }

  private calculateVelocityTrend(
    sortedCommits: CommitData[]
  ): 'increasing' | 'stable' | 'decreasing' {
    if (sortedCommits.length < 10) return 'stable';

    const midpoint = Math.floor(sortedCommits.length / 2);
    const firstHalf = sortedCommits.slice(0, midpoint);
    const secondHalf = sortedCommits.slice(midpoint);

    const firstHalfDays =
      (firstHalf[firstHalf.length - 1].date.getTime() - firstHalf[0].date.getTime()) /
      (1000 * 60 * 60 * 24);
    const secondHalfDays =
      (secondHalf[secondHalf.length - 1].date.getTime() - secondHalf[0].date.getTime()) /
      (1000 * 60 * 60 * 24);

    const firstHalfRate = firstHalfDays > 0 ? firstHalf.length / firstHalfDays : 0;
    const secondHalfRate = secondHalfDays > 0 ? secondHalf.length / secondHalfDays : 0;

    const change = (secondHalfRate - firstHalfRate) / Math.max(firstHalfRate, 0.1);

    if (change > 0.2) return 'increasing';
    if (change < -0.2) return 'decreasing';
    return 'stable';
  }

  private detectVacationBreaks(sortedCommits: CommitData[]): Array<any> {
    const gaps = this.calculateCommitGaps(sortedCommits);
    return gaps
      .filter(gap => gap.days >= 7)
      .map(gap => ({
        startDate: gap.startDate,
        endDate: gap.endDate,
        days: gap.days,
      }));
  }

  private calculateComparativeMetrics(
    author: any,
    allAuthors: any[],
    allCommits: CommitData[]
  ): void {
    const metrics = author.detailed.comparative;

    // Team context calculations
    const totalCommits = allCommits.length;
    const totalFiles = new Set(allCommits.flatMap(c => c.files.map(f => f.path))).size;

    metrics.teamContext.relativeContribution =
      totalCommits > 0 ? (author.commits / totalCommits) * 100 : 0;

    // Rankings
    const sortedByCommits = allAuthors.sort((a, b) => b.commits - a.commits);
    const sortedByLines = allAuthors.sort((a, b) => b.churn - a.churn);
    const sortedByFiles = allAuthors.sort((a, b) => b.filesChanged - a.filesChanged);

    metrics.teamContext.commitRank = sortedByCommits.findIndex(a => a.email === author.email) + 1;
    metrics.teamContext.linesChangedRank =
      sortedByLines.findIndex(a => a.email === author.email) + 1;
    metrics.teamContext.filesRank = sortedByFiles.findIndex(a => a.email === author.email) + 1;

    // Percentile rankings
    const totalAuthors = allAuthors.length;
    metrics.teamContext.percentileRankings = {
      commits: ((totalAuthors - metrics.teamContext.commitRank + 1) / totalAuthors) * 100,
      linesChanged:
        ((totalAuthors - metrics.teamContext.linesChangedRank + 1) / totalAuthors) * 100,
      filesTouched: ((totalAuthors - metrics.teamContext.filesRank + 1) / totalAuthors) * 100,
      messageQuality:
        ((totalAuthors - metrics.teamContext.messageQualityRank + 1) / totalAuthors) * 100,
    };

    // Specialization analysis
    const authorFiles = author.detailed.contribution.filesAndScope?.uniqueFiles || 0;
    metrics.specialization.focusIndex = totalFiles > 0 ? 1 - authorFiles / totalFiles : 0; // Higher means more focused

    if (metrics.specialization.focusIndex > 0.8) {
      metrics.specialization.specializationLevel = 'highly-specialized';
    } else if (metrics.specialization.focusIndex < 0.4) {
      metrics.specialization.specializationLevel = 'generalist';
    } else {
      metrics.specialization.specializationLevel = 'moderate';
    }

    // Growth metrics (simplified - would need historical data for real implementation)
    metrics.growth = {
      periodOverPeriodGrowth: {
        commits: 0, // Would compare with previous period
        linesChanged: 0,
        filesTouched: 0,
        messageQuality: 0,
      },
      complexityTrajectory: {
        avgLinesPerCommitGrowth: 0,
        avgFilesPerCommitGrowth: 0,
      },
      technologyBreadth: {
        languages: [],
        diversityScore: 0,
        trend: 'stable' as const,
      },
    };
  }

  private analyzeFiles(commits: CommitData[], repoPath?: string): FileStats[] {
    const fileMap = new Map<string, FileStats>();

    // Load .gitignore patterns if repoPath is provided
    const gitIgnore = repoPath ? GitIgnore.fromRepository(repoPath) : null;

    // Note: excludeExtensions filtering already applied at commit level
    // This only handles .gitignore and legacy directory patterns

    const shouldIgnoreFile = (filePath: string): boolean => {
      const normalizedPath = filePath.replace(/\\/g, '/');

      // First check .gitignore patterns if available
      if (gitIgnore && gitIgnore.isIgnored(normalizedPath)) {
        return true;
      }

      // Legacy fallback patterns for basic system directories
      return (
        normalizedPath.includes('/.git/') ||
        normalizedPath.includes('/node_modules/') ||
        normalizedPath.includes('/.vscode/') ||
        normalizedPath.includes('/dist/') ||
        normalizedPath.includes('/build/') ||
        normalizedPath.includes('/coverage/') ||
        normalizedPath.includes('/.nyc_output/') ||
        normalizedPath.includes('/tmp/') ||
        normalizedPath.includes('/temp/') ||
        normalizedPath.startsWith('.git') ||
        normalizedPath.includes('/.next/') ||
        normalizedPath.includes('/__pycache__/')
      );
    };

    for (const commit of commits) {
      for (const file of commit.files) {
        // Skip files that should be ignored
        if (shouldIgnoreFile(file.path)) {
          continue;
        }

        if (!fileMap.has(file.path)) {
          const fileStats: FileStats = {
            path: file.path,
            commits: 0,
            authors: [],
            churn: 0,
            insertions: 0,
            deletions: 0,
            firstChange: commit.date,
            lastChange: commit.date,
            riskScore: 0,
            hotspotScore: 0,
            ownership: {},
          };

          const language = this.detectLanguage(file.path);
          if (language) {
            fileStats.language = language;
          }

          fileMap.set(file.path, fileStats);
        }

        const fileStats = fileMap.get(file.path)!;
        fileStats.commits++;
        fileStats.churn += file.insertions + file.deletions;
        fileStats.insertions += file.insertions;
        fileStats.deletions += file.deletions;

        if (commit.date < fileStats.firstChange) {
          fileStats.firstChange = commit.date;
        }
        if (commit.date > fileStats.lastChange) {
          fileStats.lastChange = commit.date;
        }

        // Track authors
        const authorDisplay = (this as any).options?.redactEmails
          ? sanitizeEmail(commit.authorEmail, true)
          : commit.author;
        if (!fileStats.authors.includes(authorDisplay)) {
          fileStats.authors.push(authorDisplay);
        }

        // Track ownership
        const ownershipKey = authorDisplay;
        fileStats.ownership[ownershipKey] = (fileStats.ownership[ownershipKey] || 0) + 1;
      }
    }

    // Calculate risk and hotspot scores
    const files = Array.from(fileMap.values());
    for (const file of files) {
      file.riskScore = this.calculateFileRiskScore(file);
      file.hotspotScore = this.calculateHotspotScore(file);
    }

    return files.sort((a, b) => b.churn - a.churn);
  }

  private generateTimeline(commits: CommitData[]): TimelineData[] {
    const timelineMap = new Map<string, TimelineData>();

    for (const commit of commits) {
      const dateKey = commit.date.toISOString().split('T')[0];

      if (!timelineMap.has(dateKey)) {
        timelineMap.set(dateKey, {
          date: new Date(dateKey),
          commits: 0,
          authors: 0,
          churn: 0,
          files: 0,
        });
      }

      const day = timelineMap.get(dateKey)!;
      day.commits++;
      day.churn += commit.insertions + commit.deletions;
      day.files += commit.filesChanged;
    }

    // Calculate unique authors per day
    const authorsByDay = new Map<string, Set<string>>();
    for (const commit of commits) {
      const dateKey = commit.date.toISOString().split('T')[0];
      if (!authorsByDay.has(dateKey)) {
        authorsByDay.set(dateKey, new Set());
      }
      authorsByDay.get(dateKey)!.add(commit.authorEmail);
    }

    for (const [dateKey, authors] of authorsByDay) {
      const day = timelineMap.get(dateKey);
      if (day) {
        day.authors = authors.size;
      }
    }

    return Array.from(timelineMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private analyzeRisk(files: FileStats[], commits: CommitData[]): RiskAnalysis {
    const highRiskFiles = files
      .filter(f => f.riskScore > 0.7)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 20);

    const riskFactors = {
      highChurnFiles: files.filter(f => f.churn > 1000).length,
      manyAuthorFiles: files.filter(f => f.authors.length > 5).length,
      largeCommits: commits.filter(c => c.insertions + c.deletions > 500).length,
      recentChanges: files.filter(f => {
        const daysSinceChange = (Date.now() - f.lastChange.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceChange < 7;
      }).length,
    };

    const recommendations = this.generateRiskRecommendations(highRiskFiles, riskFactors);
    const overallRisk = this.calculateOverallRisk(highRiskFiles, riskFactors);

    return {
      highRiskFiles,
      riskFactors,
      recommendations,
      overallRisk,
    };
  }

  private analyzeGovernance(commits: CommitData[]): GovernanceAnalysis {
    let conventionalCommits = 0;
    let traceableCommits = 0;
    let totalMessageLength = 0;
    let wipCommits = 0;
    let revertCommits = 0;
    let shortMessages = 0;

    for (const commit of commits) {
      const analysis = validateCommitMessage(commit.message);

      if (analysis.isConventional) conventionalCommits++;
      if (analysis.hasIssueReference) traceableCommits++;
      if (analysis.isWip) wipCommits++;
      if (analysis.isRevert) revertCommits++;
      if (analysis.length < 10) shortMessages++;

      totalMessageLength += analysis.length;
    }

    const avgMessageLength = commits.length > 0 ? totalMessageLength / commits.length : 0;
    const traceabilityScore = commits.length > 0 ? traceableCommits / commits.length : 0;

    const score = this.calculateGovernanceScore(commits);
    const recommendations = this.generateGovernanceRecommendations({
      conventionalCommits,
      traceabilityScore,
      avgMessageLength,
      wipCommits,
      revertCommits,
      shortMessages,
      totalCommits: commits.length,
    });

    return {
      conventionalCommits,
      traceabilityScore,
      avgMessageLength,
      wipCommits,
      revertCommits,
      shortMessages,
      score,
      recommendations,
    };
  }

  private generateSummary(
    repository: RepositoryStats,
    authors: AuthorStats[],
    files: FileStats[],
    risks: RiskAnalysis,
    governance: GovernanceAnalysis
  ): ReportSummary {
    const healthRating = this.calculateHealthRating(repository.healthScore);

    const keyMetrics = {
      'Total Commits': repository.totalCommits,
      'Active Contributors': repository.totalAuthors,
      'Files Changed': repository.totalFiles,
      'Code Churn': repository.totalChurn,
      'Activity Index': Math.round(repository.healthScore * 100),
      'Governance Score': Math.round(governance.score * 100),
      'Bus Factor': Math.round((repository.busFactor / repository.totalAuthors) * 100),
    };

    const insights = this.generateInsights(repository, authors, files, risks, governance);
    const actionItems = this.generateActionItems(risks, governance);

    return {
      healthRating,
      keyMetrics,
      insights,
      actionItems,
    };
  }

  private identifyHotspots(files: FileStats[]): FileStats[] {
    return files
      .filter(f => f.hotspotScore > 0.6)
      .sort((a, b) => b.hotspotScore - a.hotspotScore)
      .slice(0, 15);
  }

  // Utility calculation methods
  private calculateBusFactor(commits: CommitData[]): number {
    const authorContributions = new Map<string, number>();

    for (const commit of commits) {
      const churn = commit.insertions + commit.deletions;
      authorContributions.set(
        commit.authorEmail,
        (authorContributions.get(commit.authorEmail) || 0) + churn
      );
    }

    const totalChurn = Array.from(authorContributions.values()).reduce((a, b) => a + b, 0);
    const sortedContributions = Array.from(authorContributions.values()).sort((a, b) => b - a);

    let cumulativeChurn = 0;
    let busFactor = 0;

    for (const contribution of sortedContributions) {
      cumulativeChurn += contribution;
      busFactor++;

      if (cumulativeChurn >= totalChurn * 0.5) {
        break;
      }
    }

    return busFactor;
  }

  private calculateHealthScore(
    commits: CommitData[],
    authorCount: number,
    activeDays: number
  ): number {
    // Repository Activity Index - objective metrics only, no subjective "health" judgments
    // This is a composite index of measurable repository activity patterns

    if (commits.length === 0 || activeDays === 0) return 0;

    // Component 1: Commit frequency (commits per day) - normalized to 0-1 scale
    const commitFrequency = commits.length / activeDays;
    const normalizedFrequency = Math.min(commitFrequency / 5, 1); // Cap at 5 commits/day for normalization

    // Component 2: Author participation ratio - normalized to 0-1 scale
    const authorParticipation = Math.min(authorCount / Math.max(commits.length / 20, 1), 1); // 1 author per 20 commits baseline

    // Component 3: Change volume consistency - coefficient of variation inverse
    const commitSizes = commits.map(c => c.insertions + c.deletions);
    const avgSize = commitSizes.reduce((sum, size) => sum + size, 0) / commitSizes.length;
    const variance =
      commitSizes.reduce((sum, size) => sum + Math.pow(size - avgSize, 2), 0) / commitSizes.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = avgSize > 0 ? stdDev / avgSize : 0;
    const consistencyIndex = Math.max(0, Math.min(1, 1 - coefficientOfVariation / 2)); // Normalize CV to 0-1

    // Equal-weighted composite of three measurable dimensions
    return (normalizedFrequency + authorParticipation + consistencyIndex) / 3;
  }

  private calculateGovernanceScore(commits: CommitData[]): number {
    if (commits.length === 0) return 0;

    let score = 0;
    let total = 0;

    for (const commit of commits) {
      const analysis = validateCommitMessage(commit.message);

      if (analysis.isConventional) score += 0.4;
      if (analysis.hasIssueReference) score += 0.25;
      if (analysis.length >= 10 && analysis.length <= 72) score += 0.15;
      if (!analysis.isWip) score += 0.1;
      if (!analysis.isRevert) score += 0.05;

      total++;
    }

    return total > 0 ? score / total : 0;
  }

  private calculateFileRiskScore(file: FileStats): number {
    // Normalized risk factors (0-1)
    const churnFactor = Math.min(file.churn / 5000, 1);
    const authorFactor = Math.min(file.authors.length / 10, 1);
    const commitFactor = Math.min(file.commits / 100, 1);

    const daysSinceChange = (Date.now() - file.lastChange.getTime()) / (1000 * 60 * 60 * 24);
    const recencyFactor = daysSinceChange < 30 ? 1 : Math.max(1 - daysSinceChange / 365, 0);

    return churnFactor * 0.35 + authorFactor * 0.25 + commitFactor * 0.25 + recencyFactor * 0.15;
  }

  private calculateHotspotScore(file: FileStats): number {
    const normalizedCommits = Math.min(file.commits / 50, 1);
    const normalizedAuthors = Math.min(file.authors.length / 8, 1);
    const normalizedChurn = Math.min(file.churn / 3000, 1);

    return normalizedCommits * 0.4 + normalizedAuthors * 0.35 + normalizedChurn * 0.25;
  }

  private calculateFileTypeBreakdown(commits: any[], repoPath?: string): any {
    const fileTypeStats = new Map<string, { commits: number; files: Set<string>; churn: number }>();
    const categoryStats = {
      sourceCode: { files: new Set<string>(), commits: 0, churn: 0 },
      documentation: { files: new Set<string>(), commits: 0, churn: 0 },
      configuration: { files: new Set<string>(), commits: 0, churn: 0 },
      tests: { files: new Set<string>(), commits: 0, churn: 0 },
      other: { files: new Set<string>(), commits: 0, churn: 0 },
    };

    // Load .gitignore patterns if repoPath is provided
    const gitIgnore = repoPath ? GitIgnore.fromRepository(repoPath) : null;

    const shouldIgnoreFile = (filePath: string): boolean => {
      const normalizedPath = filePath.replace(/\\/g, '/');

      // First check .gitignore patterns if available
      if (gitIgnore && gitIgnore.isIgnored(normalizedPath)) {
        return true;
      }

      // Legacy fallback patterns for basic system directories
      return (
        normalizedPath.includes('/.git/') ||
        normalizedPath.includes('/node_modules/') ||
        normalizedPath.includes('/.vscode/') ||
        normalizedPath.includes('/dist/') ||
        normalizedPath.includes('/build/') ||
        normalizedPath.includes('/coverage/') ||
        normalizedPath.includes('/.nyc_output/') ||
        normalizedPath.includes('/tmp/') ||
        normalizedPath.includes('/temp/') ||
        normalizedPath.startsWith('.git') ||
        normalizedPath.includes('/.next/') ||
        normalizedPath.includes('/__pycache__/')
      );
    };

    // Aggregate stats by file extension
    for (const commit of commits) {
      for (const file of commit.files) {
        // Skip files that should be ignored
        if (shouldIgnoreFile(file.path)) {
          continue;
        }

        const ext = this.getFileExtension(file.path);
        const churn = file.insertions + file.deletions;

        // Track by extension
        if (!fileTypeStats.has(ext)) {
          fileTypeStats.set(ext, { commits: 0, files: new Set(), churn: 0 });
        }
        const stats = fileTypeStats.get(ext)!;
        stats.commits++;
        stats.files.add(file.path);
        stats.churn += churn;

        // Categorize file
        const category = this.categorizeFile(file.path, ext);
        categoryStats[category].files.add(file.path);
        categoryStats[category].commits++;
        categoryStats[category].churn += churn;
      }
    }

    // Calculate totals for percentages
    const totalFiles = new Set(commits.flatMap(c => c.files.map((f: any) => f.path))).size;
    const totalCommits = commits.length;
    const totalChurn = commits.reduce(
      (sum, c) =>
        sum + c.files.reduce((fSum: number, f: any) => fSum + f.insertions + f.deletions, 0),
      0
    );

    // Convert to final format with percentages based on file count, not commit count
    const byExtension = Array.from(fileTypeStats.entries())
      .map(([ext, stats]) => ({
        extension: ext,
        language: this.detectLanguage(`file.${ext}`) || 'Unknown',
        commits: stats.commits,
        files: stats.files.size,
        churn: stats.churn,
        percentage: totalFiles > 0 ? (stats.files.size / totalFiles) * 100 : 0,
      }))
      .sort((a, b) => b.files - a.files);

    const categories = {
      sourceCode: {
        files: categoryStats.sourceCode.files.size,
        commits: categoryStats.sourceCode.commits,
        churn: categoryStats.sourceCode.churn,
        percentage: totalFiles > 0 ? (categoryStats.sourceCode.files.size / totalFiles) * 100 : 0,
      },
      documentation: {
        files: categoryStats.documentation.files.size,
        commits: categoryStats.documentation.commits,
        churn: categoryStats.documentation.churn,
        percentage:
          totalFiles > 0 ? (categoryStats.documentation.files.size / totalFiles) * 100 : 0,
      },
      configuration: {
        files: categoryStats.configuration.files.size,
        commits: categoryStats.configuration.commits,
        churn: categoryStats.configuration.churn,
        percentage:
          totalFiles > 0 ? (categoryStats.configuration.files.size / totalFiles) * 100 : 0,
      },
      tests: {
        files: categoryStats.tests.files.size,
        commits: categoryStats.tests.commits,
        churn: categoryStats.tests.churn,
        percentage: totalFiles > 0 ? (categoryStats.tests.files.size / totalFiles) * 100 : 0,
      },
      other: {
        files: categoryStats.other.files.size,
        commits: categoryStats.other.commits,
        churn: categoryStats.other.churn,
        percentage: totalFiles > 0 ? (categoryStats.other.files.size / totalFiles) * 100 : 0,
      },
    };

    return {
      byExtension,
      categories,
      totals: {
        files: totalFiles,
        commits: totalCommits,
        churn: totalChurn,
      },
    };
  }

  private getFileExtension(filePath: string): string {
    const parts = filePath.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'no-extension';
  }

  private categorizeFile(
    filePath: string,
    extension: string
  ): 'sourceCode' | 'documentation' | 'configuration' | 'tests' | 'other' {
    const path = filePath.toLowerCase();

    // Test files
    if (
      path.includes('test') ||
      path.includes('spec') ||
      path.includes('__tests__') ||
      extension === 'test.js' ||
      extension === 'spec.ts'
    ) {
      return 'tests';
    }

    // Documentation
    if (['md', 'txt', 'rst', 'adoc', 'asciidoc'].includes(extension)) {
      return 'documentation';
    }

    // Configuration
    if (
      ['json', 'yaml', 'yml', 'toml', 'ini', 'conf', 'config', 'env', 'properties'].includes(
        extension
      ) ||
      path.includes('config') ||
      path.includes('.env') ||
      path.includes('package') ||
      path.includes('tsconfig') ||
      path.includes('webpack') ||
      path.includes('babel') ||
      path.includes('eslint') ||
      path.includes('prettier')
    ) {
      return 'configuration';
    }

    // Source code
    if (
      [
        'js',
        'ts',
        'tsx',
        'jsx',
        'py',
        'java',
        'cs',
        'php',
        'rb',
        'go',
        'rs',
        'cpp',
        'c',
        'swift',
        'kt',
        'scala',
        'css',
        'scss',
        'sass',
        'less',
      ].includes(extension)
    ) {
      return 'sourceCode';
    }

    return 'other';
  }

  private detectLanguage(filePath: string): string | undefined {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
      js: 'JavaScript',
      ts: 'TypeScript',
      py: 'Python',
      java: 'Java',
      cs: 'C#',
      cpp: 'C++',
      c: 'C',
      php: 'PHP',
      rb: 'Ruby',
      go: 'Go',
      rs: 'Rust',
    };

    return ext ? languageMap[ext] : undefined;
  }

  private calculateOverallRisk(
    highRiskFiles: FileStats[],
    riskFactors: any
  ): 'low' | 'medium' | 'high' {
    const riskScore =
      highRiskFiles.length +
      riskFactors.highChurnFiles * 0.5 +
      riskFactors.manyAuthorFiles * 0.3 +
      riskFactors.largeCommits * 0.2;

    if (riskScore > 15) return 'high';
    if (riskScore > 5) return 'medium';
    return 'low';
  }

  private calculateHealthRating(_score: number): 'fair' {
    // Return objective score category based on percentage bands
    // All scores categorized as 'fair' to avoid subjective value judgments
    return 'fair';
  }

  private generateRiskRecommendations(_highRiskFiles: FileStats[], _riskFactors: any): string[] {
    // Removed all recommendations - only report measurable data
    return [];
  }

  private generateGovernanceRecommendations(_analysis: any): string[] {
    // Removed all recommendations - only report measurable data
    return [];
  }

  private generateInsights(
    _repository: RepositoryStats,
    _authors: AuthorStats[],
    _files: FileStats[],
    _risks: RiskAnalysis,
    _governance: GovernanceAnalysis
  ): string[] {
    // Removed all subjective insights - only report measurable data
    return [];
  }

  private generateActionItems(_risks: RiskAnalysis, _governance: GovernanceAnalysis): string[] {
    // Removed all action items - only report measurable data
    return [];
  }

  private async generateMetadata(
    options: GitSparkOptions,
    processingTime: number
  ): Promise<ReportMetadata> {
    const branch = await this.collector.getCurrentBranch();

    // Use the version fallback utility for more robust version detection
    const { getVersion } = await import('../version-fallback.js');
    const version = await getVersion();

    let gitVersion = '';
    try {
      gitVersion = await (this.collector as any).git.getVersion();
    } catch {
      // Ignore git version retrieval errors (non-fatal metadata)
    }

    let commit = '';
    try {
      const { spawnSync } = await import('child_process');
      const r = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: options.repoPath || process.cwd() });
      if (r.status === 0) commit = String(r.stdout).trim();
    } catch {
      // Ignore inability to resolve current commit hash
    }

    return {
      generatedAt: new Date(),
      version,
      repoPath: options.repoPath || process.cwd(),
      analysisOptions: options,
      processingTime,
      gitVersion,
      commit,
      branch,
      cliArguments: process.argv.slice(2), // Capture CLI arguments (excluding node and script path)
      warnings: [],
    };
  }

  private reportProgress(phase: string, current: number, total: number): void {
    if (this.progressCallback) {
      this.progressCallback(phase, current, total);
    }
  }

  /**
   * Calculate comprehensive team effectiveness score
   *
   * Evaluates team performance across four key dimensions:
   * - Collaboration (30%): Code review, knowledge sharing, cross-pollination
   * - Consistency (25%): Velocity consistency, bus factor, active contributors
   * - Quality (25%): Governance, refactoring, documentation, testing
   * - Work-Life Balance (20%): Work patterns, overtime, sustainability
   *
   * @param commits All commits in the analysis
   * @param authors Author statistics
   * @param files File statistics
   * @returns Comprehensive team score with detailed metrics
   */
  private calculateTeamScore(
    commits: CommitData[],
    authors: AuthorStats[],
    files: FileStats[]
  ): TeamScore {
    const collaboration = this.calculateTeamCollaboration(commits, authors, files);
    const consistency = this.calculateTeamConsistency(commits, authors);
    const workLifeBalance = this.calculateTeamWorkLifeBalance(commits, authors);

    // Calculate overall score with rebalanced weighted components
    // Collaboration (40%), Consistency (45%), Work-Life Balance (15%)
    const overall = Math.round(
      collaboration.score * 0.4 + consistency.score * 0.45 + workLifeBalance.score * 0.15
    );

    const insights = this.generateTeamInsights(
      overall,
      collaboration,
      consistency,
      workLifeBalance
    );
    const recommendations = this.generateTeamRecommendations(
      collaboration,
      consistency,
      workLifeBalance
    );

    return {
      overall,
      collaboration,
      consistency,
      workLifeBalance,
      insights,
      recommendations,
    };
  }

  /**
   * Calculate team organization metrics based on file specialization and ownership patterns
   * Higher scores indicate better team organization with clear file ownership and specialization
   */
  private calculateTeamCollaboration(
    _commits: CommitData[],
    authors: AuthorStats[],
    files: FileStats[]
  ): TeamCollaborationMetrics {
    if (files.length === 0 || authors.length === 0) {
      return {
        score: 0,
        crossTeamInteraction: 0,
        knowledgeDistribution: 0,
        fileOwnershipDistribution: {
          exclusive: 0,
          shared: 0,
          collaborative: 0,
        },
        limitations: {
          dataSource: 'git-file-authorship-only' as const,
          knownLimitations: ['No files or authors to analyze'],
        },
      };
    }

    // File ownership distribution
    const exclusiveFiles = files.filter(f => f.authors.length === 1).length;
    const sharedFiles = files.filter(f => f.authors.length >= 2 && f.authors.length <= 3).length;
    const collaborativeFiles = files.filter(f => f.authors.length > 3).length;

    const fileOwnershipDistribution = {
      exclusive: files.length > 0 ? (exclusiveFiles / files.length) * 100 : 0,
      shared: files.length > 0 ? (sharedFiles / files.length) * 100 : 0,
      collaborative: files.length > 0 ? (collaborativeFiles / files.length) * 100 : 0,
    };

    // Calculate specialization score - measures how specialized files are when grouped by developer
    // Score: 0 = every author has touched every file, 100 = each file touched by only one author
    let specializationScore = 0;
    if (files.length > 0) {
      // Count files by number of authors
      const singleAuthorFiles = files.filter(f => f.authors.length === 1).length;

      // Perfect specialization = all files have exactly one author
      specializationScore = (singleAuthorFiles / files.length) * 100;
    }

    // Ownership clarity - higher scores for more exclusive file ownership
    const ownershipClarityScore = fileOwnershipDistribution.exclusive;

    // File overlap penalty - penalize files with many authors as it suggests unclear ownership
    const multiAuthorFiles = files.filter(f => f.authors.length > 1).length;
    const overlapPenalty = files.length > 0 ? (multiAuthorFiles / files.length) * 100 : 0;
    const organizationScore = Math.max(0, 100 - overlapPenalty * 0.5); // Soft penalty

    // Calculate final organization score - emphasizing specialization and clear ownership
    const organizationFactors = [
      specializationScore * 0.5, // 50% weight on developer specialization
      ownershipClarityScore * 0.3, // 30% weight on exclusive file ownership
      organizationScore * 0.2, // 20% weight on low file overlap
    ];

    const score = organizationFactors.reduce((sum, factor) => sum + factor, 0);

    // For backward compatibility, we keep the old field names but with inverted meaning
    const crossTeamInteraction = 100 - overlapPenalty; // Now measures lack of overlap (good thing)
    const knowledgeDistribution = specializationScore; // Now measures specialization

    return {
      score: Math.round(Math.min(100, score)),
      crossTeamInteraction,
      knowledgeDistribution,
      fileOwnershipDistribution,
      limitations: {
        dataSource: 'git-file-authorship-only' as const,
        knownLimitations: [
          'Based only on Git commit authorship, not actual collaboration quality',
          'High specialization may indicate knowledge silos if taken to extreme',
          'Cannot measure code reviews, pair programming, or knowledge transfer',
          'File ownership patterns may not reflect actual domain expertise',
          'Does not account for intentional collaboration or mentoring',
        ],
      },
    };
  }

  /**
   * Calculate team consistency and velocity metrics
   */
  private calculateTeamConsistency(
    commits: CommitData[],
    authors: AuthorStats[]
  ): TeamConsistencyMetrics {
    // Bus factor percentage - what percentage of authors account for 80% of commits
    const busFactorPercentage = this.calculateBusFactorPercentage(commits, authors);

    // Active contributor ratio (contributors with commits in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCommits = commits.filter(c => c.date >= thirtyDaysAgo);
    const recentContributors = new Set(recentCommits.map(c => c.authorEmail)).size;
    const activeContributorRatio =
      authors.length > 0 ? (recentContributors / authors.length) * 100 : 0;

    // Velocity consistency (inverse of coefficient of variation in daily commits)
    const dailyCommits = this.calculateDailyCommitCounts(commits);
    const avgDaily = dailyCommits.reduce((sum, count) => sum + count, 0) / dailyCommits.length;
    const variance =
      dailyCommits.reduce((sum, count) => sum + Math.pow(count - avgDaily, 2), 0) /
      dailyCommits.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = avgDaily > 0 ? stdDev / avgDaily : 0;
    const velocityConsistency = Math.max(0, 100 - coefficientOfVariation * 100);

    // Improved delivery cadence calculation
    const deliveryCadence = this.calculateImprovedDeliveryCadence(commits);

    // Contribution distribution (Gini coefficient for inequality)
    const commitCounts = authors.map(a => a.commits).sort((a, b) => a - b);
    const giniCoefficient = this.calculateGiniCoefficient(commitCounts);
    const sortedAuthors = authors.sort((a, b) => b.commits - a.commits);
    const topContributorDominance =
      sortedAuthors.length > 0 ? (sortedAuthors[0].commits / commits.length) * 100 : 0;

    // Calculate consistency score - higher bus factor percentage is better (more distributed)
    const consistencyScore = Math.round(
      busFactorPercentage * 0.25 + // Higher percentage = better distribution
        activeContributorRatio * 0.25 +
        velocityConsistency * 0.25 +
        deliveryCadence * 0.25
    );

    return {
      score: consistencyScore,
      velocityConsistency,
      busFactorPercentage,
      activeContributorRatio,
      deliveryCadence,
      contributionDistribution: {
        giniCoefficient,
        topContributorDominance,
      },
    };
  }

  /**
   * Calculate team work-life balance metrics
   */
  private calculateTeamWorkLifeBalance(
    commits: CommitData[],
    _authors: AuthorStats[]
  ): TeamWorkLifeBalanceMetrics {
    // Analyze commit time patterns
    const afterHoursCommits = commits.filter(c => {
      const hour = c.date.getHours();
      return hour < 8 || hour > 18; // Before 8 AM or after 6 PM
    }).length;

    const weekendCommits = commits.filter(c => {
      const day = c.date.getDay();
      return day === 0 || day === 6; // Sunday or Saturday
    }).length;

    const afterHoursCommitFrequency =
      commits.length > 0 ? (afterHoursCommits / commits.length) * 100 : 0;
    const weekendCommitActivity = commits.length > 0 ? (weekendCommits / commits.length) * 100 : 0;

    // High velocity days analysis
    const highVelocityDays = this.calculateHighVelocityDays(commits);

    // Commit time patterns health (inverse of concerning patterns)
    const commitTimePatterns = Math.max(0, 100 - afterHoursCommitFrequency - weekendCommitActivity);

    // Team active coverage (estimate from daily contributor diversity)
    const teamActiveCoverage = this.calculateTeamActiveCoverage(commits);

    // Calculate work-life balance score
    const balanceScore = Math.round(
      commitTimePatterns * 0.4 +
        Math.max(0, 100 - afterHoursCommitFrequency) * 0.3 +
        Math.max(0, 100 - weekendCommitActivity) * 0.2 +
        teamActiveCoverage.coveragePercentage * 0.1
    );

    return {
      score: balanceScore,
      commitTimePatterns,
      afterHoursCommitFrequency,
      weekendCommitActivity,
      commitTimingIndicators: {
        highVelocityDays,
        consecutiveCommitDays: this.calculateConsecutiveWorkDays(commits),
        afterHoursCommits: afterHoursCommits,
      },
      teamActiveCoverage,
      limitations: {
        timezoneWarning:
          'Commit timestamps may not reflect actual work hours due to timezone differences',
        workPatternNote:
          'Git commits ≠ work hours (CI commits, batched commits, scheduled deployments)',
        burnoutDetection: 'Cannot accurately assess burnout from Git data alone',
        recommendedApproach: 'Use for general patterns only, not individual performance assessment',
        knownLimitations: [
          'Commit times affected by timezones and CI/CD systems',
          'Weekend/after-hours commits may be maintenance or urgent fixes',
          'Does not account for flexible work schedules',
          'Cannot distinguish between work and personal commits',
          'Team coverage estimates collaboration, not vacation planning',
        ],
      },
    };
  }

  /**
   * Generate team insights based on calculated metrics
   */
  private generateTeamInsights(
    overall: number,
    collaboration: TeamCollaborationMetrics,
    consistency: TeamConsistencyMetrics,
    workLifeBalance: TeamWorkLifeBalanceMetrics
  ): TeamInsights {
    const strengths: string[] = [];
    const improvements: string[] = [];
    const risks: string[] = [];

    // Collaboration insights - based on measurable file authorship patterns
    if (collaboration.knowledgeDistribution > 70) {
      strengths.push('Strong knowledge distribution across team members');
    } else if (collaboration.knowledgeDistribution < 40) {
      improvements.push('Consider spreading knowledge across more team members');
    }

    if (collaboration.crossTeamInteraction > 60) {
      strengths.push('Good cross-team collaboration on shared files');
    } else if (collaboration.crossTeamInteraction < 30) {
      improvements.push('Increase collaboration on shared codebase areas');
    }

    // Consistency insights
    if (consistency.busFactorPercentage >= 60) {
      strengths.push('Well-distributed contribution pattern - low bus factor risk');
    } else if (consistency.busFactorPercentage <= 30) {
      risks.push('High bus factor risk - few contributors handle most work');
    }

    // Work-life balance insights
    if (workLifeBalance.afterHoursCommitFrequency > 30) {
      risks.push('High after-hours commit activity detected');
    }
    if (workLifeBalance.weekendCommitActivity > 20) {
      risks.push('Significant weekend commit activity detected');
    }

    // Determine team dynamics
    let teamDynamics: 'highly-collaborative' | 'balanced' | 'siloed' | 'fragmented';
    if (collaboration.score > 80) {
      teamDynamics = 'highly-collaborative';
    } else if (collaboration.score > 60) {
      teamDynamics = 'balanced';
    } else if (collaboration.score > 40) {
      teamDynamics = 'siloed';
    } else {
      teamDynamics = 'fragmented';
    }

    // Determine maturity level
    let maturityLevel: 'nascent' | 'developing' | 'mature' | 'optimized';
    if (overall > 85) {
      maturityLevel = 'optimized';
    } else if (overall > 70) {
      maturityLevel = 'mature';
    } else if (overall > 55) {
      maturityLevel = 'developing';
    } else {
      maturityLevel = 'nascent';
    }

    // Determine sustainability rating
    let sustainabilityRating: 'excellent' | 'good' | 'concerning' | 'critical';
    if (workLifeBalance.score > 80) {
      sustainabilityRating = 'excellent';
    } else if (workLifeBalance.score > 65) {
      sustainabilityRating = 'good';
    } else if (workLifeBalance.score > 45) {
      sustainabilityRating = 'concerning';
    } else {
      sustainabilityRating = 'critical';
    }

    return {
      strengths,
      improvements,
      risks,
      teamDynamics,
      maturityLevel,
      sustainabilityRating,
    };
  }

  /**
   * Generate team recommendations based on metrics
   */
  private generateTeamRecommendations(
    _collaboration: TeamCollaborationMetrics,
    _consistency: TeamConsistencyMetrics,
    _workLifeBalance: TeamWorkLifeBalanceMetrics
  ): string[] {
    // Removed all recommendations - only report measurable data
    return [];
  }

  /**
   * Helper method to calculate daily commit counts
   */
  private calculateDailyCommitCounts(commits: CommitData[]): number[] {
    const dailyCounts = new Map<string, number>();

    for (const commit of commits) {
      const dateKey = commit.date.toISOString().split('T')[0];
      dailyCounts.set(dateKey, (dailyCounts.get(dateKey) || 0) + 1);
    }

    return Array.from(dailyCounts.values());
  }

  /**
   * Helper method to calculate delivery cadence
   */
  private calculateImprovedDeliveryCadence(commits: CommitData[]): number {
    if (commits.length < 2) return 100;

    const sortedCommits = commits.sort((a, b) => a.date.getTime() - b.date.getTime());
    const gaps: number[] = [];

    // Calculate gaps between consecutive commits
    for (let i = 1; i < sortedCommits.length; i++) {
      const gap = sortedCommits[i].date.getTime() - sortedCommits[i - 1].date.getTime();
      gaps.push(gap / (1000 * 60 * 60 * 24)); // Convert to days
    }

    const avgGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;

    // Determine if the average gap indicates good cadence
    let cadenceScore = 0;
    if (avgGap <= 1) {
      cadenceScore = 100; // Daily commits
    } else if (avgGap <= 3) {
      cadenceScore = 90; // Every few days
    } else if (avgGap <= 7) {
      cadenceScore = 75; // Weekly
    } else if (avgGap <= 14) {
      cadenceScore = 50; // Bi-weekly
    } else if (avgGap <= 30) {
      cadenceScore = 25; // Monthly
    } else {
      cadenceScore = 10; // Very infrequent
    }

    // Adjust for consistency - penalize large variations
    const gapVariance = gaps.reduce((sum, gap) => sum + Math.pow(gap - avgGap, 2), 0) / gaps.length;
    const gapStdDev = Math.sqrt(gapVariance);
    const consistencyPenalty = avgGap > 0 ? Math.min((gapStdDev / avgGap) * 50, 40) : 0;

    return Math.max(0, Math.min(100, cadenceScore - consistencyPenalty));
  }

  /**
   * Calculate bus factor as a percentage - what percentage of authors account for 80% of commits
   */
  private calculateBusFactorPercentage(commits: CommitData[], authors: AuthorStats[]): number {
    if (authors.length === 0) return 0;

    const sortedAuthors = authors.sort((a, b) => b.commits - a.commits);
    const totalCommits = commits.length;
    let cumulativeCommits = 0;
    let authorsFor80Percent = 0;

    // Find how many authors account for 80% of commits
    for (const author of sortedAuthors) {
      cumulativeCommits += author.commits;
      authorsFor80Percent++;
      if (cumulativeCommits >= totalCommits * 0.8) {
        break;
      }
    }

    // Return as percentage - lower percentage means higher bus factor risk
    return Math.round((authorsFor80Percent / authors.length) * 100);
  }

  /**
   * Helper method to calculate Gini coefficient for contribution inequality
   */
  private calculateGiniCoefficient(values: number[]): number {
    if (values.length === 0) return 0;

    const sortedValues = values.slice().sort((a, b) => a - b);
    const n = sortedValues.length;
    const sum = sortedValues.reduce((acc, val) => acc + val, 0);

    if (sum === 0) return 0;

    let numerator = 0;
    for (let i = 0; i < n; i++) {
      numerator += (2 * i - n + 1) * sortedValues[i];
    }

    return numerator / (n * sum);
  }

  /**
   * Helper method to calculate high velocity days
   */
  private calculateHighVelocityDays(commits: CommitData[]): number {
    const dailyCounts = this.calculateDailyCommitCounts(commits);
    const avgDaily = dailyCounts.reduce((sum, count) => sum + count, 0) / dailyCounts.length;
    const threshold = avgDaily * 2; // Days with more than 2x average commits

    return dailyCounts.filter(count => count > threshold).length;
  }

  /**
   * Helper method to calculate consecutive work days
   */
  private calculateConsecutiveWorkDays(commits: CommitData[]): number {
    const workDays = new Set(commits.map(c => c.date.toISOString().split('T')[0]));

    const sortedDays = Array.from(workDays).sort();
    let maxConsecutive = 0;
    let currentConsecutive = 1;

    for (let i = 1; i < sortedDays.length; i++) {
      const prevDate = new Date(sortedDays[i - 1]);
      const currDate = new Date(sortedDays[i]);
      const diffTime = currDate.getTime() - prevDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        currentConsecutive++;
      } else {
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
        currentConsecutive = 1;
      }
    }

    return Math.max(maxConsecutive, currentConsecutive);
  }

  /**
   * Helper method to calculate vacation coverage
   */
  private calculateTeamActiveCoverage(commits: CommitData[]): {
    multiContributorDays: number;
    soloContributorDays: number;
    coveragePercentage: number;
    note: string;
  } {
    // Analyze daily contributor diversity
    const dailyAuthors = new Map<string, Set<string>>();

    for (const commit of commits) {
      const dateKey = commit.date.toISOString().split('T')[0];
      if (!dailyAuthors.has(dateKey)) {
        dailyAuthors.set(dateKey, new Set());
      }
      dailyAuthors.get(dateKey)!.add(commit.authorEmail);
    }

    const multiContributorDays = Array.from(dailyAuthors.values()).filter(
      authors => authors.size > 1
    ).length;
    const soloContributorDays = dailyAuthors.size - multiContributorDays;
    const coveragePercentage =
      dailyAuthors.size > 0 ? (multiContributorDays / dailyAuthors.size) * 100 : 0;

    return {
      multiContributorDays,
      soloContributorDays,
      coveragePercentage,
      note: 'Measures daily contributor diversity, not vacation coverage or work scheduling',
    };
  }

  /**
   * Analyze daily trends from commit data
   *
   * Computes comprehensive daily trending metrics exclusively from Git commit data.
   * All metrics are objective, observable patterns with no speculation about
   * team performance, code quality, or individual productivity.
   *
   * @param commits - All commits to analyze for trends
   * @returns Daily trends data or undefined if no commits
   */
  private async analyzeDailyTrends(commits: CommitData[], options: GitSparkOptions) {
    if (commits.length === 0) {
      return undefined;
    }

    logger.info('Analyzing daily trends', { totalCommits: commits.length });

    // Create trends analyzer with default timezone (could be configurable)
    const trendsAnalyzer = new DailyTrendsAnalyzer('America/Chicago', {
      start: 8, // 8am
      end: 18, // 6pm
      weekdays: true,
    });

    // Calculate analysis range if days is specified
    let analysisRange: { startDate: Date; endDate: Date } | undefined;
    if (options.days && options.days > 0) {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - options.days + 1); // +1 to include today
      analysisRange = { startDate, endDate };
    }

    // Analyze trends with progress reporting
    const trendsData = await trendsAnalyzer.analyzeDailyTrends(
      commits,
      this.progressCallback,
      analysisRange
    );

    logger.info('Daily trends analysis completed', {
      daysAnalyzed: trendsData.analysisMetadata.activeDays,
      totalDays: trendsData.analysisMetadata.totalDays,
    });

    return trendsData;
  }

  /**
   * Analyze the current state of files in the repository
   * This provides a snapshot of what files exist right now, regardless of Git history
   */
  private async analyzeCurrentRepositoryState(
    repoPath: string,
    options?: GitSparkOptions
  ): Promise<CurrentRepositoryState> {
    const extensionStats = new Map<
      string,
      { fileCount: number; totalSizeBytes: number; files: string[] }
    >();
    const categoryStats = {
      sourceCode: { fileCount: 0, totalSizeBytes: 0, files: [] as string[] },
      documentation: { fileCount: 0, totalSizeBytes: 0, files: [] as string[] },
      configuration: { fileCount: 0, totalSizeBytes: 0, files: [] as string[] },
      tests: { fileCount: 0, totalSizeBytes: 0, files: [] as string[] },
      other: { fileCount: 0, totalSizeBytes: 0, files: [] as string[] },
    };
    const directoryStats = new Map<string, number>();

    let totalFiles = 0;
    let totalSizeBytes = 0;

    // Get excluded extensions from options
    const excludeExtensions = options?.excludeExtensions || [];

    // Load .gitignore patterns
    const gitIgnore = GitIgnore.fromRepository(repoPath);

    const shouldIgnore = (filePath: string): boolean => {
      const normalizedPath = filePath.replace(/\\/g, '/');

      // First check .gitignore patterns
      if (gitIgnore.isIgnored(normalizedPath)) {
        return true;
      }

      // Check if file extension is in excluded list
      if (excludeExtensions.length > 0) {
        const ext = path.extname(normalizedPath).toLowerCase();
        if (ext && excludeExtensions.some(excl => excl.toLowerCase() === ext)) {
          return true;
        }
      }

      // Legacy fallback patterns for basic system directories
      return (
        normalizedPath.includes('/.git/') ||
        normalizedPath.includes('/node_modules/') ||
        normalizedPath.includes('/.vscode/') ||
        normalizedPath.includes('/dist/') ||
        normalizedPath.includes('/build/') ||
        normalizedPath.includes('/coverage/') ||
        normalizedPath.includes('/.nyc_output/') ||
        normalizedPath.includes('/tmp/') ||
        normalizedPath.includes('/temp/') ||
        normalizedPath.startsWith('.git') ||
        normalizedPath.includes('/.next/') ||
        normalizedPath.includes('/__pycache__/')
      );
    };

    const walkDirectory = (dirPath: string): void => {
      try {
        const items = fs.readdirSync(dirPath);

        for (const item of items) {
          const fullPath = path.join(dirPath, item);
          const relativePath = path.relative(repoPath, fullPath);

          if (shouldIgnore(relativePath)) {
            continue;
          }

          try {
            const stats = fs.statSync(fullPath);

            if (stats.isDirectory()) {
              walkDirectory(fullPath);
            } else if (stats.isFile()) {
              totalFiles++;
              totalSizeBytes += stats.size;

              // Track directory
              const dirName = path.dirname(relativePath);
              directoryStats.set(dirName, (directoryStats.get(dirName) || 0) + 1);

              // Get file extension
              const ext = this.getFileExtension(relativePath);

              // Track by extension
              if (!extensionStats.has(ext)) {
                extensionStats.set(ext, { fileCount: 0, totalSizeBytes: 0, files: [] });
              }
              const extData = extensionStats.get(ext)!;
              extData.fileCount++;
              extData.totalSizeBytes += stats.size;
              extData.files.push(relativePath);

              // Categorize file
              const category = this.categorizeFile(relativePath, ext);
              categoryStats[category].fileCount++;
              categoryStats[category].totalSizeBytes += stats.size;
              categoryStats[category].files.push(relativePath);
            }
          } catch (error) {
            // Skip files that can't be accessed
            continue;
          }
        }
      } catch (error) {
        // Skip directories that can't be accessed
        return;
      }
    };

    // Start analysis
    walkDirectory(repoPath);

    // Convert to final format
    const byExtension = Array.from(extensionStats.entries())
      .map(([ext, stats]) => ({
        extension: ext,
        language: this.detectLanguage(`file.${ext}`) || 'Unknown',
        fileCount: stats.fileCount,
        totalSizeBytes: stats.totalSizeBytes,
        percentage: totalFiles > 0 ? (stats.fileCount / totalFiles) * 100 : 0,
        averageFileSize: stats.fileCount > 0 ? stats.totalSizeBytes / stats.fileCount : 0,
      }))
      .sort((a, b) => b.fileCount - a.fileCount);

    const categories = {
      sourceCode: {
        fileCount: categoryStats.sourceCode.fileCount,
        totalSizeBytes: categoryStats.sourceCode.totalSizeBytes,
        percentage: totalFiles > 0 ? (categoryStats.sourceCode.fileCount / totalFiles) * 100 : 0,
      },
      documentation: {
        fileCount: categoryStats.documentation.fileCount,
        totalSizeBytes: categoryStats.documentation.totalSizeBytes,
        percentage: totalFiles > 0 ? (categoryStats.documentation.fileCount / totalFiles) * 100 : 0,
      },
      configuration: {
        fileCount: categoryStats.configuration.fileCount,
        totalSizeBytes: categoryStats.configuration.totalSizeBytes,
        percentage: totalFiles > 0 ? (categoryStats.configuration.fileCount / totalFiles) * 100 : 0,
      },
      tests: {
        fileCount: categoryStats.tests.fileCount,
        totalSizeBytes: categoryStats.tests.totalSizeBytes,
        percentage: totalFiles > 0 ? (categoryStats.tests.fileCount / totalFiles) * 100 : 0,
      },
      other: {
        fileCount: categoryStats.other.fileCount,
        totalSizeBytes: categoryStats.other.totalSizeBytes,
        percentage: totalFiles > 0 ? (categoryStats.other.fileCount / totalFiles) * 100 : 0,
      },
    };

    const topDirectories = Array.from(directoryStats.entries())
      .map(([dirPath, fileCount]) => ({
        path: dirPath === '.' ? '(root)' : dirPath,
        fileCount,
        percentage: totalFiles > 0 ? (fileCount / totalFiles) * 100 : 0,
      }))
      .sort((a, b) => b.fileCount - a.fileCount)
      .slice(0, 10); // Top 10 directories

    return {
      totalFiles,
      totalSizeBytes,
      byExtension,
      categories,
      topDirectories,
      analyzedAt: new Date(),
    };
  }

  /**
   * Analyze Azure DevOps integration data
   */
  private async analyzeAzureDevOps(
    options: GitSparkOptions,
    commits: CommitData[]
  ): Promise<AzureDevOpsAnalytics | undefined> {
    try {
      logger.info('Starting Azure DevOps analysis');

      // Initialize Azure DevOps collector if not already done
      if (!this.azureDevOpsCollector) {
        const repoPath = options.repoPath || this.collector.getRepositoryPath();
        this.azureDevOpsCollector = new AzureDevOpsCollector(
          repoPath,
          options,
          commits,
          this.progressCallback
        );

        await this.azureDevOpsCollector.initialize();
      }

      // Collect and process pull request data
      const processedPRData = await this.azureDevOpsCollector.collectPullRequestData();

      // Generate comprehensive analytics
      const analytics = await this.azureDevOpsCollector.generateAnalytics(processedPRData);

      logger.info('Azure DevOps analysis completed', {
        totalPRs: analytics.summary.totalPullRequests,
        gitCommitCoverage: analytics.summary.coverage.gitCommitCoverage,
      });

      // Debug: Check analytics structure
      logger.info('Azure DevOps analytics structure for HTML report', {
        hasSummary: !!analytics.summary,
        totalPRs: analytics.summary.totalPullRequests,
        hasPullRequests: !!analytics.pullRequests,
        statusBreakdown: analytics.pullRequests?.statusBreakdown,
        hasDataQuality: !!analytics.dataQuality,
      });

      return analytics;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.error('Azure DevOps analysis failed', {
        error: errorMessage,
        stack: errorStack,
        type: error?.constructor?.name,
      });

      // Add warning to report instead of failing completely
      if (this.progressCallback) {
        this.progressCallback(
          'Azure DevOps analysis failed - continuing without integration',
          94,
          100
        );
      }

      return undefined;
    }
  }

  /**
   * Cleanup resources, including Azure DevOps collector
   */
  async cleanup(): Promise<void> {
    if (this.azureDevOpsCollector) {
      await this.azureDevOpsCollector.cleanup();
    }
  }
}
