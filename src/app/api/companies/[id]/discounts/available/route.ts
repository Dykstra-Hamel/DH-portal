import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

/**
 * GET /api/companies/[companyId]/discounts/available
 *
 * Returns available discounts for a specific plan, filtered by:
 * - Active status
 * - Plan eligibility
 * - Time restrictions (seasonal/limited_time)
 * - User role (manager-only discounts)
 *
 * Query params:
 * - planId: UUID of the service plan
 * - userIsManager: boolean indicating if user has manager/admin role
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');
    const userIsManager = searchParams.get('userIsManager') === 'true';

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch all active discounts for the company
    const { data: discounts, error } = await supabase
      .from('company_discounts')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('discount_name', { ascending: true });

    if (error) {
      console.error('Error fetching discounts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch discounts' },
        { status: 500 }
      );
    }

    // Filter discounts using the PostgreSQL helper function
    const availableDiscounts = [];

    for (const discount of discounts || []) {
      const { data: isAvailable } = await supabase
        .rpc('is_discount_available', {
          p_discount_id: discount.id,
          p_plan_id: planId,
          p_user_is_manager: userIsManager,
          p_check_date: new Date().toISOString(),
        });

      if (isAvailable) {
        availableDiscounts.push({
          id: discount.id,
          name: discount.discount_name,
          description: discount.description,
          discount_type: discount.discount_type,
          discount_value: discount.discount_value,
          applies_to_price: discount.applies_to_price,
          requires_manager: discount.requires_manager,
        });
      }
    }

    return NextResponse.json({
      success: true,
      discounts: availableDiscounts,
    });
  } catch (error) {
    console.error('Error in available discounts GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
