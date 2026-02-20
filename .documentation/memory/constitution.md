<!--
SYNC IMPACT REPORT - Constitution Amendments
==============================================
Version: 1.1.0 (MINOR - new rules added to Documentation Standards)
Last Amended: 2026-02-20

Amendment History:
- 1.1.0 (2026-02-20): Added documentation lifecycle rules to Documentation Standards
  * Project docs must reflect current state
  * Stale docs must be removed/archived (not maintained)
  * Working docs must be cleaned up when obsolete
  * Rationale: Stale documentation worse than no documentation

- 1.0.0 (2026-02-20): Initial ratification via /speckit.discover-constitution

Original Principles Formalized:
- NEW: I. Type Safety (TypeScript Strict Mode)
- NEW: II. Testing Standards (Jest + Coverage Thresholds)
- NEW: III. Analytical Integrity (Git-Only Metrics) [Git Spark Specific]
- NEW: IV. Layered Architecture (CLI → Core → Output)
- NEW: V. ESM Module System

Security Requirements Added:
- Command Injection Prevention (Parameterized Execution)
- HTML Report Security (CSP + Escaping)
- Dependency Management (Weekly Audits)

Development Standards Added:
- CI/CD Pipeline (Multi-OS, Multi-Version)
- Documentation Standards (JSDoc Required)
- Code Quality (ESLint + Prettier)
- Logging Strategy (CLI vs Internal)
- Runtime Requirements (Node.js 20.19+)

Templates Status:
✅ spec-template.md: Reviewed - no conflicts detected
✅ plan-template.md: Reviewed - constitution check section aligns
✅ tasks-template.md: Reviewed - task categorization compatible
⚠️  commands/*.md: Reviewed - agent-specific references acceptable per project style

Follow-up Required:
- PR template: Add constitutional compliance checklist
- CONTRIBUTING.md: Reference constitution in contribution guidelines
- Review tooling: Consider automated checks for some MUST rules

Discovery Source: /speckit.discover-constitution (2026-02-20)
Evidence: 15 source files, 15 test files, 100% pattern confidence
==============================================
-->

# Git Spark Constitution

## Core Principles

### I. Type Safety (MANDATORY)

All TypeScript code **MUST** compile with strict mode and enhanced type checking enabled. Zero compilation errors allowed.

**Non-Negotiable Rules:**
- `strict: true` in tsconfig.json with all strict flags enabled
- `noImplicitAny`, `noUnusedLocals`, `noUnusedParameters`, `exactOptionalPropertyTypes` enforced
- All source files compile without errors under strict mode
- CI pipeline blocks merge if TypeScript compilation fails

**Rationale:** Type safety catches errors at compile time, improves refactoring safety, provides superior IDE support, and prevents entire classes of runtime errors. This is foundational to code quality.

---

### II. Testing Standards (MANDATORY)

All code changes **MUST** include tests with enforced coverage thresholds. No untested code in production.

**Non-Negotiable Rules:**
- All new features include Jest tests in separate `test/` directory
- Test files use `*.test.ts` naming convention
- Coverage thresholds enforced: Branches ≥75%, Functions ≥87%, Lines ≥86%, Statements ≥85%
- Pre-commit hook runs tests and blocks failing commits
- Test timeout: 30 seconds maximum
- CI pipeline blocks merge if tests fail or coverage drops

**Encouraged Practices:**
- Test edge cases and error conditions
- Use meaningful test descriptions
- Keep tests focused and independent

**Rationale:** Comprehensive testing prevents regressions, ensures reliability, enables confident refactoring, and serves as living documentation.

---

### III. Analytical Integrity (MANDATORY - Git Spark Specific)

All analytics metrics **MUST** be derivable from Git commit data with documented limitations. Transparency over completeness.

**Non-Negotiable Rules:**
- Metrics based only on Git commit metadata: author, date, files, message
- Use honest naming: "commitTimePattern" not "workingHours"
- Include `limitations` object in metric types explaining data source, known limitations, recommended approach
- No subjective "recommendations" in reports

**Prohibited Practices:**
- Do not claim to measure actual work hours from commit timestamps
- Do not claim to measure code quality from commit metadata  
- Do not claim to measure code review participation without review platform data
- Do not rank developers or teams subjectively

**Rationale:** Git Spark prioritizes transparency. Better to clearly explain what we CAN'T measure than provide misleading insights. Users trust the tool because it's honest about limitations.

---

### IV. Layered Architecture (MANDATORY)

Code **MUST** follow the established three-layer architecture with clear separation of concerns.

**Non-Negotiable Rules:**
- **CLI Layer** (`src/cli/**`): Argument parsing, validation, user interaction only
- **Core Layer** (`src/core/**`): Business logic, analysis, data processing only
- **Output Layer** (`src/output/**`): Format-specific serialization only
- **Utils Layer** (`src/utils/**`): Shared utilities, no business logic
- No circular dependencies between layers
- Data flows: CLI → Core → Output (never backwards)

**Encouraged Practices:**
- Extract reusable logic to utils layer
- Keep layers focused on single responsibility
- Use dependency injection for testability
- One class per file (exceptions: small helper classes)

**Rationale:** Layered architecture enables independent testing, maintainability, clear boundaries, and allows team members to work in parallel without conflicts.

---

### V. ESM Module System (MANDATORY)

All code **MUST** use ECMAScript Modules (ESM) with explicit file extensions.

**Non-Negotiable Rules:**
- `"type": "module"` in package.json
- All imports include `.js` extension (even for `.ts` files): `import { foo } from './bar.js'`
- Use `import/export` syntax, no CommonJS `require()` in new code
- Module resolution: `bundler` mode in tsconfig.json
- Target: ES2020 or later

**Prohibited Practices:**
- No `require()` or `module.exports` in new code
- No `.cjs` files except configuration (ESLint, etc.)

**Rationale:** ESM is the JavaScript standard, provides better tree-shaking, enables modern tooling, and aligns with the ecosystem's direction.

---

## Security Requirements

### Command Injection Prevention (MANDATORY)

All external command execution **MUST** use parameterized execution to prevent injection attacks.

**Non-Negotiable Rules:**
- Use `spawn(command, args)` with argument arrays, never shell string concatenation
- Validate and sanitize all user input via `validateGitOptions()` before execution
- Implement buffer limits to prevent DoS (200MB default)
- Implement timeouts for long-running operations (60s default)
- No use of `exec()` or `shell: true` with user-provided data

**Encouraged Practices:**
- Log all command executions for audit trail
- Include command validation in unit tests
- Document security assumptions in code comments

**Example (Required Pattern):**
```typescript
// ✅ CORRECT: Parameterized execution
spawn('git', ['log', '--author', userInput], { cwd: repoPath })

// ❌ FORBIDDEN: String concatenation
exec(`git log --author=${userInput}`) // SECURITY VIOLATION
```

**Rationale:** Command injection is a CRITICAL security vulnerability. Parameterized execution eliminates this attack vector entirely.

---

### HTML Report Security (MANDATORY)

All HTML report generation **MUST** follow security-first principles.

**Non-Negotiable Rules:**
- Implement Content Security Policy with SHA-256 hashed inline scripts
- No `unsafe-inline` or `unsafe-eval` in CSP
- HTML-escape all user-generated content (author names, commit messages) before template insertion
- Native SVG charts only (no external charting libraries)
- Self-contained reports (no external API calls, air-gap capable)
- Integrity checks on external CDN resources (Bootstrap CSS with SRI hashes)
- Support email redaction via `--redact-emails` flag

**Encouraged Practices:**
- Keep external dependencies minimal
- Prefer native browser features over libraries
- Test reports in restrictive CSP environments

**Rationale:** Security-first HTML ensures reports can be safely shared publicly, reviewed in air-gapped environments, and meet enterprise security requirements.

---

### Dependency Management (MANDATORY)

Dependencies **MUST** be regularly audited and kept up-to-date with no known vulnerabilities.

**Non-Negotiable Rules:**
- Weekly security audits via GitHub Actions (scheduled Mondays 9 AM UTC)
- `npm audit` must pass at `moderate` severity level
- CodeQL analysis on all pushes to main
- Snyk vulnerability scanning configured
- No known vulnerabilities at moderate+ severity allowed in production
- Automated dependency update PRs via GitHub Actions

**Encouraged Practices:**
- Review dependency updates within 7 days
- Test thoroughly after major version updates
- Document breaking changes in CHANGELOG.md
- Monitor security advisories for critical dependencies

**Rationale:** Supply chain security is critical. Regular audits prevent vulnerabilities from reaching production and maintain user trust.

---

## Development Standards

### CI/CD Pipeline (MANDATORY)

All code **MUST** pass the complete CI/CD pipeline before merge to main branch.

**Non-Negotiable Rules:**
- Lint must pass: `npm run lint` (ESLint with TypeScript rules)
- Tests must pass: `npm run test` (Jest with coverage thresholds)
- Build must succeed: `npm run build` (TypeScript compilation)
- Security audit must pass: `npm audit --audit-level=moderate`
- Multi-OS testing: Ubuntu, Windows, macOS (all must pass)
- Multi-version Node.js: 20.x, 22.x (all must pass)
- Pre-commit hook: lint + test (blocks failing commits via Husky)
- Pre-push hook: build (blocks broken builds via Husky)
- No bypassing CI checks without explicit documented approval

**Rationale:** Automated quality gates prevent broken code from reaching production, maintain consistent quality, and enable confident merging.

---

### Documentation Standards (MANDATORY)

All exported APIs **MUST** have JSDoc documentation. All project documentation **MUST** reflect current code state.

**Non-Negotiable Rules (Code Documentation):**
- All exported classes, interfaces, functions must have JSDoc comment blocks
- Include `@param` for all parameters with descriptions
- Include `@returns` for all return values with type information
- Include `@example` for public APIs showing real usage
- Document error conditions with `@throws`

**Non-Negotiable Rules (Project Documentation):**
- Documentation must accurately reflect current code state (README, guides, API docs)
- Stale documentation must be removed or archived - never commit to maintaining outdated docs
- Working documents (drafts, planning, discovery notes) must be archived or deleted when obsolete
- AI session notes belong in `/copilot/session-YYYY-MM-DD/` (auto-scoped, time-bound)
- Update or delete affected documentation when code changes (don't leave stale docs)

**Encouraged Practices:**
- Complex internal logic should have inline comments
- Use meaningful variable/function names (self-documenting code)
- Keep comments up-to-date during refactoring
- Date-stamp working documents: `planning-2026-02-20.md`
- Archive to `archive/YYYY/` only if historical value exists
- Delete ruthlessly - clean repo over clutter

**Rationale:** Documentation enables library consumers to use APIs correctly and reduces support burden. Stale documentation is worse than no documentation - it misleads users and wastes time. Maintaining historical docs is too costly; better to keep only current, accurate docs.

---

### Code Quality - Linting & Formatting (MANDATORY)

All code **MUST** pass ESLint and Prettier checks with zero errors.

**Non-Negotiable Rules:**
- ESLint: No errors allowed (warnings should be minimized and justified)
- Prettier: All files formatted with project configuration
- Pre-commit hook enforces linting and blocks non-compliant commits
- CI pipeline blocks merge if lint fails
- Configuration: `eslint.config.cjs` (ESLint), `.prettierrc` (Prettier)

**Prettier Configuration:**
- Semi-colons: required
- Single quotes: yes
- Print width: 100 characters
- Tab width: 2 spaces
- Trailing commas: ES5

**Rationale:** Consistent code style reduces review friction, prevents style debates, and makes code easier to read and maintain.

---

### Logging Strategy (MANDATORY)

Logging **MUST** be separated by concern: CLI for user interaction, structured logger for internal operations.

**Non-Negotiable Rules:**
- **CLI layer** (`src/cli/**`): Use `console.log/error/warn` with Chalk colors for user-facing output
- **Core/Utils layers** (`src/core/**`, `src/utils/**`): Use structured logger with debug levels
- Never use `console.*` in core/utils layers (VIOLATION)
- Logger must support: debug, info, warn, error levels
- Logger must include context (module name, relevant data)

**Encouraged Practices:**
- Use progress callbacks for long-running operations (Git operations)
- Include timing information for performance-critical operations
- Log security-relevant events (command execution, validation failures)

**Rationale:** Separation of concerns enables debugging without cluttering user output and allows different logging strategies per environment (development vs production).

---

### Runtime Requirements (MANDATORY)

Git Spark **MUST** support specified Node.js versions and environments.

**Non-Negotiable Rules:**
- Node.js: ≥20.19.0 (LTS or later)
- npm: ≥10.0.0
- Multi-OS support: Linux (Ubuntu), macOS, Windows (all tested in CI)
- CI tests on all supported platforms
- Engines field enforced in package.json

**Encouraged Practices:**
- Support latest LTS and current Node.js versions
- Test on multiple Node.js versions in CI matrix (currently 20.x, 22.x)
- Document breaking changes when dropping version support

**Rationale:** Clear runtime requirements prevent compatibility issues and ensure consistent behavior across user environments.

---

## Governance

### Constitutional Authority

This constitution supersedes all informal practices, preferences, and conventions. When conflicts arise, the constitution takes precedence.

### Amendment Process

**Requirements for Amendments:**
- Document rationale and business justification
- Team discussion and majority consensus required for major changes
- Update constitution version following semantic versioning:
  - **MAJOR**: Backward incompatible governance/principle removals or redefinitions
  - **MINOR**: New principle/section added or materially expanded guidance
  - **PATCH**: Clarifications, wording improvements, typo fixes
- Create migration plan for changes affecting existing code
- Update "Last Amended" date to amendment date
- Propagate changes to dependent templates (spec, plan, tasks)

**Review Cadence:**
- Quarterly review for relevance and effectiveness
- Gather team feedback on pain points
- Keep constitution pragmatic and actionable, not bureaucratic

### Compliance Review

**All Pull Requests Must Verify:**
1. ✅ TypeScript strict mode compliance (all code compiles)
2. ✅ Test coverage thresholds met (≥75% branches, ≥87% functions)
3. ✅ Security patterns followed (parameterized commands, input validation)
4. ✅ Documentation complete & current (JSDoc for exports + project docs reflect code)
5. ✅ CI pipeline passes (lint, test, build, security audit)
6. ✅ Analytical integrity maintained (Git-only metrics, limitations documented)
7. ✅ Architecture layers respected (no violations of CLI → Core → Output flow)
8. ✅ Code quality checks pass (ESLint, Prettier)
9. ✅ HTML security followed (CSP, escaping) if applicable
10. ✅ Dependencies audit clean (no moderate+ vulnerabilities)
11. ✅ Stale docs removed/archived (no obsolete working documents left behind)

### Violation Severity

**CRITICAL** (Blocks merge immediately):
- Security violations (command injection, HTML XSS)
- TypeScript compilation errors
- Failing tests or coverage drops below thresholds
- CI pipeline failures

**HIGH** (Requires fix before merge):
- Missing documentation on exports
- Stale or inaccurate project documentation
- Architecture layer violations
- Analytical integrity compromises (misleading metrics)

**MEDIUM** (Should fix before merge, can defer with justification):
- Code style inconsistencies
- Missing tests for edge cases
- Incomplete error handling

**LOW** (Nice-to-have, address in future PR):
- Minor documentation improvements
- Code organization suggestions

### Enforcement Tools

**Automated Checks:**
- TypeScript compiler enforces type safety
- Jest enforces test coverage thresholds
- Husky git hooks enforce lint/test/build before commit/push
- GitHub Actions CI enforces multi-OS, multi-version compatibility
- npm audit + CodeQL + Snyk enforce security standards
- ESLint + Prettier enforce code quality

**Manual Review:**
- Analytical integrity (requires human judgment)
- Architecture adherence (requires understanding of boundaries)
- Documentation quality (requires domain knowledge)

### Development Guidance

For day-to-day development practices not covered in this constitution, refer to:
- `.github/copilot-instructions.md` - AI development guidance and project-specific patterns
- `README.md` - Quick start and usage examples
- `docs/performance-tuning.md` - Performance optimization strategies
- `SECURITY.md` - Security reporting and best practices

When in doubt, prioritize the constitution's principles over convenience.

---

**Version**: 1.1.0 | **Ratified**: 2026-02-20 | **Last Amended**: 2026-02-20
