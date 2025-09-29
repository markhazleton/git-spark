import { HTMLExporter } from '../src/output/html';
import { AnalysisReport } from '../src/types';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

describe('HTMLExporter (Phase 1)', () => {
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
    if (existsSync(f)) require('fs').unlinkSync(f);
    if (existsSync(outDir)) require('fs').rmdirSync(outDir, { recursive: true });
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

  it('includes key metric cards', async () => {
    await exporter.export(report, outDir);
    const html = readFileSync(resolve(outDir, 'git-spark-report.html'), 'utf-8');
    expect(html).toMatch(/Commits<\/div>/);
    expect(html).toMatch(/Contributors<\/div>/);
    expect(html).toMatch(/Files Changed<\/div>/);
  });

  it('escapes HTML in dynamic content', async () => {
    report.authors[0].name = 'Alice <script>alert(1)</script>';
    report.files[0].path = 'src/<Injected>.ts';
    await exporter.export(report, outDir);
    const html = readFileSync(resolve(outDir, 'git-spark-report.html'), 'utf-8');
    expect(html).toContain('Alice &lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('src/&lt;Injected&gt;.ts');
    expect(html).not.toContain('<script>alert(1)</script>');
  });

  it('shows governance and risk sections', async () => {
    await exporter.export(report, outDir);
    const html = readFileSync(resolve(outDir, 'git-spark-report.html'), 'utf-8');
    expect(html).toContain('Governance & Code Quality');
    expect(html).toContain('Risk Overview');
  });

  it('includes CSS variables and smooth scroll behavior', async () => {
    await exporter.export(report, outDir);
    const html = readFileSync(resolve(outDir, 'git-spark-report.html'), 'utf-8');
    expect(html).toContain(':root {');
    expect(html).toContain('--color-primary');
    expect(html).toContain('scroll-behavior: smooth');
  });
});
