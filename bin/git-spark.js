#!/usr/bin/env node

// ESM entry point for git-spark CLI
import { createCLI } from '../dist/src/cli/commands.js';
import { setGlobalLogLevel } from '../dist/src/utils/logger.js';

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Set default log level
setGlobalLogLevel('info');

// Create and run CLI
async function main() {
  try {
    const program = await createCLI();
    program.parse(process.argv);
  } catch (error) {
    console.error('Failed to initialize CLI:', error);
    process.exit(1);
  }
}

main();