import { Connection } from 'jsforce';
import * as queries from '../salesforce/queries';
import type { BotRecord } from '../salesforce/types';
import {
  calculateCategoryScore,
  calculateOverallScore,
  calculateStageScore,
  scoreToGrade,
  CATEGORY_CONFIG,
} from './scoring';
import { analyzeTopicDesign } from './rules/topicDesign';
import { analyzeInstructionQuality } from './rules/instructionQuality';
import { analyzeActionsConfig } from './rules/actionsConfig';
import { analyzeEscalation } from './rules/escalation';
import { analyzeGuardrails } from './rules/guardrails';
import { analyzeChannelConfig } from './rules/channelConfig';
import { analyzeErrorHandling } from './rules/errorHandling';
import { analyzeLlmGrounding } from './rules/llmGrounding';
import { analyzeSecurity } from './rules/security';
import { analyzeTestCoverage } from './rules/testCoverage';
import { analyzeAgentDefinition } from './rules/agentDefinition';
import { analyzeTestExistence } from './rules/testExistence';
import { analyzeActivation } from './rules/activation';
import { analyzeDataCloud } from './rules/dataCloud';
import type {
  AgentAnalysisData,
  AgentReport,
  CategoryScore,
  CategoryId,
  Finding,
  AnalysisReport,
  RuleAnalyzer,
} from './types';

const ANALYZERS: Record<CategoryId, RuleAnalyzer> = {
  agentDefinition: analyzeAgentDefinition,
  topicDesign: analyzeTopicDesign,
  instructionQuality: analyzeInstructionQuality,
  actionsConfig: analyzeActionsConfig,
  escalation: analyzeEscalation,
  guardrails: analyzeGuardrails,
  channelConfig: analyzeChannelConfig,
  errorHandling: analyzeErrorHandling,
  llmGrounding: analyzeLlmGrounding,
  security: analyzeSecurity,
  testCoverage: analyzeTestCoverage,
  testExistence: analyzeTestExistence,
  activation: analyzeActivation,
};

export async function analyzeAgent(
  conn: Connection,
  bot: BotRecord
): Promise<AgentReport> {
  // Fetch all metadata
  const botVersion = await queries.getActiveBotVersion(conn, bot.Id);
  const allTopics = await queries.getTopics(conn);
  const allActions = await queries.getActions(conn);

  // Get full metadata via Metadata API
  const topicMetadata = await queries.getTopicMetadata(
    conn,
    allTopics.map((t) => t.DeveloperName)
  );
  const actionMetadata = await queries.getActionMetadata(
    conn,
    allActions.map((a) => a.DeveloperName)
  );
  const botMetadata = await queries.getBotMetadata(conn, [bot.DeveloperName]);
  const botVersionMeta = botVersion
    ? await queries.getBotVersionMetadata(conn, [botVersion.DeveloperName])
    : [];

  // Fetch test definitions and channel deployments
  const testDefinitions = await queries.getTestDefinitions(conn, bot.DeveloperName);
  const channelDeployments = await queries.getChannelDeployments(conn, bot.Id);

  // Fetch Data Cloud information
  const dataCloudInfo = await queries.getDataCloudInfo(conn);

  const analysisData: AgentAnalysisData = {
    bot,
    botVersion,
    plannerBundle: null,
    topics: allTopics,
    topicMetadata,
    actions: allActions,
    actionMetadata,
    botMetadata: botMetadata[0] ?? null,
    botVersionMetadata: botVersionMeta[0] ?? null,
    testDefinitions,
    channelDeployments,
    dataCloudInfo,
  };

  // Run all analyzers
  const categories: CategoryScore[] = (
    Object.entries(ANALYZERS) as [CategoryId, RuleAnalyzer][]
  ).map(([categoryId, analyzer]) => {
    const findings = analyzer(analysisData);
    const config = CATEGORY_CONFIG[categoryId];
    const score = calculateCategoryScore(findings);
    return {
      category: categoryId,
      stage: config.stage,
      label: config.label,
      score,
      maxScore: 100,
      weight: config.weight,
      findings,
      passCount: findings.filter((f) => f.severity === 'info').length,
      warnCount: findings.filter((f) => f.severity === 'warning').length,
      failCount: findings.filter((f) => f.severity === 'critical').length,
    };
  });

  // Run Data Cloud analyzer separately (it uses 'data' stage)
  const dataCloudFindings = analyzeDataCloud(analysisData);

  const allFindings = [...categories.flatMap((c) => c.findings), ...dataCloudFindings];
  const overallScore = calculateOverallScore(categories);

  // Calculate stage-specific scores for Agent Development Life Cycle
  const dataScore = calculateCategoryScore(dataCloudFindings);
  const stageScores = {
    designSetup: calculateStageScore(categories, 'designSetup'),
    configuration: calculateStageScore(categories, 'configuration'),
    test: calculateStageScore(categories, 'test'),
    deploy: calculateStageScore(categories, 'deploy'),
    monitor: calculateStageScore(categories, 'monitor'),
    data: dataScore, // Data stage score from data cloud findings
  };

  return {
    agentName: bot.MasterLabel,
    agentDeveloperName: bot.DeveloperName,
    overallScore,
    overallGrade: scoreToGrade(overallScore),
    stageScores,
    categories,
    findings: allFindings,
    dataCloudInfo,
    analyzedAt: new Date().toISOString(),
    orgId: (conn as unknown as { userInfo?: { organizationId?: string } }).userInfo?.organizationId ?? '',
    apiVersion: conn.version ?? '61.0',
  };
}

export async function analyzeOrg(conn: Connection): Promise<AnalysisReport> {
  const agents = await queries.listAgents(conn);

  if (agents.length === 0) {
    return {
      agents: [],
      summary: {
        totalAgents: 0,
        averageScore: 0,
        criticalCount: 0,
        warningCount: 0,
        infoCount: 0,
      },
      analyzedAt: new Date().toISOString(),
    };
  }

  const agentReports: AgentReport[] = [];
  for (const agent of agents) {
    const report = await analyzeAgent(conn, agent);
    agentReports.push(report);
  }

  return {
    agents: agentReports,
    summary: {
      totalAgents: agentReports.length,
      averageScore: Math.round(
        agentReports.reduce((s, r) => s + r.overallScore, 0) / agentReports.length
      ),
      criticalCount: agentReports.reduce(
        (s, r) => s + r.findings.filter((f) => f.severity === 'critical').length,
        0
      ),
      warningCount: agentReports.reduce(
        (s, r) => s + r.findings.filter((f) => f.severity === 'warning').length,
        0
      ),
      infoCount: agentReports.reduce(
        (s, r) => s + r.findings.filter((f) => f.severity === 'info').length,
        0
      ),
    },
    analyzedAt: new Date().toISOString(),
  };
}
