#!/usr/bin/env node

/**
 * Promotes the CHANGELOG.md "[Unreleased]" section to a dated version section
 * and leaves a fresh empty "[Unreleased]" section in its place.
 *
 * Usage: node scripts/update-changelog.js [--allow-empty]
 * Reads the version from package.json (npm has already bumped it by the time
 * the "version" lifecycle script runs) and stages CHANGELOG.md with git so it
 * rides along in the same commit that `npm version` creates.
 *
 * This script is run automatically during:
 * - npm version (via the "version" lifecycle script) as part of npm run release:*
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

function getPackageVersion() {
  const packagePath = join(rootDir, 'package.json');
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
  return packageJson.version;
}

function getIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function promoteUnreleased(changelog, version, date) {
  const unreleasedHeading = '## [Unreleased]';
  const startIndex = changelog.indexOf(unreleasedHeading);
  if (startIndex === -1) {
    throw new Error('No "## [Unreleased]" section found in CHANGELOG.md');
  }

  const contentStart = startIndex + unreleasedHeading.length;
  const nextHeadingMatch = changelog.slice(contentStart).match(/\n## \[/);
  const contentEnd = nextHeadingMatch
    ? contentStart + nextHeadingMatch.index
    : changelog.length;

  const body = changelog.slice(contentStart, contentEnd).trim();

  const replacement =
    `${unreleasedHeading}\n\n## [${version}] - ${date}` + (body ? `\n\n${body}` : '');

  const updated = changelog.slice(0, startIndex) + replacement + '\n\n' + changelog.slice(contentEnd).trimStart();

  return { updated, body };
}

function main() {
  try {
    const allowEmpty = process.argv.includes('--allow-empty');
    const version = getPackageVersion();
    const date = getIsoDate();

    const changelogPath = join(rootDir, 'CHANGELOG.md');
    const changelog = readFileSync(changelogPath, 'utf-8');

    const { updated, body } = promoteUnreleased(changelog, version, date);

    if (!body && !allowEmpty) {
      console.error(
        '❌ CHANGELOG.md "[Unreleased]" section is empty. Document what changed before releasing, ' +
          'or pass --allow-empty to release anyway.'
      );
      process.exit(1);
    }

    writeFileSync(changelogPath, updated, 'utf-8');
    console.log(`✅ CHANGELOG.md: Promoted [Unreleased] to [${version}] - ${date}`);

    execSync('git add CHANGELOG.md', { cwd: rootDir, stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Error updating CHANGELOG.md:', error.message);
    process.exit(1);
  }
}

main();
