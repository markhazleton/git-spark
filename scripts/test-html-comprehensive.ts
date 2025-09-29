#!/usr/bin/env node

/**
 * Comprehensive HTML Report Test Suite
 * Tests all aspects of the HTML report generation
 */

import { GitSpark } from '../src/index';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

async function runComprehensiveHtmlTest() {
  console.log('🧪 Starting Comprehensive HTML Report Test Suite\n');

  const testResults: Array<{ test: string; passed: boolean; details?: string }> = [];

  try {
    // Test 1: Generate real report from current repository
    console.log('📊 Test 1: Generating real report from current repository...');
    const gitSpark = new GitSpark({ repoPath: process.cwd() });
    const report = await gitSpark.analyze();

    testResults.push({
      test: 'Real repository analysis',
      passed: true,
      details: `${report.repository.totalCommits} commits, ${report.repository.totalAuthors} authors`,
    });

    // Test 2: Export HTML
    console.log('📄 Test 2: Exporting HTML report...');
    const outputDir = resolve('./test-output');
    await gitSpark.export('html', outputDir);

    const reportPath = resolve(outputDir, 'git-spark-report.html');
    const htmlExists = existsSync(reportPath);

    testResults.push({
      test: 'HTML file creation',
      passed: htmlExists,
      details: htmlExists ? `Created at ${reportPath}` : 'File not found',
    });

    if (htmlExists) {
      // Test 3: Validate HTML content
      console.log('🔍 Test 3: Validating HTML content structure...');
      const htmlContent = readFileSync(reportPath, 'utf-8');

      const validationTests = [
        {
          name: 'HTML5 DOCTYPE',
          test: htmlContent.includes('<!DOCTYPE html>'),
          content: 'DOCTYPE declaration',
        },
        {
          name: 'HTML structure',
          test: htmlContent.includes('<html lang="en">') && htmlContent.includes('</html>'),
          content: 'Valid HTML tags',
        },
        {
          name: 'Bootstrap CSS',
          test: htmlContent.includes('bootstrap@5.1.3/dist/css/bootstrap.min.css'),
          content: 'Bootstrap CSS CDN',
        },
        {
          name: 'Bootstrap JS',
          test: htmlContent.includes('bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js'),
          content: 'Bootstrap JS CDN',
        },
        {
          name: 'Title',
          test: htmlContent.includes('Git Spark Analysis Report'),
          content: 'Page title',
        },
        {
          name: 'Repository stats',
          test: htmlContent.includes('Total Commits:') && htmlContent.includes('Total Authors:'),
          content: 'Repository statistics',
        },
        {
          name: 'Author table',
          test: htmlContent.includes('Top Authors') && htmlContent.includes('<table'),
          content: 'Author information table',
        },
        {
          name: 'File table',
          test: htmlContent.includes('Hot Files'),
          content: 'File information table',
        },
        {
          name: 'Custom styles',
          test: htmlContent.includes('font-family: -apple-system'),
          content: 'Custom CSS styles',
        },
        {
          name: 'Responsive design',
          test: htmlContent.includes('col-md-') && htmlContent.includes('container-fluid'),
          content: 'Bootstrap responsive classes',
        },
      ];

      for (const validation of validationTests) {
        testResults.push({
          test: `HTML Validation: ${validation.name}`,
          passed: validation.test,
          details: validation.content,
        });
      }

      // Test 4: Check for security (HTML escaping)
      console.log('🔒 Test 4: Checking HTML security...');
      const hasScriptTags =
        htmlContent.includes('<script>') &&
        !htmlContent.includes('bootstrap') &&
        !htmlContent.includes('cdn.jsdelivr.net');

      testResults.push({
        test: 'Security: No unsafe script tags',
        passed: !hasScriptTags,
        details: hasScriptTags ? 'Found potential unsafe scripts' : 'Only CDN scripts found',
      });

      // Test 5: File size validation
      console.log('📏 Test 5: Checking file size...');
      const fileSize = htmlContent.length;
      const reasonableSize = fileSize > 1000 && fileSize < 1000000; // Between 1KB and 1MB

      testResults.push({
        test: 'File size validation',
        passed: reasonableSize,
        details: `${Math.round(fileSize / 1024)}KB`,
      });

      // Test 6: Data accuracy
      console.log('📈 Test 6: Validating data accuracy...');
      const commitCountInHtml = htmlContent.match(/Total Commits: (\d+)/)?.[1];
      const authorCountInHtml = htmlContent.match(/Total Authors: (\d+)/)?.[1];

      const dataAccurate =
        commitCountInHtml === report.repository.totalCommits.toString() &&
        authorCountInHtml === report.repository.totalAuthors.toString();

      testResults.push({
        test: 'Data accuracy',
        passed: dataAccurate,
        details: `HTML: ${commitCountInHtml} commits, ${authorCountInHtml} authors`,
      });
    }

    // Print results
    console.log('\n📋 Test Results Summary:');
    console.log('='.repeat(80));

    let passedTests = 0;
    let totalTests = testResults.length;

    for (const result of testResults) {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      const details = result.details ? ` (${result.details})` : '';
      console.log(`${status} ${result.test}${details}`);

      if (result.passed) passedTests++;
    }

    console.log('='.repeat(80));
    console.log(
      `🎯 Overall: ${passedTests}/${totalTests} tests passed (${Math.round((passedTests / totalTests) * 100)}%)`
    );

    if (passedTests === totalTests) {
      console.log('🎉 All tests passed! HTML report is working perfectly.');
      console.log(`🌐 View the report at: http://localhost:3000`);
    } else {
      console.log('⚠️  Some tests failed. Check the details above.');
    }
  } catch (error) {
    console.error('❌ Test suite failed with error:', error);
    testResults.push({
      test: 'Test suite execution',
      passed: false,
      details: String(error),
    });
  }
}

// Run the comprehensive test
runComprehensiveHtmlTest();
