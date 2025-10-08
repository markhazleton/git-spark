import { spawn, ChildProcess } from 'child_process';
import { GitCommand, GitError } from '../types';
import { createLogger } from './logger';
import { validateGitOptions } from './input-validation';

const logger = createLogger('git');

export class GitExecutor {
  constructor(private repoPath: string) {}

  async execute(command: GitCommand): Promise<string> {
    return new Promise((resolve, reject) => {
      const args = [command.command, ...command.args];
      const options = {
        cwd: command.options?.cwd || this.repoPath,
        maxBuffer: command.options?.maxBuffer || 1024 * 1024 * 200, // 200MB
        timeout: command.options?.timeout || 60000, // 60 seconds
      };

      logger.debug(`Executing: git ${args.join(' ')}`, { cwd: options.cwd });

      const child: ChildProcess = spawn('git', args, {
        cwd: options.cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
        if (stdout.length > options.maxBuffer) {
          child.kill();
          clearTimeout(timeoutId);
          reject(new GitError('Output buffer exceeded maximum size', args.join(' ')));
        }
      });

      child.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      const timeoutId = setTimeout(() => {
        child.kill();
        reject(new GitError('Git command timed out', args.join(' ')));
      }, options.timeout);

      child.on('close', (code: number | null) => {
        clearTimeout(timeoutId);

        if (code === 0) {
          logger.debug(`Git command completed successfully`, {
            command: args.join(' '),
            outputSize: stdout.length,
          });
          resolve(stdout);
        } else {
          const error = new GitError(
            `Git command failed with code ${code}: ${stderr}`,
            args.join(' ')
          );
          logger.error('Git command failed', {
            command: args.join(' '),
            code,
            stderr: stderr.slice(0, 500),
          });
          reject(error);
        }
      });

      child.on('error', (err: Error) => {
        clearTimeout(timeoutId);
        reject(new GitError(`Failed to execute git command: ${err.message}`, args.join(' ')));
      });
    });
  }

  async getCommitLog(
    options: {
      since?: string;
      until?: string;
      branch?: string;
      author?: string;
      path?: string;
      maxCount?: number;
    } = {}
  ): Promise<string> {
    // Validate and sanitize all input parameters
    const validation = validateGitOptions(options);
    if (!validation.isValid) {
      throw new GitError(`Invalid parameters: ${validation.errors.join(', ')}`, 'log');
    }

    const safeOptions = validation.sanitized!;
    const args = ['log', '--numstat', '--pretty=format:%H|%h|%an|%ae|%ai|%s|%b|%P', '--no-merges'];

    if (safeOptions.since) args.push('--since', safeOptions.since);
    if (safeOptions.until) args.push('--until', safeOptions.until);
    if (safeOptions.author) args.push('--author', safeOptions.author);
    if (safeOptions.maxCount) args.push('--max-count', safeOptions.maxCount.toString());
    if (safeOptions.branch) args.push(safeOptions.branch);
    if (safeOptions.path) args.push('--', safeOptions.path);

    return this.execute({ command: 'log', args: args.slice(1) });
  }

  async getBranches(): Promise<string[]> {
    const output = await this.execute({
      command: 'branch',
      args: ['-r', '--format=%(refname:short)'],
    });
    return output
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.includes('HEAD'))
      .map(line => line.replace('origin/', ''));
  }

  async getCurrentBranch(): Promise<string> {
    const output = await this.execute({ command: 'rev-parse', args: ['--abbrev-ref', 'HEAD'] });
    return output.trim();
  }

  async getRemoteUrl(): Promise<string> {
    try {
      const output = await this.execute({
        command: 'config',
        args: ['--get', 'remote.origin.url'],
      });
      return output.trim();
    } catch {
      return '';
    }
  }

  async getVersion(): Promise<string> {
    const output = await this.execute({ command: '--version', args: [] });
    return output.trim();
  }

  async validateRepository(): Promise<boolean> {
    try {
      await this.execute({ command: 'rev-parse', args: ['--git-dir'] });
      return true;
    } catch {
      return false;
    }
  }

  async getFileSize(path: string, commit = 'HEAD'): Promise<number> {
    try {
      const output = await this.execute({
        command: 'cat-file',
        args: ['-s', `${commit}:${path}`],
      });
      return parseInt(output.trim(), 10);
    } catch {
      return 0;
    }
  }

  async getFileHistory(path: string, maxCount = 100): Promise<string> {
    return this.execute({
      command: 'log',
      args: [
        '--follow',
        '--numstat',
        '--pretty=format:%H|%h|%an|%ae|%ai|%s',
        `--max-count=${maxCount}`,
        '--',
        path,
      ],
    });
  }

  async getCommitCount(
    options: {
      since?: string;
      until?: string;
      branch?: string;
      author?: string;
    } = {}
  ): Promise<number> {
    // Validate and sanitize all input parameters
    const validation = validateGitOptions(options);
    if (!validation.isValid) {
      throw new GitError(`Invalid parameters: ${validation.errors.join(', ')}`, 'rev-list');
    }

    const safeOptions = validation.sanitized!;
    const args = ['rev-list', '--count'];

    if (safeOptions.since) args.push('--since', safeOptions.since);
    if (safeOptions.until) args.push('--until', safeOptions.until);
    if (safeOptions.author) args.push('--author', safeOptions.author);

    args.push(safeOptions.branch || 'HEAD');

    const output = await this.execute({ command: 'rev-list', args: args.slice(1) });
    return parseInt(output.trim(), 10);
  }

  async getFirstCommitDate(branch = 'HEAD'): Promise<Date | null> {
    try {
      const output = await this.execute({
        command: 'log',
        args: ['--reverse', '--format=%aI', '--max-count=1', branch],
      });
      const dateString = output.trim();
      if (!dateString) {
        return null;
      }
      return new Date(dateString);
    } catch {
      return null;
    }
  }

  async getLanguageStats(): Promise<{ [language: string]: number }> {
    try {
      const output = await this.execute({
        command: 'ls-files',
        args: ['--cached', '--exclude-standard'],
      });

      const files = output.split('\n').filter(f => f.trim());
      const stats: { [language: string]: number } = {};

      for (const file of files) {
        const ext = file.split('.').pop()?.toLowerCase() || 'unknown';
        const language = this.getLanguageFromExtension(ext);
        stats[language] = (stats[language] || 0) + 1;
      }

      return stats;
    } catch {
      return {};
    }
  }

  private getLanguageFromExtension(ext: string): string {
    const languageMap: { [key: string]: string } = {
      js: 'JavaScript',
      ts: 'TypeScript',
      py: 'Python',
      java: 'Java',
      cs: 'C#',
      cpp: 'C++',
      c: 'C',
      php: 'PHP',
      rb: 'Ruby',
      go: 'Go',
      rs: 'Rust',
      swift: 'Swift',
      kt: 'Kotlin',
      scala: 'Scala',
      html: 'HTML',
      css: 'CSS',
      scss: 'SCSS',
      sass: 'Sass',
      less: 'Less',
      json: 'JSON',
      xml: 'XML',
      yaml: 'YAML',
      yml: 'YAML',
      md: 'Markdown',
      sh: 'Shell',
      bash: 'Bash',
      ps1: 'PowerShell',
      sql: 'SQL',
      dockerfile: 'Dockerfile',
      dockerignore: 'Docker',
      gitignore: 'Git',
      txt: 'Text',
    };

    return languageMap[ext] || 'Other';
  }
}
