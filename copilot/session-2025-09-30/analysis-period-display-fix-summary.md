# Analysis Period Display Fix Summary

## Issue Description

The "Analyzed Period" label in HTML reports was displaying the full repository date range instead of the actual analysis period based on user-specified options. For example:

- **Problem**: `Analyzed Period: 2021-05-26 → 2025-08-20 (1549 days)` (full repo history)
- **Expected**: `Analyzed Period: 2025-09-23 → 2025-09-30 (8 days)` (last 7 days as requested)

## Root Cause Analysis

The HTML output was calculating the analysis period using `report.repository.firstCommit` and `report.repository.lastCommit`, which represent the date range of commits that were actually found in the analysis. However, users expect to see the **intended** analysis period based on their command-line options:

- `--days N`: Last N days from now
- `--since DATE`: From specific date to now  
- `--until DATE`: From repo start to specific date
- `--since DATE --until DATE`: Between specific dates

## Solution Implementation

### Updated Analysis Period Calculation

Modified `src/output/html.ts` to calculate the analysis period based on `report.metadata.analysisOptions` instead of actual commit dates:

```typescript
// Before: Used actual commit range
const first = report.repository.firstCommit;
const last = report.repository.lastCommit;

// After: Calculate intended analysis period from user options
const options = report.metadata.analysisOptions;
if (options.since && options.until) {
  // Use explicit date range
  startDate = new Date(options.since);
  endDate = new Date(options.until);
} else if (options.since) {
  // From specific date to now
  startDate = new Date(options.since);
  endDate = new Date();
} else if (options.until) {
  // From beginning to specific date  
  startDate = report.repository.firstCommit || new Date(0);
  endDate = new Date(options.until);
} else if (options.days) {
  // Last N days from now
  endDate = new Date();
  startDate = new Date(endDate.getTime() - (options.days * 24 * 60 * 60 * 1000));
} else {
  // Fallback to actual commit range if no specific options
  startDate = report.repository.firstCommit;
  endDate = report.repository.lastCommit;
}
```

### Logic Flow

1. **Explicit Date Range** (`--since` + `--until`): Shows exact date range specified
2. **Since Date Only** (`--since`): Shows from specified date to current date
3. **Until Date Only** (`--until`): Shows from repository start to specified date
4. **Days Option** (`--days`): Shows last N days from current date
5. **No Options**: Falls back to actual commit range (original behavior)

## Testing and Validation

### Test Cases Verified

1. **Days Option**: `--days 7`
   - Result: `Analyzed Period: 2025-09-23 → 2025-09-30 (8 days)` ✅

2. **Explicit Date Range**: `--since 2025-09-01 --until 2025-09-30`
   - Result: `Analyzed Period: 2025-09-01 → 2025-09-30 (30 days)` ✅

3. **All Tests Pass**: 159/159 tests passing ✅

### Before vs After Comparison

| Scenario | Before (Incorrect) | After (Correct) |
|----------|-------------------|-----------------|
| `--days 7` | `2021-05-26 → 2025-08-20 (1549 days)` | `2025-09-23 → 2025-09-30 (8 days)` |
| `--since 2025-09-01 --until 2025-09-30` | `2021-05-26 → 2025-08-20 (1549 days)` | `2025-09-01 → 2025-09-30 (30 days)` |

## Impact Assessment

### Benefits

- **Accurate Period Display**: Shows the intended analysis period, not just found commits
- **User Expectations Met**: Matches what users expect when they specify date options
- **Better UX**: Clear understanding of what period was analyzed
- **Maintains Fallback**: Still shows commit range when no specific options provided

### Scope

- **Affected**: HTML output format only (primary user-facing format)
- **Not Affected**: Console, JSON, CSV, and Markdown outputs (they don't show date ranges)
- **Backwards Compatible**: No breaking changes to API or data structures

### Files Modified

- `src/output/html.ts`: Updated analysis period calculation logic

## Risk Assessment

- **Risk Level**: Very Low
- **Testing**: All existing tests continue to pass
- **Fallback**: Graceful fallback to original behavior when no options specified
- **Error Handling**: Wrapped in try/catch to prevent failures

## Conclusion

This fix ensures that the "Analyzed Period" label in HTML reports accurately reflects the user's intended analysis timeframe based on their command-line options, rather than just showing the range of commits that happened to be found. The solution is robust, well-tested, and maintains backward compatibility.
