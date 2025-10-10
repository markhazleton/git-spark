# Contributions Calendar Date Range Fix

**Date:** October 8, 2025  
**Session:** Fix contributions calendar to use actual commit date range

## Problem

The Contributions Calendar in the HTML report was displaying the date range from the analysis parameters (e.g., "Activity over the last 30 days") instead of showing the actual date range of the commits in the repository. This was misleading when analyzing repositories where the earliest commit is more recent than the requested analysis period.

### Example Issue

- User requests analysis of last 30 days (`--days 30`)
- Repository's first commit was only 10 days ago
- Calendar showed "Activity over the last 30 days" even though only 10 days had actual data
- This made it appear as if 20 days of data were missing

## Solution

Modified the `generateContributionsGraphSection` method in `src/output/html.ts` to:

1. **Calculate actual date range from commit data**: Extract dates with commits from the calendar data
2. **Display accurate date range**: Show "Activity from YYYY-MM-DD to YYYY-MM-DD (X active days)" format
3. **Count only active days**: Display the number of days that actually had commits, not the requested analysis period

### Changes Made

#### File: `src/output/html.ts`

**Before:**

```typescript
private generateContributionsGraphSection(contributionsGraph: any, metadata: any): string {
  const { totalCommits, weeks } = contributionsGraph;
  
  return `
    <div class="contributions-header">
      <span>Activity over the last ${metadata.totalDays} days</span>
      <span>${totalCommits} total commits</span>
    </div>
  `;
}
```

**After:**

```typescript
private generateContributionsGraphSection(contributionsGraph: any): string {
  const { totalCommits, weeks, calendar } = contributionsGraph;
  
  // Calculate actual date range from the calendar data (first commit to last commit)
  const datesWithCommits = calendar.filter((day: any) => day.count > 0);
  const actualDays = datesWithCommits.length > 0 ? datesWithCommits.length : calendar.length;
  const dateRangeText =
    datesWithCommits.length > 0
      ? `${datesWithCommits[0].date} to ${datesWithCommits[datesWithCommits.length - 1].date}`
      : `${calendar[0]?.date || ''} to ${calendar[calendar.length - 1]?.date || ''}`;
  
  return `
    <div class="contributions-header">
      <span>Activity from ${this.escapeHtml(dateRangeText)} (${actualDays} active days)</span>
      <span>${totalCommits} total commits</span>
    </div>
  `;
}
```

**Also Updated:**

- Removed unused `metadata` parameter from method signature
- Updated call site to not pass `metadata` parameter

## Benefits

1. **Accuracy**: Date range accurately reflects actual commit activity
2. **Clarity**: Users immediately see the true activity period
3. **Consistency**: Calendar visualization matches the displayed date range
4. **Active Days**: Shows count of days with commits, not total days in analysis period

## Testing

### Test Results

- ✅ All 217 tests pass
- ✅ Build successful (TypeScript compilation with no errors)
- ✅ No regressions in existing functionality

### Test Coverage

- HTML exporter tests verify report generation
- Daily trends analysis tests confirm correct date range calculation
- Integration tests validate end-to-end functionality

## Example Output

### Before Fix

```
Activity over the last 30 days
```

### After Fix

```
Activity from 2025-09-29 to 2025-10-08 (6 active days)
```

## Implementation Details

### Data Flow

1. **Daily Trends Analyzer** (`src/core/daily-trends.ts`):
   - Determines date range based on actual commits (when `analysisRange` not provided)
   - Or uses explicit `analysisRange` (when `--days` specified)
   - Generates contributions graph with calendar data

2. **Contributions Graph Generation**:
   - Creates calendar array with all days in range
   - Marks days with commits (count > 0)
   - Preserves intensity levels for visualization

3. **HTML Exporter** (`src/output/html.ts`):
   - Filters calendar to find days with actual commits
   - Calculates date range from first to last commit
   - Counts active days (days with commits)
   - Displays accurate range in header text

### Edge Cases Handled

- **No commits**: Falls back to showing full calendar range
- **Single day**: Shows correct singular form
- **Sparse commits**: Accurately counts only active days

## Related Files

- `src/output/html.ts` - Main fix location
- `src/core/daily-trends.ts` - Generates contributions graph data
- `src/core/analyzer.ts` - Calls daily trends analysis

## Version

- **Build**: 1.0.187
- **Test Status**: All tests passing
- **Branch**: main
