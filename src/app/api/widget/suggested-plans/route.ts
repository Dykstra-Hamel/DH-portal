import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Helper function to add CORS headers
const addCorsHeaders = (response: NextResponse) => {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
};

interface SuggestedPlansRequest {
  companyId: string;
  selectedPests: string[]; // Array of pest slugs
}

interface PlanSuggestion {
  id: string;
  plan_name: string;
  plan_description: string;
  plan_category: string;
  initial_price: number;
  recurring_price: number;
  billing_frequency: string;
  treatment_frequency: string;
  includes_inspection: boolean;
  plan_features: string[];
  plan_faqs: Array<{ question: string; answer: string }>;
  highlight_badge: string | null;
  color_scheme: any;
  requires_quote: boolean;
  plan_image_url: string | null;
  coverage_match: {
    covered_pests: number;
    total_selected: number;
    coverage_percentage: number;
    missing_pests: string[];
  };
}

export async function POST(request: NextRequest) {
  try {
    const { companyId, selectedPests }: SuggestedPlansRequest = await request.json();

    if (!companyId) {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Company ID is required' },
          { status: 400 }
        )
      );
    }

    if (!selectedPests || selectedPests.length === 0) {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'At least one pest must be selected' },
          { status: 400 }
        )
      );
    }

    const supabase = createAdminClient();

    // First, get the pest IDs from the slugs
    const { data: pestTypes, error: pestError } = await supabase
      .from('pest_types')
      .select('id, slug, name')
      .in('slug', selectedPests)
      .eq('is_active', true);

    if (pestError) {
      console.error('Error fetching pest types:', pestError);
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Failed to fetch pest information' },
          { status: 500 }
        )
      );
    }

    const pestIds = pestTypes?.map(pest => pest.id) || [];
    
    if (pestIds.length === 0) {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'No valid pests found' },
          { status: 400 }
        )
      );
    }

    // Get all active service plans for the company with their pest coverage
    const { data: servicePlans, error: plansError } = await supabase
      .from('service_plans')
      .select(`
        id,
        plan_name,
        plan_description,
        plan_category,
        initial_price,
        recurring_price,
        billing_frequency,
        treatment_frequency,
        includes_inspection,
        plan_features,
        plan_faqs,
        display_order,
        highlight_badge,
        color_scheme,
        requires_quote,
        plan_image_url,
        plan_pest_coverage (
          pest_id,
          coverage_level,
          pest_types (
            slug,
            name
          )
        )
      `)
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('display_order');

    if (plansError) {
      console.error('Error fetching service plans:', plansError);
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Failed to fetch service plans' },
          { status: 500 }
        )
      );
    }

    if (!servicePlans || servicePlans.length === 0) {
      return addCorsHeaders(
        NextResponse.json({
          success: true,
          suggestions: [],
          message: 'No service plans available for this company',
        })
      );
    }

    // Calculate coverage match for each plan
    const planSuggestions: PlanSuggestion[] = servicePlans.map((plan: any) => {
      const planPestSlugs = plan.plan_pest_coverage.map((coverage: any) => 
        coverage.pest_types.slug
      );
      
      const coveredPests = selectedPests.filter(pestSlug => 
        planPestSlugs.includes(pestSlug)
      );
      
      const missingPests = selectedPests.filter(pestSlug => 
        !planPestSlugs.includes(pestSlug)
      );

      const coveragePercentage = Math.round(
        (coveredPests.length / selectedPests.length) * 100
      );

      return {
        id: plan.id,
        plan_name: plan.plan_name,
        plan_description: plan.plan_description,
        plan_category: plan.plan_category,
        initial_price: plan.initial_price,
        recurring_price: plan.recurring_price,
        billing_frequency: plan.billing_frequency,
        treatment_frequency: plan.treatment_frequency,
        includes_inspection: plan.includes_inspection,
        plan_features: plan.plan_features || [],
        plan_faqs: plan.plan_faqs || [],
        highlight_badge: plan.highlight_badge,
        color_scheme: plan.color_scheme,
        requires_quote: plan.requires_quote,
        plan_image_url: plan.plan_image_url,
        coverage_match: {
          covered_pests: coveredPests.length,
          total_selected: selectedPests.length,
          coverage_percentage: coveragePercentage,
          missing_pests: missingPests,
        },
      };
    });

    // Sort plans by coverage percentage (best matches first), then by display order
    const sortedSuggestions = planSuggestions.sort((a, b) => {
      if (a.coverage_match.coverage_percentage !== b.coverage_match.coverage_percentage) {
        return b.coverage_match.coverage_percentage - a.coverage_match.coverage_percentage;
      }
      return (servicePlans.find(p => p.id === a.id)?.display_order || 0) - 
             (servicePlans.find(p => p.id === b.id)?.display_order || 0);
    });

    return addCorsHeaders(
      NextResponse.json({
        success: true,
        suggestions: sortedSuggestions,
        metadata: {
          total_plans: sortedSuggestions.length,
          perfect_matches: sortedSuggestions.filter(s => s.coverage_match.coverage_percentage === 100).length,
          selected_pests: selectedPests,
        },
      })
    );
  } catch (error) {
    console.error('Error in suggested plans:', error);
    return addCorsHeaders(
      NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    );
  }
}