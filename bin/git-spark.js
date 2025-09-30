#!/usr/bin/env node

// Adjusted paths: TypeScript compilation preserves 'src' directory in dist (dist/src/...)
// so we require from dist/src to locate emitted JS modules.
const { createCLI } = require('../dist/src/cli/commands');
const { setGlobalLogLevel } = require('../dist/src/utils/logger');

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