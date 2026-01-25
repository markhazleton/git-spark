#!/usr/bin/env node

/**
 * Updates the version badge and published date in docs/index.html
 * and the footer in docs/performance-tuning.md
 * Usage: node scripts/update-docs-version.js [version]
 * If version is not provided, it will read from package.json
 * 
 * This script is run automatically during:
 * - npm run build (via postbuild)
 * - npm run docs:update-version
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

function getFormattedDate() {
  const now = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return now.toLocaleDateString('en-US', options);
}

function getMonthYear() {
  const now = new Date();
  const options = { year: 'numeric', month: 'long' };
  return now.toLocaleDateString('en-US', options);
}

function updateIndexHtml(version) {
  const docsPath = join(rootDir, 'docs', 'index.html');
  if (!existsSync(docsPath)) {
    console.log('⚠️  docs/index.html not found, skipping');
    return false;
  }
  
  let docsContent = readFileSync(docsPath, 'utf-8');
  let updated = false;
  
  // Match version badge pattern: <span class="version-badge">v1.0.221 - Available on npm</span>
  const versionBadgeRegex = /(version-badge">v)\d+\.\d+\.\d+(\s+-\s+Available on npm<\/span>)/g;
  const newVersionContent = docsContent.replace(versionBadgeRegex, `$1${version}$2`);
  
  if (newVersionContent !== docsContent) {
    docsContent = newVersionContent;
    updated = true;
    console.log(`✅ index.html: Updated version badge to v${version}`);
  }
  
  // Update published date: <span id="published-date">Published: January 25, 2026</span>
  const publishedDateRegex = /(<span id="published-date">Published: )[^<]+(\s*<\/span>)/g;
  const formattedDate = getFormattedDate();
  const newDateContent = docsContent.replace(publishedDateRegex, `$1${formattedDate}$2`);
  
  if (newDateContent !== docsContent) {
    docsContent = newDateContent;
    updated = true;
    console.log(`✅ index.html: Updated published date to ${formattedDate}`);
  }
  
  if (updated) {
    writeFileSync(docsPath, docsContent, 'utf-8');
  }
  return updated;
}

function updatePerformanceTuning(version) {
  const mdPath = join(rootDir, 'docs', 'performance-tuning.md');
  if (!existsSync(mdPath)) {
    console.log('⚠️  docs/performance-tuning.md not found, skipping');
    return false;
  }
  
  let mdContent = readFileSync(mdPath, 'utf-8');
  let updated = false;
  const monthYear = getMonthYear();
  
  // Update "Last Updated" line: **Last Updated:** January 2026
  const lastUpdatedRegex = /(\*\*Last Updated:\*\*\s*)[A-Za-z]+\s+\d{4}/g;
  const newUpdatedContent = mdContent.replace(lastUpdatedRegex, `$1${monthYear}`);
  
  if (newUpdatedContent !== mdContent) {
    mdContent = newUpdatedContent;
    updated = true;
    console.log(`✅ performance-tuning.md: Updated "Last Updated" to ${monthYear}`);
  }
  
  // Update version line: **Git Spark Version:** 1.2.0+
  const versionRegex = /(\*\*Git Spark Version:\*\*\s*)\d+\.\d+\.\d+\+/g;
  const newVersionContent = mdContent.replace(versionRegex, `$1${version}+`);
  
  if (newVersionContent !== mdContent) {
    mdContent = newVersionContent;
    updated = true;
    console.log(`✅ performance-tuning.md: Updated version to ${version}+`);
  }
  
  if (updated) {
    writeFileSync(mdPath, mdContent, 'utf-8');
  }
  return updated;
}

function updateDocsVersion(version) {
  const indexUpdated = updateIndexHtml(version);
  const perfUpdated = updatePerformanceTuning(version);
  
  return indexUpdated || perfUpdated;
}

function getPackageVersion() {
  const packagePath = join(rootDir, 'package.json');
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
  return packageJson.version;
}

function main() {
  try {
    // Get version from command line argument or package.json
    const version = process.argv[2] || getPackageVersion();
    
    console.log(`📝 Updating docs site to v${version}...`);
    console.log('');
    
    const updated = updateDocsVersion(version);
    
    if (updated) {
      console.log('');
      console.log('✨ Docs updated successfully!');
    } else {
      console.log('⚠️  No changes needed - docs already up to date');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating docs:', error.message);
    process.exit(1);
  }
}

main();
