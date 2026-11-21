import { readdirSync, readFileSync, rmSync, writeFileSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import type { AddressInfo } from 'net';
import { request } from 'http';
import { busFactorShare } from '../src/core/analyzer-helpers.js';
import { createReportServer, REPORT_SERVER_HOST } from '../src/cli/report-command.js';

// chalk, boxen, and ora are ESM-only; Jest runs CommonJS, so replace them with pass-throughs
jest.mock('chalk', () => {
  const style: unknown = new Proxy((text: string) => text, { get: () => style });
  return { __esModule: true, default: style };
});
jest.mock('boxen', () => ({ __esModule: true, default: (text: string) => text }));
jest.mock('ora', () => ({
  __esModule: true,
  default: () => {
    const spinner = {
      text: '',
      start: () => spinner,
      succeed: () => spinner,
      fail: () => spinner,
      warn: () => spinner,
    };
    return spinner;
  },
}));

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return listSourceFiles(full);
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts') ? [full] : [];
  });
}

describe('relative imports', () => {
  it('always carry a .js extension so Node ESM can resolve them', () => {
    // Jest resolves extensionless imports, so a runtime test would not catch a missing extension
    const relativeImport = /(?:from\s+|import\(\s*)['"](\.{1,2}\/[^'"]+)['"]/g;
    const offenders: string[] = [];
    for (const file of listSourceFiles(join(process.cwd(), 'src'))) {
      for (const match of readFileSync(file, 'utf-8').matchAll(relativeImport)) {
        if (!match[1].endsWith('.js')) offenders.push(`${file}: ${match[1]}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('busFactorShare', () => {
  it('returns 0 for an empty window instead of NaN', () => {
    expect(busFactorShare(0, 0)).toBe(0);
  });

  it('rounds the share of contributors to a whole percentage', () => {
    expect(busFactorShare(1, 3)).toBe(33);
    expect(busFactorShare(2, 2)).toBe(100);
  });
});

describe('report server', () => {
  const dir = mkdtempSync(join(tmpdir(), 'git-spark-server-'));
  const reportPath = join(dir, 'report.html');

  beforeAll(() => writeFileSync(reportPath, '<html>report</html>'));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  function send(port: number, method: string, path = '/') {
    return new Promise<{ status: number; headers: Record<string, unknown>; body: string }>(
      (resolve, reject) => {
        const req = request({ host: REPORT_SERVER_HOST, port, method, path }, res => {
          let body = '';
          res.on('data', chunk => (body += chunk));
          res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body }));
        });
        req.on('error', reject);
        req.end();
      }
    );
  }

  it('listens on loopback only', () => {
    expect(REPORT_SERVER_HOST).toBe('127.0.0.1');
  });

  it('serves the report without CORS headers and rejects other methods', async () => {
    const server = await createReportServer(reportPath);
    await new Promise<void>(resolve => server.listen(0, REPORT_SERVER_HOST, resolve));
    const { port } = server.address() as AddressInfo;
    try {
      const get = await send(port, 'GET');
      expect(get.status).toBe(200);
      expect(get.body).toBe('<html>report</html>');
      expect(get.headers['access-control-allow-origin']).toBeUndefined();

      expect((await send(port, 'OPTIONS')).status).toBe(405);
      expect((await send(port, 'POST')).status).toBe(405);
      expect((await send(port, 'GET', '/other')).status).toBe(404);
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  });
});
