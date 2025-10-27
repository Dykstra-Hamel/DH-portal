import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    // Fetch form submission linked to this ticket
    const { data: formSubmission, error } = await supabase
      .from('form_submissions')
      .select('*')
      .eq('ticket_id', id)
      .single();

    if (error) {
      console.error('Error fetching form submission:', error);
      return NextResponse.json(
        { formSubmission: null },
        { status: 200 }
      );
    }

    return NextResponse.json({ formSubmission });
  } catch (error) {
    console.error('Error in form-submission API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
