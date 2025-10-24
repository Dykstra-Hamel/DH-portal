/**
 * Prompt Templates for Gemini AI
 *
 * Reusable prompt templates for different AI features with:
 * - Role-playing for domain expertise
 * - Structured output formats
 * - Industry-specific knowledge
 * - Variable substitution
 */

import { PromptTemplate, PromptContext } from './types';

// ============================================================================
// SYSTEM INSTRUCTIONS
// ============================================================================

export const PEST_CONTROL_EXPERT_SYSTEM_INSTRUCTION = `
You are an expert pest control business analyst and consultant with 20+ years of experience in the industry.

Your expertise includes:
- Pest control operations, seasonality, and market dynamics
- Sales and marketing strategies for pest control companies
- Customer relationship management and retention
- Lead qualification and conversion optimization
- Pricing strategies and quote optimization
- Service area expansion planning
- Call center operations and customer service

You provide data-driven insights backed by business metrics, and always give actionable recommendations.
When analyzing data, you focus on KPIs that matter most to pest control businesses:
- Lead conversion rates and win rates
- Customer acquisition cost (CAC) and lifetime value (LTV)
- Call answer rates and follow-up effectiveness
- Seasonal pest pressure trends
- Service area profitability
- Marketing ROI by channel

You communicate in a professional yet friendly tone, avoiding jargon unless necessary.
Your recommendations are always specific, measurable, and realistic.
`;

// ============================================================================
// CHAT PROMPTS
// ============================================================================

export function buildChatPrompt(context: PromptContext): string {
  const { userQuery, companyName, businessMetrics, recentLeads } = context;

  let prompt = `You are analyzing data for **${companyName}**, a pest control company.\n\n`;

  // Add business metrics context if available
  if (businessMetrics) {
    prompt += `## Current Business Metrics\n\n`;

    if (businessMetrics.leads) {
      const { leads } = businessMetrics;
      prompt += `### Leads\n`;
      prompt += `- Total Leads: ${leads.totalLeads}\n`;
      prompt += `- New Leads: ${leads.newLeads}\n`;
      prompt += `- Won Leads: ${leads.wonLeads}\n`;
      prompt += `- Lost Leads: ${leads.lostLeads}\n`;
      prompt += `- Win Rate: ${leads.winRate}%\n`;
      prompt += `- Pipeline Value: $${leads.totalPipelineValue.toLocaleString()}\n`;
      prompt += `- Avg Lead Value: $${leads.averageLeadValue.toLocaleString()}\n\n`;

      if (leads.leadsBySource && Object.keys(leads.leadsBySource).length > 0) {
        prompt += `**Lead Sources:**\n`;
        Object.entries(leads.leadsBySource).forEach(([source, count]) => {
          prompt += `- ${source}: ${count}\n`;
        });
        prompt += `\n`;
      }
    }

    if (businessMetrics.calls) {
      const { calls } = businessMetrics;
      prompt += `### Calls\n`;
      prompt += `- Total Calls: ${calls.totalCalls}\n`;
      prompt += `- Inbound: ${calls.inboundCalls}\n`;
      prompt += `- Outbound: ${calls.outboundCalls}\n`;
      prompt += `- Avg Duration: ${Math.round(calls.averageDuration / 60)} minutes\n`;
      prompt += `- Answer Rate: ${calls.answerRate}%\n\n`;

      if (calls.sentimentBreakdown) {
        prompt += `**Call Sentiment:**\n`;
        prompt += `- Positive: ${calls.sentimentBreakdown.positive}\n`;
        prompt += `- Neutral: ${calls.sentimentBreakdown.neutral}\n`;
        prompt += `- Negative: ${calls.sentimentBreakdown.negative}\n\n`;
      }
    }

    if (businessMetrics.customers) {
      const { customers } = businessMetrics;
      prompt += `### Customers\n`;
      prompt += `- Total Customers: ${customers.totalCustomers}\n`;
      prompt += `- Active: ${customers.activeCustomers}\n`;
      prompt += `- Inactive: ${customers.inactiveCustomers}\n`;
      prompt += `- Avg Customer Value: $${customers.averageCustomerValue.toLocaleString()}\n`;
      prompt += `- Retention Rate: ${customers.retentionRate}%\n\n`;
    }
  }

  // Add recent leads context
  if (recentLeads && recentLeads.length > 0) {
    prompt += `## Recent Leads (Sample)\n\n`;
    recentLeads.slice(0, 5).forEach((lead: any, index: number) => {
      prompt += `**Lead ${index + 1}:**\n`;
      prompt += `- Status: ${lead.lead_status}\n`;
      prompt += `- Source: ${lead.lead_source}\n`;
      prompt += `- Pest Type: ${lead.pest_type || 'N/A'}\n`;
      prompt += `- Estimated Value: $${lead.estimated_value || 0}\n`;
      prompt += `- Created: ${new Date(lead.created_at).toLocaleDateString()}\n\n`;
    });
  }

  // Add user query
  prompt += `## User Question\n\n${userQuery}\n\n`;

  prompt += `Please provide a helpful, data-driven response. Include specific numbers from the metrics when relevant, and give actionable recommendations.`;

  return prompt;
}

// ============================================================================
// INSIGHTS PROMPTS
// ============================================================================

export function buildInsightsPrompt(context: PromptContext): string {
  const { companyName, businessMetrics, dateRange } = context;

  const startDate = dateRange?.start
    ? new Date(dateRange.start).toLocaleDateString()
    : 'Unknown';
  const endDate = dateRange?.end ? new Date(dateRange.end).toLocaleDateString() : 'Unknown';

  let prompt = `Analyze the following business data for **${companyName}** (${startDate} - ${endDate}) and provide strategic insights.\n\n`;

  // Add comprehensive metrics
  if (businessMetrics) {
    prompt += `## Business Metrics\n\n`;
    prompt += JSON.stringify(businessMetrics, null, 2);
    prompt += `\n\n`;
  }

  prompt += `## Task\n\n`;
  prompt += `Analyze this data and identify the top 5-10 most important insights. For each insight, provide:\n\n`;
  prompt += `1. **Type**: 'opportunity', 'warning', 'recommendation', 'trend', or 'anomaly'\n`;
  prompt += `2. **Priority**: 'low', 'medium', 'high', or 'critical'\n`;
  prompt += `3. **Title**: A clear, concise title (under 60 characters)\n`;
  prompt += `4. **Description**: A detailed explanation (2-3 sentences)\n`;
  prompt += `5. **Actionable Steps**: 2-4 specific actions the company can take\n`;
  prompt += `6. **Estimated Impact**: What metric will improve, by how much, and in what timeframe\n`;
  prompt += `7. **Confidence**: Your confidence in this insight (0-100%)\n\n`;

  prompt += `Focus on insights that are:\n`;
  prompt += `- Actionable (the company can do something about it)\n`;
  prompt += `- Impactful (will meaningfully affect business outcomes)\n`;
  prompt += `- Specific (tied to concrete metrics and actions)\n`;
  prompt += `- Time-sensitive (if applicable)\n\n`;

  prompt += `Return your response as a JSON object with this structure:\n`;
  prompt += `{\n`;
  prompt += `  "insights": [\n`;
  prompt += `    {\n`;
  prompt += `      "type": "opportunity",\n`;
  prompt += `      "priority": "high",\n`;
  prompt += `      "title": "...",\n`;
  prompt += `      "description": "...",\n`;
  prompt += `      "actionableSteps": ["...", "..."],\n`;
  prompt += `      "estimatedImpact": {\n`;
  prompt += `        "metric": "...",\n`;
  prompt += `        "expectedChange": "...",\n`;
  prompt += `        "timeframe": "..."\n`;
  prompt += `      },\n`;
  prompt += `      "confidence": 85\n`;
  prompt += `    }\n`;
  prompt += `  ],\n`;
  prompt += `  "summary": "Overall summary of the analysis in 2-3 sentences"\n`;
  prompt += `}\n`;

  return prompt;
}

// ============================================================================
// PEST PRESSURE PREDICTION PROMPT
// ============================================================================

export function buildPestPressurePredictionPrompt(context: PromptContext): string {
  const { companyName, historicalData, currentMonth, serviceAreas } = context;

  let prompt = `You are predicting pest pressure trends for **${companyName}** for the next 30-90 days.\n\n`;

  prompt += `## Historical Data\n\n`;
  prompt += `Historical pest-related lead data by month and pest type:\n`;
  prompt += JSON.stringify(historicalData, null, 2);
  prompt += `\n\n`;

  prompt += `## Current Context\n\n`;
  prompt += `- Current Month: ${currentMonth}\n`;
  prompt += `- Service Areas: ${JSON.stringify(serviceAreas)}\n\n`;

  prompt += `## Task\n\n`;
  prompt += `Based on historical patterns, seasonality, and pest biology, predict pest pressure for the next 30-90 days.\n\n`;

  prompt += `For each major pest type, provide:\n`;
  prompt += `1. **Current Pressure**: low, medium, high, or extreme\n`;
  prompt += `2. **Predicted Pressure**: low, medium, high, or extreme (for next 30 days)\n`;
  prompt += `3. **Confidence Score**: 0-100%\n`;
  prompt += `4. **Affected Areas**: Which cities/regions will see the most pressure\n`;
  prompt += `5. **Contributing Factors**: Weather, season, breeding cycles, etc.\n`;
  prompt += `6. **Recommendations**: Proactive marketing, staffing, inventory decisions\n\n`;

  prompt += `Return your response as a JSON array:\n`;
  prompt += `[\n`;
  prompt += `  {\n`;
  prompt += `    "pestType": "ants",\n`;
  prompt += `    "currentPressure": "medium",\n`;
  prompt += `    "predictedPressure": "high",\n`;
  prompt += `    "confidenceScore": 85,\n`;
  prompt += `    "timeframe": "next 30 days",\n`;
  prompt += `    "affectedAreas": [...],\n`;
  prompt += `    "factors": ["..."],\n`;
  prompt += `    "recommendations": ["..."]\n`;
  prompt += `  }\n`;
  prompt += `]\n`;

  return prompt;
}

// ============================================================================
// LEAD QUALITY SCORING PROMPT
// ============================================================================

export function buildLeadQualityScoringPrompt(context: PromptContext): string {
  const { lead, historicalConversionData, companyAverages } = context;

  let prompt = `Score the quality of this lead based on historical conversion patterns.\n\n`;

  prompt += `## Lead Data\n\n`;
  prompt += JSON.stringify(lead, null, 2);
  prompt += `\n\n`;

  prompt += `## Historical Conversion Patterns\n\n`;
  prompt += JSON.stringify(historicalConversionData, null, 2);
  prompt += `\n\n`;

  prompt += `## Company Averages\n\n`;
  prompt += JSON.stringify(companyAverages, null, 2);
  prompt += `\n\n`;

  prompt += `## Task\n\n`;
  prompt += `Analyze this lead and predict its likelihood of converting to a sale.\n\n`;

  prompt += `Consider factors like:\n`;
  prompt += `- Lead source (organic, referral, paid ads)\n`;
  prompt += `- Pest type and urgency\n`;
  prompt += `- Geographic area and service availability\n`;
  prompt += `- Contact information completeness\n`;
  prompt += `- Estimated value vs. company average\n`;
  prompt += `- Response time and engagement\n`;
  prompt += `- Historical patterns for similar leads\n\n`;

  prompt += `Return a JSON object:\n`;
  prompt += `{\n`;
  prompt += `  "leadId": "${lead.id}",\n`;
  prompt += `  "qualityScore": 85,\n`;
  prompt += `  "qualityTier": "hot",\n`;
  prompt += `  "conversionProbability": 0.72,\n`;
  prompt += `  "factors": [\n`;
  prompt += `    {\n`;
  prompt += `      "factor": "High-value pest type",\n`;
  prompt += `      "score": 90,\n`;
  prompt += `      "weight": 0.3\n`;
  prompt += `    }\n`;
  prompt += `  ],\n`;
  prompt += `  "recommendedActions": ["Contact within 1 hour", "..."],\n`;
  prompt += `  "optimalContactTime": {\n`;
  prompt += `    "day": "Tuesday",\n`;
  prompt += `    "timeRange": "10am-12pm"\n`;
  prompt += `  }\n`;
  prompt += `}\n`;

  return prompt;
}

// ============================================================================
// CHURN RISK PREDICTION PROMPT
// ============================================================================

export function buildChurnRiskPrompt(context: PromptContext): string {
  const { customer, serviceHistory, communicationHistory, companyBenchmarks } = context;

  let prompt = `Predict churn risk for this customer based on their behavior and history.\n\n`;

  prompt += `## Customer Data\n\n`;
  prompt += JSON.stringify(customer, null, 2);
  prompt += `\n\n`;

  prompt += `## Service History\n\n`;
  prompt += JSON.stringify(serviceHistory, null, 2);
  prompt += `\n\n`;

  prompt += `## Communication History\n\n`;
  prompt += JSON.stringify(communicationHistory, null, 2);
  prompt += `\n\n`;

  prompt += `## Company Benchmarks\n\n`;
  prompt += JSON.stringify(companyBenchmarks, null, 2);
  prompt += `\n\n`;

  prompt += `## Task\n\n`;
  prompt += `Analyze churn risk factors:\n`;
  prompt += `- Service frequency and gaps\n`;
  prompt += `- Communication responsiveness\n`;
  prompt += `- Payment history and issues\n`;
  prompt += `- Support case volume and sentiment\n`;
  prompt += `- Competitor activity in their area\n`;
  prompt += `- Seasonal patterns\n\n`;

  prompt += `Return a JSON object:\n`;
  prompt += `{\n`;
  prompt += `  "customerId": "${customer.id}",\n`;
  prompt += `  "customerName": "${customer.first_name} ${customer.last_name}",\n`;
  prompt += `  "riskScore": 75,\n`;
  prompt += `  "riskLevel": "high",\n`;
  prompt += `  "factors": [\n`;
  prompt += `    {\n`;
  prompt += `      "factor": "No service in 90+ days",\n`;
  prompt += `      "impact": 40,\n`;
  prompt += `      "description": "..."\n`;
  prompt += `    }\n`;
  prompt += `  ],\n`;
  prompt += `  "recommendedActions": ["..."],\n`;
  prompt += `  "estimatedRetentionCost": 150,\n`;
  prompt += `  "estimatedLifetimeValue": 2400\n`;
  prompt += `}\n`;

  return prompt;
}

// ============================================================================
// MARKETING RECOMMENDATIONS PROMPT
// ============================================================================

export function buildMarketingRecommendationsPrompt(context: PromptContext): string {
  const { companyName, businessMetrics, marketingSpend, competitorData } = context;

  let prompt = `Provide marketing strategy recommendations for **${companyName}** based on their current performance.\n\n`;

  prompt += `## Current Performance\n\n`;
  prompt += JSON.stringify(businessMetrics, null, 2);
  prompt += `\n\n`;

  if (marketingSpend) {
    prompt += `## Marketing Spend\n\n`;
    prompt += JSON.stringify(marketingSpend, null, 2);
    prompt += `\n\n`;
  }

  if (competitorData) {
    prompt += `## Competitive Intelligence\n\n`;
    prompt += JSON.stringify(competitorData, null, 2);
    prompt += `\n\n`;
  }

  prompt += `## Task\n\n`;
  prompt += `Analyze the data and provide marketing recommendations across these areas:\n`;
  prompt += `1. **Channel Optimization**: Which channels to increase/decrease investment in\n`;
  prompt += `2. **Seasonal Campaigns**: When to run campaigns for different pest types\n`;
  prompt += `3. **Geographic Expansion**: Which areas show the most opportunity\n`;
  prompt += `4. **Messaging**: What customer pain points to emphasize\n`;
  prompt += `5. **Budget Allocation**: How to distribute marketing budget across channels\n`;
  prompt += `6. **Performance Goals**: Specific KPIs to target\n\n`;

  prompt += `Return a JSON object with structured recommendations.\n`;

  return prompt;
}

// ============================================================================
// WEEKLY/MONTHLY REPORT PROMPT
// ============================================================================

export function buildReportPrompt(context: PromptContext): string {
  const { companyName, reportType, businessMetrics, dateRange, previousPeriodMetrics } = context;

  const startDate = dateRange?.start
    ? new Date(dateRange.start).toLocaleDateString()
    : 'Unknown';
  const endDate = dateRange?.end ? new Date(dateRange.end).toLocaleDateString() : 'Unknown';

  let prompt = `Generate a comprehensive ${reportType} report for **${companyName}** covering ${startDate} - ${endDate}.\n\n`;

  prompt += `## Current Period Metrics\n\n`;
  prompt += JSON.stringify(businessMetrics, null, 2);
  prompt += `\n\n`;

  if (previousPeriodMetrics) {
    prompt += `## Previous Period Comparison\n\n`;
    prompt += JSON.stringify(previousPeriodMetrics, null, 2);
    prompt += `\n\n`;
  }

  prompt += `## Task\n\n`;
  prompt += `Create a professional business report with these sections:\n\n`;

  prompt += `1. **Executive Summary** (3-4 sentences highlighting the most important takeaways)\n`;
  prompt += `2. **Key Metrics Overview** (Present the numbers in an organized way with % changes)\n`;
  prompt += `3. **Lead Performance Analysis**\n`;
  prompt += `   - Lead volume trends\n`;
  prompt += `   - Conversion rate analysis\n`;
  prompt += `   - Lead source effectiveness\n`;
  prompt += `4. **Call & Communication Analysis**\n`;
  prompt += `   - Call volume and quality\n`;
  prompt += `   - Response time metrics\n`;
  prompt += `   - Customer sentiment trends\n`;
  prompt += `5. **Revenue & Pipeline Health**\n`;
  prompt += `   - Pipeline value and quality\n`;
  prompt += `   - Win rate trends\n`;
  prompt += `   - Deal velocity\n`;
  prompt += `6. **Customer & Service Analysis**\n`;
  prompt += `   - Customer acquisition and retention\n`;
  prompt += `   - Service area performance\n`;
  prompt += `7. **Key Findings** (Bulleted list of 5-7 critical observations)\n`;
  prompt += `8. **Strategic Recommendations** (5-7 specific, actionable recommendations)\n\n`;

  prompt += `Format the report in a professional, business-appropriate tone. Use markdown formatting.\n`;

  return prompt;
}

// ============================================================================
// PROMPT TEMPLATE REGISTRY
// ============================================================================

export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  CHAT_QUERY: {
    id: 'chat_query',
    name: 'Chat Query',
    description: 'Interactive chat for business data queries',
    template: buildChatPrompt.toString(),
    variables: ['userQuery', 'companyName', 'businessMetrics', 'recentLeads', 'recentCalls'],
    category: 'chat',
    model: 'gemini-1.5-flash',
    temperature: 0.7,
    maxTokens: 2048,
  },

  BUSINESS_INSIGHTS: {
    id: 'business_insights',
    name: 'Business Insights',
    description: 'Generate strategic insights from business data',
    template: buildInsightsPrompt.toString(),
    variables: ['companyName', 'businessMetrics', 'dateRange'],
    category: 'insights',
    model: 'gemini-1.5-flash',
    temperature: 0.5,
    maxTokens: 4096,
  },

  PEST_PRESSURE_PREDICTION: {
    id: 'pest_pressure_prediction',
    name: 'Pest Pressure Prediction',
    description: 'Predict upcoming pest pressure trends',
    template: buildPestPressurePredictionPrompt.toString(),
    variables: ['companyName', 'historicalData', 'currentMonth', 'serviceAreas'],
    category: 'predictions',
    model: 'gemini-1.5-flash',
    temperature: 0.3,
    maxTokens: 3072,
  },

  LEAD_QUALITY_SCORING: {
    id: 'lead_quality_scoring',
    name: 'Lead Quality Scoring',
    description: 'Score lead quality and conversion probability',
    template: buildLeadQualityScoringPrompt.toString(),
    variables: ['lead', 'historicalConversionData', 'companyAverages'],
    category: 'predictions',
    model: 'gemini-1.5-flash',
    temperature: 0.2,
    maxTokens: 2048,
  },

  CHURN_RISK: {
    id: 'churn_risk',
    name: 'Customer Churn Risk',
    description: 'Predict customer churn risk',
    template: buildChurnRiskPrompt.toString(),
    variables: ['customer', 'serviceHistory', 'communicationHistory', 'companyBenchmarks'],
    category: 'predictions',
    model: 'gemini-1.5-flash',
    temperature: 0.2,
    maxTokens: 2048,
  },

  MARKETING_RECOMMENDATIONS: {
    id: 'marketing_recommendations',
    name: 'Marketing Recommendations',
    description: 'Generate marketing strategy recommendations',
    template: buildMarketingRecommendationsPrompt.toString(),
    variables: ['companyName', 'businessMetrics', 'marketingSpend', 'competitorData'],
    category: 'insights',
    model: 'gemini-1.5-flash',
    temperature: 0.6,
    maxTokens: 3072,
  },

  PERFORMANCE_REPORT: {
    id: 'performance_report',
    name: 'Performance Report',
    description: 'Generate comprehensive performance reports',
    template: buildReportPrompt.toString(),
    variables: ['companyName', 'reportType', 'businessMetrics', 'dateRange', 'previousPeriodMetrics'],
    category: 'reports',
    model: 'gemini-1.5-flash',
    temperature: 0.4,
    maxTokens: 4096,
  },
};
