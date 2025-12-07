import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/add-on-services/[companyId]/eligible-for-plan/[planId]
 * Get all add-ons with eligibility flag for a specific service plan
 * Uses the get_eligible_addons_for_plan database function
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; planId: string }> }
) {
  try {
    const { companyId, planId } = await params;
    const supabase = await createClient();

    // Call the database function to get eligible add-ons
    const { data, error } = await supabase.rpc('get_eligible_addons_for_plan', {
      p_service_plan_id: planId,
      p_company_id: companyId,
    });

    if (error) {
      console.error('Error fetching eligible add-ons:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch eligible add-ons' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      addons: data,
    });
  } catch (error) {
    console.error(
      'Error in GET /api/add-on-services/[companyId]/eligible-for-plan/[planId]:',
      error
    );
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
