# Git Spark - Copilot Instructions

## Project Overview

Git Spark is an enterprise-grade Git repository analytics and reporting tool built with TypeScript. It provides comprehensive repository health scoring, team collaboration analysis, and code quality metrics through CLI and programmatic interfaces.

## Copilot Document Organization

**CRITICAL**: All Copilot-generated documentation and markdown files (`.md`) MUST be placed in a dedicated session folder structure:

```
/copilot/session-{YYYY-MM-DD}/
├── analysis-documents.md
├── feature-specifications.md
├── implementation-notes.md
└── session-summary.md
```

### Rules for Document Placement:

- **NEVER** place Copilot-generated `.md` files in existing code folders (`src/`, `test/`, `scripts/`, etc.)
- **NEVER** place Copilot-generated `.md` files in the repository root
- **ALWAYS** use the format `/copilot/session-{YYYY-MM-DD}/` for new sessions
- **ALWAYS** organize documents by session date to maintain chronological order
- **Exception**: Only the `.github/copilot-instructions.md` file should exist outside the `/copilot/` structure

This organization ensures:

- Clean separation between code and AI-generated documentation
- Easy identification and management of AI session artifacts
- Prevention of repository root clutter
- Clear audit trail of AI assistance sessions

## Architecture & Core Components

### Project Structure

```
src/
├── cli/           # Command-line interface and argument parsing
├── core/          # Core analysis engine and GitSpark class
├── output/        # Export formats (HTML, JSON, CSV, Markdown, Console)
├── types/         # TypeScript type definitions and interfaces
├── utils/         # Utility functions and helpers
└── index.ts       # Main public API exports
```

### Key Design Patterns

- **Modular Architecture**: Separate concerns across CLI, core analysis, and output formatting
- **TypeScript-First**: Full type safety with comprehensive interfaces in `src/types/`
- **Streaming Processing**: Handle large repositories efficiently with chunked analysis
- **Progress Callbacks**: Real-time feedback for long-running operations
- **Configuration-Driven**: Flexible analysis through `.git-spark.json` config files

## Development Workflow

### Building & Testing

```bash
npm run build          # TypeScript compilation to dist/
npm test              # Jest test suite with 80%+ coverage requirement
npm run test:coverage # Coverage reporting
npm run lint          # ESLint + Prettier code quality
```

### CLI Development

- Main CLI entry: `bin/git-spark.js` → `src/cli/index.ts`
- Use Commander.js for argument parsing with TypeScript types
- HTML demo CLI: `scripts/cli-html-demo.ts` with comprehensive features
- Cross-platform scripts: PowerShell (`scripts/git-spark-html.ps1`) and Batch (`scripts/git-spark-html.bat`)

### API Development

- Public API surface in `src/index.ts`
- Main class: `GitSpark` in `src/core/`
- Quick functions: `analyze()` and `exportReport()` for simple usage
- Progress callbacks for UI integration

## Code Quality Standards

### TypeScript Conventions

- Strict TypeScript configuration with full type coverage
- Interface definitions in `src/types/` for all major data structures
- Generic types for flexible, reusable components
- No `any` types - use proper type definitions

### Testing Requirements

- Jest testing framework with ts-jest preset
- Minimum 80% code coverage (branches, functions, lines, statements)
- Test files: `**/__tests__/**/*.ts` and `**/*.test.ts`
- Integration tests for CLI and core functionality

### Performance Considerations

- Memory-efficient processing for 100k+ commits
- Configurable chunking (default: 1000 commits per batch)
- Buffer limits to prevent DoS attacks (default: 200MB)
- Caching system for redundant Git operations
- Streaming output generation for large reports

## Output Format Implementation

### HTML Reports (Primary Format)

- Bootstrap 5.1.3 for styling with CDN links
- Interactive charts and visualizations
- Security: HTML escaping for all user content
- Template-based generation with embedded CSS/JS
- Location: `src/output/html.ts`

### Export Formats

- **JSON**: Machine-readable for CI/CD integration
- **Console**: Color-coded terminal output with tables
- **Markdown**: Documentation-friendly format
- **CSV**: Separate files for authors, files, timeline data

## Git Repository Analytics Accuracy & Limitations

**CRITICAL PRINCIPLE**: Git Spark MUST maintain complete honesty and transparency about what can and cannot be determined from Git repository data alone. Never guess, estimate, or fabricate metrics that cannot be accurately derived from a standalone Git repository.

### Fundamental Git Data Limitations

#### What Git DOES Store:

- Commit metadata (author, committer, timestamp, message)
- File changes (additions, deletions, modifications)
- Branch and merge history
- Tag information
- Commit relationships and ancestry

#### What Git DOES NOT Store:

- **Code review data**: No reviewer information, approval status, or review comments
- **Pull/merge request metadata**: No PR numbers, descriptions, or review workflows
- **Issue tracking**: No bug reports, feature requests, or issue relationships
- **Deployment information**: No production deployments, rollbacks, or environment data
- **Team structure**: No organizational hierarchy, roles, or responsibilities
- **Work hours/timezone**: No actual working hours, time zones, or availability
- **Performance metrics**: No build times, test results, or runtime performance
- **External tool data**: No CI/CD results, monitoring data, or third-party integrations

### Honest Metric Naming & Reporting

#### ✅ CORRECT Approach:

- Use descriptive, limitation-aware naming: `reviewWorkflowParticipation` not `codeReviewCoverage`
- Include comprehensive limitations documentation for all metrics
- Clearly state estimation methods and data sources
- Provide warnings about metric reliability and interpretation
- Use qualifiers like "pattern", "workflow", "detected", "estimated"

#### ❌ INCORRECT Approach:

- Never claim to measure actual code review participation without platform API data
- Never report "test coverage" when only detecting test file patterns
- Never claim to measure "overtime" or "burnout" from commit timing alone
- Never report "vacation coverage" without actual HR/calendar data
- Never imply Git data provides complete team performance insights

### Required Transparency Features

#### Limitations Objects

All team metrics MUST include comprehensive limitations metadata:

```typescript
limitations: {
  dataSource: 'git-commits-only';
  estimationMethod: string;
  platformSpecific?: {
    detected: string;
    accuracy: 'high' | 'medium' | 'low';
    notes: string;
  };
  knownLimitations: string[];
  recommendedApproach: string;
}
```

#### User Education

- Clearly explain what each metric actually measures
- Provide context about Git data constraints
- Offer guidance on supplementing Git data with other sources
- Include warnings about misinterpretation risks

#### Platform Detection

- Recognize different Git hosting platforms (GitHub, GitLab, Azure DevOps)
- Acknowledge that Git data is fundamentally the same across platforms
- Explain that platform-specific features require API integration
- Provide accuracy indicators based on detected patterns

### Implementation Guidelines

#### When Adding New Metrics:

1. **Validate Data Availability**: Ensure the metric can be accurately calculated from Git data alone
2. **Honest Naming**: Use descriptive names that reflect actual capabilities
3. **Document Limitations**: Include comprehensive limitation warnings
4. **Provide Context**: Explain what the metric does and doesn't measure
5. **Test Accuracy**: Validate metric calculations against known repositories

#### When Reviewing Existing Metrics:

1. **Audit Accuracy**: Verify metrics don't overstate capabilities
2. **Update Names**: Change misleading names to honest descriptions
3. **Add Warnings**: Include limitation documentation where missing
4. **Enhance Education**: Improve user understanding of metric constraints

## Git Integration Patterns

### Safe Git Operations

- All Git commands are parameterized and validated
- Use `child_process.spawn()` with argument arrays (never shell strings)
- Comprehensive error handling for Git operation failures
- Repository validation before analysis

### Analysis Capabilities

- Commit history analysis with date range filtering
- Author and file-level metrics with risk scoring
- Temporal coupling analysis (expensive, requires `--heavy` flag)
- Branch comparison and diff analysis
- Governance scoring based on commit message patterns

### Ethical Analytics Principles

#### Transparency First

- Always declare data sources and limitations upfront
- Never obscure or minimize metric constraints
- Provide clear guidance on appropriate metric usage
- Educate users about Git analytics capabilities and boundaries

#### Prevent Misuse

- Include warnings against using metrics for performance reviews without context
- Emphasize that Git data reflects workflow patterns, not team performance
- Recommend supplementing Git analytics with other data sources
- Discourage drawing conclusions beyond what the data supports

#### Honest Communication

- Use precise language that reflects actual measurement capabilities
- Avoid marketing-speak or inflated claims about metric accuracy
- Acknowledge uncertainty and estimation in all derived metrics
- Provide confidence levels where applicable

### User Education Requirements

#### Documentation Standards

- Every metric must include clear explanation of calculation method
- Provide examples of what the metric does and doesn't indicate
- Include common misinterpretation warnings
- Offer guidance on combining metrics for better insights

#### Error Prevention

- Clear naming conventions that prevent confusion
- Prominent limitation warnings in user interfaces
- Educational tooltips and help text
- Examples of appropriate and inappropriate metric usage

## Configuration & Extensibility

### Configuration Schema

- `.git-spark.json` for project-specific settings
- Hierarchical config: CLI args → config file → defaults
- Configurable thresholds, weights, and exclusion patterns
- Example config structure in README.md

### Adding New Analysis Features

1. Define types in `src/types/`
2. Implement core logic in `src/core/`
3. Add output formatting in `src/output/`
4. Update CLI options in `src/cli/`
5. Add comprehensive tests
6. Update documentation

## Security & Enterprise Requirements

### Input Validation

- Sanitize all user inputs and file paths
- Path traversal protection for output directories
- Email redaction capability (`--redact-emails`)
- Buffer size limits for Git command output

### Error Handling

- Graceful degradation for missing Git repository
- Comprehensive error messages with actionable guidance
- Progress indicators for long-running operations
- Proper cleanup on interruption (SIGINT handling)

## Dependencies & Maintenance

### Core Dependencies

- **Commander.js**: CLI argument parsing and command structure
- **Chalk**: Terminal color output and formatting
- **Boxen**: Professional CLI output presentation
- **Date-fns**: Date manipulation and formatting
- **Glob**: File pattern matching for exclusions

### Development Dependencies

- **TypeScript 5.9+**: Latest TypeScript features and strict checking
- **Jest**: Testing framework with ts-jest integration
- **ESLint + Prettier**: Code quality and formatting
- **Rimraf**: Cross-platform file cleanup

### Version Requirements

- Node.js 18+ (specified in engines field)
- NPM package compatibility with modern toolchains
- Semantic versioning for releases

## Common Development Tasks

### Adding New Output Format

1. Create exporter class in `src/output/`
2. Implement interface with `generateOutput()` method
3. Add format option to CLI and types
4. Update factory pattern in core
5. Add format-specific tests

### Extending Analysis Metrics

1. Define metric interfaces in `src/types/`
2. Implement calculation logic in `src/core/`
3. Add configuration options for thresholds
4. Update all output formats to display new metrics
5. Add comprehensive test coverage

### CLI Enhancement

1. Add new commands/options in `src/cli/`
2. Update TypeScript types for options
3. Maintain backward compatibility
4. Update help documentation and README
5. Add integration tests for new functionality

## Testing Guidelines

### Unit Testing

- Test all public methods and error conditions
- Mock Git operations for consistent testing
- Use descriptive test names and organize in suites
- Maintain 80%+ coverage requirement

### Integration Testing

- Test complete workflows end-to-end
- Validate CLI interface with real Git repositories
- Test all output formats with sample data
- Performance testing with large datasets

Remember: Git Spark prioritizes enterprise reliability, performance at scale, comprehensive analytics, and **absolute honesty about data limitations**. All code should reflect these values with proper error handling, type safety, thorough testing, and transparent reporting of what can and cannot be determined from Git repository data alone. Never guess, estimate, or fabricate metrics that cannot be accurately derived from a standalone Git repository.
