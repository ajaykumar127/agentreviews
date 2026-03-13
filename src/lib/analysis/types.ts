import type {
  BotRecord,
  BotVersionRecord,
  GenAiPlannerBundleRecord,
  GenAiPluginRecord,
  GenAiPluginMetadata,
  GenAiFunctionRecord,
  GenAiFunctionMetadata,
  BotMetadata,
  BotVersionMetadata,
  AiEvaluationDefinitionRecord,
  ChannelDeploymentRecord,
} from '../salesforce/types';

export type Severity = 'critical' | 'warning' | 'info';

// Agent Development Life Cycle stages
export type ReviewStage = 'designSetup' | 'configuration' | 'test' | 'deploy' | 'monitor' | 'data' | 'apex';

export type CategoryId =
  | 'topicDesign'
  | 'instructionQuality'
  | 'actionsConfig'
  | 'escalation'
  | 'guardrails'
  | 'channelConfig'
  | 'errorHandling'
  | 'llmGrounding'
  | 'security'
  | 'testCoverage'
  | 'agentDefinition'
  | 'testExistence'
  | 'activation'
  | 'agentScriptDeterminism'
  | 'apexBestPractices';

export interface Finding {
  id: string;
  category: CategoryId;
  stage: ReviewStage;
  severity: Severity;
  title: string;
  description: string;
  recommendation: string;
  affectedComponent: string;
}

export type ScoreDimension = 'reliability' | 'compliance' | 'usability' | 'maintainability' | 'security';

export interface CategoryScore {
  category: CategoryId;
  stage: ReviewStage;
  label: string;
  score: number;
  maxScore: number;
  weight: number;
  findings: Finding[];
  passCount: number;
  warnCount: number;
  failCount: number;
  // Advanced scoring metrics
  exponentialScore?: number;
  confidenceInterval?: {
    lower: number;
    upper: number;
    confidence: number;
  };
  dimensions?: Record<ScoreDimension, number>;
  impactWeightedScore?: number;
  percentile?: number;
}

export interface AgentReport {
  agentName: string;
  agentDeveloperName: string;
  overallScore: number;
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  stageScores: {
    designSetup: number;
    configuration: number;
    test: number;
    deploy: number;
    monitor: number;
    data: number;
    apex?: number;
  };
  categories: CategoryScore[];
  findings: Finding[];
  dataCloudInfo?: {
    isEnabled: boolean;
    dataSources: any[];
    retrievers: any[];
    searchIndexes: any[];
    debugInfo?: {
      availableObjects: string[];
      dataCloudObjects: string[];
      queriesAttempted: string[];
      errors: string[];
    };
  };
  // Advanced scoring metrics
  confidenceInterval?: {
    lower: number;
    upper: number;
    confidence: number;
  };
  dimensionalScores?: Record<ScoreDimension, number>;
  percentile?: number;
  analyzedAt: string;
  orgId: string;
  apiVersion: string;
}

export interface AnalysisReport {
  agents: AgentReport[];
  summary: {
    totalAgents: number;
    averageScore: number;
    criticalCount: number;
    warningCount: number;
    infoCount: number;
  };
  analyzedAt: string;
}

export interface AgentAnalysisData {
  bot: BotRecord;
  botVersion: BotVersionRecord | null;
  plannerBundle: GenAiPlannerBundleRecord | null;
  topics: GenAiPluginRecord[];
  topicMetadata: GenAiPluginMetadata[];
  actions: GenAiFunctionRecord[];
  actionMetadata: GenAiFunctionMetadata[];
  botMetadata: BotMetadata | null;
  botVersionMetadata: BotVersionMetadata | null;
  testDefinitions: AiEvaluationDefinitionRecord[];
  channelDeployments: ChannelDeploymentRecord[];
  dataCloudInfo?: {
    isEnabled: boolean;
    dataSources: any[];
    retrievers: any[];
    searchIndexes: any[];
    debugInfo?: {
      availableObjects: string[];
      dataCloudObjects: string[];
      queriesAttempted: string[];
      errors: string[];
    };
  };
}

export type RuleAnalyzer = (data: AgentAnalysisData) => Finding[];
