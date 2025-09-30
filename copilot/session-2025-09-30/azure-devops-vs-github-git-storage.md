# Azure DevOps vs GitHub: Git Storage Comparison

## Core Question: Does Git Store PR Approval Contributors?

**Short Answer: NO** - Git itself does not store PR approvers, reviewers, or approval status. This information lives in the platform's database, not in Git commits.

## Git Storage: Platform-Agnostic

Git stores the same core data regardless of platform:

```bash
# Standard Git commit data (identical across platforms)
git log --pretty=format:"%H|%P|%an|%ae|%cn|%ce|%ad|%cd|%s|%b"
```

**What Git Always Stores:**

- Commit hash, parents, author, committer
- Timestamps, commit message
- File changes (diff data)
- Tree objects, blob objects

**What Git NEVER Stores:**

- PR/MR approvers or reviewers
- Review comments or feedback
- Build status or CI results
- Platform-specific metadata

## Platform Differences in Git Integration

### **Azure DevOps Git Repository**

#### **Merge Commit Patterns:**

```bash
# Azure DevOps merge commit examples
"Merged PR 123: Add authentication feature"
"Pull request 456: Fix user validation"
"Merge branch 'users/john/feature' of https://dev.azure.com/org/project/_git/repo into main"
```

#### **Branch Naming Conventions:**

```bash
# Common Azure DevOps patterns
users/john.doe/feature-auth          # User-based branches
features/WORK-123-add-validation     # Work item linked branches
releases/v2.1.0                      # Release branches
```

#### **Work Item Integration:**

```bash
# Commit messages often include work item references
"Add user validation (fixes AB#123)"
"Implement authentication feature (related AB#456, AB#789)"
```

#### **Azure DevOps Specific Git Extensions:**

- **Git Notes**: Some organizations use git notes for additional metadata
- **Commit Status**: Build/pipeline status (stored in Azure DevOps, not Git)
- **Linked Work Items**: Referenced in commit messages but stored in Azure DevOps

### **GitHub Repository**

#### **Merge Commit Patterns:**

```bash
# GitHub merge commit examples
"Merge pull request #123 from feature/auth"
"Merge branch 'feature/auth' into main"
"Update authentication.js (#123)"  # Squash merge with PR reference
```

#### **Branch Naming Conventions:**

```bash
# Common GitHub patterns
feature/user-authentication          # Feature branches
bugfix/issue-123-fix-validation     # Bug fix branches
dependabot/npm_and_yarn/lodash-4.17.21  # Dependabot branches
```

#### **Issue/PR References:**

```bash
# GitHub commit message patterns
"Fix user validation (closes #123)"
"Add feature (fixes #456, resolves #789)"
"Co-authored-by: Jane Doe <jane@example.com>"  # Pair programming
```

## Review Information Storage Locations

### **Azure DevOps**

```json
// Stored in Azure DevOps database (NOT in Git)
{
  "pullRequestId": 123,
  "reviewers": [
    { "id": "user1", "vote": 10, "isRequired": true },
    { "id": "user2", "vote": 5, "isRequired": false }
  ],
  "policies": {
    "minimumApproverCount": 2,
    "requiredReviewers": ["security-team"],
    "pathBasedRequirements": true
  }
}
```

### **GitHub**

```json
// Stored in GitHub database (NOT in Git)
{
  "pull_request": {
    "number": 123,
    "reviews": [
      { "user": "reviewer1", "state": "APPROVED" },
      { "user": "reviewer2", "state": "CHANGES_REQUESTED" }
    ],
    "requested_reviewers": ["user3", "user4"]
  }
}
```

## What Can Be Detected from Git Alone

### **Azure DevOps Repositories**

#### **✅ Reliable Signals:**

```typescript
const azureDevOpsSignals = {
  // Merge commit detection
  isMergeCommit: commit.parents.length > 1,
  
  // Azure DevOps merge patterns
  hasPRPattern: /^(Merged PR \d+:|Pull request \d+:)/.test(commit.message),
  
  // Work item references
  hasWorkItemRef: /\(?(fixes?|closes?|resolves?) AB#\d+\)?/i.test(commit.message),
  
  // User branch patterns
  hasUserBranch: /users\/[\w.]+\//.test(commit.message),
  
  // Azure DevOps URL patterns in merge messages
  hasAzureDevOpsURL: /dev\.azure\.com/.test(commit.message)
};
```

#### **⚠️ Partial Signals:**

```typescript
// These require additional heuristics
const partialSignals = {
  // Branch naming in merge messages (if preserved)
  branchNaming: extractBranchFromMerge(commit.message),
  
  // Time patterns (Azure DevOps often has different merge timing)
  businessHoursMerge: isBusinessHours(commit.date),
  
  // Committer vs Author differences (common in PR workflows)
  differentCommitter: commit.author !== commit.committer
};
```

### **GitHub Repositories**

#### **✅ Reliable Signals:**

```typescript
const githubSignals = {
  // GitHub-specific merge patterns
  hasPRPattern: /^Merge pull request #\d+/.test(commit.message),
  
  // Issue references
  hasIssueRef: /\(?(fixes?|closes?|resolves?) #\d+\)?/i.test(commit.message),
  
  // Co-authored commits (GitHub feature)
  hasCoAuthor: /Co-authored-by:/.test(commit.message),
  
  // GitHub squash merge patterns
  hasSquashPattern: /\(#\d+\)$/.test(commit.message)
};
```

## Enhanced Detection Strategy for Azure DevOps

### **Implementation for Git Spark:**

```typescript
// Enhanced Azure DevOps detection
class AzureDevOpsDetector {
  detectPRActivity(commit: CommitData): PRIndicators {
    return {
      confidence: this.calculateConfidence(commit),
      signals: {
        mergeCommit: commit.parents.length > 1,
        prMergePattern: this.detectAzurePRPattern(commit.message),
        workItemLinked: this.detectWorkItemReference(commit.message),
        userBranchPattern: this.detectUserBranch(commit.message),
        azureDevOpsURL: this.detectAzureDevOpsURL(commit.message)
      },
      estimatedReviewType: this.estimateReviewType(commit)
    };
  }

  private detectAzurePRPattern(message: string): boolean {
    const patterns = [
      /^Merged PR \d+:/,
      /^Pull request \d+:/,
      /^Merge branch .+ of https:\/\/dev\.azure\.com/,
      /^Merge .+ into main \(Pull request \d+\)/
    ];
    return patterns.some(pattern => pattern.test(message));
  }

  private detectWorkItemReference(message: string): boolean {
    return /\b(AB#|fixes AB#|closes AB#|resolves AB#)\d+/i.test(message);
  }
}
```

## Key Differences Summary

| **Aspect** | **Azure DevOps** | **GitHub** | **Git Storage** |
|------------|-------------------|------------|-----------------|
| **PR Approvers** | Azure DevOps DB | GitHub DB | ❌ Not stored |
| **Review Comments** | Azure DevOps DB | GitHub DB | ❌ Not stored |
| **Merge Patterns** | "Merged PR X:" | "Merge pull request #X" | ✅ In commit message |
| **Work Item Links** | "AB#123" | "#123" | ✅ In commit message |
| **Co-authorship** | Manual | Built-in support | ✅ In commit message |
| **Branch URLs** | Full Azure URLs | Shorter patterns | ✅ Sometimes in merges |
| **Policy Enforcement** | Azure DevOps | GitHub | ❌ Not stored |

## Conclusion

**Git alone cannot tell you WHO approved a PR** - that information lives in the platform's database. However, Git can provide strong signals about:

1. **Whether a commit came through a PR workflow** (merge patterns)
2. **Work item/issue linkage** (commit message references)  
3. **Collaboration patterns** (co-authorship, timing, branch patterns)
4. **Platform type** (URL patterns, message formats)

For true approval tracking, you'd need to integrate with the Azure DevOps REST API or GitHub API, which is beyond Git's scope but could be a future enhancement for Git Spark.
