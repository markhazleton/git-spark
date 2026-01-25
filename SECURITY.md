# Security Policy

## Supported Versions

We actively support the following versions of Git Spark with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.2.x   | :white_check_mark: |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously and appreciate your efforts to responsibly disclose your findings.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them using one of the following methods:

1. **GitHub Security Advisories (Preferred)**
   - Visit <https://github.com/markhazleton/git-spark/security/advisories/new>
   - This is the most secure and efficient way to report vulnerabilities

2. **Email**
   - Send details to: <mark@markhazleton.com>
   - Use subject line: `[SECURITY] Git Spark Vulnerability Report`
   - Encrypt sensitive information using GPG if possible

### What to Include

Please include the following information in your report:

- Type of vulnerability (e.g., XSS, command injection, path traversal)
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the vulnerability, including how an attacker might exploit it

### Response Timeline

- **Initial Response**: Within 48 hours of report submission
- **Triage**: Within 5 business days we'll provide an initial assessment
- **Updates**: Regular updates on our progress every 7 days
- **Resolution**: We aim to release patches within 30 days for critical vulnerabilities

### What to Expect

1. **Acknowledgment**: We'll acknowledge receipt of your report
2. **Validation**: We'll work to validate the vulnerability
3. **Communication**: We'll keep you informed of our progress
4. **Credit**: With your permission, we'll credit you in the security advisory
5. **Disclosure**: We'll coordinate public disclosure timing with you

## Security Best Practices

### For Users

When using Git Spark, follow these security practices:

1. **Keep Updated**: Always use the latest version
2. **Input Validation**: Be cautious when analyzing untrusted repositories
3. **Output Review**: Review generated reports before sharing publicly
4. **Email Redaction**: Use `--redact-emails` flag when sharing reports
5. **Access Control**: Limit who can access generated analytics reports

### For Contributors

When contributing to Git Spark:

1. **Code Review**: All code changes require review before merging
2. **Dependencies**: Keep dependencies updated and audit regularly
3. **Input Sanitization**: Always sanitize user inputs and Git output
4. **Path Validation**: Validate file paths to prevent traversal attacks
5. **Command Injection**: Never pass unsanitized data to shell commands
6. **Testing**: Include security-focused test cases
7. **Secrets**: Never commit API keys, tokens, or credentials

## Security Features

Git Spark includes several security features:

### Input Validation

- Repository path validation and sanitization
- Git command output buffer limits (200MB default)
- File path traversal protection
- Email pattern validation and redaction

### Safe Git Operations

- Parameterized Git commands (no shell string interpolation)
- Read-only Git operations (no modifications to repositories)
- Timeout protection for long-running operations
- Process cleanup on interruption (SIGINT handling)

### Output Security

- HTML escaping for all user-generated content
- CSV injection prevention
- Safe JSON serialization
- Optional email redaction in reports

## Known Security Considerations

### Command Execution

Git Spark executes Git commands using `child_process.spawn()` with proper argument arrays to prevent command injection. All Git operations are read-only.

### File System Access

Git Spark reads from Git repositories and writes report files. It validates all file paths and respects `.gitignore` patterns. Never run Git Spark with elevated privileges unless absolutely necessary.

### Data Privacy

Generated reports may contain:

- Author names and email addresses
- Commit messages
- File paths and names
- Code change statistics

Use the `--redact-emails` option when sharing reports publicly.

### Dependencies

We regularly audit dependencies using:

- `npm audit` for known vulnerabilities
- CodeQL for code analysis
- Snyk for dependency scanning
- Automated dependency updates via Dependabot

## Vulnerability Disclosure Policy

### Coordinated Disclosure

We follow coordinated vulnerability disclosure:

1. Report is received and acknowledged
2. Vulnerability is validated and assessed
3. Fix is developed and tested
4. Security advisory is prepared
5. Fix is released
6. Advisory is published after users have time to update

### Public Disclosure

After a fix is released:

- We'll publish a GitHub Security Advisory
- CVE will be requested if severity warrants
- Details will be added to CHANGELOG.md
- Reporter will be credited (if desired)

## Security Updates

Security updates are released as:

- **Patch versions** (1.0.x) for non-breaking security fixes
- **Minor versions** (1.x.0) if security fix requires minor breaking changes
- **Emergency releases** for critical vulnerabilities

Subscribe to releases and security advisories:

- Watch the repository: <https://github.com/markhazleton/git-spark>
- GitHub Security Advisories: <https://github.com/markhazleton/git-spark/security/advisories>
- npm security advisories: <https://www.npmjs.com/package/git-spark>

## Contact

- **Security Issues**: <mark@markhazleton.com>
- **GitHub Security**: <https://github.com/markhazleton/git-spark/security/advisories/new>
- **General Issues**: <https://github.com/markhazleton/git-spark/issues>

## Acknowledgments

We appreciate the security research community's efforts to keep Git Spark secure. Contributors who responsibly disclose vulnerabilities will be credited in our security advisories (with permission).

---

Last Updated: January 25, 2026
