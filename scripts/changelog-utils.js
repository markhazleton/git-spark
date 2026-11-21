/**
 * Shared CHANGELOG.md parsing for the docs changelog page and GitHub Release notes.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const rootDir = join(__dirname, '..');

export function readChangelog() {
  return readFileSync(join(rootDir, 'CHANGELOG.md'), 'utf-8');
}

/**
 * Splits CHANGELOG.md into released versions: [{ version, date, body }], newest first.
 * The "[Unreleased]" section is excluded.
 */
export function parseReleases(changelog) {
  const headingRegex = /^## \[([^\]]+)\](?:\s*-\s*(\d{4}-\d{2}-\d{2}))?\s*$/gm;
  const headings = [...changelog.matchAll(headingRegex)];

  return headings
    .map((match, i) => {
      const start = match.index + match[0].length;
      const end = i + 1 < headings.length ? headings[i + 1].index : changelog.length;
      const body = changelog
        .slice(start, end)
        // Drop link reference definitions ("[1.3.2]: https://...") at the end of the file.
        .replace(/^\[[^\]]+\]:\s+\S+\s*$/gm, '')
        .trim();
      return { version: match[1], date: match[2], body };
    })
    .filter(release => release.version.toLowerCase() !== 'unreleased');
}
