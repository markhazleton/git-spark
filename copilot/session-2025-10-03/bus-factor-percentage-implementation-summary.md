# Bus Factor Percentage Display Implementation

## Session Date: October 3, 2025

## Objective

Convert the Bus Factor display in HTML reports from a raw number to a percentage, representing "the lowest possible percentage of authors it takes to account for 50% of all commits".

## Problem Analysis

The Bus Factor was previously displayed as a raw number (e.g., "1 author", "3 authors") which didn't provide context about what percentage of the total contributor base this represented.

## Solution Implemented

### 1. HTML Display Changes

**File:** `src/output/html.ts`

**Before:**

```typescript
{
  label: 'Bus Factor',
  value: numberFmt(report.repository.busFactor),
  raw: report.repository.busFactor,
}
```

**After:**

```typescript
{
  label: 'Bus Factor',
  value: `${Math.round((report.repository.busFactor / report.repository.totalAuthors) * 100)}%`,
  raw: report.repository.busFactor,
}
```

### 2. Team Patterns Section Update

**Before:**

```html
<span class="metric-value">${numberFmt(report.repository.busFactor)}</span>
<span class="metric-note">Authors for 50% of commits</span>
```

**After:**

```html
<span class="metric-value">${Math.round((report.repository.busFactor / report.repository.totalAuthors) * 100)}%</span>
<span class="metric-note">Percentage of authors for 50% of commits</span>
```

### 3. Documentation Updates

**Before:**

```html
<li><strong>Bus Factor:</strong> Minimum number of top contributors needed to account for 50% of commits</li>
<code>Bus Factor = Minimum authors needed for 50% of total commits</code>
```

**After:**

```html
<li><strong>Bus Factor:</strong> Percentage of contributors needed to account for 50% of commits</li>
<code>Bus Factor = (Minimum authors needed for 50% of total commits ÷ Total authors) × 100%</code>
```

## Calculation Logic

The percentage is calculated using the formula:

```
Bus Factor Percentage = (busFactor / totalAuthors) × 100
```

Where:

- `busFactor` = Raw number of authors needed for 50% of commits
- `totalAuthors` = Total number of contributors to the repository

## Examples

### Single Author Repository

- Raw Bus Factor: 1 author
- Total Authors: 1
- **Bus Factor Percentage: 100%**

### Multi-Author Repository

- Raw Bus Factor: 2 authors  
- Total Authors: 10
- **Bus Factor Percentage: 20%**

## Interpretation

- **Lower percentages** (e.g., 10-30%) indicate **better knowledge distribution** - fewer people are responsible for the majority of work
- **Higher percentages** (e.g., 70-100%) indicate **knowledge concentration risk** - a large portion of contributors are needed to account for half the work

## Key Design Decisions

1. **Round to Whole Numbers**: Used `Math.round()` for clean percentage display
2. **Preserve Raw Data**: Kept the original `busFactor` value in the `raw` property for potential future use
3. **Update All Contexts**: Modified both the summary cards and team patterns sections
4. **Comprehensive Documentation**: Updated both inline descriptions and formula documentation

## Testing Results

✅ **Build Success**: TypeScript compilation completed without errors  
✅ **Display Update**: Bus Factor now shows as "100%" in test repository (1 author scenario)  
✅ **Documentation Updated**: Formula and descriptions reflect percentage calculation  
✅ **Context Preserved**: All existing functionality maintained

## Files Modified

1. **`src/output/html.ts`**:
   - Updated Bus Factor display calculation in summary metrics
   - Modified team patterns section to show percentage
   - Updated documentation section with new formula and description

## Impact

### User Benefits

- **Better Context**: Percentages provide immediate understanding of knowledge distribution
- **Risk Assessment**: Easy to identify knowledge concentration risks at a glance
- **Comparative Analysis**: Percentages allow better comparison across different repositories

### Technical Benefits

- **Maintained Compatibility**: Raw bus factor values preserved for internal calculations
- **Consistent Formatting**: Follows same percentage pattern as other metrics (Health, Activity Index)
- **Clear Documentation**: Updated formulas help users understand the calculation

## Outcome

The Bus Factor is now displayed as a percentage in HTML reports, providing clearer insight into knowledge distribution risks. The change makes it immediately apparent what portion of the contributor base is critical for the project's continuity, supporting better project management and risk mitigation decisions.
