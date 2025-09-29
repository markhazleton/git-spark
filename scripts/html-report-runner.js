#!/usr/bin/env node
// Smart runner that only rebuilds if the compiled demo is stale.
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const srcFile = path.join(repoRoot, 'scripts', 'cli-html-demo.ts');
const distFile = path.join(repoRoot, 'dist', 'scripts', 'cli-html-demo.js');

function needsBuild() {
  if (!fs.existsSync(distFile)) return true;
  if (!fs.existsSync(srcFile)) return true; // unexpected, but force build
  try {
    const srcTime = fs.statSync(srcFile).mtimeMs;
    const distTime = fs.statSync(distFile).mtimeMs;
    return distTime < srcTime; // dist older than source
  } catch {
    return true;
  }
}

if (needsBuild()) {
  const build = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: process.platform === 'win32' });
  if (build.status !== 0) {
    process.exit(build.status || 1);
  }
}

// Pass through remaining args to compiled demo
const args = process.argv.slice(2);
const run = spawnSync(process.execPath, [distFile, ...args], { stdio: 'inherit' });
process.exit(run.status === null ? 1 : run.status);