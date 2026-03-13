# Agent Script & Determinism Analyzer

## 🎯 Overview

New analyzer added to evaluate agent determinism and Agent Script best practices based on Salesforce's official documentation:
- **Agent Script Guide**: https://developer.salesforce.com/docs/ai/agentforce/guide/agent-script.html
- **Levels of Determinism**: https://www.salesforce.com/agentforce/levels-of-determinism/

## 📊 Salesforce's 6 Levels of Determinism

### Level 1: Instruction-Free Topic & Prompt Action Selection
- **What**: Maximum LLM autonomy, dynamic tool selection
- **When**: Exploratory tasks, general inquiries, initial deployment
- **Trade-off**: Most flexible, least controlled

### Level 2: Agent Instructions
- **What**: Policy guidance through topic instructions
- **When**: Compliance-aware interactions
- **Trade-off**: Guided but flexible

### Level 3: Data Grounding
- **What**: Responses anchored in verified external data
- **When**: Factual accuracy critical
- **Trade-off**: Reduced hallucination, requires data connections

### Level 4: Agent Variables
- **What**: State management via context variables
- **When**: Multi-step personalized interactions
- **Trade-off**: Stateful, less memory-dependent

### Level 5: Deterministic Actions (Apex/Flows)
- **What**: Programmatic business logic execution
- **When**: Structured business processes
- **Trade-off**: Full control, requires development

### Level 6: Agent Script
- **What**: Hard-coded reasoning paths
- **When**: Compliance-critical, high-stakes interactions
- **Trade-off**: Maximum control, minimum flexibility

---

## ✅ Checks Implemented

### SCRIPT-001: Context Variables (Level 4)
**Severity**: Warning
**Check**: Does agent have context variables defined?
**Why**: Variables enable state management without relying on LLM memory
**Recommendation**: Define variables for user preferences, session state, business data

### SCRIPT-002: Context Variables Confirmation
**Severity**: Info
**Check**: Positive feedback when variables are defined
**Why**: Confirms Level 4 determinism achieved

### SCRIPT-003: Overscripted Instructions
**Severity**: Warning
**Check**: Topics with >500 character instructions
**Why**: Long instructions = overscripting, reduces flexibility
**Recommendation**: Use abstract guidance or Agent Script for deterministic flows

### SCRIPT-004: Instruction-Free Topics (Level 1)
**Severity**: Info
**Check**: Topics without instructions
**Why**: Identifies maximum-autonomy topics
**Recommendation**: Evaluate if policy guidance needed

### SCRIPT-005: Data Grounding Missing (Level 3)
**Severity**: Warning
**Check**: No data retrieval actions detected
**Why**: Without data grounding, responses may hallucinate
**Recommendation**: Add actions to retrieve CRM/knowledge base data

### SCRIPT-006: Data Grounding Detected
**Severity**: Info
**Check**: Data retrieval actions found
**Why**: Confirms Level 3 determinism

### SCRIPT-007: Deterministic Actions (Level 5)
**Severity**: Info
**Check**: Apex or Flow actions detected
**Why**: Confirms sophisticated business logic execution

### SCRIPT-008: Agent Script Candidates
**Severity**: Info
**Check**: Topics with complex conditional logic
**Why**: Identifies candidates for Level 6 Agent Script
**Recommendation**: Consider Agent Script for compliance-critical paths

### SCRIPT-009: Topic Count vs Determinism
**Severity**: Warning
**Check**: >10 topics reduces deterministic routing
**Why**: Too many topics = lower classification accuracy
**Recommendation**: Consolidate or use Agent Script for routing

### SCRIPT-010: Actions per Topic
**Severity**: Warning
**Check**: >10 actions per topic
**Why**: Too many actions = lower selection accuracy
**Recommendation**: Split topic or use Agent Script for sequencing

### SCRIPT-011: Determinism Level Summary
**Severity**: Info
**Check**: Overall determinism level (1-6)
**Why**: Provides clear assessment of current state
**Recommendation**: Guidance on next level progression

---

## 🎨 What the Analyzer Does

### Automatic Determinism Assessment
The analyzer evaluates your agent and assigns a **Determinism Level (1-6)**:

```
Level 1 → Has no instructions
Level 2 → Has instructions on topics
Level 3 → Has data retrieval actions
Level 4 → Has context variables
Level 5 → Uses Apex/Flows
Level 6 → Uses Agent Script (future detection)
```

### Actionable Recommendations
For each level, provides:
- **Current state** description
- **Why this matters** for agent reliability
- **Next steps** to increase determinism if needed

### Trade-off Awareness
Helps balance:
- **Flexibility** (Level 1-2) vs **Control** (Level 5-6)
- **Autonomy** (LLM-driven) vs **Reliability** (Programmatic)
- **Creativity** (Open-ended) vs **Compliance** (Guaranteed paths)

---

## 📋 How Findings Appear

### Configuration Stage View
All findings appear under the **Configuration** stage with category **"Agent Script & Determinism"**

### Example Findings

**Without Variables:**
```
⚠️ WARNING: No context variables defined (Level 4 Determinism)
→ Define variables to enable state management and reduce LLM memory reliance
```

**With Variables:**
```
✓ INFO: Context variables defined (3 variables)
→ Level 4 Determinism achieved with personalized state management
```

**Complex Instructions:**
```
⚠️ WARNING: Topics may be overscripted with excessive instructions
→ Use abstract guidance or consider Agent Script for deterministic flows
```

**Missing Data Grounding:**
```
⚠️ WARNING: No apparent data grounding actions (Level 3 Determinism)
→ Add actions to retrieve verified data from CRM/knowledge bases
```

**Determinism Summary:**
```
ℹ️ INFO: Agent operates at Level 3 Determinism
→ Data Grounding: Responses connected to verified sources
→ Consider: Variables (Level 4) for personalization or Apex (Level 5) for complex logic
```

---

## 🔧 Weight & Scoring

**Category Weight**: 12% of Configuration stage (highest in Configuration)

This reflects Agent Script & Determinism's importance in:
- Agent reliability and predictability
- Compliance and regulatory adherence
- Business process automation quality
- User experience consistency

---

## 📊 Impact on Scores

### Configuration Stage Score
- **Before**: 50% of overall score (9 categories)
- **After**: 55% of overall score (10 categories)
- Agent Script & Determinism = 12% of Configuration = **6.6% of overall score**

### Other Category Adjustments
Minor weight rebalancing to accommodate new category:
- Topic Design: 10% → 9%
- Instruction Quality: 12% → 10%
- Actions Config: 10% → 9%
- Escalation: 5% → 4%
- Channel Config: 3% → 2%
- Error Handling: 5% → 4%

---

## 🎯 Real-World Examples

### Low Determinism (Level 1-2)
**Use Case**: Customer support chatbot, exploratory product discovery
**Why**: Needs flexibility to handle creative questions
**Agent Script**: Not needed

### Medium Determinism (Level 3-4)
**Use Case**: Order status lookup, account information retrieval
**Why**: Needs accurate data, user-specific context
**Agent Script**: Optional

### High Determinism (Level 5-6)
**Use Case**: Loan approval workflow, compliance verification, multi-step onboarding
**Why**: Must follow exact business rules, regulatory requirements
**Agent Script**: Highly recommended

---

## 📚 Reference Documentation

### Salesforce Official Docs
- [Agent Script Guide](https://developer.salesforce.com/docs/ai/agentforce/guide/agent-script.html)
- [Levels of Determinism](https://www.salesforce.com/agentforce/levels-of-determinism/)

### Key Takeaways from Docs

**Agent Script Definition:**
> "Script combines the flexibility of natural language instructions for handling conversational tasks with the reliability of programmatic expressions for handling business rules."

**When to Use Agent Script:**
> "Use Agent Script when you need deterministic control over agent transitions between topics, action chaining, business rule enforcement, or context preservation."

**Best Practice:**
> "Define explicit reasoning boundaries - specify areas where the LLM has interpretive freedom versus areas requiring deterministic execution."

**Instruction Quality:**
> "Avoid overscripting specific conversational flows. Use abstract-level instructions similar to human employee training."

**Optimal Limits:**
> "Salesforce recommends maximum 10 topics and 10 actions per topic for optimal classification accuracy and deterministic routing."

---

## ✨ Benefits

1. **Education**: Teaches users about determinism levels
2. **Assessment**: Automatically evaluates current determinism
3. **Guidance**: Provides next steps based on business needs
4. **Best Practices**: Enforces Salesforce recommendations
5. **Compliance**: Identifies gaps for regulated industries
6. **Quality**: Improves agent reliability and predictability

---

## 🚀 Next Steps

Users should:
1. **Run analysis** to see their determinism level
2. **Review findings** under Configuration → Agent Script & Determinism
3. **Evaluate needs** - Does use case require more control?
4. **Implement changes** based on recommendations
5. **Re-analyze** to track improvements

Optimal determinism = **Right level for business requirements**, not maximum control for every use case.
