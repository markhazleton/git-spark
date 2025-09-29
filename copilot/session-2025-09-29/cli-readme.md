# Git Spark HTML Report CLI

This document provides comprehensive instructions for generating HTML reports from the command line using various interfaces.

## 🚀 Quick Start

The fastest way to generate an HTML report:

```bash
# Using TypeScript directly
npx ts-node scripts/cli-html-demo.ts

# Using PowerShell (Windows)
.\scripts\git-spark-html.ps1

# Using Batch (Windows)
.\scripts\git-spark-html.bat
```

## 📋 Available CLI Options

All CLI interfaces support the same core options:

| Option | Short | Description | Example |
|--------|-------|-------------|---------|
| `--repo` | `-r` | Repository path to analyze | `--repo /path/to/repo` |
| `--output` | `-o` | Output directory for reports | `--output ./my-reports` |
| `--days` | `-d` | Analyze last N days | `--days 30` |
| `--since` | `-s` | Start date (YYYY-MM-DD) | `--since 2024-01-01` |
| `--until` | `-u` | End date (YYYY-MM-DD) | `--until 2024-12-31` |
| `--branch` | `-b` | Analyze specific branch | `--branch main` |
| `--author` | `-a` | Filter by author | `--author john@example.com` |
| `--path-pattern` | `-p` | Filter files by pattern | `--path-pattern "**/*.ts"` |
| `--heavy` | | Enable detailed analysis | `--heavy` |
| `--open` | | Open report in browser | `--open` |
| `--serve` | | Start HTTP server | `--serve` |
| `--port` | | Server port number | `--port 8080` |

## 🛠️ CLI Interface Options

### 1. TypeScript CLI (Cross-platform)

**File**: `scripts/cli-html-demo.ts`

```bash
# Basic usage
npx ts-node scripts/cli-html-demo.ts

# With options
npx ts-node scripts/cli-html-demo.ts --days 30 --heavy --serve

# Complete example
npx ts-node scripts/cli-html-demo.ts \
  --repo /path/to/repo \
  --days 60 \
  --branch develop \
  --author "john@example.com" \
  --path-pattern "**/*.{ts,js}" \
  --heavy \
  --output ./detailed-reports \
  --serve \
  --port 8080
```

### 2. PowerShell CLI (Windows)

**File**: `scripts/git-spark-html.ps1`

```powershell
# Basic usage
.\scripts\git-spark-html.ps1

# With parameters
.\scripts\git-spark-html.ps1 -Days 30 -Heavy -Serve

# Complete example
.\scripts\git-spark-html.ps1 `
  -RepoPath "C:\Projects\MyRepo" `
  -Days 60 `
  -Branch "develop" `
  -Author "john@example.com" `
  -PathPattern "**/*.{ts,js}" `
  -Heavy `
  -OutputPath ".\detailed-reports" `
  -Serve `
  -Port 8080
```

### 3. Batch CLI (Windows)

**File**: `scripts/git-spark-html.bat`

```cmd
REM Basic usage
scripts\git-spark-html.bat

REM With options
scripts\git-spark-html.bat --days 30 --heavy --serve

REM Complete example
scripts\git-spark-html.bat ^
  --repo "C:\Projects\MyRepo" ^
  --days 60 ^
  --branch develop ^
  --author john@example.com ^
  --path-pattern "**/*.ts" ^
  --heavy ^
  --output .\detailed-reports ^
  --serve ^
  --port 8080
```

## 📊 Common Usage Patterns

### Basic Repository Analysis

```bash
# Current repository, default settings
npx ts-node scripts/cli-html-demo.ts

# Specific repository
npx ts-node scripts/cli-html-demo.ts --repo /path/to/repo
```

### Time-based Analysis

```bash
# Last 30 days
npx ts-node scripts/cli-html-demo.ts --days 30

# Specific date range
npx ts-node scripts/cli-html-demo.ts --since 2024-01-01 --until 2024-06-30

# This year only
npx ts-node scripts/cli-html-demo.ts --since 2024-01-01
```

### Branch and Author Filtering

```bash
# Specific branch
npx ts-node scripts/cli-html-demo.ts --branch main

# Specific author
npx ts-node scripts/cli-html-demo.ts --author john@example.com

# Multiple filters
npx ts-node scripts/cli-html-demo.ts --branch develop --author team-lead@company.com
```

### File Type Analysis

```bash
# TypeScript files only
npx ts-node scripts/cli-html-demo.ts --path-pattern "**/*.ts"

# Source code files
npx ts-node scripts/cli-html-demo.ts --path-pattern "src/**/*.{js,ts,jsx,tsx}"

# Documentation files
npx ts-node scripts/cli-html-demo.ts --path-pattern "**/*.{md,rst,txt}"
```

### Advanced Analysis

```bash
# Heavy analysis (detailed insights)
npx ts-node scripts/cli-html-demo.ts --heavy

# Heavy analysis with time filter
npx ts-node scripts/cli-html-demo.ts --days 90 --heavy

# Complete analysis
npx ts-node scripts/cli-html-demo.ts --heavy --days 365 --branch main
```

### Server and Browser Integration

```bash
# Generate and open in browser
npx ts-node scripts/cli-html-demo.ts --open

# Start HTTP server
npx ts-node scripts/cli-html-demo.ts --serve

# Custom port
npx ts-node scripts/cli-html-demo.ts --serve --port 8080

# Server with heavy analysis
npx ts-node scripts/cli-html-demo.ts --heavy --serve --port 3000
```

## 🗂️ Output Structure

```
reports/
└── git-spark-report.html     # Main HTML report (self-contained)
```

The generated HTML report includes:

- **Repository Summary**: Health scores, commit counts, contributor stats
- **Interactive Charts**: Commit trends, author contributions, file hotspots
- **Detailed Tables**: Top contributors, risky files, governance metrics
- **Bootstrap Styling**: Professional, responsive design
- **Self-contained**: All dependencies via CDN, no external files needed

## 🌐 HTTP Server Features

When using `--serve`, the CLI starts a local HTTP server with:

- **CORS enabled** for local development
- **Graceful shutdown** (Ctrl+C)
- **404 handling** for missing resources
- **UTF-8 encoding** for proper character display
- **Static file serving** for the HTML report

Server URLs:

- Main report: `http://localhost:3000/`
- Alternative: `http://localhost:3000/index.html`

## 🔧 Configuration Examples

### Team Lead Dashboard

```bash
# Weekly team overview with detailed analysis
npx ts-node scripts/cli-html-demo.ts \
  --days 7 \
  --heavy \
  --output ./weekly-reports \
  --serve
```

### Code Quality Audit

```bash
# Focus on source code with heavy analysis
npx ts-node scripts/cli-html-demo.ts \
  --path-pattern "src/**/*.{js,ts,jsx,tsx}" \
  --heavy \
  --days 30 \
  --output ./quality-audit
```

### Release Analysis

```bash
# Analyze specific branch for release
npx ts-node scripts/cli-html-demo.ts \
  --branch release/v2.0 \
  --since 2024-01-01 \
  --heavy \
  --output ./release-analysis \
  --open
```

### Developer Contribution Report

```bash
# Individual developer analysis
npx ts-node scripts/cli-html-demo.ts \
  --author "developer@company.com" \
  --days 90 \
  --output ./dev-contributions
```

## 🚨 Troubleshooting

### Common Issues

1. **"Module not found" errors**

   ```bash
   # Ensure dependencies are installed
   npm install
   
   # Build the project
   npm run build
   ```

2. **PowerShell execution policy**

   ```powershell
   # Enable script execution
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

3. **Port already in use**

   ```bash
   # Use a different port
   npx ts-node scripts/cli-html-demo.ts --serve --port 8080
   ```

4. **Large repository analysis**

   ```bash
   # Use time filtering for better performance
   npx ts-node scripts/cli-html-demo.ts --days 30
   ```

### Performance Tips

- Use `--days` to limit analysis scope for large repositories
- Avoid `--heavy` for quick overviews
- Use `--path-pattern` to focus on specific file types
- Consider `--branch` filtering for multi-branch repositories

## 📚 Help and Documentation

Each CLI interface provides built-in help:

```bash
# TypeScript CLI help
npx ts-node scripts/cli-html-demo.ts --help

# PowerShell help
Get-Help .\scripts\git-spark-html.ps1 -Full

# Batch help
scripts\git-spark-html.bat --help
```

## 🎯 Next Steps

After generating your HTML report:

1. **Review the Report**: Open the generated HTML file in your browser
2. **Share with Team**: The HTML file is self-contained and portable
3. **Automate Generation**: Use the CLI in CI/CD pipelines
4. **Schedule Reports**: Set up regular report generation
5. **Customize Analysis**: Experiment with different filters and options

The HTML reports provide comprehensive insights into repository health, contributor activity, code quality, and governance metrics.
