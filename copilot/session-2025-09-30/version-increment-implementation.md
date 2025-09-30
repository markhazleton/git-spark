# Build Script Documentation

## Automatic Version Increment

This project now automatically increments the patch version on every build using semantic versioning.

### How it works

1. **prebuild script**: Runs `npm version patch --no-git-tag-version` to increment the version in package.json
2. **prebuild script**: Runs `node scripts/generate-version.js` to create `src/version.ts` with the current version
3. **build script**: Compiles TypeScript as usual
4. **Runtime**: The analyzer uses the generated version file as the primary source for version information

### Version Detection Priority

1. **Generated version file** (`src/version.ts`) - Most reliable, embedded at build time
2. **git-spark package.json via require.resolve** - For when used as an installed package
3. **Relative path resolution** - For development scenarios
4. **Current working directory** - Fallback for development in the git-spark repo
5. **Default "0.0.0"** - If all else fails

### Benefits

- **Deterministic**: Every build produces a unique, traceable version
- **Automatic**: No manual version management required
- **Reliable**: Works in all deployment scenarios (local dev, npm package, global install)
- **Traceable**: Reports always show the exact version that generated them

### Usage

```bash
# This will increment version from 1.0.1 to 1.0.2 and build
npm run build

# For development without version increment
npm run build:watch
```

### Files

- `scripts/generate-version.js` - Generates the version file at build time
- `src/version.ts` - Auto-generated file (in .gitignore)
- `src/core/analyzer.ts` - Uses the version in report metadata
