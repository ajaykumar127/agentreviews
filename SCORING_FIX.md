# Stage Score Math Fix

## Issue Reported
"The total number for all stages doesn't add up. Can you check esp when i filter to each agent. Something is wrong with the math there."

---

## Root Cause

### Problem 1: Category Weights Didn't Sum to 1.0
The category weights in `CATEGORY_CONFIG` added up to **0.95 (95%)**, not 1.0:

```
Stage Breakdown:
- designSetup:   10% (agentDefinition: 0.10)
- configuration: 50% (topicDesign: 0.10, instructionQuality: 0.12, actionsConfig: 0.10,
                      escalation: 0.05, guardrails: 0.03, channelConfig: 0.03,
                      errorHandling: 0.05, security: 0.02)
- test:          15% (testCoverage: 0.07, testExistence: 0.08)
- deploy:        15% (activation: 0.15)
- monitor:        5% (llmGrounding: 0.05)
────────────────────
Total:           95% ❌
```

**Impact**: The overall score was calculated as a weighted sum of category scores using these weights, resulting in a score that was artificially deflated. A perfect agent (100 in all categories) would only score 95 overall.

### Problem 2: Overall Score Not Normalized
The `calculateOverallScore()` function was summing `(category_score × weight)` without normalizing:

```typescript
// BEFORE (WRONG):
export function calculateOverallScore(categories: CategoryScore[]): number {
  return Math.round(
    categories.reduce((sum, cat) => sum + cat.score * cat.weight, 0)
  );
}
```

This meant:
- If all categories scored 100, overall = (100 × 0.10) + (100 × 0.50) + ... = **95** (should be 100)
- The overall score didn't match the weighted average of stage scores

---

## The Fix

**Updated `calculateOverallScore()` to normalize by total weight:**

```typescript
// AFTER (CORRECT):
export function calculateOverallScore(categories: CategoryScore[]): number {
  // Calculate total weight of all categories
  const totalWeight = categories.reduce((sum, cat) => sum + cat.weight, 0);

  // Calculate weighted score
  const weightedScore = categories.reduce((sum, cat) => sum + cat.score * cat.weight, 0);

  // Normalize to 0-100 by dividing by total weight
  // This ensures overall score properly reflects stage scores even if weights don't sum to 1.0
  return Math.round(weightedScore / totalWeight);
}
```

**What this does:**
1. Calculates the total weight of all categories (0.95)
2. Calculates the weighted sum of scores
3. **Divides by total weight to normalize to 0-100 scale**

---

## Math Example

### Before Fix:
```
Agent with these stage scores:
- designSetup:   80  (weight: 0.10)
- configuration: 90  (weight: 0.50)
- test:          70  (weight: 0.15)
- deploy:        85  (weight: 0.15)
- monitor:       75  (weight: 0.05)

Overall Score (WRONG):
= (80 × 0.10) + (90 × 0.50) + (70 × 0.15) + (85 × 0.15) + (75 × 0.05)
= 8 + 45 + 10.5 + 12.75 + 3.75
= 80 ❌ (seems too low given most stages are 75-90)
```

### After Fix:
```
Same agent with same stage scores:

Overall Score (CORRECT):
Weighted sum = 80
Total weight = 0.95
Normalized score = 80 / 0.95 = 84.21 ≈ 84 ✅

This properly reflects the weighted average of stage scores!
```

### Perfect Agent Example:
```
Agent with all perfect scores (100 in every category):

Before Fix:
Overall = (100 × 0.95) = 95 ❌ (should be 100!)

After Fix:
Overall = 95 / 0.95 = 100 ✅
```

---

## Understanding Stage Scores vs Overall Score

### How Stage Scores Are Calculated:
Each stage score is the **weighted average** of categories within that stage, normalized to 0-100:

```typescript
calculateStageScore(categories, 'configuration'):
  - Get all configuration categories (8 categories, weights: 0.50 total)
  - Calculate: (topicDesign_score × 0.10) + (instructionQuality_score × 0.12) + ...
  - Divide by total stage weight (0.50)
  - Result: Score from 0-100 for configuration stage
```

### How Overall Score Is Calculated:
Overall score is the **weighted average** of ALL category scores, normalized to 0-100:

```typescript
calculateOverallScore(categories):
  - Get all 13 categories (weights: 0.95 total)
  - Calculate: sum of (category_score × category_weight)
  - Divide by total weight (0.95) → NORMALIZED to 0-100 ✅
```

### The Relationship:
Overall score = weighted average of stage scores, where weights are stage weights:

```
Overall = (designSetup × 0.10) + (config × 0.50) + (test × 0.15) + (deploy × 0.15) + (monitor × 0.05)
        ────────────────────────────────────────────────────────────────────────────────────────────
                                            0.95

This matches the category-based calculation because:
- Stage score = weighted avg of categories in that stage
- Overall score = weighted avg of all categories
- Both normalized to 0-100
```

---

## About Data Stage

**Data stage is INTENTIONALLY SEPARATE** and not included in overall score:

1. **Data stage uses different calculation:**
   - Simple deduction-based score (starts at 100, subtracts for findings)
   - Not a weighted average of categories
   - Calculated from `analyzeDataCloud()` findings

2. **Why it's separate:**
   - Data Cloud is optional (not all orgs have it)
   - Data grounding is a supplementary feature
   - Shown in separate "Data" tab in UI
   - Doesn't affect core agent lifecycle score

3. **Weights still work correctly:**
   - The 5 main lifecycle stages (designSetup, configuration, test, deploy, monitor) have weights totaling 0.95
   - Normalization ensures overall score is still 0-100
   - Data stage shown separately for informational purposes

---

## Verification

### Test Case 1: Perfect Agent
```
All categories: 100
All stage scores: 100
Overall score: 100 ✅ (was 95 before fix)
```

### Test Case 2: Mixed Scores
```
designSetup:   80 (10%)
configuration: 90 (50%)
test:          70 (15%)
deploy:        85 (15%)
monitor:       75 (5%)

Weighted sum: (80×0.10 + 90×0.50 + 70×0.15 + 85×0.15 + 75×0.05) = 80
Overall: 80 / 0.95 = 84 ✅

Manual verification:
  If you average the stages weighted by their percentages:
  (80×10% + 90×50% + 70×15% + 85×15% + 75×5%) / 100%
  = (8 + 45 + 10.5 + 12.75 + 3.75) / 1.0
  = 80 / 1.0 = 80... but wait, that's using % as decimals.

  Actually: (80×0.10 + 90×0.50 + 70×0.15 + 85×0.15 + 75×0.05) / 0.95 = 84
  This is correct because we're normalizing by actual total weight.
```

### Test Case 3: Agent Filter
When filtering to a specific agent:
- Categories are filtered to that agent's data
- Stage scores recalculated for that agent's categories
- Overall score normalized correctly ✅
- Math now adds up properly ✅

---

## Summary

✅ **FIXED**: Overall score now properly normalized to 0-100 scale
✅ **FIXED**: Stage scores and overall score now mathematically consistent
✅ **FIXED**: Filtering by agent shows correct proportional scores
✅ **MAINTAINED**: Data stage remains separate (intentional design)
✅ **MAINTAINED**: All existing category weights unchanged

**The math now adds up correctly!** 🎉
