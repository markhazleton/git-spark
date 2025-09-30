const { HTMLExporter } = require('./dist/src/output/html');
const { mkdirSync, writeFileSync } = require('fs');
const { resolve } = require('path');

// Create a sample report with detailed author metrics showing proportional bars
const sampleReport = {
  metadata: {
    repoPath: '/demo/repository',
    generatedAt: new Date(),
    version: '1.0.0'
  },
  repository: {
    path: '/demo/repository',
    name: 'demo-repository',
    url: 'https://github.com/demo/repository',
    defaultBranch: 'main',
    isGitRepository: true
  },
  analysis: {
    totalCommits: 28,
    totalFiles: 50,
    activeAuthors: 1,
    dateRange: {
      start: new Date('2024-01-01'),
      end: new Date('2024-01-31')
    },
    branchInfo: {
      total: 1,
      active: 1,
      stale: 0
    }
  },
  authors: [
    {
      email: 'demo@example.com',
      name: 'Demo Author',
      commits: 28,
      insertions: 15000,
      deletions: 3000,
      netLines: 12000,
      firstCommit: new Date('2024-01-01'),
      lastCommit: new Date('2024-01-31'),
      daysActive: 20,
      // Add detailed metrics with uneven commit size distribution to show proportionality
      detailed: {
        contribution: {
          totalLines: 15000,
          productivity: { commitsPerDay: 1.4, linesPerCommit: 535.7 },
          impact: { impactScore: 0.8, reach: 0.6 },
          largestCommitDetails: {
            size: 2000,
            hash: 'abc123def456',
            date: new Date('2024-01-15'),
            message: 'Large feature implementation with extensive refactoring',
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
          // CRITICAL: Very uneven distribution to demonstrate proportional bars
          commitSizeDistribution: {
            micro: 1,     // 3.6% - should be very narrow
            small: 15,    // 53.6% - should be very wide (dominant)  
            medium: 8,    // 28.6% - should be medium width
            large: 3,     // 10.7% - should be narrow
            veryLarge: 1, // 3.6% - should be very narrow (same as micro)
          },
        },
        collaboration: {
          filesSharedWithOthers: 5,
          reviewParticipation: 0.8,
        },
        patterns: {},
        insights: {
          strengths: ['Consistent contributor', 'Good code coverage'],
          growthAreas: ['Consider smaller commits', 'More frequent pushes'],
        },
      }
    }
  ],
  files: [],
  timeline: [],
  riskFactors: {
    score: 3.2,
    high: 1,
    medium: 2,
    low: 5,
    factors: [
      { level: 'medium', description: 'Some large commits detected' },
      { level: 'low', description: 'Good test coverage' }
    ]
  },
  governance: {
    score: 8.5,
    conventionalCommits: 22,
    totalCommits: 28,
    patterns: {
      feat: 12,
      fix: 8,
      docs: 2
    }
  }
};

async function generateDemoReport() {
  console.log('🎯 Creating demo report with proportional commit size distribution bars...\n');
  
  const exporter = new HTMLExporter();
  const outDir = './demo-proportional-bars';
  
  try {
    // Create output directory
    mkdirSync(outDir, { recursive: true });
    
    // Generate the report
    await exporter.export(sampleReport, outDir);
    
    const reportPath = resolve(outDir, 'git-spark-report.html');
    console.log(`✅ Demo report generated successfully!`);
    console.log(`📍 Location: ${reportPath}`);
    console.log('\n🎯 This report demonstrates proportional commit size distribution bars:');
    console.log('   • Micro (1 commit, 3.6%): Very narrow bar');
    console.log('   • Small (15 commits, 53.6%): Very wide bar (dominant)');
    console.log('   • Medium (8 commits, 28.6%): Medium width bar');
    console.log('   • Large (3 commits, 10.7%): Narrow bar');
    console.log('   • Very Large (1 commit, 3.6%): Very narrow bar');
    console.log('\n📖 Open the HTML file in your browser to see the proportional bars in action!');
    
  } catch (error) {
    console.error('❌ Error generating demo report:', error.message);
  }
}

generateDemoReport();