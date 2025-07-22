import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Get the current user from the session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: leadId } = await params;

    // First get the lead to check company access
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('company_id')
      .eq('id', leadId)
      .single();
    
    if (leadError) {
      console.error('Error fetching lead for calls:', leadError);
      if (leadError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch lead' }, { status: 500 });
    }

    // Verify user has access to this lead's company
    const { data: userCompany, error: userCompanyError } = await supabase
      .from('user_companies')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', lead.company_id)
      .single();

    if (userCompanyError || !userCompany) {
      return NextResponse.json({ error: 'Access denied to this lead' }, { status: 403 });
    }

    // Get call records for this lead
    const { data: calls, error: callsError } = await supabase
      .from('call_records')
      .select('*')
      .eq('lead_id', leadId)
      .order('start_timestamp', { ascending: false });
    
    if (callsError) {
      console.error('Error fetching call records:', callsError);
      return NextResponse.json({ error: 'Failed to fetch call records' }, { status: 500 });
    }
    
    return NextResponse.json(calls || []);
  } catch (error) {
    console.error('Error in lead calls API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}