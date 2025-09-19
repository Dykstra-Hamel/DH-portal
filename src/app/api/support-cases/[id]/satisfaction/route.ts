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

    const { rating, feedback } = await request.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Update the support case with satisfaction rating
    const updateData: any = {
      satisfaction_rating: rating,
      satisfaction_collected_at: new Date().toISOString(),
    };
    
    if (feedback) {
      updateData.satisfaction_feedback = feedback;
    }

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
      console.error('Error updating support case satisfaction:', updateError);
      return NextResponse.json({ error: 'Failed to update support case satisfaction' }, { status: 500 });
    }

    return NextResponse.json(updatedSupportCase);
  } catch (error) {
    console.error('Unexpected error in support case satisfaction update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}