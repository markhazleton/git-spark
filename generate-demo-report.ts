import { HTMLExporter } from './src/output/html';
import { AnalysisReport } from './src/types';

const createTestReport = (): AnalysisReport => {
  return {
    metadata: {
      generatedAt: new Date(),
      version: '1.0.0',
      repoPath: '/test/demo-repo',
      analysisOptions: { repoPath: '/test/demo-repo' },
      processingTime: 1000,
      gitVersion: '2.44.0',
      commit: 'abcdef1234567890',
      branch: 'main',
    },
    repository: {
      totalCommits: 100,
      totalAuthors: 3,
      totalFiles: 50,
      totalChurn: 50000,
      firstCommit: new Date('2024-01-01'),
      lastCommit: new Date('2024-12-31'),
      activeDays: 365,
      avgCommitsPerDay: 0.27,
      languages: { typescript: 30000, javascript: 15000, markdown: 5000 },
      busFactor: 1,
      healthScore: 0.75,
      governanceScore: 0.65,
    },
    authors: [
      {
        name: 'Lead Developer',
        email: 'lead@example.com',
        commits: 60,
        insertions: 30000,
        deletions: 5000,
        churn: 35000,
        filesChanged: 40,
        firstCommit: new Date('2024-01-01'),
        lastCommit: new Date('2024-12-31'),
        activeDays: 300,
        avgCommitSize: 583,
        largestCommit: 2500,
        workPatterns: {
          peakDay: 'Tuesday',
          peakHour: 14,
          weekendCommits: 0.1,
          afterHoursCommits: 0.2,
          consistencyScore: 0.8,
        },
        riskScore: 0.3,
        detailed: {
          contribution: {
            totalLines: 35000,
            productivity: { commitsPerDay: 0.2, linesPerCommit: 583 },
            impact: { impactScore: 0.85, reach: 0.8 },
            largestCommitDetails: {
              size: 2500,
              hash: 'abc123def456',
              date: new Date('2024-06-15'),
              message: 'Major refactor: implement new architecture patterns',
            },
            filesAndScope: {
              uniqueFiles: 40,
              avgFilesPerCommit: 2.2,
              fileDiversityScore: 0.8,
              directoryFocus: [
                { directory: 'src/core', percentage: 45 },
                { directory: 'src/components', percentage: 30 },
                { directory: 'src/utils', percentage: 15 },
                { directory: 'test', percentage: 10 },
              ],
              sourceVsPublishedRatio: {
                sourceLines: { insertions: 25000, deletions: 3000 },
                sourceCommits: 50,
              },
            },
            // This is where the proportional commit size distribution will be rendered
            commitSizeDistribution: {
              micro: 5, // 8.3% - should be narrow
              small: 35, // 58.3% - should be widest
              medium: 15, // 25.0% - should be medium
              large: 4, // 6.7% - should be narrow
              veryLarge: 1, // 1.7% - should be narrowest
            },
          },
          collaboration: {
            filesSharedWithOthers: 25,
            reviewParticipation: 0.9,
          },
          patterns: {},
          insights: {
            strengths: [
              'Consistent contributor',
              'Good code review participation',
              'Well-structured commits',
            ],
            growthAreas: ['Could break down large commits', 'More documentation commits'],
          },
        },
      },
    ],
    hotspots: {
      files: [
        {
          path: 'src/core/main.ts',
          commits: 15,
          authors: 2,
          churn: 5000,
          riskScore: 0.7,
          firstCommit: new Date('2024-01-01'),
          lastCommit: new Date('2024-12-15'),
          complexity: { cyclomatic: 25, cognitive: 30 },
        },
      ],
      authors: [],
    },
    timeline: {
      daily: [],
      weekly: [],
      monthly: [],
      patterns: {
        busiestDay: 'Tuesday',
        busiestHour: 14,
        weekendActivity: 0.1,
        holidayActivity: 0.05,
      },
    },
    files: [
      {
        path: 'src/core/main.ts',
        commits: 15,
        authors: 2,
        churn: 5000,
        riskScore: 0.7,
        extension: 'ts',
        size: 2500,
      },
    ],
    risks: {
      level: 'Medium',
      factors: {
        highChurnFiles: 2,
        manyAuthorFiles: 1,
        largeCommits: 5,
        recentChanges: 10,
      },
      recommendations: ['Review large commits', 'Monitor high-churn files'],
    },
    governance: {
      conventionalCommits: 65,
      traceability: 0.7,
      averageMessageLength: 65,
      wipCommits: 3,
      reverts: 1,
      shortMessages: 5,
      recommendations: ['Improve commit message standards', 'Reduce WIP commits'],
    },
  };
};

async function generateDemoReport() {
  console.log('Generating demo report with proportional commit size distribution bars...');

  const exporter = new HTMLExporter();
  const report = createTestReport();
  const outputDir = './demo-proportional-bars';

  await exporter.export(report, outputDir);

  console.log(`✅ Demo report generated: ${outputDir}/git-spark-report.html`);
  console.log('');
  console.log('This report includes a detailed author profile with:');
  console.log('- Micro commits: 5 (8.3%) - narrow bar');
  console.log('- Small commits: 35 (58.3%) - widest bar');
  console.log('- Medium commits: 15 (25.0%) - medium bar');
  console.log('- Large commits: 4 (6.7%) - narrow bar');
  console.log('- Very Large commits: 1 (1.7%) - narrowest bar');
  console.log('');
  console.log('The bars should now be proportional to these percentages!');
}

generateDemoReport().catch(console.error);
