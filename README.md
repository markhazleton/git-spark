# 🔥 Git Spark

[![npm version](https://badge.fury.io/js/git-spark.svg)](https://badge.fury.io/js/git-spark)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://github.com/MarkHazleton/git-spark/workflows/Node.js%20CI/badge.svg)](https://github.com/MarkHazleton/git-spark/actions)

## Enterprise-grade Git repository analytics and reporting tool

Git Spark provides transparent, honest insights into Git repository health, team organization patterns, and code quality through comprehensive analysis of commit history. **We are committed to reporting only what can be accurately derived from Git repository data alone** - never guessing, estimating, or fabricating metrics from unavailable data sources. Built for enterprise environments with performance, reliability, security, and analytical integrity in mind.

## ✨ Features

### 📊 Comprehensive Analytics

- **Repository Health Scoring** - Overall health assessment with actionable recommendations
- **Team Organization Analysis** - File ownership patterns, developer specialization, and team structure
- **Code Quality Metrics** - Risk assessment, hotspot identification, and governance scoring
- **Timeline Visualization** - Activity patterns and trend analysis
- **Bus Factor Calculation** - Knowledge concentration and team resilience metrics

> **🔍 Analytical Integrity Promise**: All metrics are transparently calculated from Git repository data only. We clearly document what each metric measures, its limitations, and what it cannot determine. No guesswork, no extrapolation beyond available data.

### 🎯 Enterprise-Ready

- **High Performance** - Process 100k+ commits efficiently with memory optimization
- **Multiple Output Formats** - HTML, JSON, Markdown, CSV, and console output
- **Configurable Analysis** - Customizable thresholds, weights, and filtering options
- **Security Focused** - Input validation, safe file handling, and email redaction
- **CI/CD Integration** - JSON output for automated analysis and reporting

### 🛠️ Developer Experience

- **CLI Interface** - Intuitive command-line tool with progress indicators
- **Programmatic API** - TypeScript/JavaScript library for custom integrations
- **Interactive Reports** - Rich, security‑hardened HTML reports with advanced visualizations
- **Comprehensive Documentation** - Examples, tutorials, and best practices

> **Note**: This is version 1.0 with core analytics features fully implemented. Advanced features like branch comparison, watch mode, and API server are planned for future releases (see [Roadmap](#-roadmap) section).

### 🖥️ Interactive HTML Report (v1.0)

Enterprise-focused, accessible, and secure analytics dashboard:

- **Multi‑Series Timeline** – Commits, churn (lines changed), and active authors with dataset toggles
- **Risk Factors Bar Chart** – Visual breakdown of churn, recency, ownership, coupling potential, and knowledge concentration inputs
- **Governance Radar Chart** – Conventional commit adherence, traceability, message quality, WIP/revert penalties
- **Dark Mode Toggle (Persistent)** – Remembers preference via localStorage; charts dynamically re-theme
- **One‑Click Data Export** – Download embedded JSON or CSV bundles directly from the report (offline capable)
- **Progressive Table Pagination** – “Show more” incremental reveal for large author/file sets (performance friendly)
- **Dataset Toggles & Live Updates** – Enable/disable series without reloading page
- **Open Graph Preview Image** – Auto‑generated SVG summary for social sharing & link unfurling
- **Accessibility Enhancements** – ARIA live region announcements for sorting; keyboard focus management; reduced‑motion compliance
- **Security‑First Delivery** – Strict CSP with SHA‑256 hashed inline script & style blocks (no `unsafe-inline`), SRI‑pinned Chart.js, single trusted CDN origin
- **Email Redaction Option** – Controlled via CLI flag (`--redact-emails`) for privacy sensitive audits
- **Transparent Metrics Documentation** – Every team metric includes comprehensive limitations and data source explanations

> **Analytical Integrity**: All analytics data are embedded (no external calls) ensuring the report is a self-contained artifact suitable for air‑gapped review workflows. Every metric includes honest explanations of what Git data can and cannot reveal.

## 🚀 Quick Start

### Installation

```bash
# Global installation for CLI usage
npm install -g git-spark

# Local installation for programmatic usage
npm install git-spark
```

### Basic Usage

```bash
# Analyze current repository (last 30 days)
git-spark --days=30

# Generate HTML report
git-spark --format=html --output=./reports

# Analyze specific date range
git-spark --since=2024-01-01 --until=2024-12-31

# Quick health check
git-spark health

# Validate environment
git-spark validate

# Enable heavy analysis for detailed insights  
git-spark --heavy --format=html
```

### Programmatic Usage

```typescript
import { GitSpark, analyze } from 'git-spark';

// Quick analysis
const report = await analyze('/path/to/repo', { days: 30 });

// Advanced usage with options
const gitSpark = new GitSpark({
  repoPath: '/path/to/repo',
  since: '2024-01-01',
  format: 'html',
  output: './reports'
});

const report = await gitSpark.analyze();
await gitSpark.export('html', './reports');
```

## 📖 Documentation

### CLI Commands

#### `git-spark [options]`

Main analysis command with comprehensive options:

```bash
git-spark [options]

Options:
  -d, --days <number>        analyze last N days
  -s, --since <date>         start date (YYYY-MM-DD)
  -u, --until <date>         end date (YYYY-MM-DD)
  -f, --format <format>      output format (html|json|console|markdown|csv)
  -o, --output <path>        output directory (default: "./reports")
  -c, --config <path>        configuration file
  -b, --branch <name>        analyze specific branch
  -a, --author <name>        filter by author
  -p, --path <glob>          filter by file path pattern
  --heavy                    enable expensive analyses
  --log-level <level>        logging verbosity (error|warn|info|debug|verbose)
  --no-cache                 disable caching
  --redact-emails            redact email addresses in reports
  -h, --help                 display help for command
```

#### `git-spark analyze`

Detailed analysis with additional options:

```bash
git-spark analyze [options]

Options:
  -r, --repo <path>          repository path (default: current directory)
  [all main command options]
```

#### `git-spark health`

Quick repository health assessment:

```bash
git-spark health [options]

Options:
  -r, --repo <path>          repository path (default: current directory)
```

#### `git-spark validate`

Environment and requirements validation:

```bash
git-spark validate
```

### Configuration

Create a `.git-spark.json` configuration file to customize analysis:

> **Note**: Configuration file support is implemented for basic options. Advanced configuration features may be expanded in future versions.

```json
{
  "version": "1.0",
  "analysis": {
    "excludePaths": [
      "node_modules/**",
      "dist/**",
      "build/**",
      ".git/**"
    ],
    "excludeAuthors": [
      "dependabot[bot]",
      "github-actions[bot]"
    ],
    "thresholds": {
      "largeCommitLines": 500,
      "smallCommitLines": 50,
      "staleBranchDays": 30,
      "largeFileKB": 300,
      "hotspotAuthorThreshold": 3
    },
    "weights": {
      "risk": {
        "churn": 0.35,
        "recency": 0.25,
        "ownership": 0.20,
        "entropy": 0.10,
        "coupling": 0.10
      },
      "governance": {
        "conventional": 0.40,
        "traceability": 0.25,
        "length": 0.15,
        "wipPenalty": 0.10,
        "revertPenalty": 0.05,
        "shortPenalty": 0.05
      }
    }
  },
  "output": {
    "defaultFormat": "html",
    "outputDir": "./reports",
    "includeCharts": true,
    "redactEmails": false,
    "theme": "default"
  },
  "performance": {
    "maxBuffer": 200,
    "enableCaching": true,
    "cacheDir": ".git-spark-cache",
    "chunkSize": 1000
  }
}
```

### API Reference

#### `GitSpark` Class

```typescript
class GitSpark {
  constructor(options: GitSparkOptions, progressCallback?: ProgressCallback)
  
  async analyze(): Promise<AnalysisReport>
  async export(format: OutputFormat, outputPath: string): Promise<void>
  
  static getDefaultConfig(): GitSparkConfig
}
```

#### `GitSparkOptions` Interface

```typescript
interface GitSparkOptions {
  repoPath?: string;           // Repository path
  since?: string;              // Start date (YYYY-MM-DD)
  until?: string;              // End date (YYYY-MM-DD)
  days?: number;               // Last N days
  branch?: string;             // Specific branch
  author?: string;             // Author filter
  path?: string;               // Path filter
  format?: OutputFormat;       // Output format
  output?: string;             // Output directory
  config?: string;             // Config file path
  heavy?: boolean;             // Enable expensive analyses
  logLevel?: LogLevel;         // Log level
  noCache?: boolean;           // Disable caching
}
```

#### Quick Functions

```typescript
// Quick analysis function
async function analyze(
  repoPath?: string, 
  options?: Partial<GitSparkOptions>
): Promise<AnalysisReport>

// Quick export function
async function exportReport(
  report: AnalysisReport,
  format: OutputFormat,
  outputPath: string
): Promise<void>
```

## � Analytical Integrity & Data Limitations

### Our Commitment to Honest Analytics

Git Spark is built on a foundation of **complete transparency** about what can and cannot be determined from Git repository data alone. We never guess, estimate, or fabricate metrics from unavailable data sources.

### What Git Data CAN Provide

✅ **Commit metadata**: Author, committer, timestamp, message  
✅ **File changes**: Additions, deletions, modifications  
✅ **Branch and merge history**: Repository structure and workflow patterns  
✅ **Temporal patterns**: When changes occurred based on commit timing  
✅ **Contribution patterns**: Who worked on what files and when  

### What Git Data CANNOT Provide

❌ **Code review data**: No reviewer information, approval status, or review comments  
❌ **Pull/merge request metadata**: No PR numbers, descriptions, or review workflows  
❌ **Issue tracking**: No bug reports, feature requests, or issue relationships  
❌ **Deployment information**: No production deployments, rollbacks, or environment data  
❌ **Team structure**: No organizational hierarchy, roles, or responsibilities  
❌ **Work hours/timezone**: No actual working hours, vacation schedules, or availability  
❌ **Performance metrics**: No build times, test results, or runtime performance  

### Our Honest Metric Approach

- **Transparent Naming**: Metric names clearly indicate data source limitations
- **Comprehensive Documentation**: Every metric includes limitation warnings
- **Platform Detection**: We identify hosting platforms but acknowledge Git data is fundamentally the same
- **Educational Focus**: We help users understand what metrics do and don't measure
- **No False Claims**: We never imply Git data provides complete team performance insights

### User Education & Responsible Usage

All team-related metrics include detailed explanations of:

- What the metric actually measures from Git data
- Known limitations and potential misinterpretations  
- Recommended approaches for supplementing Git analytics
- Warnings against using metrics for performance reviews without context

## �📊 Report Formats

### HTML Reports

Interactive reports with transparent analytics and comprehensive limitations documentation:

- Executive summary with health rating and data source explanations
- Interactive charts and visualizations (multi‑series timelines, risk & governance analytics)
- Detailed author and file analysis with clear metric definitions
- Risk assessment and recommendations with calculation transparency
- Governance scoring with methodology explanations
- **Comprehensive limitations documentation** for all team metrics
- Export buttons (JSON + CSV) for downstream processing
- Dark mode, accessibility features, and CSP/SRI security hardening

> **Transparency First**: Every metric in the HTML report includes clear explanations of what it measures, its data sources, and its limitations. Users receive honest, educational information about Git analytics capabilities.

### JSON Reports

Machine-readable format for:

- CI/CD integration
- Custom tooling integration
- Data processing and analysis
- API consumption

### Console Output

Terminal-friendly format with:

- Color-coded health indicators
- Tabular data presentation
- Progress indicators
- Quick insights and recommendations

### Markdown Reports

Documentation-friendly format for:

- README integration
- Wiki documentation
- Version control tracking
- Collaboration and sharing

### CSV Exports

Spreadsheet-compatible format with separate files for:

- `authors.csv` - Author statistics and metrics
- `files.csv` - File-level analysis and risk scores
- `timeline.csv` - Daily activity and trends

## 🔍 Analysis Details

### Repository Health Score

Composite metric based on:

- **Commit Frequency** - Regular development activity
- **Author Diversity** - Distributed knowledge and contributions
- **Commit Size Distribution** - Balanced change patterns
- **Governance Adherence** - Code quality and standards compliance

### Risk Analysis

File-level risk assessment considering:

- **Code Churn** - Frequency and volume of changes
- **Author Count** - Number of different contributors
- **Recency** - How recently files were modified
- **Ownership Distribution** - Knowledge concentration
- **Temporal Coupling** - Files that change together (planned for v1.1)

### Governance Scoring

Code quality metrics including:

- **Conventional Commits** - Structured commit message adherence
- **Traceability** - Issue references and linking
- **Message Quality** - Length and descriptiveness
- **WIP Detection** - Work-in-progress identification
- **Revert Analysis** - Error correction patterns

### Team Analytics

Team organization and specialization insights covering:

- **Developer Specialization** - Measures how unique each developer's file set is compared to others, promoting clear areas of responsibility
- **File Ownership Clarity** - Percentage of files with single-author ownership, indicating clear responsibility boundaries  
- **Organization Efficiency** - Low file overlap between developers, suggesting better task distribution and reduced conflicts
- **Commit Time Patterns** - Work timing analysis based on commit timestamps (not actual working hours)
- **Team Active Coverage** - Days with multiple contributors (estimated pattern, not actual vacation coverage)

> **⚠️ Important Approach**: The Team Organization Score measures specialization and clear ownership rather than traditional collaboration. High scores indicate well-organized teams with distinct areas of responsibility, which typically reduces conflicts and improves efficiency. Very high scores may sometimes indicate knowledge silos, while very low scores suggest unclear ownership or coordination issues. All metrics include comprehensive limitation documentation to prevent misinterpretation.

## 🏗️ CI/CD Integration

### GitHub Actions

```yaml
name: Repository Analysis
on: [push, pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Full history for analysis
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install git-spark
        run: npm install -g git-spark
      
      - name: Run analysis
        run: git-spark --format=json --output=./reports
      
      - name: Upload reports
        uses: actions/upload-artifact@v3
        with:
          name: git-spark-reports
          path: ./reports/
```

### GitLab CI

```yaml
repository_analysis:
  stage: analysis
  image: node:18
  script:
    - npm install -g git-spark
    - git-spark --format=json --output=./reports
  artifacts:
    paths:
      - reports/
    expire_in: 1 week
  only:
    - main
    - develop
```

## 🔒 Security Considerations

Git Spark is designed with security in mind:

- **Input Validation** - All user inputs are validated and sanitized
- **Path Traversal Protection** - Safe file path handling
- **Email Redaction** - Optional email address anonymization
- **Buffer Limits** - Configurable limits to prevent DoS attacks
- **No Arbitrary Execution** - Git commands are parameterized and safe
- **Dependency Security** - Minimal dependencies with security auditing
- **Strict Content Security Policy** - Inline script & style blocks hashed (SHA‑256); no `unsafe-inline` or dynamic eval
- **Subresource Integrity (SRI)** - External Chart.js resource locked to integrity hash
- **Single External Origin** - Minimizes supply chain surface
- **Escaped Dynamic Content** - All user / repo derived strings safely encoded in HTML output

## 🎯 Performance

Optimized for large repositories:

- **Streaming Processing** - Handle massive repositories without memory issues
- **Intelligent Caching** - Avoid redundant Git operations
- **Chunked Analysis** - Process commits in configurable batches
- **Memory Management** - Efficient data structures and garbage collection
- **Progress Tracking** - Real-time progress indicators for long operations

**Benchmarks:**

- 10k commits: ~10 seconds
- 100k commits: ~2 minutes
- Memory usage: <500MB for 100k commits

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- --testNamePattern="GitSpark"

# Run integration tests
npm run test:integration
```

## 🤝 Contributing

We welcome contributions! Please see our [GitHub Issues](https://github.com/MarkHazleton/git-spark/issues) to get started or open a new issue to discuss your ideas.

### Development Setup

```bash
# Clone repository
git clone https://github.com/MarkHazleton/git-spark.git
cd git-spark

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Start development mode
npm run dev
```

### Code Standards

- **TypeScript** - Full type safety and modern JavaScript features
- **ESLint + Prettier** - Consistent code formatting and quality
- **Jest Testing** - Comprehensive test coverage (>80%)
- **Semantic Versioning** - Clear version management
- **Conventional Commits** - Structured commit messages

## 📋 Roadmap

### ✅ Completed (v1.0)

- **Transparent Team Metrics**: Honest metric terminology with comprehensive limitations documentation
- **Analytical Integrity Framework**: Clear separation between what Git data can and cannot provide
- **Enhanced User Education**: Comprehensive warnings and guidance about metric interpretation
- Secure HTML report with strict CSP + SRI
- Multi‑series activity timeline (commits / churn / authors)
- Risk factor aggregation & visualization
- Governance radar visualization
- Dark mode with adaptive chart theming
- One‑click JSON & CSV export from report UI
- Pagination & performance safeguards for large tables
- Accessibility improvements (ARIA live sort announcements, keyboard navigation, reduced motion support)
- OG image (SVG) generation for social/link previews
- Email redaction option

These capabilities establish a foundation of **analytical honesty and transparency** that will guide all future development, ensuring users have accurate expectations about Git repository analytics.

### v1.1 (Planned)

- [ ] Branch comparison and diff analysis (`--compare` option)
- [ ] Continuous monitoring mode (`--watch` option)
- [ ] Historical trend analysis and forecasting
- [ ] Advanced temporal coupling analysis
- [ ] Custom risk scoring models

### v1.2 (Future)

- [ ] API server mode for remote analysis
- [ ] Machine learning-based anomaly detection
- [ ] Integration with code quality tools (SonarQube, CodeClimate)
- [ ] Real-time monitoring and alerting
- [ ] Multi-repository analysis and benchmarking
- [ ] Advanced visualization with D3.js

### v2.0 (Vision)

- [ ] Web dashboard and UI
- [ ] Database persistence (SQLite/PostgreSQL)
- [ ] User authentication and authorization
- [ ] Team management and permissions
- [ ] Webhook integrations and notifications

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Git Community** - For the powerful version control system
- **Open Source Contributors** - For the excellent libraries and tools
- **Enterprise Users** - For feedback and requirements validation
- **TypeScript Team** - For the robust type system

## 📞 Support

- **Documentation**: [GitHub Wiki](https://github.com/MarkHazleton/git-spark/wiki)
- **Issues**: [GitHub Issues](https://github.com/MarkHazleton/git-spark/issues)
- **Discussions**: [GitHub Discussions](https://github.com/MarkHazleton/git-spark/discussions)
- **Email**: [mark@markhazleton.com](mailto:mark@markhazleton.com)

---

Built with ❤️ and unwavering commitment to analytical honesty for the developer community

> Git Spark prioritizes transparency, accuracy, and user education above all else. We believe developers deserve honest, reliable analytics that clearly communicate both capabilities and limitations.
