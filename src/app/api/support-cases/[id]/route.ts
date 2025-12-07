import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SupportCaseFormData } from '@/types/support-case';
import { getCustomerPrimaryServiceAddress } from '@/lib/service-addresses';

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
        ticket:tickets!support_cases_ticket_id_fkey(
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

    // Get customer's primary service address if support case has a customer
    let primaryServiceAddress = null;
    if (supportCase.customer_id) {
      try {
        const result = await getCustomerPrimaryServiceAddress(supportCase.customer_id);
        primaryServiceAddress = result.serviceAddress;
      } catch (serviceAddressError) {
        console.error(
          'Error fetching primary service address:',
          serviceAddressError
        );
        // Don't fail the API call if service address fetching fails
      }
    }

    // Add primary service address to response
    const enhancedSupportCase = {
      ...supportCase,
      primary_service_address: primaryServiceAddress,
    };

    return NextResponse.json(enhancedSupportCase);
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
        ticket:tickets!support_cases_ticket_id_fkey(
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

    // Get customer's primary service address if support case has a customer
    let primaryServiceAddress = null;
    if (updatedSupportCase.customer_id) {
      try {
        const result = await getCustomerPrimaryServiceAddress(updatedSupportCase.customer_id);
        primaryServiceAddress = result.serviceAddress;
      } catch (serviceAddressError) {
        console.error(
          'Error fetching primary service address:',
          serviceAddressError
        );
        // Don't fail the API call if service address fetching fails
      }
    }

    // Add primary service address to response
    const enhancedUpdatedSupportCase = {
      ...updatedSupportCase,
      primary_service_address: primaryServiceAddress,
    };

    return NextResponse.json(enhancedUpdatedSupportCase);
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