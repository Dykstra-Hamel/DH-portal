import { createAdminClient } from '@/lib/supabase/server-admin';

export interface ABTestCampaign {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  test_type: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'cancelled';
  traffic_split_percentage: number;
  variant_split: Record<string, number>;
  control_variant: string;
  start_date: string;
  end_date: string;
  confidence_level: number;
  minimum_sample_size: number;
  minimum_effect_size: number;
  statistical_power: number;
  auto_promote_winner: boolean;
  auto_complete_on_significance: boolean;
  max_duration_days: number;
  winner_variant?: string;
  winner_determined_at?: string;
  statistical_significance: boolean;
  significance_level?: number;
}

export interface ABTestVariant {
  id: string;
  campaign_id: string;
  variant_label: string;
  template_id: string;
  is_control: boolean;
  traffic_percentage: number;
  participants_assigned: number;
  emails_sent: number;
  emails_delivered: number;
  emails_opened: number;
  emails_clicked: number;
  conversions: number;
  open_rate: number;
  click_rate: number;
  conversion_rate: number;
}

export interface ABTestAssignment {
  id: string;
  campaign_id: string;
  variant_id: string;
  lead_id: string;
  customer_id?: string;
  assigned_at: string;
  assignment_hash: string;
  email_log_id?: string;
  converted: boolean;
  converted_at?: string;
  conversion_type?: string;
  conversion_value?: number;
}

export interface StatisticalResults {
  campaign_id: string;
  total_participants: number;
  total_emails_sent: number;
  test_duration_days: number;
  primary_metric: 'open_rate' | 'click_rate' | 'conversion_rate';
  control_rate: number;
  test_rate: number;
  lift_percentage: number;
  p_value: number;
  confidence_interval_lower: number;
  confidence_interval_upper: number;
  is_significant: boolean;
  confidence_level: number;
  probability_to_beat_control?: number;
  recommended_action: 'continue' | 'stop_and_implement_winner' | 'stop_inconclusive' | 'extend_test';
  recommended_winner?: string;
}

export class ABTestEngine {
  private supabase;

  constructor() {
    this.supabase = createAdminClient();
  }

  /**
   * Assigns a lead to an A/B test variant if there's an active test
   */
  async assignLeadToTest(
    companyId: string,
    leadId: string,
    templateId: string
  ): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.rpc(
        'assign_lead_to_ab_test',
        {
          p_company_id: companyId,
          p_lead_id: leadId,
          p_template_id: templateId
        }
      );

      if (error) {
        console.error('Error assigning lead to A/B test:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in assignLeadToTest:', error);
      return null;
    }
  }

  /**
   * Gets the template to use for a specific lead (A/B test variant or original)
   */
  async getTemplateForLead(
    leadId: string,
    defaultTemplateId: string
  ): Promise<string> {
    try {
      // Check if lead is assigned to any active A/B test
      const { data: assignment, error } = await this.supabase
        .from('ab_test_assignments')
        .select(`
          variant_id,
          ab_test_variants!inner (
            template_id,
            ab_test_campaigns!inner (
              status,
              start_date,
              end_date
            )
          )
        `)
        .eq('lead_id', leadId)
        .eq('ab_test_variants.ab_test_campaigns.status', 'running')
        .gte('ab_test_variants.ab_test_campaigns.end_date', new Date().toISOString())
        .single();

      if (error || !assignment) {
        return defaultTemplateId;
      }

      return (assignment as any).ab_test_variants.template_id;
    } catch (error) {
      console.error('Error getting template for lead:', error);
      return defaultTemplateId;
    }
  }

  /**
   * Records email metrics for A/B test tracking
   */
  async recordEmailMetrics(
    emailLogId: string,
    event: 'sent' | 'delivered' | 'opened' | 'clicked',
    timestamp: Date = new Date()
  ): Promise<void> {
    try {
      const updateField = `email_${event}_at`;
      
      const { error } = await this.supabase
        .from('ab_test_assignments')
        .update({ 
          [updateField]: timestamp.toISOString(),
          email_log_id: emailLogId
        })
        .eq('email_log_id', emailLogId);

      if (error) {
        console.error(`Error recording ${event} metric:`, error);
      }
    } catch (error) {
      console.error(`Error in recordEmailMetrics (${event}):`, error);
    }
  }

  /**
   * Records conversion for A/B test tracking
   */
  async recordConversion(
    leadId: string,
    conversionType: string = 'qualified',
    conversionValue?: number
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('ab_test_assignments')
        .update({
          converted: true,
          converted_at: new Date().toISOString(),
          conversion_type: conversionType,
          conversion_value: conversionValue
        })
        .eq('lead_id', leadId)
        .eq('converted', false); // Only update if not already converted

      if (error) {
        console.error('Error recording conversion:', error);
      }
    } catch (error) {
      console.error('Error in recordConversion:', error);
    }
  }

  /**
   * Performs statistical analysis on A/B test campaign
   */
  async analyzeTestResults(campaignId: string): Promise<StatisticalResults | null> {
    try {
      // Get campaign and variants data
      const { data: campaign, error: campaignError } = await this.supabase
        .from('ab_test_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError || !campaign) {
        throw new Error(`Campaign not found: ${campaignId}`);
      }

      const { data: variants, error: variantsError } = await this.supabase
        .from('ab_test_variants')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('variant_label');

      if (variantsError || !variants || variants.length < 2) {
        throw new Error('Insufficient variant data for analysis');
      }

      const controlVariant = variants.find(v => v.is_control) || variants[0];
      const testVariants = variants.filter(v => !v.is_control || v.id !== controlVariant.id);
      const bestTestVariant = testVariants.reduce((best, current) => 
        current.conversion_rate > best.conversion_rate ? current : best
      );

      // Calculate basic metrics
      const totalParticipants = variants.reduce((sum, v) => sum + v.participants_assigned, 0);
      const totalEmailsSent = variants.reduce((sum, v) => sum + v.emails_sent, 0);
      const testDuration = Math.ceil(
        (new Date().getTime() - new Date(campaign.start_date).getTime()) / (1000 * 60 * 60 * 24)
      );

      const primaryMetric = 'conversion_rate';
      const controlRate = controlVariant.conversion_rate;
      const testRate = bestTestVariant.conversion_rate;
      const liftPercentage = controlRate > 0 ? ((testRate - controlRate) / controlRate) * 100 : 0;

      // Statistical significance testing (simplified Z-test for proportions)
      const { pValue, confidenceInterval, isSignificant } = this.calculateStatisticalSignificance(
        controlVariant,
        bestTestVariant,
        campaign.confidence_level
      );

      // Determine recommended action
      let recommendedAction: StatisticalResults['recommended_action'] = 'continue';
      let recommendedWinner: string | undefined;

      if (totalParticipants >= campaign.minimum_sample_size * variants.length) {
        if (isSignificant) {
          if (testRate > controlRate) {
            recommendedAction = 'stop_and_implement_winner';
            recommendedWinner = bestTestVariant.variant_label;
          } else {
            recommendedAction = 'stop_inconclusive';
          }
        } else if (testDuration >= campaign.max_duration_days) {
          recommendedAction = 'stop_inconclusive';
        }
      }

      const results: StatisticalResults = {
        campaign_id: campaignId,
        total_participants: totalParticipants,
        total_emails_sent: totalEmailsSent,
        test_duration_days: testDuration,
        primary_metric: primaryMetric,
        control_rate: controlRate,
        test_rate: testRate,
        lift_percentage: liftPercentage,
        p_value: pValue,
        confidence_interval_lower: confidenceInterval.lower,
        confidence_interval_upper: confidenceInterval.upper,
        is_significant: isSignificant,
        confidence_level: campaign.confidence_level,
        recommended_action: recommendedAction,
        recommended_winner: recommendedWinner
      };

      // Store results
      await this.storeTestResults(results);

      return results;
    } catch (error) {
      console.error('Error analyzing test results:', error);
      return null;
    }
  }

  /**
   * Calculates statistical significance using Z-test for proportions
   */
  private calculateStatisticalSignificance(
    controlVariant: ABTestVariant,
    testVariant: ABTestVariant,
    confidenceLevel: number
  ) {
    const n1 = controlVariant.participants_assigned;
    const n2 = testVariant.participants_assigned;
    const x1 = controlVariant.conversions;
    const x2 = testVariant.conversions;

    if (n1 === 0 || n2 === 0) {
      return { pValue: 1, confidenceInterval: { lower: 0, upper: 0 }, isSignificant: false };
    }

    const p1 = x1 / n1;
    const p2 = x2 / n2;
    const pooledP = (x1 + x2) / (n1 + n2);
    const standardError = Math.sqrt(pooledP * (1 - pooledP) * (1 / n1 + 1 / n2));

    if (standardError === 0) {
      return { pValue: 1, confidenceInterval: { lower: 0, upper: 0 }, isSignificant: false };
    }

    // Z-test statistic
    const zStat = (p2 - p1) / standardError;
    
    // Two-tailed p-value (approximation)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zStat)));
    
    // Confidence interval for difference in proportions
    const diffSE = Math.sqrt((p1 * (1 - p1)) / n1 + (p2 * (1 - p2)) / n2);
    const zCritical = this.getZCritical(confidenceLevel);
    const diff = p2 - p1;
    
    const confidenceInterval = {
      lower: Math.max(0, diff - zCritical * diffSE),
      upper: Math.min(1, diff + zCritical * diffSE)
    };

    const isSignificant = pValue < (1 - confidenceLevel);

    return { pValue, confidenceInterval, isSignificant };
  }

  /**
   * Normal CDF approximation
   */
  private normalCDF(x: number): number {
    return (1 + this.erf(x / Math.sqrt(2))) / 2;
  }

  /**
   * Error function approximation
   */
  private erf(x: number): number {
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  /**
   * Get Z critical value for confidence level
   */
  private getZCritical(confidenceLevel: number): number {
    const alpha = 1 - confidenceLevel;
    // Common Z-critical values
    const zValues: Record<string, number> = {
      '0.90': 1.645,
      '0.95': 1.96,
      '0.99': 2.576
    };
    
    return zValues[confidenceLevel.toString()] || 1.96; // Default to 95% CI
  }

  /**
   * Stores test results in database
   */
  private async storeTestResults(results: StatisticalResults): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('ab_test_results')
        .insert({
          campaign_id: results.campaign_id,
          total_participants: results.total_participants,
          total_emails_sent: results.total_emails_sent,
          test_duration_days: results.test_duration_days,
          primary_metric: results.primary_metric,
          control_rate: results.control_rate,
          test_rate: results.test_rate,
          lift_percentage: results.lift_percentage,
          p_value: results.p_value,
          confidence_interval_lower: results.confidence_interval_lower,
          confidence_interval_upper: results.confidence_interval_upper,
          is_significant: results.is_significant,
          confidence_level: results.confidence_level,
          recommended_action: results.recommended_action,
          recommended_winner: results.recommended_winner
        });

      if (error) {
        console.error('Error storing test results:', error);
      }
    } catch (error) {
      console.error('Error in storeTestResults:', error);
    }
  }

  /**
   * Promotes the winning variant and completes the test
   */
  async promoteWinner(campaignId: string, winnerVariant: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc(
        'promote_ab_test_winner',
        {
          p_campaign_id: campaignId,
          p_winner_variant: winnerVariant
        }
      );

      if (error) {
        console.error('Error promoting winner:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Error in promoteWinner:', error);
      return false;
    }
  }

  /**
   * Automatically checks and completes tests that meet completion criteria
   */
  async checkAndCompleteTests(): Promise<void> {
    try {
      // Get all running campaigns with auto-completion enabled
      const { data: campaigns, error } = await this.supabase
        .from('ab_test_campaigns')
        .select('id')
        .eq('status', 'running')
        .eq('auto_complete_on_significance', true);

      if (error || !campaigns) {
        return;
      }

      // Analyze each campaign and auto-complete if criteria are met
      for (const campaign of campaigns) {
        const results = await this.analyzeTestResults(campaign.id);
        
        if (results && results.recommended_action === 'stop_and_implement_winner' && results.recommended_winner) {
          await this.promoteWinner(campaign.id, results.recommended_winner);
        }
      }
    } catch (error) {
      console.error('Error in checkAndCompleteTests:', error);
    }
  }

  /**
   * Gets active campaigns for a company
   */
  async getActiveCampaigns(companyId: string): Promise<ABTestCampaign[]> {
    try {
      const { data, error } = await this.supabase
        .from('ab_test_campaigns')
        .select('*')
        .eq('company_id', companyId)
        .in('status', ['draft', 'running', 'paused'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting active campaigns:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getActiveCampaigns:', error);
      return [];
    }
  }

  /**
   * Gets campaign variants with performance metrics
   */
  async getCampaignVariants(campaignId: string): Promise<ABTestVariant[]> {
    try {
      const { data, error } = await this.supabase
        .from('ab_test_variants')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('variant_label');

      if (error) {
        console.error('Error getting campaign variants:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCampaignVariants:', error);
      return [];
    }
  }
}

export const abTestEngine = new ABTestEngine();