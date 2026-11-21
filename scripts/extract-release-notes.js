#!/usr/bin/env node

/**
 * Prints one version's CHANGELOG.md section as GitHub Release notes.
 *
 * Usage: node scripts/extract-release-notes.js <version>   (e.g. 2.0.1 or v2.0.1)
 * Exits non-zero if the version has no CHANGELOG.md entry.
 *
 * Used by .github/workflows/publish.yml to create the GitHub Release after npm publish.
 */

import { readChangelog, parseReleases } from './changelog-utils.js';

const REPO_URL = 'https://github.com/MarkHazleton/git-spark';

const version = (process.argv[2] ?? '').replace(/^v/, '');
if (!version) {
  console.error('Usage: node scripts/extract-release-notes.js <version>');
  process.exit(1);
}

const release = parseReleases(readChangelog()).find(r => r.version === version);
if (!release) {
  console.error(`❌ No CHANGELOG.md entry for version ${version}`);
  process.exit(1);
}

const footer = [
  `Install: \`npm install -g git-spark@${version}\``,
  `Full release history: ${REPO_URL}/blob/main/CHANGELOG.md`,
].join('\n\n');

process.stdout.write(`${release.body || 'No notable changes recorded.'}\n\n---\n\n${footer}\n`);
