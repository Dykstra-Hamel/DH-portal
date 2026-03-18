import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    const { count: submitted, error: submittedError } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('lead_source', 'technician')
      .eq('submitted_by', user.id)
      .eq('company_id', companyId);

    if (submittedError) {
      console.error('Error fetching submitted count:', submittedError);
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }

    const { count: won, error: wonError } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('lead_source', 'technician')
      .eq('submitted_by', user.id)
      .eq('company_id', companyId)
      .eq('lead_status', 'won');

    if (wonError) {
      console.error('Error fetching won count:', wonError);
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }

    return NextResponse.json({ submitted: submitted ?? 0, won: won ?? 0 });
  } catch (error) {
    console.error('Unexpected error in tech-leads stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
