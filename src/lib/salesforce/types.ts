// Tooling API record shapes
export interface BotRecord {
  Id: string;
  DeveloperName: string;
  MasterLabel: string;
  Description: string | null;
  Type: string;
}

export interface BotVersionRecord {
  Id: string;
  DeveloperName: string;
  Number: number;
  Status: string;
  BotId: string;
}

export interface GenAiPlannerBundleRecord {
  Id: string;
  DeveloperName: string;
  MasterLabel: string;
  Type: string;
}

export interface GenAiPluginRecord {
  Id: string;
  DeveloperName: string;
  MasterLabel: string;
  Description: string | null;
  Language: string | null;
}

export interface GenAiFunctionRecord {
  Id: string;
  DeveloperName: string;
  MasterLabel: string;
  Description: string | null;
}

export interface AiEvaluationDefinitionRecord {
  Id: string;
  DeveloperName: string;
  MasterLabel: string;
  SubjectName: string;
  SubjectVersion: string | null;
  IsActive: boolean;
}

export interface ChannelDeploymentRecord {
  Id: string;
  BotId: string;
  ChannelType: string;
  IsActive: boolean;
}

// Metadata API full shapes (from conn.metadata.read)
export interface GenAiPluginInstruction {
  instruction: string;
  sequence: number;
}

export interface GenAiPluginFunction {
  functionName: string;
}

export interface GenAiPluginMetadata {
  fullName: string;
  masterLabel: string;
  description?: string;
  classificationDescription?: string;
  scope?: string;
  instructions?: GenAiPluginInstruction[];
  genAiFunctions?: GenAiPluginFunction[];
}

export interface GenAiFunctionParam {
  name: string;
  dataType: string;
  description?: string;
  required?: boolean;
}

export interface GenAiFunctionMetadata {
  fullName: string;
  masterLabel: string;
  description?: string;
  genAiFunctionInputs?: GenAiFunctionParam[];
  genAiFunctionOutputs?: GenAiFunctionParam[];
}

export interface BotMetadata {
  fullName: string;
  masterLabel: string;
  description?: string;
  botChannels?: BotChannel[];
  contextVariables?: BotContextVariable[];
}

export interface BotChannel {
  channel: string;
  channelLabel?: string;
}

export interface BotContextVariable {
  developerName: string;
  dataType: string;
}

export interface BotVersionMetadata {
  fullName: string;
  masterLabel: string;
  conversationVariables?: BotContextVariable[];
}

export interface SalesforceSession {
  accessToken: string;
  instanceUrl: string;
  apiVersion: string;
  userId?: string;
  orgId?: string;
}

export interface DataCloudRecord {
  Id: string;
  Name: string;
  DeveloperName?: string;
  Status?: string;
}

export interface DataSourceRecord {
  Id: string;
  Name: string;
  Type?: string;
  ConnectionStatus?: string;
}

export interface RetrieverRecord {
  Id: string;
  Name: string;
  DeveloperName?: string;
  Type?: string;
  Status?: string;
}

export interface SearchIndexRecord {
  Id: string;
  Name: string;
  DeveloperName?: string;
  Status?: string;
  ObjectType?: string;
}
