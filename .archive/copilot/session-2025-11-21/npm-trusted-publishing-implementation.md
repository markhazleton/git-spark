# NPM Trusted Publishing Implementation Guide

## Issue Analysis

The current publishing workflow failed because it's attempting to use both trusted publishing (OIDC) and traditional token authentication simultaneously, which creates a conflict.

### Current Problems

1. **Mixed Authentication Methods**: Workflow has `id-token: write` permission (for OIDC) but also passes `NODE_AUTH_TOKEN` secret
2. **Registry URL Conflict**: The `registry-url` parameter in `setup-node` is intended for token-based auth
3. **Missing NPM Configuration**: Trusted publisher not yet configured on npmjs.com
4. **Outdated npm CLI**: Trusted publishing requires npm 11.5.1 or later

## Implementation Steps

### Step 1: Configure Trusted Publisher on npmjs.com

1. Navigate to https://www.npmjs.com/package/git-spark
2. Go to package Settings
3. Find "Trusted Publisher" section
4. Click "GitHub Actions" button
5. Configure the following fields:
   - **Organization or user**: `markhazleton`
   - **Repository**: `git-spark`
   - **Workflow filename**: `publish.yml` (must include `.yml` extension)
   - **Environment name**: (leave blank unless using GitHub environments)

### Step 2: Update GitHub Actions Workflow

The workflow needs these critical changes:

1. **Remove `NODE_AUTH_TOKEN` from publish step** - OIDC handles authentication
2. **Remove `registry-url` from setup-node** - Not needed for trusted publishing
3. **Ensure npm 11.5.1+** - Add npm upgrade step
4. **Keep `id-token: write` permission** - Required for OIDC
5. **Keep `--provenance` flag** - Automatically generates attestations with trusted publishing

### Step 3: Security Best Practices

After implementing trusted publishing:

1. **Restrict Token Access** (Recommended):
   - Go to package Settings → Publishing access
   - Select "Require two-factor authentication and disallow tokens"
   - This blocks traditional token publishing while allowing trusted publishing

2. **Revoke Old Tokens**:
   - Remove the `NPM_TOKEN` secret from GitHub repository settings
   - Revoke any automation tokens on npmjs.com that are no longer needed

3. **Optional: Use GitHub Environments**:
   - Create a "production" environment with protection rules
   - Add environment name to trusted publisher config
   - Require manual approval before publishing

## Updated Workflow Structure

```yaml
permissions:
  contents: read
  id-token: write  # Required for OIDC

steps:
  - name: Setup Node.js
    uses: actions/setup-node@v4
    with:
      node-version: "20.x"
      # NO registry-url for trusted publishing
      cache: "npm"

  - name: Ensure npm 11.5.1+
    run: npm install -g npm@latest

  - name: Publish to NPM
    run: npm publish --provenance
    # NO NODE_AUTH_TOKEN - OIDC handles it
```

## Key Benefits

1. **Security**: No long-lived tokens to manage or potentially leak
2. **Automatic Provenance**: Cryptographic proof of package authenticity
3. **Zero Credential Management**: GitHub generates short-lived tokens automatically
4. **Build Transparency**: Users can verify package build process

## Verification

After publishing with trusted publishing:

1. Check package page on npmjs.com for provenance badge
2. Verify attestations are linked to the specific GitHub workflow run
3. Confirm that traditional tokens no longer work (if restricted)

## Troubleshooting

### Common Issues

1. **"Unable to authenticate" error**:
   - Verify workflow filename matches exactly (including `.yml`)
   - Ensure using GitHub-hosted runners (not self-hosted)
   - Confirm `id-token: write` permission is set

2. **"Package not found" error**:
   - Double-check trusted publisher configuration on npmjs.com
   - Verify organization/repository names match exactly

3. **Provenance not generated**:
   - Only works for public repositories with public packages
   - Ensure `--provenance` flag is included (or provenance not disabled)

## References

- [NPM Trusted Publishers Documentation](https://docs.npmjs.com/trusted-publishers)
- [GitHub OIDC Documentation](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [NPM Provenance Documentation](https://docs.npmjs.com/generating-provenance-statements)
- [OpenSSF Trusted Publishers Specification](https://repos.openssf.org/trusted-publishers-for-all-package-repositories)

## Implementation Date

November 21, 2025
