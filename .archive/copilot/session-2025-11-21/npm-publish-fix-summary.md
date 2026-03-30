# NPM Publish Issue Fix Summary

## Issue Identified

The GitHub Actions workflow at https://github.com/markhazleton/git-spark/actions/runs/19568541399/job/56036334621 failed because of conflicting authentication methods:

- Workflow had OIDC permissions (`id-token: write`) for trusted publishing
- But also included `NODE_AUTH_TOKEN` secret for traditional token authentication
- And included `registry-url` in `setup-node` which is meant for token-based auth

This caused npm to receive mixed signals about which authentication method to use.

## Changes Implemented

### 1. Updated `.github/workflows/publish.yml`

**Removed:**
- `registry-url: "https://registry.npmjs.org"` from setup-node step
- `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` environment variable from publish step

**Added:**
- Step to upgrade npm to latest version (11.5.1+ required for trusted publishing)

**Kept:**
- `id-token: write` permission (required for OIDC)
- `--provenance` flag (automatically generates attestations)

### 2. Updated `package.json`

**Added:**
```json
"publishConfig": {
  "access": "public",
  "provenance": true
}
```

This ensures:
- Package is explicitly published as public
- Provenance generation is enabled by default

## Required Manual Steps

### ⚠️ CRITICAL: Configure Trusted Publisher on npmjs.com

Before the next publish attempt, you MUST configure the trusted publisher on npmjs.com:

1. **Go to:** https://www.npmjs.com/package/git-spark
2. **Navigate to:** Settings → Trusted Publisher section
3. **Click:** "GitHub Actions" button
4. **Fill in:**
   - Organization or user: `markhazleton`
   - Repository: `git-spark`
   - Workflow filename: `publish.yml` (must include `.yml`)
   - Environment name: (leave blank unless using GitHub environments)
5. **Save** the configuration

### Optional Security Enhancements

After verifying trusted publishing works:

1. **Restrict Token Access (Recommended):**
   - Go to package Settings → Publishing access
   - Select "Require two-factor authentication and disallow tokens"
   - This prevents token-based publishing while allowing trusted publishing

2. **Clean Up Secrets:**
   - Remove `NPM_TOKEN` from GitHub repository secrets
   - Revoke the token on npmjs.com if no longer needed

3. **Add Environment Protection (Optional):**
   - Create "production" environment in GitHub repo settings
   - Add manual approval requirement
   - Update trusted publisher config with environment name

## How Trusted Publishing Works

1. **No Tokens Needed:** GitHub automatically generates short-lived OIDC tokens
2. **Automatic Provenance:** Cryptographic proof links package to specific workflow run
3. **Enhanced Security:** No long-lived credentials to manage or leak
4. **Transparent Build:** Users can verify package authenticity

## Verification Steps

After the next successful publish:

1. Check https://www.npmjs.com/package/git-spark for provenance badge
2. Verify attestations link to the GitHub workflow run
3. Confirm build transparency information is displayed

## Testing the Fix

To test the updated workflow:

1. **Ensure trusted publisher is configured** on npmjs.com (see above)
2. Create a new tag: `git tag v1.0.264`
3. Push the tag: `git push origin v1.0.264`
4. Monitor the GitHub Actions workflow

## Expected Outcome

The workflow should now:
- ✅ Upgrade npm to 11.5.1+
- ✅ Build and test the package
- ✅ Authenticate using OIDC (no token needed)
- ✅ Publish with automatic provenance generation
- ✅ Create deployment record on GitHub

## Rollback Plan

If trusted publishing doesn't work:

1. Re-add `registry-url` to setup-node
2. Re-add `NODE_AUTH_TOKEN` environment variable
3. Remove the trusted publisher configuration from npmjs.com
4. Ensure `NPM_TOKEN` secret exists in GitHub

However, trusted publishing is the recommended approach for security and transparency.

## References

- [Implementation Guide](./npm-trusted-publishing-implementation.md)
- [NPM Trusted Publishers Docs](https://docs.npmjs.com/trusted-publishers)
- [GitHub OIDC Docs](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)

## Files Modified

1. `.github/workflows/publish.yml` - Updated for OIDC-only authentication
2. `package.json` - Added publishConfig with provenance settings
3. `copilot/session-2025-11-21/npm-trusted-publishing-implementation.md` - Detailed implementation guide
4. `copilot/session-2025-11-21/npm-publish-fix-summary.md` - This summary

## Date

November 21, 2025
