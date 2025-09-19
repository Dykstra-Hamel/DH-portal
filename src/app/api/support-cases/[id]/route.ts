import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SupportCaseFormData } from '@/types/support-case';

export async function GET(
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

    const { data: supportCase, error } = await supabase
      .from('support_cases')
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
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Support case not found' }, { status: 404 });
      }
      console.error('Error fetching support case:', error);
      return NextResponse.json({ error: 'Failed to fetch support case' }, { status: 500 });
    }

    return NextResponse.json(supportCase);
  } catch (error) {
    console.error('Unexpected error in support case GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
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

    const updateData: Partial<SupportCaseFormData> = await request.json();

    // Update the support case
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
      console.error('Error updating support case:', updateError);
      return NextResponse.json({ error: 'Failed to update support case' }, { status: 500 });
    }

    return NextResponse.json(updatedSupportCase);
  } catch (error) {
    console.error('Unexpected error in support case PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    // Archive the support case instead of deleting
    const { data: archivedSupportCase, error: archiveError } = await supabase
      .from('support_cases')
      .update({ archived: true })
      .eq('id', id)
      .select()
      .single();

    if (archiveError) {
      if (archiveError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Support case not found' }, { status: 404 });
      }
      console.error('Error archiving support case:', archiveError);
      return NextResponse.json({ error: 'Failed to archive support case' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Support case archived successfully' });
  } catch (error) {
    console.error('Unexpected error in support case DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}