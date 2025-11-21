#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json
const packageJsonPath = path.resolve(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

// Generate version file
const versionFileContent = `/**
 * Auto-generated version file
 * Generated at build time from package.json
 * DO NOT EDIT MANUALLY
 */

export const VERSION = '${packageJson.version}';
export const BUILD_TIME = '${new Date().toISOString()}';
`;

// Write version file
const versionFilePath = path.resolve(__dirname, '../src/version.ts');
fs.writeFileSync(versionFilePath, versionFileContent, 'utf-8');

console.log(`✓ Generated version file: ${packageJson.version}`);