import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, notes } = await request.json();

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Validate status value
    const validStatuses = ['new', 'assigned', 'in_progress', 'awaiting_customer', 'awaiting_internal', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = { status };
    
    // Add notes if provided
    if (notes) {
      updateData.notes = notes;
    }

    // Update the support case with automatic timestamp handling via trigger
    const { data: updatedSupportCase, error: updateError } = await supabase
      .from('support_cases')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        customer:customers(
          id,
          first_name,
          last_name,
          email,
          phone,
          address,
          city,
          state,
          zip_code
        ),
        company:companies(
          id,
          name,
          website
        ),
        ticket:tickets(
          id,
          type,
          source,
          created_at
        )
      `)
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Support case not found' }, { status: 404 });
      }
      console.error('Error updating support case status:', updateError);
      return NextResponse.json({ error: 'Failed to update support case status' }, { status: 500 });
    }

    return NextResponse.json(updatedSupportCase);
  } catch (error) {
    console.error('Unexpected error in support case status update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}