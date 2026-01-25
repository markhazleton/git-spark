#!/usr/bin/env node
/**
 * Git Spark CLI Entry Point
 *
 * This is the main entry point for the git-spark command-line tool.
 * It loads the CLI from the compiled distribution and executes it.
 */

import { createCLI } from '../dist/src/cli/commands.js';

async function main() {
  try {
    const program = await createCLI();
    await program.parseAsync(process.argv);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

main();
