import {
  validateOptions,
  validateNodeVersion,
  validateCommitMessage,
} from '../src/utils/validation';
import { GitSparkOptions } from '../src/types';

describe('Validation Utils', () => {
  describe('validateOptions', () => {
    it('should validate correct options', () => {
      const options: GitSparkOptions = {
        repoPath: process.cwd(),
        days: 30,
        format: 'html',
      };

      const result = validateOptions(options);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid date format', () => {
      const options: GitSparkOptions = {
        since: 'invalid-date',
      };

      const result = validateOptions(options);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid output format', () => {
      const options: GitSparkOptions = {
        format: 'invalid' as any,
      };

      const result = validateOptions(options);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid format'))).toBe(true);
    });
  });

  describe('validateNodeVersion', () => {
    it('should validate current Node.js version', () => {
      const result = validateNodeVersion();
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateCommitMessage', () => {
    it('should identify conventional commits', () => {
      const message = 'feat: add new feature';
      const result = validateCommitMessage(message);

      expect(result.isConventional).toBe(true);
      expect(result.length).toBe(message.length);
    });

    it('should identify non-conventional commits', () => {
      const message = 'random commit message';
      const result = validateCommitMessage(message);

      expect(result.isConventional).toBe(false);
    });

    it('should identify WIP commits', () => {
      const message = 'WIP: work in progress';
      const result = validateCommitMessage(message);

      expect(result.isWip).toBe(true);
    });

    it('should identify revert commits', () => {
      const message = 'Revert "previous commit"';
      const result = validateCommitMessage(message);

      expect(result.isRevert).toBe(true);
    });

    it('should identify issue references', () => {
      const message = 'fix: resolve issue #123';
      const result = validateCommitMessage(message);

      expect(result.hasIssueReference).toBe(true);
    });
  });
});
