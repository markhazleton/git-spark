#!/usr/bin/env node

/**
 * Updates the version badge in docs/index.html to match package.json
 * Usage: node scripts/update-docs-version.js [version]
 * If version is not provided, it will read from package.json
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

function updateDocsVersion(version) {
  const docsPath = join(rootDir, 'docs', 'index.html');
  const docsContent = readFileSync(docsPath, 'utf-8');
  
  // Match version badge pattern: <span class="version-badge">v1.0.221 - Available on npm</span>
  const versionBadgeRegex = /(version-badge">v)\d+\.\d+\.\d+(\s+-\s+Available on npm<\/span>)/g;
  
  const updatedContent = docsContent.replace(
    versionBadgeRegex,
    `$1${version}$2`
  );
  
  if (docsContent === updatedContent) {
    console.log('⚠️  No changes made - version might already be up to date');
    return false;
  }
  
  writeFileSync(docsPath, updatedContent, 'utf-8');
  console.log(`✅ Updated docs/index.html version badge to v${version}`);
  return true;
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
    
    console.log(`📝 Updating docs site version to: v${version}`);
    
    const updated = updateDocsVersion(version);
    
    if (updated) {
      console.log('');
      console.log('Next steps:');
      console.log('1. Review the changes: git diff docs/index.html');
      console.log('2. Commit the changes: git add docs/index.html');
      console.log(`3. Commit: git commit -m "docs: update version badge to v${version}"`);
      console.log('4. Push: git push origin main');
      console.log('');
      console.log('Or use the automated workflow:');
      console.log(`gh workflow run update-docs.yml -f version=${version}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating docs version:', error.message);
    process.exit(1);
  }
}

main();
