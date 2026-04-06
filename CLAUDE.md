# git-spark — Claude Code Context

Git repository analytics and reporting tool. Analyzes commit patterns and contributor activity, generating HTML reports with native SVG charts.

## Constitution

See [.devspark/memory/constitution.md](.devspark/memory/constitution.md) for non-negotiable principles. Key rules:

- **Never fabricate metrics** — every metric must have a derivable data source or report "cannot measure"
- **Test-First** — TDD mandatory; coverage thresholds: branches 75%, functions 87%, lines 86%
- **Security-First** — all Git ops via `spawn()` with argument arrays, never shell string concatenation; HTML output escaped; CSP SHA-256 hashes
- **Simplicity** — YAGNI; only make changes that are directly requested or clearly necessary
- **Honesty** — metric names must reflect what is actually measured; all metrics include a `limitations` object

## Tech Stack

- **Runtime**: Node.js 20+ / TypeScript (strict, `noImplicitAny`, `exactOptionalPropertyTypes`)
- **Module resolution**: `bundler` — `.js` extension required on all imports
- **CLI**: Commander.js
- **Testing**: Jest with ts-jest, 30s timeout
- **Linting**: ESLint with @typescript-eslint (`no-unsafe-any`)

## Key Commands

```bash
npm run prebuild      # generate src/version.ts (run before build/test)
npm run build         # clean + tsc
npm test              # jest
npm run test:coverage # jest --coverage
npm run lint          # eslint src/**/*.ts
```

Always run `npm run prebuild` before `npm test` or `npm run build`.

## DevSpark Commands

DevSpark slash commands are available in `.claude/commands/`. Use `/devspark.<command>` to invoke them.
