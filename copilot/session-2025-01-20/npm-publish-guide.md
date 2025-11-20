# Git Spark - NPM Publishing Guide

## Current Status

- **Local Version**: 1.0.262
- **Published Version**: 1.0.223 (npm)
- **Gap**: 39 unpublished versions
- **Test Status**: ✅ 227/227 tests passing
- **Test Coverage**: 56% (below 70% target)

## Recent Improvements (Session 2025-01-20)

### ✅ Completed Fixes

1. **Updated `.gitignore`** - Added comprehensive test output patterns to prevent test artifacts from cluttering the working tree:
   - `test-*.html`
   - `test*.html`
   - `*-test-*.html`

2. **Removed auto-versioning** - Modified `package.json` prebuild script to stop automatically incrementing version on every build:
   - **Before**: `npm version patch --no-git-tag-version && node scripts/generate-version.js`
   - **After**: `node scripts/generate-version.js`

3. **Cleaned working tree** - Removed uncommitted `test-results.html` file (108,611 lines)

### 🔄 In Progress

- **Test Coverage Improvement**: Currently at 56%, need to reach 70% target before publishing

## NPM Publishing Process

### Pre-Publishing Checklist

Before publishing to npm, ensure:

- [ ] All tests pass: `npm test`
- [ ] Test coverage meets thresholds (currently 56%, target 70%):
  ```bash
  npm run test:coverage
  ```
- [ ] Build succeeds without errors: `npm run build`
- [ ] No uncommitted changes in working tree: `git status`
- [ ] CHANGELOG.md is updated with release notes
- [ ] Version number is manually bumped

### Manual Version Bumping

Now that auto-versioning is disabled, manually increment version using:

```bash
# Patch release (1.0.262 → 1.0.263) - Bug fixes, minor changes
npm version patch --no-git-tag-version

# Minor release (1.0.262 → 1.1.0) - New features, backward compatible
npm version minor --no-git-tag-version

# Major release (1.0.262 → 2.0.0) - Breaking changes
npm version major --no-git-tag-version
```

Then regenerate version file:
```bash
node scripts/generate-version.js
```

### Publishing to NPM

1. **Verify Package Contents**:
   ```bash
   npm pack --dry-run
   ```
   This shows what files will be included in the package.

2. **Build Distribution**:
   ```bash
   npm run build
   ```
   Compiles TypeScript to `dist/` directory.

3. **Publish to NPM**:
   ```bash
   npm publish
   ```
   Requires npm authentication. Use `npm login` if not already authenticated.

4. **Verify Publication**:
   ```bash
   npm view git-spark version
   ```
   Should show the newly published version.

5. **Tag Git Repository**:
   ```bash
   git tag v1.0.263
   git push origin v1.0.263
   ```

### Handling the 39-Version Backlog

**Recommendation**: Do NOT publish all 39 intermediate versions individually.

**Strategy**:
1. Review CHANGELOG.md to understand what changed between v1.0.223 and v1.0.262
2. Consolidate meaningful changes into release notes
3. Decide on version bump:
   - If mostly bug fixes: v1.0.263 (patch)
   - If new features added: v1.1.0 (minor)
   - If breaking changes: v2.0.0 (major)
4. Publish single consolidated release

**Example Consolidated Release**:
```bash
# Bump to next logical version based on changes
npm version minor --no-git-tag-version  # 1.0.262 → 1.1.0
node scripts/generate-version.js

# Update CHANGELOG.md with consolidated notes
# ... edit CHANGELOG.md ...

# Build and publish
npm run build
npm publish

# Tag release
git add .
git commit -m "chore: release v1.1.0"
git tag v1.1.0
git push origin main --tags
```

## Release Frequency Recommendations

- **Patch Releases**: As needed for bug fixes (weekly/bi-weekly)
- **Minor Releases**: When new features are stable (monthly/quarterly)
- **Major Releases**: Only for breaking changes (rarely)

## CI/CD Automation (Future Enhancement)

Consider setting up GitHub Actions to automate:
- Test execution on pull requests
- Coverage reporting
- Automated npm publishing on tag creation
- Changelog generation

Example workflow location: `.github/workflows/publish.yml`

## Version Control Best Practices

1. **Commit Messages**: Follow conventional commits format:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `chore:` for maintenance tasks
   - `docs:` for documentation updates

2. **Git Tags**: Always tag releases in Git for traceability

3. **CHANGELOG.md**: Keep comprehensive release notes

## Test Coverage Improvement Plan

Before next publish, increase coverage from 56% to 70%+:

1. **Identify Low-Coverage Modules**:
   ```bash
   npm run test:coverage
   # Check coverage/lcov-report/index.html
   ```

2. **Priority Modules to Test**:
   - `src/core/daily-trends.ts`
   - `src/integrations/azure-devops/`
   - `src/utils/` (various utilities)

3. **Coverage Targets**:
   - Statements: 70% (currently 56.53%)
   - Branches: 60% (currently 49.01%)
   - Functions: 75% (currently 55.74%)
   - Lines: 70% (currently 56.91%)

## NPM Package Configuration

Current package.json settings for npm:

```json
{
  "name": "git-spark",
  "version": "1.0.262",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "git-spark": "bin/git-spark.js"
  },
  "files": [
    "dist/",
    "bin/",
    "README.md",
    "LICENSE"
  ]
}
```

**Key Fields**:
- `files`: Specifies what gets published (source `src/` is excluded)
- `bin`: Makes CLI tool globally accessible
- `types`: TypeScript type definitions for consumers

## Troubleshooting

### Problem: "You do not have permission to publish"
**Solution**: Ensure you're logged into npm with correct account:
```bash
npm whoami
npm login
```

### Problem: "Version already exists"
**Solution**: Bump version before publishing:
```bash
npm version patch --no-git-tag-version
```

### Problem: "Tests failing"
**Solution**: Fix tests before publishing:
```bash
npm test -- --verbose
```

### Problem: "Build errors"
**Solution**: Check TypeScript compilation:
```bash
npm run build
# Review errors and fix source code
```

## Security Considerations

1. **Credentials**: Never commit npm auth tokens to Git
2. **Dependencies**: Regularly audit with `npm audit`
3. **Version Pinning**: Consider exact versions for critical dependencies
4. **Pre-publish Hooks**: Use `prepublishOnly` script to enforce checks

## Resources

- [NPM Publishing Guide](https://docs.npmjs.com/cli/v9/commands/npm-publish)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Keep a Changelog](https://keepachangelog.com/)

---

**Document Created**: 2025-01-20  
**Session**: copilot/session-2025-01-20  
**Status**: Package ready for publishing after test coverage improvement
