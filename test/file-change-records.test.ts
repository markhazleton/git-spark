import { DataCollector } from '../src/core/collector.js';
import { expandRenamePath, unquoteGitPath } from '../src/core/git-paths.js';
import { mkdirSync, mkdtempSync, writeFileSync, appendFileSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { tmpdir } from 'os';
import { execFileSync } from 'child_process';
import type { CommitData } from '../src/types/index.js';

function git(root: string, ...args: string[]) {
  execFileSync('git', args, { cwd: root, stdio: 'pipe' });
}

function write(root: string, file: string, content: string) {
  const full = join(root, file);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content, 'utf-8');
}

describe('file change records', () => {
  let repo: string;
  let commits: CommitData[];
  const bySubject = (subject: string) => {
    const commit = commits.find(c => c.subject === subject);
    if (!commit) throw new Error(`missing commit: ${subject}`);
    return commit;
  };

  beforeAll(async () => {
    repo = mkdtempSync(join(tmpdir(), 'git-spark-file-changes-'));
    git(repo, 'init', '-q');
    git(repo, 'config', 'user.name', 'Test User');
    git(repo, 'config', 'user.email', 'test@example.com');
    git(repo, 'config', 'diff.renames', 'true');

    write(repo, 'docs/guide/intro.md', '# Intro\n\nline one\nline two\nline three\n');
    write(repo, 'notes.txt', 'first note\n');
    write(repo, 'old/keep.txt', 'to be removed\n');
    write(repo, 'café.txt', 'non-ascii name\n');
    git(repo, 'add', '-A');
    git(repo, 'commit', '-q', '-m', 'add files');

    appendFileSync(join(repo, 'notes.txt'), 'second note\nthird note\n');
    git(repo, 'commit', '-q', '-am', 'append notes');

    mkdirSync(join(repo, 'docs/manual'), { recursive: true });
    git(repo, 'mv', 'docs/guide/intro.md', 'docs/manual/intro.md');
    git(repo, 'commit', '-q', '-m', 'move intro');

    git(repo, 'rm', '-q', 'old/keep.txt');
    git(repo, 'commit', '-q', '-m', 'remove keep');

    commits = await new DataCollector(repo).collectCommits({ repoPath: repo });
  });

  afterAll(() => {
    rmSync(repo, { recursive: true, force: true });
  });

  it('records added files with their real names, including non-ASCII ones', () => {
    const files = bySubject('add files').files;
    expect(files.map(f => [f.path, f.status]).sort()).toEqual([
      ['café.txt', 'added'],
      ['docs/guide/intro.md', 'added'],
      ['notes.txt', 'added'],
      ['old/keep.txt', 'added'],
    ]);
  });

  it('reports an append-only edit as modified, not added', () => {
    const [file] = bySubject('append notes').files;
    expect(file).toEqual({ path: 'notes.txt', insertions: 2, deletions: 0, status: 'modified' });
  });

  it('expands a brace-form rename into the full old and new paths', () => {
    const [file] = bySubject('move intro').files;
    expect(file.status).toBe('renamed');
    expect(file.path).toBe('docs/manual/intro.md');
    expect(file.oldPath).toBe('docs/guide/intro.md');
  });

  it('reports a removed file as deleted', () => {
    const [file] = bySubject('remove keep').files;
    expect(file).toEqual({ path: 'old/keep.txt', insertions: 0, deletions: 1, status: 'deleted' });
  });

  it('records no path with rename braces or arrows', () => {
    const paths = commits.flatMap(c => c.files.flatMap(f => [f.path, f.oldPath ?? '']));
    expect(paths.filter(p => /[{}]| => /.test(p))).toEqual([]);
  });
});

describe('expandRenamePath', () => {
  it.each([
    ['src/{a => b}/file.ts', 'src/a/file.ts', 'src/b/file.ts'],
    ['{old => new}/x.md', 'old/x.md', 'new/x.md'],
    ['docs/{ => sub}/x.md', 'docs/x.md', 'docs/sub/x.md'],
    ['docs/{sub => }/x.md', 'docs/sub/x.md', 'docs/x.md'],
    ['dir/{a.txt => b.txt}', 'dir/a.txt', 'dir/b.txt'],
    ['a.txt => b.txt', 'a.txt', 'b.txt'],
  ])('%s', (input, oldPath, path) => {
    expect(expandRenamePath(input)).toEqual({ oldPath, path });
  });

  it('returns null for a path that is not a rename', () => {
    expect(expandRenamePath('src/index.ts')).toBeNull();
  });
});

describe('unquoteGitPath', () => {
  it('leaves unquoted paths unchanged', () => {
    expect(unquoteGitPath('src/plain.ts')).toBe('src/plain.ts');
  });

  it('decodes C-style escapes and octal UTF-8 bytes', () => {
    expect(unquoteGitPath('"caf\\303\\251.txt"')).toBe('café.txt');
    expect(unquoteGitPath('"say \\"hi\\".txt"')).toBe('say "hi".txt');
    expect(unquoteGitPath('"tab\\there"')).toBe('tab\there');
    expect(unquoteGitPath('"back\\\\slash"')).toBe('back\\slash');
  });
});
