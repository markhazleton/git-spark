# Enhanced PR Detection from Git Data

## Current Implementation

Git Spark currently uses basic merge commit detection:

```typescript
// Simple parent count check
isMerge: parents ? parents.trim().split(' ').length > 1 : false
```

**Limitations:**

- Misses squash merges (appear as regular commits)
- Misses rebase merges (linear history)
- No platform-specific pattern recognition

## Proposed Enhancement

### 1. Multi-Signal Detection

```typescript
interface PRDetectionSignals {
  isMergeCommit: boolean;        // Current: 2+ parents
  hasPRPattern: boolean;         // New: Commit message patterns
  hasCoAuthor: boolean;          // Current: Co-authored-by detection
  hasPlatformRefs: boolean;      // New: Issue/PR references
  hasReviewKeywords: boolean;    // New: Review-related keywords
}

function detectCodeReviewParticipation(commit: CommitData): number {
  const signals = {
    isMergeCommit: commit.parents.length > 1,
    hasPRPattern: detectPRMessagePattern(commit.message),
    hasCoAuthor: commit.coAuthors.length > 0,
    hasPlatformRefs: detectPlatformReferences(commit.message),
    hasReviewKeywords: detectReviewKeywords(commit.message)
  };
  
  // Weighted scoring
  return calculateReviewScore(signals);
}
```

### 2. Platform-Specific Patterns

```typescript
const PR_PATTERNS = {
  github: [
    /^Merge pull request #(\d+)/,
    /^Merge branch .+ into .+/,
    /\(#(\d+)\)$/,  // "(#123)" at end of message
  ],
  gitlab: [
    /^Merge branch .+ into '.+'/,
    /See merge request .+!(\d+)/,
  ],
  azureDevOps: [
    /^Merged PR (\d+):/,
    /^Pull request (\d+):/,
  ],
  bitbucket: [
    /^Merged in .+ \(pull request #(\d+)\)/,
  ]
};
```

### 3. Review Keywords Detection

```typescript
const REVIEW_KEYWORDS = [
  'reviewed-by:', 'approved-by:', 'lgtm', 'looks good',
  'code review', 'peer review', 'reviewed and approved',
  'fixes #', 'closes #', 'resolves #'
];

function detectReviewKeywords(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return REVIEW_KEYWORDS.some(keyword => 
    lowerMessage.includes(keyword)
  );
}
```

### 4. Commit Signature Analysis

```typescript
function analyzeCommitSignature(commit: CommitData): ReviewIndicators {
  return {
    // Time patterns (PRs often merged during business hours)
    businessHoursMerge: isBusinessHours(commit.date),
    
    // Author vs Committer difference (common in PR workflows)
    authorCommitterDiff: commit.author !== commit.committer,
    
    // File change patterns (PRs often touch multiple related files)
    multiFileChange: commit.files.length > 1,
    
    // Commit size (PRs often larger than direct commits)
    significantSize: commit.insertions + commit.deletions > 50
  };
}
```

## Implementation Strategy

### Phase 1: Enhanced Pattern Detection

- Add commit message pattern matching
- Implement platform-specific regex patterns
- Weight multiple signals for confidence scoring

### Phase 2: Statistical Learning

- Analyze repository history for patterns
- Build confidence models based on detected workflows
- Provide accuracy estimates for each detection method

### Phase 3: Configuration Support

- Allow users to specify their workflow type
- Custom pattern definitions for enterprise Git platforms
- Manual override options for edge cases

## Expected Accuracy Improvements

| **Current Method** | **Accuracy** | **Enhanced Method** | **Expected Accuracy** |
|-------------------|--------------|---------------------|----------------------|
| Merge commits only | ~40-60% | Multi-signal detection | ~85-95% |
| Platform agnostic | Limited | Platform-aware patterns | High |
| Binary detection | Yes/No | Confidence scoring | Nuanced |

## Benefits

1. **Better Insights**: More accurate collaboration metrics
2. **Platform Flexibility**: Works across GitHub, GitLab, Azure DevOps
3. **Workflow Awareness**: Adapts to team's specific processes
4. **Confidence Indicators**: Shows reliability of detection

## Implementation Files

- `src/core/pr-detector.ts` - New PR detection engine
- `src/types/index.ts` - Enhanced interfaces
- `src/core/analyzer.ts` - Updated collaboration metrics
- `test/pr-detector.test.ts` - Comprehensive test coverage
