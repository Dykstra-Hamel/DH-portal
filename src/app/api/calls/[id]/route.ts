import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createAdminClient();

    // Check if user is global admin
    const isAdmin = await isAuthorizedAdmin(user);

    // First get the call record to check company access
    const { data: callRecord, error: fetchError } = await supabase
      .from('call_records')
      .select(`
        id,
        leads!inner (
          id,
          company_id
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching call record:', fetchError);
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Call record not found' }, { status: 404 });
      }
      return NextResponse.json(
        { error: 'Failed to fetch call record' },
        { status: 500 }
      );
    }

    // If not admin, verify user has access to the company
    if (!isAdmin) {
      if (!callRecord.leads || !(callRecord.leads as any).company_id) {
        return NextResponse.json(
          { error: 'Call record not associated with a company' },
          { status: 400 }
        );
      }

      const { data: userCompany, error: userCompanyError } = await supabase
        .from('user_companies')
        .select('id')
        .eq('user_id', user.id)
        .eq('company_id', (callRecord.leads as any).company_id)
        .single();

      if (userCompanyError || !userCompany) {
        return NextResponse.json(
          { error: 'Access denied to this call record' },
          { status: 403 }
        );
      }
    }

    // Delete the call record
    const { error: deleteError } = await supabase
      .from('call_records')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting call record:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete call record' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Call record deleted successfully' 
    });
  } catch (error) {
    console.error('Error in call record delete API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}