import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const dateRange = searchParams.get('dateRange') || '30d';
    const metric = searchParams.get('metric') || 'overview';

    const supabase = createAdminClient();

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (dateRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get partial leads for form analysis  
    let baseQuery = supabase
      .from('partial_leads')
      .select(`
        id,
        company_id,
        form_data,
        step_completed,
        service_area_data,
        attribution_data,
        progressive_state,
        created_at,
        updated_at,
        expires_at,
        converted_to_lead_id
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (companyId) {
      baseQuery = baseQuery.eq('company_id', companyId);
    }

    const { data: partialLeads, error } = await baseQuery;

    if (error) {
      console.error('Error fetching form analytics data:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch form analytics data' },
        { status: 500 }
      );
    }

    // Get completed leads for conversion analysis
    let leadsQuery = supabase
      .from('leads')
      .select(`
        id,
        company_id,
        partial_lead_id,
        lead_status,
        estimated_value,
        created_at
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (companyId) {
      leadsQuery = leadsQuery.eq('company_id', companyId);
    }

    const { data: leads } = await leadsQuery;

    // Process analytics based on requested metric
    let analyticsData: any = {};

    switch (metric) {
      case 'overview':
        analyticsData = generateFormOverviewAnalytics(partialLeads || [], leads || []);
        break;
      case 'steps':
        analyticsData = generateStepAnalytics(partialLeads || [], leads || []);
        break;
      case 'abandonment':
        analyticsData = generateAbandonmentAnalytics(partialLeads || [], leads || []);
        break;
      case 'completion-times':
        analyticsData = generateCompletionTimeAnalytics(partialLeads || [], leads || []);
        break;
      case 'field-analysis':
        analyticsData = generateFieldAnalytics(partialLeads || [], leads || []);
        break;
      case 'progressive-forms':
        analyticsData = generateProgressiveFormAnalytics(partialLeads || [], leads || []);
        break;
      default:
        analyticsData = generateFormOverviewAnalytics(partialLeads || [], leads || []);
    }

    return NextResponse.json({
      success: true,
      data: analyticsData,
      metadata: {
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          label: dateRange
        },
        totalPartialLeads: partialLeads?.length || 0,
        totalLeads: leads?.length || 0,
        companyFilter: companyId
      }
    });

  } catch (error) {
    console.error('Error in form analytics API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateFormOverviewAnalytics(partialLeads: any[], leads: any[]) {
  const totalPartialLeads = partialLeads?.length || 0;
  const completedForms = partialLeads?.filter(p => p.converted_to_lead_id)?.length || 0;
  const wonLeads = leads?.filter(l => l.lead_status === 'won')?.length || 0;
  
  // Form completion analysis
  const formSteps = ['pest-selection', 'address-input', 'home-details', 'contact-info'];
  const stepCompletion = formSteps.reduce((acc: any, step) => {
    const completedStep = partialLeads?.filter(p => 
      p.step_completed === step || 
      (p.progressive_state && getStepOrder(p.step_completed) >= getStepOrder(step))
    )?.length || 0;
    
    acc[step] = {
      completed: completedStep,
      percentage: totalPartialLeads > 0 ? (completedStep / totalPartialLeads) * 100 : 0
    };
    return acc;
  }, {});

  // Service area qualification
  const servedUsers = partialLeads?.filter(p => p.service_area_data?.served)?.length || 0;
  const outsideAreaUsers = partialLeads?.filter(p => p.service_area_data?.served === false)?.length || 0;

  // Average form completion time
  const completionTimes = partialLeads?.filter(p => p.converted_to_lead_id).map(p => {
    const start = new Date(p.created_at);
    const end = new Date(p.updated_at);
    return (end.getTime() - start.getTime()) / 1000; // seconds
  }) || [];

  const avgCompletionTime = completionTimes.length > 0 
    ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length 
    : 0;

  return {
    summary: {
      totalFormStarts: totalPartialLeads,
      completedForms,
      completionRate: totalPartialLeads > 0 ? (completedForms / totalPartialLeads) * 100 : 0,
      wonLeads,
      conversionRate: completedForms > 0 ? (wonLeads / completedForms) * 100 : 0,
      avgCompletionTime: Math.round(avgCompletionTime),
      servedUsers,
      outsideAreaUsers,
      serviceQualificationRate: totalPartialLeads > 0 ? (servedUsers / totalPartialLeads) * 100 : 0
    },
    stepCompletion,
    completionTimeDistribution: getCompletionTimeDistribution(completionTimes)
  };
}

function generateStepAnalytics(partialLeads: any[], leads: any[]) {
  const formSteps = [
    { key: 'pest-selection', name: 'Pest Selection', order: 1 },
    { key: 'address-input', name: 'Address Input', order: 2 },
    { key: 'home-details', name: 'Home Details', order: 3 },
    { key: 'contact-info', name: 'Contact Information', order: 4 }
  ];

  const stepAnalytics = formSteps.map(step => {
    const reachedStep = partialLeads?.filter(p => 
      getStepOrder(p.step_completed) >= step.order
    )?.length || 0;
    
    const completedStep = partialLeads?.filter(p => 
      getStepOrder(p.step_completed) > step.order
    )?.length || 0;

    const abandonedAtStep = partialLeads?.filter(p => 
      p.step_completed === step.key && !p.converted_to_lead_id
    )?.length || 0;

    const avgTimeOnStep = calculateAvgTimeOnStep(partialLeads, step.key);

    return {
      step: step.key,
      name: step.name,
      order: step.order,
      reached: reachedStep,
      completed: completedStep,
      abandoned: abandonedAtStep,
      completionRate: reachedStep > 0 ? (completedStep / reachedStep) * 100 : 0,
      abandonmentRate: reachedStep > 0 ? (abandonedAtStep / reachedStep) * 100 : 0,
      avgTimeSpent: avgTimeOnStep
    };
  });

  return {
    stepAnalytics,
    funnel: stepAnalytics.map(step => ({
      step: step.name,
      count: step.reached,
      percentage: partialLeads.length > 0 ? (step.reached / partialLeads.length) * 100 : 0,
      dropoffRate: step.abandonmentRate
    }))
  };
}

function generateAbandonmentAnalytics(partialLeads: any[], leads: any[]) {
  const abandonedLeads = partialLeads?.filter(p => !p.converted_to_lead_id) || [];
  
  // Abandonment by step
  const abandonmentByStep = abandonedLeads.reduce((acc: any, lead) => {
    const step = lead.step_completed || 'unknown';
    acc[step] = (acc[step] || 0) + 1;
    return acc;
  }, {});

  // Abandonment reasons analysis (based on patterns)
  const abandonmentReasons = abandonedLeads.reduce((acc: any, lead) => {
    let reason = 'Unknown';
    
    if (lead.service_area_data?.served === false) {
      reason = 'Outside Service Area';
    } else if (lead.step_completed === 'pest-selection' && !lead.form_data?.pestIssue) {
      reason = 'Pest Selection Incomplete';
    } else if (lead.step_completed === 'address-input' && !lead.form_data?.address) {
      reason = 'Address Input Incomplete';
    } else if (lead.step_completed === 'home-details' && !lead.form_data?.homeSize) {
      reason = 'Home Details Incomplete';
    } else if (lead.step_completed === 'contact-info') {
      reason = 'Contact Info Incomplete';
    } else {
      reason = 'Form Navigation';
    }
    
    acc[reason] = (acc[reason] || 0) + 1;
    return acc;
  }, {});

  // Time-based abandonment analysis
  const abandonmentByTime = abandonedLeads.reduce((acc: any, lead) => {
    const timeSpent = new Date(lead.updated_at).getTime() - new Date(lead.created_at).getTime();
    const minutes = Math.floor(timeSpent / (1000 * 60));
    
    let timeRange = '0-1 min';
    if (minutes >= 1 && minutes < 5) timeRange = '1-5 min';
    else if (minutes >= 5 && minutes < 15) timeRange = '5-15 min';
    else if (minutes >= 15) timeRange = '15+ min';
    
    acc[timeRange] = (acc[timeRange] || 0) + 1;
    return acc;
  }, {});

  return {
    totalAbandoned: abandonedLeads.length,
    abandonmentRate: partialLeads.length > 0 ? (abandonedLeads.length / partialLeads.length) * 100 : 0,
    abandonmentByStep,
    abandonmentReasons,
    abandonmentByTime,
    topAbandonmentReasons: Object.entries(abandonmentReasons)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([reason, count]) => ({ reason, count }))
  };
}

function generateCompletionTimeAnalytics(partialLeads: any[], leads: any[]) {
  const completedForms = partialLeads?.filter(p => p.converted_to_lead_id) || [];
  
  const completionTimes = completedForms.map(form => {
    const startTime = new Date(form.created_at);
    const endTime = new Date(form.updated_at);
    const duration = (endTime.getTime() - startTime.getTime()) / 1000; // seconds
    
    return {
      id: form.id,
      duration,
      minutes: Math.round(duration / 60),
      step: form.step_completed,
      company: form.companies.name
    };
  });

  const avgCompletionTime = completionTimes.length > 0 
    ? completionTimes.reduce((sum, t) => sum + t.duration, 0) / completionTimes.length 
    : 0;

  const medianCompletionTime = getMedian(completionTimes.map(t => t.duration));

  // Completion time by step
  const timeByStep = completionTimes.reduce((acc: any, time) => {
    if (!acc[time.step]) {
      acc[time.step] = [];
    }
    acc[time.step].push(time.duration);
    return acc;
  }, {});

  const stepTimeAnalytics = Object.entries(timeByStep).map(([step, times]: [string, any]) => ({
    step,
    avgTime: times.reduce((sum: number, time: number) => sum + time, 0) / times.length,
    medianTime: getMedian(times),
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
    count: times.length
  }));

  return {
    totalCompletedForms: completedForms.length,
    avgCompletionTime: Math.round(avgCompletionTime),
    medianCompletionTime: Math.round(medianCompletionTime),
    completionTimeDistribution: getCompletionTimeDistribution(completionTimes.map(t => t.duration)),
    stepTimeAnalytics,
    fastestCompletions: completionTimes.sort((a, b) => a.duration - b.duration).slice(0, 10),
    slowestCompletions: completionTimes.sort((a, b) => b.duration - a.duration).slice(0, 10)
  };
}

function generateFieldAnalytics(partialLeads: any[], leads: any[]) {
  const fieldAnalytics = {
    pestIssue: analyzeField(partialLeads, 'pestIssue'),
    address: analyzeField(partialLeads, 'address'),
    homeSize: analyzeField(partialLeads, 'homeSize'),
    contactName: analyzeField(partialLeads, 'contactInfo.name'),
    contactEmail: analyzeField(partialLeads, 'contactInfo.email'),
    contactPhone: analyzeField(partialLeads, 'contactInfo.phone')
  };

  // Most common pest issues
  const pestIssues = partialLeads
    ?.filter(p => p.form_data?.pestIssue)
    .reduce((acc: any, p) => {
      const issue = p.form_data.pestIssue;
      acc[issue] = (acc[issue] || 0) + 1;
      return acc;
    }, {}) || {};

  // Home size distribution
  const homeSizes = partialLeads
    ?.filter(p => p.form_data?.homeSize)
    .reduce((acc: any, p) => {
      const size = parseInt(p.form_data.homeSize);
      let range = 'Unknown';
      
      if (size < 1000) range = 'Under 1,000';
      else if (size < 1500) range = '1,000-1,499';
      else if (size < 2000) range = '1,500-1,999';
      else if (size < 2500) range = '2,000-2,499';
      else if (size < 3000) range = '2,500-2,999';
      else range = '3,000+';
      
      acc[range] = (acc[range] || 0) + 1;
      return acc;
    }, {}) || {};

  return {
    fieldAnalytics,
    pestIssueDistribution: Object.entries(pestIssues)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([issue, count]) => ({ issue, count })),
    homeSizeDistribution: homeSizes,
    fieldCompletionRates: Object.entries(fieldAnalytics).map(([field, data]: [string, any]) => ({
      field,
      completionRate: data.completionRate,
      avgLength: data.avgLength
    }))
  };
}

function generateProgressiveFormAnalytics(partialLeads: any[], leads: any[]) {
  const progressiveForms = partialLeads?.filter(p => p.progressive_state) || [];
  const traditionalForms = partialLeads?.filter(p => !p.progressive_state) || [];

  const progressiveStats = {
    total: progressiveForms.length,
    completed: progressiveForms.filter(p => p.converted_to_lead_id).length,
    completionRate: progressiveForms.length > 0 
      ? (progressiveForms.filter(p => p.converted_to_lead_id).length / progressiveForms.length) * 100 
      : 0
  };

  const traditionalStats = {
    total: traditionalForms.length,
    completed: traditionalForms.filter(p => p.converted_to_lead_id).length,
    completionRate: traditionalForms.length > 0 
      ? (traditionalForms.filter(p => p.converted_to_lead_id).length / traditionalForms.length) * 100 
      : 0
  };

  return {
    progressiveStats,
    traditionalStats,
    improvement: progressiveStats.completionRate - traditionalStats.completionRate,
    totalProgressive: progressiveForms.length,
    totalTraditional: traditionalForms.length,
    progressiveAdoption: partialLeads.length > 0 
      ? (progressiveForms.length / partialLeads.length) * 100 
      : 0
  };
}

// Helper functions
function getStepOrder(step: string): number {
  const stepOrder: { [key: string]: number } = {
    'pest-selection': 1,
    'address-input': 2,
    'home-details': 3,
    'contact-info': 4
  };
  return stepOrder[step] || 0;
}

function calculateAvgTimeOnStep(partialLeads: any[], step: string): number {
  // This is a simplified calculation - in a real implementation, 
  // you'd track step-specific timestamps
  const stepsAtThisLevel = partialLeads?.filter(p => p.step_completed === step) || [];
  
  const times = stepsAtThisLevel.map(p => {
    const duration = new Date(p.updated_at).getTime() - new Date(p.created_at).getTime();
    return duration / 1000; // seconds
  });

  return times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0;
}

function getCompletionTimeDistribution(times: number[]) {
  const distribution = {
    '0-30s': 0,
    '30s-1m': 0,
    '1-2m': 0,
    '2-5m': 0,
    '5-10m': 0,
    '10m+': 0
  };

  times.forEach(time => {
    if (time <= 30) distribution['0-30s']++;
    else if (time <= 60) distribution['30s-1m']++;
    else if (time <= 120) distribution['1-2m']++;
    else if (time <= 300) distribution['2-5m']++;
    else if (time <= 600) distribution['5-10m']++;
    else distribution['10m+']++;
  });

  return distribution;
}

function getMedian(numbers: number[]): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function analyzeField(partialLeads: any[], fieldPath: string) {
  const total = partialLeads?.length || 0;
  const completed = partialLeads?.filter(p => getNestedValue(p.form_data, fieldPath))?.length || 0;
  
  const values = partialLeads
    ?.map(p => getNestedValue(p.form_data, fieldPath))
    .filter(v => v !== null && v !== undefined && v !== '') || [];

  const avgLength = values.length > 0 
    ? values.reduce((sum, val) => sum + String(val).length, 0) / values.length 
    : 0;

  return {
    total,
    completed,
    completionRate: total > 0 ? (completed / total) * 100 : 0,
    avgLength: Math.round(avgLength)
  };
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current && current[key], obj);
}