#!/usr/bin/env node

/**
 * Simple HTTP server to serve the generated HTML report
 */

import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const PORT = 3000;
const REPORT_PATH = resolve('./test-output/git-spark-report.html');

const server = createServer((req, res) => {
  console.log(`📥 ${req.method} ${req.url}`);

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    if (req.url === '/' || req.url === '/index.html') {
      // Serve the HTML report
      if (existsSync(REPORT_PATH)) {
        const content = readFileSync(REPORT_PATH, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
              <h1>📄 Git Spark Report Not Found</h1>
              <p>The HTML report hasn't been generated yet.</p>
              <p>Run: <code>npx ts-node scripts/test-html-report.ts</code></p>
              <p>Expected location: <code>${REPORT_PATH}</code></p>
            </body>
          </html>
        `);
      }
    } else {
      // 404 for other routes
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
            <h1>404 - Page Not Found</h1>
            <p>Go to <a href="/">Git Spark Report</a></p>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('❌ Server error:', error);
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h1>500 - Server Error</h1>
          <p>Error: ${error}</p>
        </body>
      </html>
    `);
  }
});

server.listen(PORT, () => {
  console.log(`🌐 Git Spark Report Server running at http://localhost:${PORT}`);
  console.log(`📄 Serving HTML report from: ${REPORT_PATH}`);
  console.log(`🚀 Open your browser to view the report!`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
