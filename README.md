# 🔥 Git Spark

[![npm version](https://badge.fury.io/js/git-spark.svg)](https://badge.fury.io/js/git-spark)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://github.com/MarkHazleton/git-spark/workflows/Node.js%20CI/badge.svg)](https://github.com/MarkHazleton/git-spark/actions)

**Enterprise-grade Git repository analytics and reporting tool**

Git Spark provides actionable insights into Git repository health, team collaboration patterns, and code quality through comprehensive analysis of commit history. Built for enterprise environments with performance, reliability, and security in mind.

## ✨ Features

### 📊 Comprehensive Analytics

- **Repository Health Scoring** - Overall health assessment with actionable recommendations
- **Team Collaboration Analysis** - Contribution patterns, work distribution, and team dynamics
- **Code Quality Metrics** - Risk assessment, hotspot identification, and governance scoring
- **Timeline Visualization** - Activity patterns and trend analysis
- **Bus Factor Calculation** - Knowledge concentration and team resilience metrics

### 🎯 Enterprise-Ready

- **High Performance** - Process 100k+ commits efficiently with memory optimization
- **Multiple Output Formats** - HTML, JSON, Markdown, CSV, and console output
- **Configurable Analysis** - Customizable thresholds, weights, and filtering options
- **Security Focused** - Input validation, safe file handling, and email redaction
- **CI/CD Integration** - JSON output for automated analysis and reporting

### 🛠️ Developer Experience

- **CLI Interface** - Intuitive command-line tool with progress indicators
- **Programmatic API** - TypeScript/JavaScript library for custom integrations
- **Interactive Reports** - Rich HTML reports with charts and visualizations
- **Comprehensive Documentation** - Examples, tutorials, and best practices

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
  --heavy                    enable expensive analyses (coupling)
  --log-level <level>        logging verbosity (error|warn|info|debug|verbose)
  --no-cache                 disable caching
  --compare <branch>         compare with another branch
  --watch                    continuous monitoring mode
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
  compare?: string;            // Comparison branch
  watch?: boolean;             // Watch mode
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

## 📊 Report Formats

### HTML Reports

Interactive reports with:

- Executive summary with health rating
- Interactive charts and visualizations
- Detailed author and file analysis
- Risk assessment and recommendations
- Governance scoring and insights

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
- **Temporal Coupling** - Files that change together (with --heavy option)

### Governance Scoring

Code quality metrics including:

- **Conventional Commits** - Structured commit message adherence
- **Traceability** - Issue references and linking
- **Message Quality** - Length and descriptiveness
- **WIP Detection** - Work-in-progress identification
- **Revert Analysis** - Error correction patterns

### Team Analytics

Collaboration insights covering:

- **Contribution Patterns** - Individual and team metrics
- **Work Distribution** - Balanced vs concentrated effort
- **Temporal Patterns** - Work timing and consistency
- **Bus Factor** - Knowledge concentration risks
- **Collaboration Networks** - Team interaction patterns

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

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

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

### v1.1 (Planned)

- [ ] Branch comparison and diff analysis
- [ ] Historical trend analysis and forecasting
- [ ] Advanced temporal coupling analysis
- [ ] Custom risk scoring models
- [ ] API server mode for remote analysis

### v1.2 (Future)

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

**Built with ❤️ for the developer community**
