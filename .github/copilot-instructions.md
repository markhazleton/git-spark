# Git Spark - AI Agent Instructions

Git Spark is an enterprise-grade Git repository analytics tool (TypeScript, Node.js 20+) that analyzes Git commit history to generate comprehensive reports (HTML, JSON, CSV, Markdown, Console). It emphasizes **analytical transparency** - never guessing metrics that can't be derived from Git data alone.

## Core Architecture & Data Flow

**Three-Layer Pipeline**: CLI → Analyzer → Output Exporters

1. **CLI Layer** ([src/cli/commands.ts](src/cli/commands.ts)): Commander.js argument parsing, option validation, progress callbacks
2. **Core Analysis** (`src/core/`):
   - [collector.ts](src/core/collector.ts): Raw Git data extraction via spawned `git log` commands (parameterized, never shell strings)
   - [analyzer.ts](src/core/analyzer.ts): Metric calculation - author stats, file risk scores, governance analysis, team collaboration patterns
   - [daily-trends.ts](src/core/daily-trends.ts): Timeline generation with complete date range coverage (including zero-activity days)
3. **Export Layer** (`src/output/`): Format-specific serialization with security hardening (HTML uses CSP + SHA-256 hashed inline content)

**Key Design Pattern**: Progress callbacks flow through all layers (`ProgressCallback` type) for real-time user feedback during long-running Git operations.

## Development Workflow Essentials

### Build & Test Cycle
```bash
npm run prebuild  # Auto-generates src/version.ts from package.json
npm run build     # TypeScript → dist/ (ES2020 modules, bundler resolution)
npm test          # Jest with ts-jest, 30s timeout, enforces 75-87% coverage
npm run lint      # ESLint with @typescript-eslint plugin (no unsafe-any)
```

**Critical**: [scripts/generate-version.js](scripts/generate-version.js) MUST run before build/test. Version detection uses fallback chain: `src/version.ts` → `package.json` → `1.0.0` default.

### Git Command Safety
All Git operations in [src/utils/git.ts](src/utils/git.ts) use `child_process.spawn()` with argument arrays:
```typescript
spawn('git', ['log', '--format=%H', '--', filePath], { cwd: repoPath })
```
Never concatenate user input into shell strings. Buffer limits (200MB default) prevent DoS attacks.

## Project-Specific Conventions

### TypeScript Configuration
- Strict mode enabled (`noImplicitAny`, `noUnusedLocals`, `exactOptionalPropertyTypes`)
- Module resolution: `bundler` (not Node16)
- Excluded from compilation: `src/integrations/azure-devops/**` (feature flag)
- Test files use ESM with Jest transform: `moduleNameMapper` strips `.js` extensions

### File Filtering Architecture
**Two-Stage Exclusion Process** (order matters):

1. **Extension Filtering** (`--exclude-extensions`): Applied during commit parsing in [analyzer.ts](src/core/analyzer.ts) before metric calculation
2. **Path Pattern Filtering**: `.gitignore` patterns handled by [utils/gitignore.ts](src/utils/gitignore.ts) during file analysis

Example: `--exclude-extensions=.md` removes markdown files from ALL metrics, while `.gitignore` only affects file-level stats.

### Analytical Integrity Rules
**Fundamental Constraint**: Git data CANNOT provide code review participation, actual work hours, test coverage, or deployment info. 

When adding metrics:
1. Validate data is in Git commit metadata (author, date, files, message)
2. Use honest naming: `commitTimePattern` not `workingHours`, `reviewWorkflowDetection` not `codeReviewCoverage`
3. Include `limitations` object with `dataSource`, `knownLimitations[]`, `recommendedApproach`
4. Test against real repository to verify calculation accuracy

Example limitation structure (from [src/types/index.ts](src/types/index.ts)):
```typescript
limitations: {
  dataSource: 'git-commits-only',
  estimationMethod: 'commit message pattern analysis',
  knownLimitations: [
    'Cannot detect actual code review participation',
    'Timing reflects commit timestamp, not work hours'
  ],
  recommendedApproach: 'Supplement with platform API data (GitHub/GitLab)'
}
```

## Testing Strategy

### Coverage Requirements (Jest config in [package.json](package.json))
- Branches: 75%, Functions: 87%, Lines: 86%, Statements: 85%
- **Excluded**: `src/types/**`, `src/cli/**`, `src/integrations/azure-devops/**`
- Test timeout: 30 seconds (handles Git operations on real repos)

### Test Patterns
```typescript
// Use test helpers in test/helpers/ for Git repo setup
describe('GitAnalyzer', () => {
  it('should filter excluded extensions from commits', async () => {
    // Mock Git operations or use test-tmp/cli-test-repo/
    const commits = await collector.collectCommits({ excludeExtensions: ['.md'] });
    expect(commits.every(c => c.files.every(f => !f.path.endsWith('.md')))).toBe(true);
  });
});
```

**Anti-pattern**: Don't test Git command parsing - test metric calculations with known commit data.

## HTML Report Security Model

**Zero Trust Approach** ([src/output/html.ts](src/output/html.ts)):
- Content Security Policy: `script-src 'sha256-...'` for all inline JS (no `unsafe-inline`)
- All user/repo content HTML-escaped before template insertion
- No external CDN dependencies except Bootstrap CSS (integrity-checked)
- Native SVG charts - no client-side charting libraries

**Dark Mode Pattern**: Theme persists via `localStorage`, charts redraw on toggle using CSS custom properties.

## Azure DevOps Integration (Optional Feature)

**Architecture**: Parallel data collection with graceful degradation
- [src/integrations/azure-devops/collector.ts](src/integrations/azure-devops/collector.ts): REST API client with multi-level caching
- Cache hierarchy: Memory → File system (`.git-spark-cache/`) → API calls
- Rate limiting: 200 req/min default, respects `Retry-After` headers
- **Activation**: `--azure-devops` flag + `AZURE_DEVOPS_TOKEN` env var or `--devops-pat`

Auto-detection logic (from `.git/config`):
```
git config --get remote.origin.url → Parse Azure DevOps URL → Extract org/project/repo
```

## Common Development Tasks

### Adding New Metric to Author Analysis
1. Define interface in [src/types/index.ts](src/types/index.ts) (add to `AuthorStats.detailed`)
2. Implement calculation in [analyzer.ts](src/core/analyzer.ts) → `calculateDetailedAuthorMetrics()`
3. Add limitations documentation: `AuthorStats.limitations?: MetricLimitations`
4. Update HTML exporter template in [src/output/html.ts](src/output/html.ts) (Author Profile Cards section)
5. Add test case validating calculation with known commit data
6. Update [README.md](README.md) metric documentation

### Extending File Risk Scoring
Risk calculated in `calculateFileRiskScore()` with weighted factors:
- Churn (35%): `min(file.churn / 5000, 1)`
- Authors (25%): `min(file.authors.length / 10, 1)`
- Commits (25%): `min(file.commits / 100, 1)`
- Recency (15%): `1 - daysSince / 365` (capped at 1 year)

Modify weights in `GitSparkConfig.analysis.weights.risk` to adjust sensitivity.

### CLI Command Enhancement
1. Add option to `createCLI()` in [src/cli/commands.ts](src/cli/commands.ts): `.option('--new-flag <value>', 'description')`
2. Update `GitSparkOptions` interface in [src/types/index.ts](src/types/index.ts)
3. Add validation in [utils/validation.ts](src/utils/validation.ts) → `validateOptions()`
4. Handle in `executeAnalysis()` or create new command with `.command('name').action()`
5. Add integration test in [test/cli-commands.test.ts](test/cli-commands.test.ts)

## Copilot Session Documentation

**CRITICAL RULE**: AI-generated markdown MUST go to `/copilot/session-{YYYY-MM-DD}/`
- ✅ Allowed: `/copilot/session-2025-12-14/feature-design.md`
- ❌ Forbidden: `/src/docs/notes.md`, `/implementation-plan.md` (root)
- Exception: Only `.github/copilot-instructions.md` lives outside `/copilot/`

Rationale: Prevents documentation clutter in code directories, maintains audit trail of AI sessions.

## Key Dependencies & Purpose

- **Commander.js**: CLI framework (subcommands, option parsing, help generation)
- **Chalk 5.x**: Terminal colors (ESM-only, no CommonJS compatibility)
- **Boxen**: Bordered CLI output boxes (used in health check command)
- **Ora**: Terminal spinners for progress indication
- **Table**: ASCII table formatting for console output
- **Semver**: Version comparison for compatibility checks

## Pitfalls to Avoid

1. **ESM Module Resolution**: All imports require `.js` extension even for `.ts` files (bundler resolution mode)
2. **Version Detection**: Always use `getVersion()` from [version-fallback.ts](src/version-fallback.ts), never hard-code version strings
3. **Git Command Timeouts**: Operations on large repos (100k+ commits) can take minutes - use progress callbacks
4. **File Filtering Order**: Apply `excludeExtensions` before `.gitignore` patterns (different scopes)
5. **Metric Honesty**: NEVER claim to measure code quality, developer performance, or test coverage from Git data alone
6. **HTML Security**: All new template variables MUST be HTML-escaped, all inline scripts MUST update CSP hashes

## Performance Optimization Patterns

See [docs/performance-tuning.md](docs/performance-tuning.md) for full guide. Key strategies:
- Chunked commit processing (1000 commits/batch default)
- Sparse checkout for file content analysis
- Memoization of Git command results (`.git-spark-cache/`)
- Streaming JSON export for large reports

## Release Process

1. Update [CHANGELOG.md](CHANGELOG.md) with version notes
2. Run `npm run prepublishOnly` (clean + build + test)
3. `npm version [patch|minor|major]` (updates package.json + creates Git tag)
4. `npm publish` (uses `publishConfig.provenance: true` for supply chain security)
5. GitHub Actions auto-publishes on tag push (trusted publishing via OIDC)

---

**Philosophy**: Git Spark prioritizes transparency over completeness. Better to clearly explain what we CAN'T measure than to provide misleading "insights" from insufficient data. All features should help developers understand their Git history honestly, not make them feel judged.
