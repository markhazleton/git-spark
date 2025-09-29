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
} from '../types';
import { DataCollector } from './collector';
import { createLogger } from '../utils/logger';
import { validateCommitMessage, sanitizeEmail } from '../utils/validation';
import { readFileSync } from 'fs';
import { resolve } from 'path';

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
    const commits = await this.collector.collectCommits(options);

    // Generate analysis components
    this.reportProgress('Analyzing repository stats', 30, 100);
    const repositoryStats = await this.analyzeRepository(commits, options);

    this.reportProgress('Analyzing authors', 40, 100);
    const authors = this.analyzeAuthors(commits);

    this.reportProgress('Analyzing files', 50, 100);
    const files = this.analyzeFiles(commits);

    this.reportProgress('Generating timeline', 60, 100);
    const timeline = this.generateTimeline(commits);

    this.reportProgress('Calculating risks', 70, 100);
    const risks = this.analyzeRisk(files, commits);

    this.reportProgress('Analyzing governance', 80, 100);
    const governance = this.analyzeGovernance(commits);

    this.reportProgress('Generating report', 90, 100);

    // Generate metadata
    const metadata = await this.generateMetadata(options, Date.now() - startTime);

    // Generate summary
    const summary = this.generateSummary(repositoryStats, authors, files, risks, governance);

    // Identify hotspots
    const hotspots = this.identifyHotspots(files);

    const report: AnalysisReport = {
      metadata,
      repository: repositoryStats,
      timeline,
      authors,
      files,
      hotspots,
      risks,
      governance,
      summary,
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
    const firstCommit = dates[0];
    const lastCommit = dates[dates.length - 1];

    const timeDiff = lastCommit.getTime() - firstCommit.getTime();
    const activeDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    const avgCommitsPerDay = activeDays > 0 ? totalCommits / activeDays : 0;

    // Get language statistics
    const languages = await this.collector.getLanguageStats();

    // Calculate bus factor (knowledge concentration)
    const busFactor = this.calculateBusFactor(commits);

    // Calculate health score
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

  private analyzeAuthors(commits: CommitData[]): AuthorStats[] {
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

      this.calculateDetailedAuthorMetrics(author, authorCommits, authorFiles, commits);
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
        commitMessageQuality: {
          overallScore: 0,
          conventionalCommitsRate: 0,
          issueTraceabilityRate: 0,
          averageLength: 0,
          qualityBreakdown: {
            conventional: 0,
            hasIssueRefs: 0,
            adequateLength: 0,
            descriptive: 0,
            properCapitalization: 0,
            noWip: 0,
          },
        },
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
    allCommits: CommitData[]
  ): void {
    const metrics = author.detailed;

    // Contribution metrics
    this.calculateContributionMetrics(
      metrics.contribution,
      author,
      authorCommits,
      authorFiles,
      allCommits
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
    allCommits: CommitData[]
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

        const dir = file.path.split('/')[0] || 'root';
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
    // Commit message quality analysis
    let conventionalCount = 0;
    let issueRefCount = 0;
    let adequateLengthCount = 0;
    let descriptiveCount = 0;
    let properCapCount = 0;
    let wipCount = 0;
    let revertCount = 0;
    let totalMessageLength = 0;

    for (const commit of authorCommits) {
      const analysis = validateCommitMessage(commit.message);

      if (analysis.isConventional) conventionalCount++;
      if (analysis.hasIssueReference) issueRefCount++;
      if (analysis.length >= 20 && analysis.length <= 72) adequateLengthCount++;
      if (!['fix', 'update', 'change'].includes(commit.subject.toLowerCase())) descriptiveCount++;
      if (commit.subject.charAt(0) === commit.subject.charAt(0).toUpperCase()) properCapCount++;
      if (analysis.isWip) wipCount++;
      if (analysis.isRevert) revertCount++;

      totalMessageLength += analysis.length;
    }

    const qualityBreakdown = {
      conventional: conventionalCount,
      hasIssueRefs: issueRefCount,
      adequateLength: adequateLengthCount,
      descriptive: descriptiveCount,
      properCapitalization: properCapCount,
      noWip: author.commits - wipCount,
    };

    const overallScore =
      author.commits > 0
        ? ((conventionalCount * 0.4 +
            issueRefCount * 0.25 +
            adequateLengthCount * 0.15 +
            descriptiveCount * 0.1 +
            properCapCount * 0.05 +
            (author.commits - wipCount) * 0.05) /
            author.commits) *
          100
        : 0;

    metrics.commitMessageQuality = {
      overallScore,
      conventionalCommitsRate: author.commits > 0 ? (conventionalCount / author.commits) * 100 : 0,
      issueTraceabilityRate: author.commits > 0 ? (issueRefCount / author.commits) * 100 : 0,
      averageLength: author.commits > 0 ? totalMessageLength / author.commits : 0,
      qualityBreakdown,
    };

    // Code quality indicators
    let featCommits = 0;
    let fixCommits = 0;
    let refactorCommits = 0;
    let docCommits = 0;
    let refactorLines = 0;
    let docLines = 0;

    for (const commit of authorCommits) {
      const msg = commit.message.toLowerCase();
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

    // Risk and ownership (placeholder values - would need file risk data)
    metrics.riskAndOwnership = {
      highRiskFileContributions: 0,
      ownershipDominance: 0,
      hotspotInvolvement: 0,
      legacyCodeInteraction: 0,
    };
  }

  private generateAuthorInsights(insights: any, author: AuthorStats, metrics: any): void {
    insights.positivePatterns = [];
    insights.growthAreas = [];
    insights.neutralObservations = [];
    insights.concerningPatterns = [];

    // Analyze patterns and generate insights
    if (metrics.quality.commitMessageQuality.overallScore > 80) {
      insights.positivePatterns.push('Excellent commit message quality');
    }

    if (metrics.workPattern.workLifeBalance.afterHoursPercentage < 20) {
      insights.positivePatterns.push('Good work-life balance');
    }

    if (metrics.collaboration.knowledgeSharingIndex > 70) {
      insights.positivePatterns.push('Strong knowledge sharing');
    }

    if (metrics.contribution.commitSizeDistribution.veryLarge > author.commits * 0.2) {
      insights.growthAreas.push('Consider smaller, more focused commits');
    }

    if (metrics.collaboration.coAuthorshipRate < 5) {
      insights.growthAreas.push('Opportunity for more pair programming');
    }

    // Set automated insights
    insights.automatedInsights = {
      workLifeBalance:
        metrics.workPattern.workLifeBalance.afterHoursPercentage > 30
          ? 'concerning'
          : metrics.workPattern.workLifeBalance.afterHoursPercentage < 15
            ? 'excellent'
            : 'healthy',
      collaboration:
        metrics.collaboration.coAuthorshipRate > 20
          ? 'highly-collaborative'
          : metrics.collaboration.coAuthorshipRate < 5
            ? 'isolated'
            : 'moderate',
      codeQuality:
        metrics.quality.commitMessageQuality.overallScore > 80
          ? 'excellent'
          : metrics.quality.commitMessageQuality.overallScore > 60
            ? 'good'
            : 'needs-improvement',
      consistency:
        metrics.workPattern.temporalPatterns.consistencyScore > 80
          ? 'very-consistent'
          : metrics.workPattern.temporalPatterns.consistencyScore > 60
            ? 'consistent'
            : 'irregular',
      expertise:
        author.avgCommitSize > 200 ? 'senior' : author.avgCommitSize > 100 ? 'mid-level' : 'junior',
    };

    insights.recommendations = [
      ...insights.positivePatterns.map((p: string) => `✓ ${p}`),
      ...insights.growthAreas.map((g: string) => `→ ${g}`),
    ];
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
    const sortedByQuality = allAuthors.sort(
      (a, b) =>
        (b.detailed.quality.commitMessageQuality?.overallScore || 0) -
        (a.detailed.quality.commitMessageQuality?.overallScore || 0)
    );

    metrics.teamContext.commitRank = sortedByCommits.findIndex(a => a.email === author.email) + 1;
    metrics.teamContext.linesChangedRank =
      sortedByLines.findIndex(a => a.email === author.email) + 1;
    metrics.teamContext.filesRank = sortedByFiles.findIndex(a => a.email === author.email) + 1;
    metrics.teamContext.messageQualityRank =
      sortedByQuality.findIndex(a => a.email === author.email) + 1;

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

  private analyzeFiles(commits: CommitData[]): FileStats[] {
    const fileMap = new Map<string, FileStats>();

    for (const commit of commits) {
      for (const file of commit.files) {
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
      'Health Score': Math.round(repository.healthScore * 100),
      'Governance Score': Math.round(governance.score * 100),
      'Bus Factor': repository.busFactor,
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
    // Simple health scoring algorithm
    const commitFrequency = activeDays > 0 ? commits.length / activeDays : 0;
    const authorDiversity = authorCount / Math.max(commits.length / 10, 1);
    const avgCommitSize =
      commits.length > 0
        ? commits.reduce((sum, c) => sum + c.insertions + c.deletions, 0) / commits.length
        : 0;

    const frequencyScore = Math.min(commitFrequency / 2, 1); // Target 2 commits per day
    const diversityScore = Math.min(authorDiversity, 1);
    const sizeScore = avgCommitSize > 0 ? Math.max(1 - avgCommitSize / 1000, 0.1) : 0.5;

    return (frequencyScore + diversityScore + sizeScore) / 3;
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

  private calculateHealthRating(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 0.8) return 'excellent';
    if (score >= 0.6) return 'good';
    if (score >= 0.4) return 'fair';
    return 'poor';
  }

  private generateRiskRecommendations(highRiskFiles: FileStats[], riskFactors: any): string[] {
    const recommendations: string[] = [];

    if (highRiskFiles.length > 10) {
      recommendations.push('Consider refactoring high-churn files to reduce complexity');
    }

    if (riskFactors.manyAuthorFiles > 5) {
      recommendations.push('Establish code ownership guidelines for frequently modified files');
    }

    if (riskFactors.largeCommits > 10) {
      recommendations.push('Encourage smaller, more focused commits');
    }

    return recommendations;
  }

  private generateGovernanceRecommendations(analysis: any): string[] {
    const recommendations: string[] = [];

    if (analysis.conventionalCommits / analysis.totalCommits < 0.5) {
      recommendations.push('Adopt conventional commit message format');
    }

    if (analysis.traceabilityScore < 0.3) {
      recommendations.push('Link commits to issues for better traceability');
    }

    if (analysis.shortMessages > analysis.totalCommits * 0.2) {
      recommendations.push('Write more descriptive commit messages');
    }

    return recommendations;
  }

  private generateInsights(
    repository: RepositoryStats,
    authors: AuthorStats[],
    _files: FileStats[],
    _risks: RiskAnalysis,
    governance: GovernanceAnalysis
  ): string[] {
    const insights: string[] = [];

    if (repository.busFactor <= 2) {
      insights.push('Low bus factor - knowledge is concentrated in few developers');
    }

    if (authors.length > 0 && authors[0].commits > repository.totalCommits * 0.5) {
      insights.push('Single developer dominates the codebase');
    }

    if (governance.score < 0.5) {
      insights.push('Commit message quality needs improvement');
    }

    return insights;
  }

  private generateActionItems(risks: RiskAnalysis, governance: GovernanceAnalysis): string[] {
    const actions: string[] = [];

    if (risks.overallRisk === 'high') {
      actions.push('Review and refactor high-risk files');
    }

    if (governance.score < 0.6) {
      actions.push('Implement commit message standards');
    }

    return actions;
  }

  private async generateMetadata(
    options: GitSparkOptions,
    processingTime: number
  ): Promise<ReportMetadata> {
    const branch = await this.collector.getCurrentBranch();
    let version = '0.0.0';
    try {
      const pkgPath = resolve(process.cwd(), 'package.json');
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      version = pkg.version || version;
    } catch {
      // Intentionally ignore: package.json may not be present when used as a library
    }

    let gitVersion = '';
    try {
      gitVersion = await (this.collector as any).git.getVersion();
    } catch {
      // Ignore git version retrieval errors (non-fatal metadata)
    }

    let commit = '';
    try {
      const { spawnSync } = require('child_process');
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
      warnings: [],
    };
  }

  private reportProgress(phase: string, current: number, total: number): void {
    if (this.progressCallback) {
      this.progressCallback(phase, current, total);
    }
  }
}
