import React, { useState, useEffect } from 'react';
import { X, Edit3, Save, BookOpen, Download } from 'lucide-react';

interface BestPracticesGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_CONTENT = `# Agent Review Instructions

## Overview
This guide outlines the comprehensive best practices for reviewing Agentforce agents across all stages of the Agent Development Life Cycle. Use this as a checklist when building, testing, and deploying agents.

---

## Stage 1: Design & Setup

### Agent Definition
- **Description**: Every agent must have a clear, descriptive summary (minimum 50 characters)
  - Explains the agent's purpose and capabilities
  - Written for end users to understand
  - Avoid technical jargon

- **Context Variables**: Define all necessary context variables
  - Document expected data types
  - Set appropriate scope (conversation vs global)
  - Use descriptive names

- **Active Version**: Ensure agent has an active version
  - Required for deployment
  - Version must be published and activated

---

## Stage 2: Configuration

### Topic Design
- **Topic Count**: Keep topics between 3-10 for optimal performance
  - Too few: Agent can't handle variety
  - Too many: Classification confusion increases

- **Required Topics**:
  - ✓ **General_FAQ** - Handles general questions
  - ✓ **Off_Topic** - Gracefully handles out-of-scope requests
  - ✓ **Escalation** - Clear path to human handoff

- **Topic Naming**: Use clear, descriptive names
  - CamelCase or underscore_case
  - Avoid generic names like "Topic1"
  - Name should indicate purpose

- **Classification Description**: Each topic needs:
  - Clear classification prompt (50+ characters)
  - Examples of when this topic applies
  - Keywords that trigger this topic

### Instruction Quality
- **Instruction Length**: Each instruction should be 50-200 characters
  - Too short: Lacks guidance
  - Too long: Model confusion

- **Instruction Count**: 3-7 instructions per topic optimal
  - Cover main scenarios
  - Be specific and actionable
  - Use imperative voice ("Search for...", "Retrieve...", "Show...")

- **Prompt Engineering Best Practices**:
  - ✓ Start with action verbs
  - ✓ Be explicit about data sources
  - ✓ Include error handling guidance
  - ✓ Specify output format when needed
  - ✗ Avoid ambiguous terms
  - ✗ Don't use negative phrasing

### Actions Configuration
- **Action Count per Topic**: Maximum 5 actions per topic
  - Salesforce best practice guideline
  - Reduces latency and complexity

- **Action Naming**: Clear, descriptive names
  - Indicates what the action does
  - Use verb-noun format: "GetCustomerData", "CreateCase"

- **Action Parameters**:
  - All required parameters documented
  - Clear descriptions for each parameter
  - Appropriate data types specified

- **Action Reusability**: Avoid duplicate actions
  - Same functionality = same action
  - Use action references across topics

### Guardrails
- **Content Filtering**: Implement appropriate guardrails
  - Block toxic or harmful content
  - Filter sensitive information
  - Prevent prompt injection

- **Output Validation**: Ensure responses are:
  - Factually grounded
  - On-topic
  - Appropriate tone

### Error Handling
- **Fallback Responses**: Define clear fallback behavior
  - When action fails
  - When data not found
  - When unclear input received

- **Escalation Triggers**:
  - Failed action attempts > 2
  - User explicitly asks for human
  - Agent confidence < threshold

---

## Stage 3: Test

### Test Coverage
- **Test Definitions Required**: Every agent needs test cases
  - Minimum 5 test cases per agent
  - Cover happy path scenarios
  - Include edge cases

- **Test Categories**:
  - ✓ Topic classification tests
  - ✓ Action execution tests
  - ✓ Escalation path tests
  - ✓ Error handling tests
  - ✓ Guardrail validation tests

- **Test Data Quality**:
  - Use realistic data
  - Include variations
  - Test boundary conditions

### Continuous Testing
- **Regression Testing**: Run tests after every change
- **Performance Testing**: Monitor response times
- **Load Testing**: Verify performance under load

---

## Stage 4: Deploy

### Activation
- **Active Version**: Agent must have active version before deployment
- **Channel Configuration**: Configure appropriate channels
  - Web Chat
  - WhatsApp
  - Messaging for In-App and Web
  - Slack (if applicable)

### Channel-Specific Guidelines
- **Character Limits**:
  - WhatsApp: 4096 characters
  - Web Chat: 32,000 characters
  - Slack: 4,000 characters
  - Test responses fit within limits

- **Media Support**:
  - Images: WhatsApp, Web Chat
  - Files: Web Chat, Slack
  - Quick Replies: WhatsApp, Messaging

### Deployment Checklist
- [ ] Active version exists
- [ ] At least one channel configured
- [ ] Channel-specific settings validated
- [ ] Greeting message configured
- [ ] Fallback responses tested
- [ ] Escalation path verified

---

## Stage 5: Monitor

### Runtime Monitoring
- **Conversation Analytics**: Track key metrics
  - Containment rate (% resolved without escalation)
  - Average response time
  - User satisfaction scores
  - Topic classification accuracy

- **Action Performance**:
  - Success rate per action
  - Average execution time
  - Error rates and types

### LLM Grounding
- **Data Sources**: Verify agent uses appropriate data
  - Data Cloud connections active
  - Knowledge articles accessible
  - External APIs responding

- **Retrieval Quality**:
  - Relevant results returned
  - Proper ranking
  - No hallucinations

### Performance Optimization
- **Response Time**: Keep under 3 seconds
  - Optimize action queries
  - Cache frequent lookups
  - Reduce unnecessary API calls

---

## Stage 6: Data Cloud & Grounding

### Data Cloud Configuration
- **Data Sources**: Configure external data connections
  - CRM data (Salesforce objects)
  - External databases
  - APIs and web services
  - File storage

- **Retrievers**: Set up GenAI Retrievers
  - Define search scope
  - Configure ranking algorithms
  - Set up semantic search

- **Search Indexes**: Optimize data retrieval
  - Index frequently accessed data
  - Configure update frequency
  - Monitor sync status

### Data Quality
- **Data Freshness**: Ensure data is current
  - Configure sync schedules
  - Monitor lag times
  - Handle stale data gracefully

- **Data Accuracy**: Validate data quality
  - Remove duplicates
  - Fix incomplete records
  - Standardize formats

### Grounding Best Practices
- **Citation**: Always cite data sources
- **Recency**: Prioritize recent information
- **Relevance**: Filter for context-appropriate data
- **Privacy**: Respect data sharing rules

---

## Security Best Practices

### Data Protection
- **PII Handling**: Never log or expose sensitive data
  - Mask credit card numbers
  - Redact SSNs and passwords
  - Encrypt data in transit

- **Access Control**: Enforce proper permissions
  - Respect Salesforce sharing rules
  - Validate user access before retrieval
  - Audit access logs

### Prompt Injection Prevention
- **Input Validation**: Sanitize user input
- **System Prompts**: Protect system instructions
- **Output Filtering**: Validate responses before sending

---

## Common Anti-Patterns to Avoid

❌ **Too many topics** (>10): Leads to classification confusion
❌ **Generic topic names**: "Topic1", "General" - not descriptive
❌ **Missing Off_Topic handler**: No graceful degradation
❌ **No escalation path**: Users get stuck
❌ **Duplicate actions**: Same logic in multiple places
❌ **Vague instructions**: "Handle the request" - too generic
❌ **No test coverage**: Changes break unexpectedly
❌ **Missing active version**: Can't deploy
❌ **Unconfigured channels**: Agent not accessible
❌ **No monitoring**: Can't identify issues

---

## Success Metrics

### Agent Quality Indicators
- **Containment Rate**: > 80% (resolved without escalation)
- **User Satisfaction**: > 4.0 / 5.0
- **Response Time**: < 3 seconds
- **Classification Accuracy**: > 90%
- **Action Success Rate**: > 95%

### Testing Benchmarks
- **Test Coverage**: > 80% of scenarios
- **Test Pass Rate**: 100% before deployment
- **Regression Tests**: Run on every change

---

## Resources

### Salesforce Documentation
- [Agentforce Setup Guide](https://help.salesforce.com/agentforce)
- [Einstein GenAI Best Practices](https://help.salesforce.com/einstein-genai)
- [Data Cloud Integration](https://help.salesforce.com/data-cloud)

### Internal Guidelines
- Follow your organization's AI ethics guidelines
- Comply with data governance policies
- Adhere to brand voice and tone

---

## Version History
- **v1.0** - Initial best practices framework
- **Last Updated**: ${new Date().toLocaleDateString()}
`;

export default function BestPracticesGuide({ isOpen, onClose }: BestPracticesGuideProps) {
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  // Load saved content from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('agentforce-best-practices');
    if (saved) {
      setContent(saved);
      setEditedContent(saved);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('agentforce-best-practices', editedContent);
    setContent(editedContent);
    setIsEditing(false);
  };

  const handleReset = () => {
    if (confirm('Reset to default best practices? Your changes will be lost.')) {
      setContent(DEFAULT_CONTENT);
      setEditedContent(DEFAULT_CONTENT);
      localStorage.removeItem('agentforce-best-practices');
      setIsEditing(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agentforce-best-practices.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Agent Review Instructions</h2>
              <p className="text-sm text-gray-500">Comprehensive checklist for agent review</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
              >
                <Edit3 className="w-4 h-4" />
                Edit
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setEditedContent(content);
                    setIsEditing(false);
                  }}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition"
            >
              Reset to Default
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {isEditing ? (
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full h-full min-h-[600px] px-4 py-3 font-mono border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              style={{
                backgroundColor: '#1e1e1e',
                color: '#ffffff',
                fontSize: '14px',
                lineHeight: '1.6',
              }}
              placeholder="Write your best practices in Markdown format..."
            />
          ) : (
            <div className="prose prose-lg max-w-none text-black">
              <div
                className="markdown-content"
                style={{ color: '#000000' }}
                dangerouslySetInnerHTML={{
                  __html: content
                    .split('\n')
                    .map((line) => {
                      // Headers
                      if (line.startsWith('# ')) return `<h1 style="color: #000000; font-size: 2rem; font-weight: bold; margin-bottom: 1rem; margin-top: 2rem;">${line.substring(2)}</h1>`;
                      if (line.startsWith('## ')) return `<h2 style="color: #000000; font-size: 1.5rem; font-weight: bold; margin-bottom: 0.75rem; margin-top: 1.5rem;">${line.substring(3)}</h2>`;
                      if (line.startsWith('### ')) return `<h3 style="color: #000000; font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; margin-top: 1rem;">${line.substring(4)}</h3>`;

                      // Horizontal rule
                      if (line === '---') return '<hr style="margin-top: 1.5rem; margin-bottom: 1.5rem; border-color: #d1d5db;" />';

                      // Lists
                      if (line.trim().startsWith('- **')) {
                        const content = line.substring(line.indexOf('**') + 2, line.lastIndexOf('**'));
                        const rest = line.substring(line.lastIndexOf('**') + 2);
                        return `<li style="color: #000000; margin-bottom: 0.5rem; font-size: 1rem;"><strong style="color: #000000; font-weight: 600;">${content}:</strong><span style="color: #000000;">${rest}</span></li>`;
                      }
                      if (line.trim().startsWith('- ✓')) return `<li style="color: #15803d; margin-bottom: 0.25rem; font-size: 1rem;">✓ ${line.substring(4)}</li>`;
                      if (line.trim().startsWith('- ✗')) return `<li style="color: #dc2626; margin-bottom: 0.25rem; font-size: 1rem;">✗ ${line.substring(4)}</li>`;
                      if (line.trim().startsWith('❌')) return `<li style="color: #dc2626; margin-bottom: 0.5rem; font-weight: 500; font-size: 1rem;">${line.substring(1)}</li>`;
                      if (line.trim().startsWith('- [ ]')) return `<li style="color: #000000; margin-bottom: 0.25rem; font-size: 1rem;"><input type="checkbox" style="margin-right: 0.5rem;" disabled /><span style="color: #000000;">${line.substring(5)}</span></li>`;
                      if (line.trim().startsWith('-')) return `<li style="color: #000000; margin-bottom: 0.25rem; font-size: 1rem;">${line.substring(line.indexOf('-') + 1)}</li>`;

                      // Paragraphs
                      if (line.trim().length > 0 && !line.startsWith(' ')) return `<p style="color: #000000; margin-bottom: 0.75rem; line-height: 1.6; font-size: 1rem;">${line}</p>`;

                      // Indented items
                      if (line.startsWith('  -')) return `<li style="color: #000000; margin-left: 1.5rem; margin-bottom: 0.25rem; font-size: 1rem;">${line.substring(3)}</li>`;

                      return '';
                    })
                    .filter(line => line.length > 0)
                    .join('\n'),
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
