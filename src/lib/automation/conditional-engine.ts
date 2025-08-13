import { createAdminClient } from '@/lib/supabase/server-admin';

export interface ConditionalRule {
  field: string;
  operator: string;
  values: any;
  description?: string;
}

export interface WorkflowBranch {
  id: string;
  workflow_id: string;
  parent_step_id: string;
  condition_type: string;
  condition_operator: string;
  condition_value: any;
  branch_steps: any[];
  branch_name?: string;
  priority: number;
  is_active: boolean;
}

export interface BranchEvaluationContext {
  lead: any;
  execution: any;
  previousStepResult?: any;
  callAnalysis?: any;
  emailMetrics?: any;
  timeContext?: {
    currentTime: Date;
    businessHoursStart: string;
    businessHoursEnd: string;
    timezone: string;
  };
}

export class ConditionalEngine {
  private supabase;

  constructor() {
    this.supabase = createAdminClient();
  }

  /**
   * Evaluates all conditional rules for a workflow step and returns the branch to take
   */
  async evaluateWorkflowBranches(
    workflowId: string,
    stepId: string,
    context: BranchEvaluationContext
  ): Promise<WorkflowBranch | null> {
    try {
      // Get all branches for this step, ordered by priority
      const { data: branches, error } = await this.supabase
        .from('workflow_branches')
        .select('*')
        .eq('workflow_id', workflowId)
        .eq('parent_step_id', stepId)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) {
        console.error('Error fetching workflow branches:', error);
        return null;
      }

      if (!branches || branches.length === 0) {
        return null;
      }

      // Evaluate each branch in priority order
      for (const branch of branches) {
        if (await this.evaluateBranchCondition(branch, context)) {
          return branch;
        }
      }

      return null;
    } catch (error) {
      console.error('Error evaluating workflow branches:', error);
      return null;
    }
  }

  /**
   * Evaluates a single branch condition
   */
  private async evaluateBranchCondition(
    branch: WorkflowBranch,
    context: BranchEvaluationContext
  ): Promise<boolean> {
    const { condition_type, condition_operator, condition_value } = branch;

    try {
      // Get the actual value to compare from the context
      const actualValue = await this.extractContextValue(condition_type, context);
      
      if (actualValue === null || actualValue === undefined) {
        return false;
      }

      // Perform the comparison based on the operator
      return this.compareValues(actualValue, condition_operator, condition_value);
    } catch (error) {
      console.error('Error evaluating branch condition:', error);
      return false;
    }
  }

  /**
   * Extracts the relevant value from the evaluation context
   */
  private async extractContextValue(
    conditionType: string,
    context: BranchEvaluationContext
  ): Promise<any> {
    const { lead, execution, previousStepResult, callAnalysis, emailMetrics, timeContext } = context;

    switch (conditionType) {
      case 'lead_score':
        return this.calculateLeadScore(lead);

      case 'urgency':
        return lead?.urgency || lead?.priority;

      case 'pest_type':
        return lead?.pest_type;

      case 'lead_source':
        return lead?.lead_source;

      case 'lead_status':
        return lead?.lead_status;

      case 'lead_age_hours':
        if (lead?.created_at) {
          const createdAt = new Date(lead.created_at);
          const now = new Date();
          return Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
        }
        return null;

      case 'call_outcome':
        if (callAnalysis) {
          return callAnalysis.call_successful ? 'successful' : 'failed';
        }
        return previousStepResult?.call_outcome;

      case 'email_opened':
        return emailMetrics?.opened || previousStepResult?.email_opened || false;

      case 'email_clicked':
        return emailMetrics?.clicked || previousStepResult?.email_clicked || false;

      case 'time_based':
        return this.evaluateTimeCondition(timeContext);

      case 'business_hours':
        return this.isBusinessHours(timeContext);

      case 'previous_step_result':
        return previousStepResult?.status;

      case 'execution_status':
        return execution?.execution_status;

      case 'retry_count':
        return execution?.retry_count || 0;

      case 'company_size':
        return lead?.home_size ? 'residential' : 'commercial';

      case 'contacted_other_companies':
        return lead?.contacted_other_companies || false;

      default:
        console.warn(`Unknown condition type: ${conditionType}`);
        return null;
    }
  }

  /**
   * Compares actual value with expected value using the specified operator
   */
  private compareValues(actualValue: any, operator: string, expectedValue: any): boolean {
    switch (operator) {
      case 'equals':
        return actualValue === expectedValue;

      case 'not_equals':
        return actualValue !== expectedValue;

      case 'greater_than':
        return Number(actualValue) > Number(expectedValue);

      case 'less_than':
        return Number(actualValue) < Number(expectedValue);

      case 'greater_than_or_equal':
        return Number(actualValue) >= Number(expectedValue);

      case 'less_than_or_equal':
        return Number(actualValue) <= Number(expectedValue);

      case 'contains':
        return String(actualValue).toLowerCase().includes(String(expectedValue).toLowerCase());

      case 'not_contains':
        return !String(actualValue).toLowerCase().includes(String(expectedValue).toLowerCase());

      case 'in_array':
        return Array.isArray(expectedValue) && expectedValue.includes(actualValue);

      case 'not_in_array':
        return Array.isArray(expectedValue) && !expectedValue.includes(actualValue);

      case 'starts_with':
        return String(actualValue).toLowerCase().startsWith(String(expectedValue).toLowerCase());

      case 'ends_with':
        return String(actualValue).toLowerCase().endsWith(String(expectedValue).toLowerCase());

      case 'is_empty':
        return !actualValue || actualValue === '' || (Array.isArray(actualValue) && actualValue.length === 0);

      case 'is_not_empty':
        return actualValue && actualValue !== '' && (!Array.isArray(actualValue) || actualValue.length > 0);

      case 'regex_match':
        try {
          const regex = new RegExp(expectedValue);
          return regex.test(String(actualValue));
        } catch (error) {
          console.error('Invalid regex pattern:', expectedValue);
          return false;
        }

      default:
        console.warn(`Unknown comparison operator: ${operator}`);
        return false;
    }
  }

  /**
   * Calculates a simple lead score based on available data
   */
  private calculateLeadScore(lead: any): number {
    let score = 0;

    // Urgency scoring
    if (lead?.urgency === 'urgent') score += 100;
    else if (lead?.urgency === 'high') score += 75;
    else if (lead?.urgency === 'medium') score += 50;
    else if (lead?.urgency === 'low') score += 25;

    // Pest type scoring (some pests are higher value)
    const highValuePests = ['termites', 'bed bugs', 'rodents'];
    if (highValuePests.includes(lead?.pest_type)) score += 25;

    // Home size scoring
    if (lead?.home_size) {
      const homeSize = Number(lead.home_size);
      if (homeSize > 3000) score += 25;
      else if (homeSize > 2000) score += 15;
      else if (homeSize > 1000) score += 10;
    }

    // Lead source scoring
    if (lead?.lead_source === 'referral') score += 30;
    else if (lead?.lead_source === 'organic') score += 20;
    else if (lead?.lead_source === 'google_cpc') score += 15;

    // Contact information completeness
    if (lead?.phone) score += 10;
    if (lead?.email) score += 10;
    if (lead?.address || lead?.street_address) score += 5;

    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Evaluates time-based conditions
   */
  private evaluateTimeCondition(timeContext?: any): string {
    if (!timeContext) return 'unknown';

    const now = timeContext.currentTime || new Date();
    const hour = now.getHours();

    if (hour >= 6 && hour < 12) return 'morning';
    else if (hour >= 12 && hour < 17) return 'afternoon';
    else if (hour >= 17 && hour < 21) return 'evening';
    else return 'night';
  }

  /**
   * Checks if current time is within business hours
   */
  private isBusinessHours(timeContext?: any): boolean {
    if (!timeContext) return false;

    const now = timeContext.currentTime || new Date();
    const currentHour = now.getHours();
    
    const startHour = parseInt(timeContext.businessHoursStart?.split(':')[0] || '9');
    const endHour = parseInt(timeContext.businessHoursEnd?.split(':')[0] || '17');

    return currentHour >= startHour && currentHour < endHour;
  }

  /**
   * Gets suggested branches based on lead characteristics
   */
  async getSuggestedBranches(lead: any): Promise<string[]> {
    const suggestions: string[] = [];

    // High urgency leads
    if (['urgent', 'high'].includes(lead?.urgency)) {
      suggestions.push('immediate_call', 'fast_response_email');
    }

    // High-value pest types
    const highValuePests = ['termites', 'bed bugs', 'rodents'];
    if (highValuePests.includes(lead?.pest_type)) {
      suggestions.push('specialist_consultation', 'detailed_inspection');
    }

    // Large properties
    if (lead?.home_size && Number(lead.home_size) > 2500) {
      suggestions.push('commercial_pricing', 'detailed_quote');
    }

    // Referral leads
    if (lead?.lead_source === 'referral') {
      suggestions.push('vip_treatment', 'referral_thank_you');
    }

    return suggestions;
  }

  /**
   * Validates a conditional rule configuration
   */
  validateConditionalRule(rule: ConditionalRule): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!rule.field) {
      errors.push('Field is required');
    }

    if (!rule.operator) {
      errors.push('Operator is required');
    }

    if (rule.values === undefined || rule.values === null) {
      errors.push('Values are required');
    }

    // Validate operator-specific requirements
    if (['in_array', 'not_in_array'].includes(rule.operator) && !Array.isArray(rule.values)) {
      errors.push('Array operators require array values');
    }

    if (['greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal'].includes(rule.operator)) {
      if (isNaN(Number(rule.values))) {
        errors.push('Numeric operators require numeric values');
      }
    }

    return { valid: errors.length === 0, errors };
  }
}

export const conditionalEngine = new ConditionalEngine();