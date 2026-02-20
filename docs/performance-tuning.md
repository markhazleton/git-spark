# Performance Tuning Guide

This guide provides recommendations for optimizing Git Spark's performance when analyzing large repositories and generating reports.

## Performance Benchmarks

Based on testing with the git-spark repository itself and various open-source projects:

| Repository Size | Commits | Files | Analysis Time | Memory Usage |
|-----------------|---------|-------|---------------|--------------|
| Small           | <1,000  | <500  | <5 seconds    | <100MB       |
| Medium          | 1,000-10,000 | 500-2,000 | 10-30 seconds | 100-300MB |
| Large           | 10,000-100,000 | 2,000-10,000 | 1-5 minutes | 300-500MB |
| Very Large      | >100,000 | >10,000 | 5-15 minutes | 500MB-1GB |

**Note:** Actual performance depends on hardware (CPU, disk I/O), repository structure, and analysis options.

---

## Optimization Strategies

### 1. Limit Analysis Time Range

The most effective way to improve performance is to limit the analysis window:

```bash
# Analyze only the last 30 days (fastest)
git-spark --days=30

# Analyze a specific quarter
git-spark --since=2026-01-01 --until=2026-03-31

# Analyze last 7 days for quick health checks
git-spark --days=7 --format=console
```

**Impact:** Reducing from 1 year to 30 days can improve speed by 10-20x for large repositories.

###  2. Use Branch Filtering

Analyze specific branches instead of the entire repository:

```bash
# Analyze only main branch
git-spark --branch=main

# Analyze feature branch
git-spark --branch=feature/new-analytics
```

**Impact:** 30-50% faster for repositories with many branches.

### 3. Exclude Non-Code Files

Skip documentation, configuration, and generated files:

```bash
# Exclude markdown and text files
git-spark --exclude-extensions=.md,.txt

# Exclude multiple file types
git-spark --exclude-extensions=.md,.txt,.log,.json,.xml,.yaml,.yml

# Focus only on source code
git-spark --exclude-extensions=.md,.txt,.json,.xml,.yaml,.yml,.lock,.sum
```

**Impact:** 20-40% faster analysis and smaller reports for documentation-heavy repositories.

### 4. Use Console Format for Quick Checks

For rapid analysis during development:

```bash
# Quick console output (no HTML generation)
git-spark --days=7 --format=console

# JSON for automation (faster than HTML)
git-spark --days=30 --format=json --output=./reports
```

**Impact:** Console format is 5-10x faster than HTML for large datasets.

### 5. Avoid Heavy Analysis Mode for Initial Runs

The `--heavy` flag enables expensive analyses. Skip it for initial exploration:

```bash
# Standard analysis (default, faster)
git-spark --days=30

# Heavy analysis (more detailed, slower)
git-spark --days=30 --heavy
```

**Impact:** Heavy mode adds 20-30% to analysis time but provides deeper insights.

---

## Azure DevOps Performance

When using Azure DevOps integration, caching is critical for performance.

### Cache Configuration

Configure cache settings in `.git-spark.json`:

```json
{
  "azureDevOps": {
    "cache": {
      "enabled": true,
      "ttlMinutes": 60,
      "maxSizeMB": 100
    }
  }
}
```

### Cache Optimization Tips

1. **First Run:** Initial analysis with Azure DevOps can take 2-5x longer due to API calls
2. **Subsequent Runs:** Cache hits reduce Azure DevOps overhead by 90%+
3. **Cache Invalidation:** Clear cache if data seems stale:
   ```bash
   rm -rf .git-spark-cache
   ```

### Rate Limiting

Azure DevOps API has rate limits (recommended: 200 requests/minute). Git Spark automatically throttles requests.

**For very large projects:**
- Use longer TTL (120-180 minutes) to reduce API calls
- Analyze smaller date ranges initially
- Let cache warm up over multiple runs

---

## Memory Management

Git Spark uses streaming processing to handle large repositories efficiently.

### Default Configuration

The default buffer size (200MB) works well for most repositories:

```json
{
  "performance": {
    "maxBuffer": 200,
    "chunkSize": 1000
  }
}
```

### For Very Large Repositories (>100k commits)

Increase buffer size in `.git-spark.json`:

```json
{
  "performance": {
    "maxBuffer": 500,
    "chunkSize": 2000
  }
}
```

**Warning:** Higher buffer sizes increase memory usage but improve performance for large datasets.

### Memory-Constrained Environments

Reduce buffer size for low-memory systems (e.g., CI/CD runners):

```json
{
  "performance": {
    "maxBuffer": 50,
    "chunkSize": 500
  }
}
```

---

## HTML Report Optimization

### Progressive Table Pagination

Large HTML reports use progressive loading for performance:

- Initial render: First 50 rows
- Click "Show more": Load additional rows incrementally
- Full dataset embedded as JSON for export

This keeps initial load time fast even for repos with 1000+ authors or files.

### Dark Mode Performance

Dark mode uses CSS variables for instant theme switching with minimal overhead. No re-rendering required.

### SVG Charts vs. External Libraries

Git Spark uses native SVG charts instead of Chart.js:

**Benefits:**
- No external JavaScript loading
- Smaller bundle size
- Faster initial page load
- Offline-capable reports

---

## CI/CD Integration Performance

### GitHub Actions

Optimize for CI/CD environments:

```yaml
- name: Run git-spark analysis
  run: |
    git-spark --days=7 --format=json --output=./reports
    # Skip heavy analysis in CI
```

### Caching in CI/CD

Cache the `.git-spark-cache` directory between runs:

```yaml
- uses: actions/cache@v3
  with:
    path: .git-spark-cache
    key: git-spark-cache-${{ github.sha }}
    restore-keys: |
      git-spark-cache-
```

**Impact:** 50-70% faster subsequent CI runs with Azure DevOps integration.

---

## Disk I/O Optimization

### Use SSD Storage

Git Spark performs many small file reads. SSD storage provides:
- 5-10x faster analysis on large repositories
- Better performance for Azure DevOps file cache

### File Cache Location

Place cache on fastest available disk:

```json
{
  "performance": {
    "cacheDir": "/path/to/fast/disk/.git-spark-cache"
  }
}
```

---

## Troubleshooting Performance Issues

### Slow Analysis (>10 minutes for <10k commits)

1. **Check disk I/O:** Use `iostat` or Task Manager to monitor disk activity
2. **Verify Git performance:** Run `git log --oneline | wc -l` to test git speed
3. **Disable Azure DevOps:** Test without `--azure-devops` flag to isolate issue
4. **Reduce date range:** Test with `--days=7` to verify baseline performance

### High Memory Usage (>1GB)

1. **Reduce buffer size** in `.git-spark.json`
2. **Use smaller chunks:** Set `chunkSize: 500` or lower
3. **Limit analysis range:** Use `--days` to reduce dataset
4. **Check for memory leaks:** Update to latest version

### Slow HTML Report Loading

1. **Check report size:** HTML files >10MB may load slowly
2. **Use JSON instead:** For programmatic access, JSON is faster
3. **Reduce analysis range:** Fewer commits = smaller HTML
4. **Limit hotspot tables:** Configure `maxHotspots` in `.git-spark.json`

---

## Configuration Reference

### Creating Your Configuration

The easiest way to create a `.git-spark.json` configuration file is with the interactive wizard:

```bash
# Interactive setup with prompts
git-spark init

# Quick setup with defaults
git-spark init --yes
```

The wizard guides you through setting days to analyze, output format, and file exclusions.

### Sample High-Performance Configuration

```json
{
  "analysis": {
    "excludeExtensions": [".md", ".txt", ".log"],
    "excludeAuthors": ["dependabot[bot]", "github-actions[bot]"]
  },
  "performance": {
    "maxBuffer": 300,
    "enableCaching": true,
    "cacheDir": ".git-spark-cache",
    "chunkSize": 1500
  },
  "azureDevOps": {
    "cache": {
      "enabled": true,
      "ttlMinutes": 90,
      "maxSizeMB": 150
    }
  }
}
```

### Sample Memory-Efficient Configuration

```json
{
  "performance": {
    "maxBuffer": 50,
    "enableCaching": true,
    "chunkSize": 500
  },
  "azureDevOps": {
    "cache": {
      "enabled": true,
      "ttlMinutes": 60,
      "maxSizeMB": 50
    }
  }
}
```

---

## Best Practices Summary

1. ✅ **Start small:** Use `--days=7` for initial testing
2. ✅ **Use caching:** Enable all caching options for repeated analysis
3. ✅ **Exclude non-code files:** Use `--exclude-extensions` for faster analysis
4. ✅ **Choose right format:** Console for quick checks, JSON for automation, HTML for presentations
5. ✅ **Monitor resources:** Watch memory and disk I/O during analysis
6. ✅ **Update regularly:** New versions often include performance improvements
7. ✅ **Use SSD storage:** Dramatically improves I/O-bound operations
8. ✅ **Cache in CI/CD:** Reuse Azure DevOps cache between runs

---

## Performance Metrics

### Real-World Examples

**Git Spark Repository** (small):
- Commits: ~300+ (at v1.2.0)
- Analysis time: 2-3 seconds
- HTML size: ~500KB
- Memory: ~50MB

**Medium Open Source Project:**
- Commits: ~5,000
- Analysis time: 15-20 seconds
- HTML size: ~2MB
- Memory: ~200MB

**Large Enterprise Repository:**
- Commits: ~50,000
- Analysis time: 2-3 minutes
- HTML size: ~8MB
- Memory: ~400MB

---

## Getting Help

If you experience persistent performance issues:

1. Check [GitHub Issues](https://github.com/MarkHazleton/git-spark/issues) for known issues
2. Run with `--log-level=debug` to diagnose problems
3. Share performance metrics when reporting issues:
   - Repository size (commits, files, authors)
   - Analysis time
   - Memory usage
   - System specifications

---

**Last Updated:** February 2026
**Git Spark Version:** 1.2.0+
