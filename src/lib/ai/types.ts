/**
 * TypeScript Type Definitions for Gemini AI Integration
 *
 * This file contains all type definitions for AI features including:
 * - Request/response payloads
 * - Business metrics interfaces
 * - Prediction models
 * - Chat message formats
 * - Error types
 */

// ============================================================================
// GEMINI CLIENT TYPES
// ============================================================================

export interface GeminiConfig {
  apiKey: string;
  model: 'gemini-1.5-flash' | 'gemini-1.5-pro' | 'gemini-2.0-flash-exp' | 'gemini-2.5-flash-lite';
  maxDailyRequests?: number;
  enableCache?: boolean;
  cacheTTL?: number; // seconds
}

export interface GeminiUsageMetrics {
  tokensIn: number;
  tokensOut: number;
  totalTokens: number;
  costCents: number;
}

export interface GeminiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  usage?: GeminiUsageMetrics;
  cached?: boolean;
  modelUsed: string;
}

// ============================================================================
// BUSINESS METRICS TYPES
// ============================================================================

export interface LeadMetrics {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  quotedLeads: number;
  wonLeads: number;
  lostLeads: number;
  unqualifiedLeads: number;
  winRate: number;
  averageLeadValue: number;
  totalPipelineValue: number;
  conversionRate: number;
  averageTimeToClose: number; // days
  leadsBySource: Record<string, number>;
  leadsByPestType: Record<string, number>;
  leadsByStatus: Record<string, number>;
}

export interface CallMetrics {
  totalCalls: number;
  inboundCalls: number;
  outboundCalls: number;
  averageDuration: number; // seconds
  totalDuration: number;
  callsByStatus: Record<string, number>;
  callsByDirection: Record<string, number>;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  answerRate: number;
  conversionRate: number; // calls that led to won leads
}

export interface CustomerMetrics {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  averageCustomerValue: number;
  customersByCity: Record<string, number>;
  customersByState: Record<string, number>;
  churnRate: number;
  retentionRate: number;
}

export interface EmailMetrics {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  bounceRate: number;
  templatePerformance: Array<{
    templateId: string;
    templateName: string;
    sends: number;
    opens: number;
    clicks: number;
    conversions: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  }>;
}

export interface AutomationMetrics {
  activeWorkflows: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRate: number;
  averageExecutionTime: number; // seconds
  workflowPerformance: Array<{
    workflowId: string;
    workflowName: string;
    executions: number;
    successRate: number;
    averageTime: number;
  }>;
}

export interface ServiceAreaMetrics {
  totalServiceAreas: number;
  leadsByServiceArea: Array<{
    areaId: string;
    areaName: string;
    leadCount: number;
    conversionRate: number;
    averageLeadValue: number;
  }>;
  coverageGaps: Array<{
    zipCode: string;
    city: string;
    state: string;
    inquiryCount: number;
  }>;
}

export interface BusinessMetrics {
  companyId: string;
  companyName: string;
  dateRange: {
    start: string;
    end: string;
  };
  leads: LeadMetrics;
  calls: CallMetrics;
  customers: CustomerMetrics;
  emails: EmailMetrics;
  automations: AutomationMetrics;
  serviceAreas: ServiceAreaMetrics;
  updatedAt: string;
}

// ============================================================================
// CHAT TYPES
// ============================================================================

export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  role: ChatRole;
  content: string;
  timestamp?: string;
}

export interface ChatContext {
  companyId: string;
  companyName: string;
  userQuery: string;
  businessMetrics?: Partial<BusinessMetrics>;
  recentLeads?: any[];
  recentCalls?: any[];
  recentCustomers?: any[];
}

export interface ChatRequest {
  companyId: string;
  message: string;
  conversationHistory?: ChatMessage[];
  includeMetrics?: boolean;
  maxTokens?: number;
}

export interface ChatResponse {
  message: string;
  sources?: string[];
  suggestedFollowUps?: string[];
  dataUsed?: string[];
  confidence?: number;
}

// ============================================================================
// INSIGHTS TYPES
// ============================================================================

export type InsightType =
  | 'opportunity'
  | 'warning'
  | 'recommendation'
  | 'trend'
  | 'anomaly';

export type InsightPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Insight {
  id: string;
  type: InsightType;
  priority: InsightPriority;
  title: string;
  description: string;
  actionableSteps?: string[];
  metrics?: Record<string, number | string>;
  affectedEntities?: Array<{
    type: 'lead' | 'customer' | 'campaign' | 'service_area';
    id: string;
    name: string;
  }>;
  estimatedImpact?: {
    metric: string;
    expectedChange: string;
    timeframe: string;
  };
  confidence: number; // 0-100
  generatedAt: string;
}

export interface InsightsRequest {
  companyId: string;
  dateRange?: {
    start: string;
    end: string;
  };
  focusAreas?: Array<'leads' | 'calls' | 'customers' | 'marketing' | 'service_areas'>;
  minConfidence?: number;
}

export interface InsightsResponse {
  insights: Insight[];
  summary: string;
  totalInsights: number;
  highPriorityCount: number;
}

// ============================================================================
// PREDICTIONS TYPES
// ============================================================================

export type PredictionType =
  | 'pest_pressure'
  | 'lead_volume'
  | 'churn_risk'
  | 'lead_quality'
  | 'seasonal_demand';

export interface PestPressurePrediction {
  pestType: string;
  currentPressure: 'low' | 'medium' | 'high' | 'extreme';
  predictedPressure: 'low' | 'medium' | 'high' | 'extreme';
  confidenceScore: number;
  timeframe: string; // e.g., "next 30 days"
  affectedAreas: Array<{
    city: string;
    state: string;
    zipCodes: string[];
    riskLevel: number; // 0-100
  }>;
  factors: string[];
  recommendations: string[];
}

// V2: New ML-powered pest pressure prediction (0-10 scale)
export interface PestPressurePredictionV2 {
  id?: string;
  companyId: string;
  pestType: string;
  locationCity?: string;
  locationState?: string;
  predictionWindow: '7d' | '30d' | '90d';
  currentPressure?: number; // 0-10 scale
  predictedPressure?: number; // 0-10 scale
  confidenceScore?: number; // 0-100
  trend?: 'increasing' | 'stable' | 'decreasing' | 'spike';
  trendPercentage?: number;
  anomalyDetected?: boolean;
  anomalySeverity?: 'low' | 'medium' | 'high' | 'critical';
  anomalyDescription?: string;
  contributingFactors?: string[];
  recommendations?: string[];
  modelVersion?: string;
  dataPointsUsed?: number;
  weatherInfluenceScore?: number;
  generatedAt?: string;
  validUntil?: string;
}

export interface LeadVolumePrediction {
  period: string; // e.g., "Q2 2025", "June 2025"
  predictedLeads: number;
  confidence: number;
  comparisonToPrevious: {
    value: number;
    percentageChange: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  bySource: Record<string, number>;
  seasonalFactors: string[];
}

export interface ChurnRiskPrediction {
  customerId: string;
  customerName: string;
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: Array<{
    factor: string;
    impact: number; // -100 to 100
    description: string;
  }>;
  recommendedActions: string[];
  estimatedRetentionCost: number;
  estimatedLifetimeValue: number;
}

export interface LeadQualityScore {
  leadId: string;
  qualityScore: number; // 0-100
  qualityTier: 'hot' | 'warm' | 'cold';
  conversionProbability: number; // 0-1
  factors: Array<{
    factor: string;
    score: number;
    weight: number;
  }>;
  recommendedActions: string[];
  optimalContactTime?: {
    day: string;
    timeRange: string;
  };
}

export interface SeasonalDemandPrediction {
  pestType: string;
  peakMonths: string[];
  lowMonths: string[];
  yearOverYearTrend: 'increasing' | 'decreasing' | 'stable';
  recommendedStaffingLevels: Record<string, number>; // month -> staff count
  recommendedMarketingBudget: Record<string, number>; // month -> budget
}

export interface PredictionsRequest {
  companyId: string;
  predictionType: PredictionType;
  dateRange?: {
    start: string;
    end: string;
  };
  parameters?: Record<string, any>;
}

export interface PredictionsResponse {
  predictionType: PredictionType;
  predictions:
    | PestPressurePrediction[]
    | LeadVolumePrediction[]
    | ChurnRiskPrediction[]
    | LeadQualityScore[]
    | SeasonalDemandPrediction[];
  generatedAt: string;
  dataQuality: {
    score: number; // 0-100
    notes: string[];
  };
}

// ============================================================================
// REPORTS TYPES
// ============================================================================

export interface ReportRequest {
  companyId: string;
  reportType: 'weekly_summary' | 'monthly_summary' | 'performance_analysis' | 'marketing_roi';
  dateRange: {
    start: string;
    end: string;
  };
  includeCharts?: boolean;
  format?: 'text' | 'html' | 'json';
}

export interface ReportSection {
  title: string;
  content: string;
  metrics?: Record<string, any>;
  charts?: Array<{
    type: 'line' | 'bar' | 'pie';
    data: any;
    title: string;
  }>;
}

export interface ReportResponse {
  title: string;
  summary: string;
  sections: ReportSection[];
  keyFindings: string[];
  recommendations: string[];
  generatedAt: string;
}

// ============================================================================
// AI CACHE TYPES
// ============================================================================

export interface AICacheEntry {
  id: string;
  companyId: string;
  queryHash: string;
  queryType: 'chat' | 'insights' | 'predictions' | 'report';
  response: any;
  modelUsed: string;
  tokensUsed: number;
  createdAt: string;
  expiresAt: string;
}

// ============================================================================
// AI USAGE TYPES
// ============================================================================

export interface AIUsageLog {
  id: string;
  companyId: string;
  userId?: string;
  featureType: 'chat' | 'insights' | 'predictions' | 'reports';
  modelUsed: string;
  tokensIn: number;
  tokensOut: number;
  costCents: number;
  cached: boolean;
  responseTime: number; // milliseconds
  success: boolean;
  errorMessage?: string;
  createdAt: string;
}

export interface AIUsageSummary {
  companyId: string;
  period: string;
  totalRequests: number;
  cachedRequests: number;
  cacheHitRate: number;
  totalTokens: number;
  totalCostCents: number;
  averageResponseTime: number;
  successRate: number;
  byFeature: Record<string, {
    requests: number;
    tokens: number;
    costCents: number;
  }>;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class AIError extends Error {
  constructor(
    message: string,
    public code: AIErrorCode,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AIError';
  }
}

export enum AIErrorCode {
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  INVALID_REQUEST = 'INVALID_REQUEST',
  MODEL_ERROR = 'MODEL_ERROR',
  TIMEOUT = 'TIMEOUT',
  INSUFFICIENT_DATA = 'INSUFFICIENT_DATA',
  UNAUTHORIZED = 'UNAUTHORIZED',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// ============================================================================
// PROMPT TEMPLATE TYPES
// ============================================================================

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
  category: 'chat' | 'insights' | 'predictions' | 'reports';
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface PromptContext {
  [key: string]: any;
}
