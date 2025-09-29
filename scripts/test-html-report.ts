#!/usr/bin/env node

/**
 * Test script to generate a real HTML report from the current git-spark repository
 */

import { GitSpark } from '../src/index';
import { resolve } from 'path';

async function testHtmlReport() {
  console.log('🚀 Testing HTML Report Generation...\n');

  try {
    // Create GitSpark instance for current repository
    const gitSpark = new GitSpark(
      {
        repoPath: process.cwd(),
      },
      (phase: string, progress: number, total: number) => {
        const percentage = Math.round((progress / total) * 100);
        console.log(`📊 ${phase}: ${progress}/${total} (${percentage}%)`);
      }
    );

    console.log('📈 Starting analysis...');
    const report = await gitSpark.analyze();

    console.log('\n📋 Analysis Summary:');
    console.log(`├── Total Commits: ${report.repository.totalCommits}`);
    console.log(`├── Total Authors: ${report.repository.totalAuthors}`);
    console.log(`├── Total Files: ${report.repository.totalFiles}`);
    console.log(`├── Health Score: ${report.repository.healthScore.toFixed(1)}/100`);
    console.log(`└── Governance Score: ${report.repository.governanceScore.toFixed(1)}/100\n`);

    // Export HTML report
    const outputDir = resolve('./test-output');
    console.log(`📄 Generating HTML report in: ${outputDir}`);

    await gitSpark.export('html', outputDir);

    const reportPath = resolve(outputDir, 'git-spark-report.html');
    console.log(`\n✅ HTML report generated successfully!`);
    console.log(`📁 Report location: ${reportPath}`);
    console.log(`🌐 Open in browser: file://${reportPath.replace(/\\/g, '/')}`);
  } catch (error) {
    console.error('❌ Error generating HTML report:', error);
    process.exit(1);
  }
}

// Run the test
testHtmlReport();
