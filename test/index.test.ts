import { GitSpark, analyze } from '../src/index';
import { GitSparkOptions } from '../src/types';

describe('GitSpark', () => {
  const testOptions: GitSparkOptions = {
    repoPath: process.cwd(),
    days: 30,
    format: 'json',
  };

  describe('constructor', () => {
    it('should create a GitSpark instance with valid options', () => {
      expect(() => new GitSpark(testOptions)).not.toThrow();
    });

    it('should throw error with invalid options', () => {
      const invalidOptions: GitSparkOptions = {
        repoPath: '/nonexistent/path',
      };

      expect(() => new GitSpark(invalidOptions)).toThrow();
    });
  });

  describe('analyze', () => {
    it('should perform analysis and return report', async () => {
      const gitSpark = new GitSpark(testOptions);
      const report = await gitSpark.analyze();

      expect(report).toBeDefined();
      expect(report.metadata).toBeDefined();
      expect(report.repository).toBeDefined();
      expect(report.authors).toBeDefined();
      expect(report.files).toBeDefined();
      expect(Array.isArray(report.authors)).toBe(true);
      expect(Array.isArray(report.files)).toBe(true);
    }, 30000); // 30 second timeout for analysis
  });

  describe('quick analyze function', () => {
    it('should perform quick analysis', async () => {
      const report = await analyze(undefined, { days: 7 });

      expect(report).toBeDefined();
      expect(report.repository).toBeDefined();
      expect(typeof report.repository.totalCommits).toBe('number');
    }, 15000);
  });
});

describe('GitSpark configuration', () => {
  it('should have valid default configuration', () => {
    const config = GitSpark.getDefaultConfig();

    expect(config.version).toBe('1.0');
    expect(config.analysis.excludePaths).toContain('node_modules/**');
    expect(config.output.defaultFormat).toBe('html');
    expect(config.performance.enableCaching).toBe(true);
  });
});
