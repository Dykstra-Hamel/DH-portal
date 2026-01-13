import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';

// DELETE /api/companies/[id]/features/[feature] - Disable a feature for a company
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; feature: string }> }
) {
  try {
    const { id, feature } = await params;

    // Verify authentication and admin status
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Check if feature exists
    const { data: existingFeature } = await supabase
      .from('company_features')
      .select('*')
      .eq('company_id', id)
      .eq('feature', feature)
      .single();

    if (!existingFeature) {
      return NextResponse.json(
        { error: 'Feature not found' },
        { status: 404 }
      );
    }

    // Update feature to disabled instead of deleting (soft delete)
    const { error: updateError } = await supabase
      .from('company_features')
      .update({
        enabled: false,
        updated_at: new Date().toISOString(),
      })
      .eq('company_id', id)
      .eq('feature', feature);

    if (updateError) {
      console.error('Error disabling company feature:', updateError);
      return NextResponse.json(
        { error: 'Failed to disable feature' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Feature disabled successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/companies/[id]/features/[feature]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
