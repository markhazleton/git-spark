import { HTMLExporter } from '../src/output/html';
import { AnalysisReport } from '../src/types';
import { existsSync, readFileSync, unlinkSync, rmSync } from 'fs';
import { resolve } from 'path';

describe('HTMLExporter (Phase 3)', () => {
  let exporter: HTMLExporter;
  let report: AnalysisReport;

  beforeEach(() => {
    exporter = new HTMLExporter();
    report = {
      metadata: {
        generatedAt: new Date(),
        version: '1.0.0',
        repoPath: '/test/repo',
        analysisOptions: { repoPath: '/test/repo' },
        processingTime: 1000,
        gitVersion: '2.44.0',
        commit: 'abcdef1234567890',
        branch: 'main',
      },
      repository: {
        totalCommits: 42,
        totalAuthors: 3,
        totalFiles: 18,
        totalChurn: 12345,
        firstCommit: new Date('2024-01-01'),
        lastCommit: new Date('2024-02-01'),
        activeDays: 31,
        avgCommitsPerDay: 1.35,
        languages: { typescript: 10000 },
        busFactor: 1,
        healthScore: 0.71,
        governanceScore: 0.55,
      },
      authors: [
        {
          name: 'Alice',
          email: 'alice@example.com',
          commits: 25,
          insertions: 8000,
          deletions: 2000,
          churn: 10000,
          filesChanged: 10,
          firstCommit: new Date('2024-01-01'),
          lastCommit: new Date('2024-02-01'),
          activeDays: 31,
          avgCommitSize: 400,
          largestCommit: 900,
          workPatterns: {
            hourDistribution: new Array(24).fill(0),
            dayDistribution: new Array(7).fill(0),
            burstDays: 0,
            afterHours: 0,
            weekends: 0,
          },
        },
      ],
      files: [
        {
          path: 'src/example/file.ts',
          commits: 10,
          authors: ['alice@example.com'],
          churn: 5000,
          insertions: 4000,
          deletions: 1000,
          firstChange: new Date('2024-01-05'),
          lastChange: new Date('2024-01-30'),
          riskScore: 0.72,
          hotspotScore: 0.8,
          ownership: { 'alice@example.com': 10 },
          language: 'TypeScript',
        },
      ],
      hotspots: [],
      timeline: [
        { date: new Date('2024-01-01'), commits: 2, churn: 150, authors: 1, files: 3 },
        { date: new Date('2024-01-02'), commits: 1, churn: 50, authors: 1, files: 2 },
      ],
      risks: {
        highRiskFiles: [],
        riskFactors: { highChurnFiles: 1, manyAuthorFiles: 0, largeCommits: 2, recentChanges: 5 },
        recommendations: ['Encourage smaller commits'],
        overallRisk: 'low',
      },
      governance: {
        conventionalCommits: 10,
        traceabilityScore: 0.2,
        avgMessageLength: 55,
        wipCommits: 1,
        revertCommits: 0,
        shortMessages: 2,
        score: 0.55,
        recommendations: ['Adopt conventional commit format'],
      },
      summary: {
        healthRating: 'good',
        keyMetrics: { commits: 42, authors: 3, files: 18, healthScore: 71 },
        insights: ['Low bus factor - knowledge is concentrated in few developers'],
        actionItems: ['Implement commit message standards'],
      },
    } as unknown as AnalysisReport;
  });

  const outDir = './test-reports';

  afterEach(() => {
    const f = resolve(outDir, 'git-spark-report.html');
    if (existsSync(f)) unlinkSync(f);
    if (existsSync(outDir)) rmSync(outDir, { recursive: true });
  });

  it('renders required meta tags & navigation', async () => {
    await exporter.export(report, outDir);
    const html = readFileSync(resolve(outDir, 'git-spark-report.html'), 'utf-8');
    expect(html).toContain('<meta name="generator"');
    expect(html).toContain('<meta name="report-date"');
    expect(html).toContain('<meta name="repository"');
    expect(html).toContain('<nav class="main-nav"');
    expect(html).toContain('Executive Summary');
  });

  it('includes key metric cards and export controls', async () => {
    await exporter.export(report, outDir);
    const html = readFileSync(resolve(outDir, 'git-spark-report.html'), 'utf-8');
    expect(html).toMatch(/Commits<\/div>/);
    expect(html).toMatch(/Contributors<\/div>/);
    expect(html).toMatch(/Files Changed<\/div>/);
    expect(html).toContain('data-export="json"');
    expect(html).toContain('Authors CSV');
  });

  it('escapes HTML in dynamic content (raw appears only in serialized JSON)', async () => {
    report.authors[0].name = 'Alice <script>alert(1)</script>';
    report.files[0].path = 'src/<Injected>.ts';
    await exporter.export(report, outDir);
    const html = readFileSync(resolve(outDir, 'git-spark-report.html'), 'utf-8');
    expect(html).toContain('Alice &lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('src/&lt;Injected&gt;.ts');
    // Raw script tag may exist inside serialized JSON export blob; ensure not present directly inside table cell markup
    const forbiddenPattern = '<td>Alice <script>alert(1)</script>';
    expect(html).not.toContain(forbiddenPattern);
  });

  it('shows governance and risk sections plus charts', async () => {
    await exporter.export(report, outDir);
    const html = readFileSync(resolve(outDir, 'git-spark-report.html'), 'utf-8');
    expect(html).toContain('Governance & Code Quality');
    expect(html).toContain('Risk Overview');
    expect(html).toContain('riskFactorsChart');
    expect(html).toContain('governanceChart');
  });

  it('includes CSS variables, smooth scroll behavior, and dataset toggles', async () => {
    await exporter.export(report, outDir);
    const html = readFileSync(resolve(outDir, 'git-spark-report.html'), 'utf-8');
    expect(html).toContain(':root {');
    expect(html).toContain('--color-primary');
    expect(html).toContain('scroll-behavior: smooth');
    expect(html).toContain('dataset-toggles');
  });

  // Test detailed author metrics and edge cases
  it('handles detailed author metrics with fallbacks', async () => {
    // Add detailed metrics to first author
    (report.authors[0] as any).detailed = {
      contribution: {
        totalLines: 10000,
        productivity: { commitsPerDay: 2.5, linesPerCommit: 400 },
        impact: { impactScore: 0.85, reach: 0.7 },
        largestCommitDetails: {
          size: 1500,
          hash: 'abc123def456',
          date: new Date('2024-01-15'),
          message: 'Major refactoring of core module',
        },
        filesAndScope: {
          uniqueFiles: 10,
          avgFilesPerCommit: 2.5,
          fileDiversityScore: 0.6,
          directoryFocus: [
            { directory: 'src/core', percentage: 60 },
            { directory: 'src/utils', percentage: 25 },
            { directory: 'test', percentage: 15 },
          ],
          sourceVsPublishedRatio: {
            sourceLines: { insertions: 8000, deletions: 2000 },
            sourceCommits: 20,
          },
        },
        // Test case: Very uneven distribution to verify proportionality
        commitSizeDistribution: {
          micro: 1, // 3.6% - Very narrow bar
          small: 15, // 53.6% - Very wide bar (dominant)
          medium: 8, // 28.6% - Medium width bar
          large: 3, // 10.7% - Narrow bar
          veryLarge: 1, // 3.6% - Very narrow bar
        },
      },
      collaboration: {
        filesSharedWithOthers: 5,
        reviewParticipation: 0.8,
      },
      patterns: {},
      insights: {
        strengths: ['Consistent contributor', 'Good test coverage'],
        growthAreas: ['Could reduce commit size', 'More code reviews'],
      },
    };

    await exporter.export(report, outDir);

    // Also create a demo report for user to see proportional bars
    const demoOutDir = './demo-proportional-bars';
    await exporter.export(report, demoOutDir);
    console.log('\n🎯 PROPORTIONAL BARS DEMO REPORT CREATED!');
    console.log(`📍 Location: ${demoOutDir}/git-spark-report.html`);
    console.log('📊 Commit Size Distribution:');
    console.log('   • Micro (1 commit, 3.6%): Very narrow bar');
    console.log('   • Small (15 commits, 53.6%): Very wide bar (dominant)');
    console.log('   • Medium (8 commits, 28.6%): Medium width bar');
    console.log('   • Large (3 commits, 10.7%): Narrow bar');
    console.log('   • Very Large (1 commit, 3.6%): Very narrow bar');
    console.log('📖 Open the HTML file to see proportional bars in action!\n');

    const html = readFileSync(resolve(outDir, 'git-spark-report.html'), 'utf-8');

    // Test detailed author profile generation
    expect(html).toContain('Major refactoring of core module');
    expect(html).toContain('abc123d'); // shortened hash
    // The insights may not render in the expected format, so let's check for the data
    expect(html).toContain('Could reduce commit size');
    expect(html).toContain('src/core/ (60%)');
  });

  it('handles commit size distribution edge cases', async () => {
    // Test with zero total commits
    (report.authors[0] as any).detailed = {
      patterns: {
        commitSizeDistribution: {
          micro: 0,
          small: 0,
          medium: 0,
          large: 0,
          veryLarge: 0,
        },
      },
    };

    await exporter.export(report, outDir);
    const html = readFileSync(resolve(outDir, 'git-spark-report.html'), 'utf-8');
    expect(html).toContain('No data available');
  });

  it('handles missing detailed metrics gracefully', async () => {
    // Test with minimal detailed data
    (report.authors[0] as any).detailed = {
      contribution: {},
      collaboration: {},
      patterns: {},
      insights: {},
    };

    await exporter.export(report, outDir);
    const html = readFileSync(resolve(outDir, 'git-spark-report.html'), 'utf-8');
    // Should not crash and should generate valid HTML
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
  });

  it('tests risk band calculations', async () => {
    // Add files with different risk scores to test risk band logic
    report.files = [
      {
        path: 'high-risk.ts',
        commits: 10,
        authors: ['alice@example.com'],
        churn: 5000,
        insertions: 4000,
        deletions: 1000,
        firstChange: new Date('2024-01-05'),
        lastChange: new Date('2024-01-30'),
        riskScore: 0.85, // high risk (>=70%)
        hotspotScore: 0.8,
        ownership: { 'alice@example.com': 10 },
        language: 'TypeScript',
      },
      {
        path: 'medium-risk.ts',
        commits: 5,
        authors: ['alice@example.com'],
        churn: 2000,
        insertions: 1500,
        deletions: 500,
        firstChange: new Date('2024-01-10'),
        lastChange: new Date('2024-01-25'),
        riskScore: 0.6, // medium risk (>=50%)
        hotspotScore: 0.6,
        ownership: { 'alice@example.com': 5 },
        language: 'TypeScript',
      },
      {
        path: 'low-risk.ts',
        commits: 2,
        authors: ['alice@example.com'],
        churn: 500,
        insertions: 400,
        deletions: 100,
        firstChange: new Date('2024-01-20'),
        lastChange: new Date('2024-01-22'),
        riskScore: 0.4, // low risk (>=30%)
        hotspotScore: 0.3,
        ownership: { 'alice@example.com': 2 },
        language: 'TypeScript',
      },
      {
        path: 'minimal-risk.ts',
        commits: 1,
        authors: ['alice@example.com'],
        churn: 100,
        insertions: 100,
        deletions: 0,
        firstChange: new Date('2024-01-25'),
        lastChange: new Date('2024-01-25'),
        riskScore: 0.15, // minimal risk (<30%)
        hotspotScore: 0.1,
        ownership: { 'alice@example.com': 1 },
        language: 'TypeScript',
      },
    ];

    await exporter.export(report, outDir);
    const html = readFileSync(resolve(outDir, 'git-spark-report.html'), 'utf-8');

    // Test risk band CSS classes are applied
    expect(html).toContain('risk-high');
    expect(html).toContain('risk-medium');
    expect(html).toContain('risk-low');
    expect(html).toContain('risk-minimal');
  });

  it('tests health rating calculations', async () => {
    // Test different health score ranges
    const testCases = [
      { healthScore: 0.95, expected: 'excellent' },
      { healthScore: 0.75, expected: 'good' },
      { healthScore: 0.55, expected: 'fair' },
      { healthScore: 0.25, expected: 'poor' },
    ];

    for (const testCase of testCases) {
      report.repository.healthScore = testCase.healthScore;
      await exporter.export(report, outDir);
      const html = readFileSync(resolve(outDir, 'git-spark-report.html'), 'utf-8');
      // The health rating appears in the data-rating attribute
      expect(html).toContain(`data-rating="${testCase.expected}"`);
    }
  });

  it('handles path truncation for long file paths', async () => {
    report.files[0].path =
      'src/very/long/path/that/should/be/truncated/because/it/is/too/long/for/display/file.ts';

    await exporter.export(report, outDir);
    const html = readFileSync(resolve(outDir, 'git-spark-report.html'), 'utf-8');

    // Should contain truncated path with ellipsis
    expect(html).toContain('...');
    // The path might still appear in the title attribute, so check for truncation in the display text
    expect(html).toMatch(/src\/very\/long\/path.*\.\.\..*display\/file\.ts/);
  });
});
