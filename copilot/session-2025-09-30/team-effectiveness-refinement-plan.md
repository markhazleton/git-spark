# Team Effectiveness Score Refinement Plan

## Overview

This document outlines the refinement plan for the Team Effectiveness Score to be based solely on what can be accurately measured from Git repository data, eliminating speculative or estimated metrics.

## Current Issues & Proposed Changes

### 1. Collaboration Metrics - REMOVE Inaccurate Metrics

#### ❌ Remove: Review Workflow Participation

- **Problem**: Cannot accurately measure actual code review participation from Git data alone
- **Current Logic**: Estimates based on merge commit patterns, which is misleading
- **Action**: Remove from both reporting and scoring completely

#### ❌ Remove: Co-Authorship Rate

- **Problem**: Teams that don't use Git's co-authorship feature are penalized unfairly
- **Current Logic**: Measures percentage of commits with co-authors
- **Action**: Remove from both reporting and scoring completely

#### ✅ Keep: Cross-Team Interaction & Knowledge Distribution

- **Reason**: Accurately measurable from file authorship patterns
- **Data**: Files touched by multiple authors vs. single-author files

### 2. Consistency Metrics - FIX Calculations

#### 🔧 Fix: Delivery Cadence

- **Problem**: Currently showing 0% even with regular commits (100 commits over 60 days)
- **Current Logic**: Coefficient of variation in commit gaps
- **New Logic**:
  - Calculate average time between commits
  - Measure consistency of commit intervals
  - Account for natural development patterns (sprints, releases)
  - Provide better baseline for "good" vs "poor" cadence

#### 🔧 Refine: Bus Factor

- **Problem**: Current calculation uses 50% threshold for code churn
- **New Logic**:
  - Calculate percentage based on authors who account for 80% of commits
  - Express as percentage: (Authors for 80% / Total Authors) × 100
  - Lower percentage = higher bus factor risk
  - More intuitive: 20% = high risk, 80% = well-distributed

### 3. Quality Metrics - RENAME & REFINE

#### 🏷️ Rename: "Code Quality" → "Commit Message Quality"

- **Problem**: "Code Quality" is misleading - we only analyze commit messages
- **Current Logic**: Evaluates governance score based on commit message patterns
- **New Name**: "Commit Message Quality" - accurately describes what's measured
- **Keep**: All existing commit message analysis (conventional commits, traceability, etc.)

#### ❌ Remove: Merge Workflow Usage

- **Problem**: Too subjective and dependent on team process rules
- **Current Logic**: Percentage of commits via merge
- **Issue**: Teams with PR rules mandating specific merge types are unfairly scored
- **Action**: Remove from both reporting and scoring completely

## Revised Team Score Components

### New Weighted Structure (100%)

1. **Cross-Team Collaboration (30%)**
   - File Knowledge Distribution (70%)
   - Cross-Team File Interaction (30%)

2. **Development Consistency (35%)**
   - Refined Bus Factor Percentage (40%)
   - Improved Delivery Cadence (35%)
   - Active Contributor Ratio (25%)

3. **Commit Message Quality (25%)**
   - Conventional Commits Usage
   - Issue Traceability
   - Message Length & Descriptiveness
   - WIP/Revert Penalties

4. **Work-Life Balance Indicators (10%)**
   - Commit Time Patterns (with timezone warnings)
   - Team Coverage Distribution

## Implementation Steps

1. **Update Type Definitions**
   - Remove `reviewWorkflowParticipation` and `coAuthorshipRate` from `TeamCollaborationMetrics`
   - Remove `mergeWorkflowUsage` from `TeamQualityMetrics`
   - Rename quality section to reflect commit message focus
   - Update bus factor to return percentage

2. **Refactor Calculation Methods**
   - Implement new delivery cadence algorithm
   - Implement percentage-based bus factor calculation
   - Update collaboration scoring to remove problematic metrics
   - Rename and refocus quality scoring

3. **Update Output Formats**
   - Remove problematic metrics from all output formats (HTML, JSON, Console, etc.)
   - Update metric descriptions to be more accurate
   - Add clear limitations documentation

4. **Update Documentation**
   - Revise metric descriptions to reflect actual capabilities
   - Emphasize what Git data can and cannot measure
   - Provide clear guidance on interpretation

## Expected Benefits

- **Accuracy**: Metrics will reflect what can actually be measured
- **Fairness**: Teams won't be penalized for process choices outside their control
- **Clarity**: Users will understand exactly what each metric represents
- **Trust**: More honest reporting builds confidence in the tool
- **Actionability**: Teams can focus on areas they can actually influence through Git practices

## Backwards Compatibility

- JSON output structure will change (breaking change - requires version bump)
- HTML reports will show fewer but more accurate metrics
- Configuration files may need updates if they reference removed metrics
- Update version to reflect breaking changes
