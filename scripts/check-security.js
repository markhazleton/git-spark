#!/usr/bin/env node

/**
 * Security Configuration Check Script
 * Verifies that all security measures are properly configured
 */

import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const checks = [
  {
    name: 'SECURITY.md exists',
    path: 'SECURITY.md',
    required: true,
  },
  {
    name: 'Dependabot configuration exists',
    path: '.github/dependabot.yml',
    required: true,
  },
  {
    name: 'Security workflow exists',
    path: '.github/workflows/security.yml',
    required: true,
  },
  {
    name: 'CodeQL workflow exists',
    path: '.github/workflows/codeql.yml',
    required: true,
  },
  {
    name: 'Node version file exists',
    path: '.nvmrc',
    required: false,
  },
];

console.log('🔒 Security Configuration Check\n');
console.log('=' .repeat(50));

let passed = 0;
let failed = 0;

for (const check of checks) {
  const filePath = join(rootDir, check.path);
  const exists = existsSync(filePath);
  
  if (exists) {
    console.log(`✅ ${check.name}`);
    passed++;
  } else if (check.required) {
    console.log(`❌ ${check.name} - MISSING`);
    failed++;
  } else {
    console.log(`⚠️  ${check.name} - optional, not found`);
  }
}

console.log('=' .repeat(50));
console.log(`\nResults: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  console.error('❌ Some required security configurations are missing!');
  process.exit(1);
}

console.log('✅ All required security configurations are in place!');
console.log('\nRecommended actions:');
console.log('1. Enable Dependabot alerts in repository settings');
console.log('2. Enable CodeQL scanning in repository settings');
console.log('3. Review and merge any Dependabot PRs');
console.log('4. Run: npm run security:audit');
console.log('5. Commit and push SECURITY.md and related files');
