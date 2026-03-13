# Mathematical Scoring System Improvements

## 🎯 Current System Issues

### Current Formula
```
category_score = 100 - Σ(severity_deduction)
overall_score = Σ(category_score × weight) / Σ(weight)
```

### Problems
1. **Linear deductions** don't reflect real-world severity accumulation
2. **No normalization** for category complexity
3. **No confidence intervals** for score reliability
4. **No population benchmarking** (is 75 good?)
5. **Equal treatment** of findings regardless of context/impact
6. **No temporal tracking** of improvements

---

## 📊 Proposed Mathematical Approaches

### Option 1: Exponential Decay Model
**Rationale**: Diminishing returns - first critical is worse than 5th

```python
def calculate_category_score(findings):
    severity_weights = {
        'critical': 0.15,  # λ parameter
        'warning': 0.08,
        'info': 0.02
    }

    # Exponential decay: S = 100 * e^(-λΣf)
    total_severity = sum(severity_weights[f.severity] for f in findings)
    score = 100 * math.exp(-total_severity)

    return score
```

**Benefits**:
- Natural saturation (can't go below 0)
- Diminishing penalty for accumulated issues
- Mathematically grounded in decay processes

**Example**:
- 1 critical: 100 × e^(-0.15) = 86.1
- 2 criticals: 100 × e^(-0.30) = 74.1
- 4 criticals: 100 × e^(-0.60) = 54.9
- 10 criticals: 100 × e^(-1.50) = 22.3

---

### Option 2: Bayesian Scoring with Confidence Intervals
**Rationale**: Incorporate uncertainty and prior knowledge

```python
def bayesian_category_score(findings, checks_performed, total_possible_checks):
    # Prior: Beta distribution based on population
    prior_alpha = 80  # Historical "successes"
    prior_beta = 20   # Historical "failures"

    # Observed data
    failures = sum(1 for f in findings if f.severity in ['critical', 'warning'])
    successes = checks_performed - failures

    # Posterior distribution: Beta(α + successes, β + failures)
    posterior_alpha = prior_alpha + successes
    posterior_beta = prior_beta + failures

    # Expected score (mean of posterior)
    expected_score = 100 * (posterior_alpha / (posterior_alpha + posterior_beta))

    # Credible interval (95%)
    from scipy.stats import beta
    lower_bound = 100 * beta.ppf(0.025, posterior_alpha, posterior_beta)
    upper_bound = 100 * beta.ppf(0.975, posterior_alpha, posterior_beta)

    return {
        'score': expected_score,
        'confidence_interval': (lower_bound, upper_bound),
        'confidence': 95
    }
```

**Benefits**:
- Provides uncertainty quantification
- Incorporates historical data
- More checks = narrower confidence interval
- Handles incomplete data gracefully

**Example Output**:
```
Score: 78.5 [73.2 - 83.8] (95% CI)
```

---

### Option 3: Z-Score Normalization (Population-Relative)
**Rationale**: Show where agent stands compared to others

```python
def calculate_z_score(agent_score, category):
    # Population statistics (from historical data)
    population_stats = {
        'topicDesign': {'mean': 72.4, 'std': 15.2},
        'instructionQuality': {'mean': 68.1, 'std': 18.7},
        # ...
    }

    stats = population_stats[category]
    z_score = (agent_score - stats['mean']) / stats['std']

    # Convert to percentile
    from scipy.stats import norm
    percentile = norm.cdf(z_score) * 100

    return {
        'raw_score': agent_score,
        'z_score': z_score,
        'percentile': percentile,
        'interpretation': get_interpretation(z_score)
    }

def get_interpretation(z_score):
    if z_score > 2: return "Exceptional (top 2%)"
    if z_score > 1: return "Above Average (top 16%)"
    if z_score > -1: return "Average"
    if z_score > -2: return "Below Average (bottom 16%)"
    return "Needs Improvement (bottom 2%)"
```

**Benefits**:
- Meaningful comparison to peer group
- Shows relative standing
- Accounts for difficulty variations

**Example Output**:
```
Topic Design: 85 (z=0.83, 80th percentile, Above Average)
```

---

### Option 4: Impact-Weighted Scoring
**Rationale**: Not all findings have equal business impact

```python
def calculate_impact_weighted_score(findings, agent_data):
    base_severity = {
        'critical': 10,
        'warning': 5,
        'info': 1
    }

    impact_multipliers = {
        # Component usage frequency
        'high_traffic_topic': 2.0,   # Used in 80%+ conversations
        'medium_traffic_topic': 1.0,  # Used in 20-80%
        'low_traffic_topic': 0.5,     # Used in <20%

        # Risk factors
        'customer_facing': 1.5,       # External users
        'internal_only': 1.0,         # Internal users

        # Data sensitivity
        'pii_handling': 2.0,          # Handles PII
        'financial_data': 1.8,        # Handles money
        'general_data': 1.0,          # General info
    }

    weighted_severity = 0
    for finding in findings:
        # Calculate impact multiplier for this finding
        component_multiplier = get_component_impact(finding, agent_data)

        # Impact = Severity × Context
        impact = base_severity[finding.severity] * component_multiplier
        weighted_severity += impact

    # Normalize to 0-100 scale
    max_possible_impact = estimate_max_impact(agent_data)
    score = 100 * (1 - min(weighted_severity / max_possible_impact, 1))

    return score
```

**Benefits**:
- Focuses attention on high-impact issues
- Accounts for real-world usage patterns
- Business-aligned scoring

---

### Option 5: Multi-Dimensional Vector Scoring
**Rationale**: Single number loses information

```python
def calculate_vector_score(findings):
    dimensions = {
        'reliability': 0,      # How predictable/deterministic
        'compliance': 0,       # Regulatory adherence
        'usability': 0,        # User experience quality
        'maintainability': 0,  # Code/config quality
        'security': 0,         # Data protection
    }

    # Map findings to dimensions
    dimension_map = {
        'SCRIPT-*': ['reliability', 'compliance'],
        'TOPIC-*': ['usability', 'reliability'],
        'SEC-*': ['security', 'compliance'],
        # ...
    }

    for finding in findings:
        affected_dimensions = get_affected_dimensions(finding)
        impact = severity_to_impact(finding.severity)

        for dim in affected_dimensions:
            dimensions[dim] += impact

    # Convert to scores (0-100 per dimension)
    scores = {
        dim: 100 * math.exp(-severity)
        for dim, severity in dimensions.items()
    }

    # Calculate composite score (weighted harmonic mean)
    weights = {'reliability': 0.3, 'compliance': 0.25, 'usability': 0.2,
               'maintainability': 0.15, 'security': 0.1}

    composite = harmonic_mean(scores, weights)

    return {
        'dimensions': scores,
        'composite': composite,
        'visualization': 'radar_chart'
    }
```

**Benefits**:
- Preserves multi-dimensional information
- Different stakeholders care about different dimensions
- Better visualization (radar charts)

**Example Output**:
```
Reliability:      82 ████████░░
Compliance:       75 ███████░░░
Usability:        88 █████████░
Maintainability:  70 ███████░░░
Security:         95 ██████████
Overall:          81
```

---

### Option 6: Statistical Process Control (SPC)
**Rationale**: Track score stability over time

```python
def calculate_spc_metrics(historical_scores):
    mean = np.mean(historical_scores)
    std = np.std(historical_scores)

    # Control limits (3-sigma)
    ucl = mean + 3 * std  # Upper control limit
    lcl = mean - 3 * std  # Lower control limit

    # Check for special cause variation
    latest_score = historical_scores[-1]

    status = 'in_control'
    if latest_score > ucl or latest_score < lcl:
        status = 'out_of_control'
    elif is_trending(historical_scores):
        status = 'trending'

    return {
        'current_score': latest_score,
        'mean': mean,
        'std': std,
        'ucl': ucl,
        'lcl': lcl,
        'status': status,
        'capability': calculate_capability_index(historical_scores)
    }

def calculate_capability_index(scores):
    # Process capability: Cpk
    # Measures how well process meets specifications
    usl = 100  # Upper spec limit
    lsl = 60   # Lower spec limit (minimum acceptable)

    mean = np.mean(scores)
    std = np.std(scores)

    cpu = (usl - mean) / (3 * std)
    cpl = (mean - lsl) / (3 * std)
    cpk = min(cpu, cpl)

    interpretation = {
        cpk >= 2.0: "World Class",
        cpk >= 1.33: "Capable",
        cpk >= 1.0: "Marginally Capable",
        cpk < 1.0: "Not Capable"
    }[True]

    return {'cpk': cpk, 'interpretation': interpretation}
```

**Benefits**:
- Detects degradation over time
- Shows process stability
- Industry-standard quality metric

---

## 🎯 Recommended Hybrid Approach

Combine multiple methods for comprehensive scoring:

```python
def comprehensive_score(agent_data):
    findings = agent_data.findings

    # 1. Base score using exponential decay
    base_score = exponential_decay_score(findings)

    # 2. Apply impact weighting
    impact_weighted = apply_impact_weights(base_score, findings, agent_data)

    # 3. Calculate confidence interval (Bayesian)
    score_with_ci = add_confidence_interval(impact_weighted, agent_data)

    # 4. Add population context (Z-score)
    with_context = add_population_context(score_with_ci, agent_data)

    # 5. Multi-dimensional breakdown
    dimensions = calculate_dimensions(findings)

    return {
        'overall_score': with_context['score'],
        'confidence_interval': with_context['ci'],
        'percentile': with_context['percentile'],
        'grade': score_to_grade(with_context['score']),
        'dimensions': dimensions,
        'trend': calculate_trend(historical_data),
        'recommendations': generate_smart_recommendations(findings, dimensions)
    }
```

---

## 📊 Visualization Improvements

### Current: Single number
```
Score: 78
Grade: B
```

### Proposed: Rich information
```
Overall Score: 78.5 [73.2 - 83.8] (95% CI)
Grade: B (80th percentile)
Trend: ↑ +3.2 from last month

Dimensions:
├─ Reliability:      82 ████████░░ (Above Avg)
├─ Compliance:       75 ███████░░░ (Average)
├─ Usability:        88 █████████░ (Exceptional)
├─ Maintainability:  70 ███████░░░ (Below Avg) ⚠️
└─ Security:         95 ██████████ (Exceptional)

Focus Areas:
1. Maintainability: 3 critical findings in instruction quality
2. Compliance: Missing test coverage for 2 topics
```

---

## 🚀 Implementation Roadmap

### Phase 1: Quick Wins (Week 1)
- [ ] Exponential decay scoring
- [ ] Multi-dimensional breakdown
- [ ] Better grade interpretation

### Phase 2: Statistical Rigor (Week 2)
- [ ] Confidence intervals
- [ ] Population benchmarking
- [ ] Impact weighting

### Phase 3: Advanced Analytics (Week 3)
- [ ] Trend analysis
- [ ] SPC charts
- [ ] Predictive scoring

### Phase 4: Machine Learning (Future)
- [ ] Learn optimal weights from data
- [ ] Anomaly detection
- [ ] Automated recommendation priority

---

## 🎓 Mathematical Justification

### Why Exponential Decay?
- **Natural saturation**: Can't exceed 100 or go below 0
- **Diminishing returns**: Fixing the 10th issue matters less than the 1st
- **Grounded in physics**: Decay processes are well-understood

### Why Bayesian?
- **Handles uncertainty**: Small sample sizes need wider confidence intervals
- **Incorporates prior knowledge**: Leverage historical data
- **Philosophically sound**: Updates beliefs with evidence

### Why Z-Score?
- **Population-relative**: "Good" is context-dependent
- **Standard metric**: Widely understood in statistics
- **Actionable**: Shows where to focus vs peers

### Why Multi-Dimensional?
- **Information preservation**: Single number loses nuance
- **Stakeholder alignment**: Different people care about different aspects
- **Better decisions**: Can optimize specific dimensions

---

## 📈 Example Comparison

### Current System
```
Agent A: 75 (Grade: B)
Agent B: 75 (Grade: B)

→ Appear equal, but...
```

### New System
```
Agent A:
- Score: 75.2 [70.1 - 80.3]
- Percentile: 62nd
- Dimensions: Balanced across all
- Trend: Stable

Agent B:
- Score: 74.8 [68.5 - 81.1]
- Percentile: 58th
- Dimensions: Excellent security, poor maintainability
- Trend: Declining ↓

→ Agent A is clearly better despite similar scores
```

---

## 💡 Key Insight

**Don't aim for a perfect single number. Aim for:**
1. **Actionable** insights (what to fix first)
2. **Confidence** in the measurement
3. **Context** for interpretation
4. **Trends** over time
5. **Dimensions** for stakeholders

The goal isn't mathematical perfection—it's **better decision-making**.
