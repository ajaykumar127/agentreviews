# V1 Analysis Refactoring Plan
## Salesforce Agentforce Expert Review

### Problems Identified:
1. ✗ Duplicate Finding IDs (AGENTDEF-001, TEST-001, TEST-002)
2. ✗ Overlapping checks across analyzers
3. ✗ Inconsistent severity levels
4. ✗ Missing critical Agentforce best practices
5. ✗ Too many low-value checks creating noise

### Agentforce Expert Recommendations:

## Phase 1: Fix Duplicate IDs (IMMEDIATE)

### agentDefinition.ts
- Change brief description from `AGENTDEF-001` → `AGENTDEF-002`
- Rename existing `AGENTDEF-002` (Type) → `AGENTDEF-003`
- Rename existing `AGENTDEF-003` (No active version) → `AGENTDEF-004`
- Rename existing `AGENTDEF-004` (No context variables) → `AGENTDEF-005`

### testCoverage.ts & testExistence.ts
- Consolidate into ONE analyzer (they overlap)
- Keep unique test-related checks only

## Phase 2: Consolidate Redundant Checks

### Merge channelConfig.ts + activation.ts
Both check channel deployment - consolidate into `deploymentReadiness.ts`:
- Active version check
- Channel configuration
- Channel-specific limits
- Deployment prerequisites

### Merge errorHandling.ts + escalation.ts
Both about conversation flow - consolidate into `conversationFlow.ts`:
- Escalation paths
- Error handling
- Fallback behavior
- Off-topic handling

## Phase 3: Enhance Critical Checks (Agentforce-Specific)

### topicDesign.ts - ADD:
- ✓ Check for **General_FAQ** topic (REQUIRED)
- ✓ Check for **Off_Topic** topic (REQUIRED)
- ✓ Check for **Escalation** topic (REQUIRED)
- ✓ Flag if >10 topics (Salesforce guideline)
- ✓ Check classification description quality
- ✓ Validate topic naming conventions

### instructionQuality.ts - ENHANCE:
- ✓ Check for data grounding references
- ✓ Validate prompt engineering patterns
- ✓ Flag overly generic instructions
- ✓ Check for action verb usage
- ✓ Ensure instructions reference specific data sources

### actionsConfig.ts - ENHANCE:
- ✓ Check for >5 actions per topic (Salesforce guideline)
- ✓ Validate action parameter completeness
- ✓ Check for duplicate action logic
- ✓ Ensure actions are properly scoped

### NEW: dataGrounding.ts
Move LLM grounding checks here + add:
- ✓ Data Cloud configuration
- ✓ Retriever setup and quality
- ✓ Search index configuration
- ✓ Citation configuration
- ✓ Data freshness checks

## Phase 4: Improve Severity Alignment

### Critical (Blocks production readiness):
- Missing required topics (General_FAQ, Off_Topic, Escalation)
- No active version
- No channels configured
- Security vulnerabilities
- Missing test coverage

### Warning (Best practice violations):
- >10 topics
- >5 actions per topic
- Poor instruction quality
- Duplicate actions
- Brief descriptions
- No Data Cloud integration

### Info (Recommendations):
- Context variable suggestions
- Optimization opportunities
- Enhancement suggestions
- Style improvements

## Phase 5: Remove Low-Value Checks

### Consider removing:
- Generic "no context variables" check (not always needed)
- Overly specific channel checks (consolidate)
- Redundant guardrail checks
- Noise-generating info findings

## Implementation Priority:

1. **IMMEDIATE**: Fix duplicate IDs
2. **HIGH**: Consolidate redundant analyzers
3. **HIGH**: Add required topic checks
4. **MEDIUM**: Enhance instruction quality checks
5. **MEDIUM**: Improve severity alignment
6. **LOW**: Remove low-value checks

## Expected Outcome:
- ✓ No duplicate findings
- ✓ Clear, actionable findings only
- ✓ Aligned with Salesforce Agentforce best practices
- ✓ Proper severity levels for business impact
- ✓ ~30-40% reduction in total findings (remove noise)
- ✓ Focus on what matters for production readiness
