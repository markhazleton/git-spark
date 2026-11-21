#!/usr/bin/env node

/**
 * Generates docs/changelog.html (the docs site's release history page) from CHANGELOG.md.
 *
 * Usage: node scripts/generate-changelog-page.js
 * Only released versions are published; the "[Unreleased]" section is skipped so the
 * page matches what is on npm. Output is deterministic (no build timestamps), so the
 * page only changes when a release is added or an entry is edited.
 *
 * This script is run automatically during:
 * - npm version (via the "version" lifecycle script) as part of npm run release:*
 * - npm run docs:changelog
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import MarkdownIt from 'markdown-it';
import { rootDir, readChangelog, parseReleases } from './changelog-utils.js';

const REPO_URL = 'https://github.com/MarkHazleton/git-spark';
const SITE_URL = 'https://git-spark.makeboldspark.com';

const md = new MarkdownIt({ html: false, linkify: false, typographer: false });

// Style "### Added" / "### Fixed" / ... headings as category labels.
md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  if (token.tag === 'h3') {
    const label = tokens[idx + 1]?.content ?? '';
    token.attrJoin('class', `category category-${slugify(label)}`);
  }
  return self.renderToken(tokens, idx, options);
};

// Open external links in a new tab.
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  if (/^https?:\/\//.test(token.attrGet('href') ?? '')) {
    token.attrSet('target', '_blank');
    token.attrSet('rel', 'noopener');
  }
  return self.renderToken(tokens, idx, options);
};

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(isoDate) {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function anchorFor(version) {
  return `v${version.replace(/[^0-9A-Za-z]+/g, '-')}`;
}

function renderRelease(release, isLatest) {
  const id = anchorFor(release.version);
  const version = escapeHtml(release.version);
  const date = release.date
    ? `<time datetime="${release.date}">${formatDate(release.date)}</time>`
    : '';
  const latest = isLatest ? '<span class="latest-badge">Latest</span>' : '';
  const body = release.body ? md.render(release.body) : '<p>No notable changes recorded.</p>';

  return `      <section class="release" id="${id}">
        <div class="release-header">
          <h2><a href="#${id}">v${version}</a></h2>
          ${latest}
          ${date}
        </div>
        <div class="release-body">
${body.trim().replace(/^/gm, '          ')}
        </div>
      </section>`;
}

function renderPage(releases) {
  const index = releases
    .map(r => `<a href="#${anchorFor(r.version)}">v${escapeHtml(r.version)}</a>`)
    .join('\n          ');
  const sections = releases.map((r, i) => renderRelease(r, i === 0)).join('\n\n');
  const latest = escapeHtml(releases[0].version);

  return `<!doctype html>
<!-- Generated from CHANGELOG.md by scripts/generate-changelog-page.js. Do not edit by hand. -->
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="Git Spark release history: new features, fixes, and breaking changes in every published version."
    />
    <meta name="author" content="Mark Hazleton" />
    <meta property="og:title" content="Git Spark Changelog" />
    <meta property="og:description" content="Release history for the git-spark npm package." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${SITE_URL}/changelog.html" />
    <link rel="canonical" href="${SITE_URL}/changelog.html" />
    <title>Git Spark Changelog</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      html {
        scroll-behavior: smooth;
      }

      body {
        font-family:
          -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        padding: 40px 20px;
        color: #2d3748;
      }

      .container {
        max-width: 1100px;
        margin: 0 auto;
        background: white;
        border-radius: 16px;
        padding: 50px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      }

      .back-link {
        display: inline-block;
        color: #667eea;
        font-weight: 600;
        text-decoration: none;
        margin-bottom: 20px;
      }

      .back-link:hover {
        text-decoration: underline;
      }

      header {
        text-align: center;
        margin-bottom: 30px;
      }

      .logo {
        font-size: 3rem;
        margin-bottom: 10px;
      }

      h1 {
        font-size: 2.6rem;
        margin-bottom: 10px;
        font-weight: 700;
      }

      .subtitle {
        color: #4a5568;
        font-size: 1.1rem;
        line-height: 1.6;
      }

      .subtitle a {
        color: #667eea;
        font-weight: 600;
        text-decoration: none;
      }

      .subtitle a:hover {
        text-decoration: underline;
      }

      .version-index {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 8px;
        padding: 20px;
        margin-bottom: 30px;
        background: #f7fafc;
        border-radius: 12px;
      }

      .version-index a {
        padding: 6px 14px;
        border-radius: 16px;
        background: white;
        border: 1px solid #e2e8f0;
        color: #667eea;
        font-size: 0.9rem;
        font-weight: 600;
        text-decoration: none;
      }

      .version-index a:hover {
        border-color: #667eea;
      }

      .release {
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        padding: 28px;
        margin-bottom: 24px;
        scroll-margin-top: 20px;
      }

      .release:target {
        border-color: #667eea;
        box-shadow: 0 8px 30px rgba(102, 126, 234, 0.2);
      }

      .release-header {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }

      .release-header h2 {
        font-size: 1.6rem;
      }

      .release-header h2 a {
        color: #2d3748;
        text-decoration: none;
      }

      .release-header h2 a:hover {
        color: #667eea;
      }

      .release-header time {
        color: #718096;
        font-size: 0.95rem;
        margin-left: auto;
      }

      .latest-badge {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 700;
      }

      .release-body {
        color: #4a5568;
        line-height: 1.7;
      }

      .release-body h3.category {
        display: inline-block;
        font-size: 0.85rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 4px 12px;
        border-radius: 8px;
        margin: 18px 0 8px;
        background: #edf2f7;
        color: #4a5568;
      }

      .release-body h3.category:first-child {
        margin-top: 0;
      }

      .release-body h3.category-added {
        background: #c6f6d5;
        color: #22543d;
      }

      .release-body h3.category-fixed {
        background: #bee3f8;
        color: #2a4365;
      }

      .release-body h3.category-changed {
        background: #e9d8fd;
        color: #44337a;
      }

      .release-body h3.category-breaking,
      .release-body h3.category-removed {
        background: #fed7d7;
        color: #742a2a;
      }

      .release-body h3.category-security {
        background: #feebc8;
        color: #7b341e;
      }

      .release-body h4 {
        margin: 14px 0 6px;
        color: #2d3748;
      }

      .release-body p {
        margin: 8px 0;
      }

      .release-body ul {
        padding-left: 24px;
        margin: 6px 0;
      }

      .release-body li {
        margin: 4px 0;
      }

      .release-body code {
        background: #edf2f7;
        padding: 1px 6px;
        border-radius: 4px;
        font-size: 0.9em;
        overflow-wrap: anywhere;
      }

      .release-body a {
        color: #667eea;
      }

      .release-body blockquote {
        background: #fffaf0;
        border-left: 4px solid #dd6b20;
        border-radius: 6px;
        padding: 10px 16px;
        margin: 0 0 12px;
        color: #7b341e;
      }

      footer {
        text-align: center;
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #e2e8f0;
        color: #718096;
        font-size: 0.9rem;
      }

      footer p {
        margin: 6px 0;
      }

      footer a {
        color: #667eea;
        text-decoration: none;
        font-weight: 600;
      }

      footer a:hover {
        text-decoration: underline;
      }

      @media (max-width: 768px) {
        body {
          padding: 16px;
        }

        .container {
          padding: 30px 20px;
        }

        h1 {
          font-size: 2rem;
        }

        .release {
          padding: 20px 16px;
        }

        .release-header time {
          margin-left: 0;
          width: 100%;
        }
      }
    </style>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-RY77Z11S9E"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

      gtag('config', 'G-RY77Z11S9E');
    </script>
  </head>
  <body>
    <div class="container">
      <a href="./" class="back-link">← Back to Git Spark</a>
      <header>
        <div class="logo">📜</div>
        <h1>Changelog</h1>
        <p class="subtitle">
          Every published release of git-spark, newest first. Latest: <strong>v${latest}</strong>.
          <br />
          Install with <a href="https://www.npmjs.com/package/git-spark" target="_blank" rel="noopener">npm</a>
          · Source: <a href="${REPO_URL}/blob/main/CHANGELOG.md" target="_blank" rel="noopener">CHANGELOG.md</a>
        </p>
      </header>

      <nav class="version-index" aria-label="Releases">
          ${index}
      </nav>

${sections}

      <footer>
        <p>
          <a href="${SITE_URL}">git-spark</a> —
          built by <a href="https://markhazleton.com">Mark Hazleton</a> ·
          <a href="https://makeboldsolutions.com">Make Bold Solutions</a>
        </p>
        <p>
          <a href="${REPO_URL}" target="_blank" rel="noopener">GitHub</a> ·
          <a href="https://www.npmjs.com/package/git-spark" target="_blank" rel="noopener">npm</a> ·
          <a href="${REPO_URL}/issues" target="_blank" rel="noopener">Issues</a> ·
          <a href="${REPO_URL}/blob/main/LICENSE" target="_blank" rel="noopener">MIT License</a>
        </p>
      </footer>
    </div>
  </body>
</html>
`;
}

function main() {
  const releases = parseReleases(readChangelog());

  if (releases.length === 0) {
    console.error('❌ No released versions found in CHANGELOG.md');
    process.exit(1);
  }

  const outPath = join(rootDir, 'docs', 'changelog.html');
  writeFileSync(outPath, renderPage(releases), 'utf-8');
  console.log(`✅ docs/changelog.html: ${releases.length} releases (latest v${releases[0].version})`);
}

main();
