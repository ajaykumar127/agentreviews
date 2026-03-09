import type { AgentAnalysisData, Finding } from '../types';

export function analyzeDataCloud(data: AgentAnalysisData): Finding[] {
  const findings: Finding[] = [];
  const { bot, dataCloudInfo, topicMetadata } = data;

  if (!dataCloudInfo) {
    return findings;
  }

  const { isEnabled, dataSources, retrievers, searchIndexes } = dataCloudInfo;

  // Check if Data Cloud components exist (more lenient check)
  const hasDataCloudComponents = dataSources.length > 0 || retrievers.length > 0 || searchIndexes.length > 0;

  // If no components at all, show warning
  if (!isEnabled && !hasDataCloudComponents) {
    findings.push({
      id: 'DATA-001',
      category: 'agentDefinition',
      stage: 'data',
      severity: 'info',
      title: 'Data Cloud components not detected',
      description: `No Data Cloud components (data sources, retrievers, or search indexes) were detected. Agentforce agents benefit from Data Cloud for grounding responses in real-time data.`,
      recommendation: 'Consider enabling Data Cloud and configuring data sources, retrievers, or search indexes to improve agent response accuracy.',
      affectedComponent: `Agent: ${bot.MasterLabel}`,
    });
  }

  // Check for retrievers
  if (retrievers.length === 0) {
    findings.push({
      id: 'DATA-006',
      category: 'agentDefinition',
      stage: 'data',
      severity: 'warning',
      title: 'No retrievers configured',
      description: `No GenAI retrievers are configured for semantic search. Retrievers enable agents to search and retrieve relevant information from your data sources using natural language.`,
      recommendation: 'Configure GenAI retrievers in Setup → Einstein → Generative AI → Retrievers to enable semantic search capabilities for your agent.',
      affectedComponent: `Agent: ${bot.MasterLabel}`,
    });
  } else {
    // Retrievers exist
    findings.push({
      id: 'DATA-007',
      category: 'agentDefinition',
      stage: 'data',
      severity: 'info',
      title: 'Retrievers configured',
      description: `${retrievers.length} GenAI retriever(s) configured. Retrievers enable semantic search and information retrieval for your agent.`,
      recommendation: 'Ensure your topics reference these retrievers in their instructions to leverage semantic search capabilities.',
      affectedComponent: `Agent: ${bot.MasterLabel}`,
    });
  }

  // Check for search indexes
  if (searchIndexes.length === 0) {
    findings.push({
      id: 'DATA-008',
      category: 'agentDefinition',
      stage: 'data',
      severity: 'warning',
      title: 'No search indexes configured',
      description: `No search indexes are configured. Search indexes optimize data retrieval performance and enable faster semantic search.`,
      recommendation: 'Configure search indexes in Data Cloud or Einstein Search to improve agent response speed and accuracy.',
      affectedComponent: `Agent: ${bot.MasterLabel}`,
    });
  } else {
    // Search indexes exist
    findings.push({
      id: 'DATA-009',
      category: 'agentDefinition',
      stage: 'data',
      severity: 'info',
      title: 'Search indexes configured',
      description: `${searchIndexes.length} search index(es) configured. Search indexes enable fast, efficient data retrieval for your agent.`,
      recommendation: 'Monitor search index sync status to ensure your agent has access to the latest data.',
      affectedComponent: `Agent: ${bot.MasterLabel}`,
    });
  }

  // Check if data sources are configured
  if (!dataSources || dataSources.length === 0) {
    findings.push({
      id: 'DATA-002',
      category: 'agentDefinition',
      stage: 'data',
      severity: 'info',
      title: 'No data sources detected',
      description: `No Data Cloud data sources were detected. Data sources connect external systems and databases to provide real-time data.`,
      recommendation: 'If using Data Cloud, configure data sources to connect your CRM data, external systems, or data streams.',
      affectedComponent: `Agent: ${bot.MasterLabel}`,
    });
  } else {
    // Check for inactive data sources
    const inactiveDataSources = dataSources.filter(
      (ds: any) => ds.ConnectionStatus && ds.ConnectionStatus !== 'Active'
    );

    if (inactiveDataSources.length > 0) {
      findings.push({
        id: 'DATA-003',
        category: 'agentDefinition',
        stage: 'data',
        severity: 'warning',
        title: 'Inactive data sources detected',
        description: `${inactiveDataSources.length} of ${dataSources.length} data sources are not active. Inactive data sources won't provide data to your agent.`,
        recommendation: 'Review and activate data sources in Data Cloud. Check connection credentials, network access, and sync schedules.',
        affectedComponent: `Agent: ${bot.MasterLabel}`,
      });
    }

    // Success - data sources are configured
    if (dataSources.length > 0 && inactiveDataSources.length === 0) {
      findings.push({
        id: 'DATA-004',
        category: 'agentDefinition',
        stage: 'data',
        severity: 'info',
        title: 'Data Cloud properly configured',
        description: `Data Cloud is enabled with ${dataSources.length} active data source(s). Your agent can access unified customer data for grounding.`,
        recommendation: 'Continue monitoring data source sync status and data quality to ensure your agent has access to fresh, accurate data.',
        affectedComponent: `Agent: ${bot.MasterLabel}`,
      });
    }
  }

  // Check if topics reference data sources in their instructions
  if (topicMetadata && topicMetadata.length > 0) {
    const topicsWithDataReferences = topicMetadata.filter((t) => {
      const instructions = t.instructions || [];
      const fullText = instructions.map((i) => i.instruction).join(' ').toLowerCase();
      return fullText.includes('data') || fullText.includes('record') || fullText.includes('search');
    });

    if (topicsWithDataReferences.length === 0) {
      findings.push({
        id: 'DATA-005',
        category: 'agentDefinition',
        stage: 'data',
        severity: 'info',
        title: 'Topics may not be using data grounding',
        description: `None of your ${topicMetadata.length} topic instructions explicitly reference data retrieval or search. The agent may not be leveraging Data Cloud effectively.`,
        recommendation: 'Update topic instructions to explicitly guide the agent to search data sources when needed (e.g., "Search customer records to find their order history").',
        affectedComponent: `Agent: ${bot.MasterLabel}`,
      });
    }
  }

  return findings;
}
