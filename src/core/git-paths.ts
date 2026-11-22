/**
 * Helpers for reading file paths from `git log` output.
 */

const C_ESCAPES: Record<string, number> = {
  a: 7,
  b: 8,
  t: 9,
  n: 10,
  v: 11,
  f: 12,
  r: 13,
  '"': 34,
  '\\': 92,
};

/**
 * Decode a path Git printed in C-style quotes (used for names containing quotes, backslashes,
 * control characters or, without core.quotePath=false, non-ASCII bytes). Unquoted paths are
 * returned unchanged.
 */
export function unquoteGitPath(path: string): string {
  if (path.length < 2 || !path.startsWith('"') || !path.endsWith('"')) return path;
  const inner = path.slice(1, -1);
  const bytes: number[] = [];
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (ch !== '\\' || i + 1 >= inner.length) {
      bytes.push(...Buffer.from(ch, 'utf8'));
      continue;
    }
    const next = inner[i + 1];
    const octal = /^[0-7]{3}/.exec(inner.slice(i + 1));
    if (octal) {
      bytes.push(parseInt(octal[0], 8));
      i += 3;
    } else if (next in C_ESCAPES) {
      bytes.push(C_ESCAPES[next]);
      i += 1;
    } else {
      bytes.push(...Buffer.from(ch, 'utf8'));
    }
  }
  return Buffer.from(bytes).toString('utf8');
}

/**
 * Expand a numstat rename path into old and new paths. Git prints either `old => new` or, when
 * the paths share a prefix or suffix, `prefix{old => new}suffix` where either side may be empty.
 * Returns null when the path is not a rename.
 */
export function expandRenamePath(path: string): { path: string; oldPath: string } | null {
  const brace = /^(.*)\{(.*) => (.*)\}(.*)$/.exec(path);
  if (brace) {
    const [, prefix, from, to, suffix] = brace;
    const join = (middle: string) => `${prefix}${middle}${suffix}`.replace(/\/\/+/g, '/');
    return { oldPath: join(from), path: join(to) };
  }
  const arrow = path.indexOf(' => ');
  if (arrow === -1) return null;
  return {
    oldPath: unquoteGitPath(path.slice(0, arrow)),
    path: unquoteGitPath(path.slice(arrow + 4)),
  };
}
