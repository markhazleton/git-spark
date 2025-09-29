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
        });
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
    }

    // Calculate derived metrics
    for (const author of authorMap.values()) {
      author.avgCommitSize = author.commits > 0 ? author.churn / author.commits : 0;

      const timeDiff = author.lastCommit.getTime() - author.firstCommit.getTime();
      author.activeDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) || 1;
    }

    return Array.from(authorMap.values()).sort((a, b) => b.commits - a.commits);
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
    } catch {}

    let gitVersion = '';
    try {
      gitVersion = await (this.collector as any).git.getVersion();
    } catch {}

    let commit = '';
    try {
      const { spawnSync } = require('child_process');
      const r = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: options.repoPath || process.cwd() });
      if (r.status === 0) commit = String(r.stdout).trim();
    } catch {}

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
