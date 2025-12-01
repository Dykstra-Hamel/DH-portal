import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getSupabaseClient } from '@/lib/api-utils';

// GET /api/contact-lists - List all contact lists for a company
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');

    if (!companyId) {
      return NextResponse.json({ error: 'company_id is required' }, { status: 400 });
    }

    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, isGlobalAdmin, supabase } = authResult;
    const queryClient = getSupabaseClient(isGlobalAdmin, supabase);

    // Check user has access to company
    if (!isGlobalAdmin) {
      const { data: userCompany } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('company_id', companyId)
        .single();

      if (!userCompany) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Get all contact lists for the company
    const { data: lists, error } = await queryClient
      .from('contact_lists')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contact lists:', error);
      return NextResponse.json({ error: 'Failed to fetch contact lists' }, { status: 500 });
    }

    // Enrich with additional data
    const enrichedLists = await Promise.all(
      (lists || []).map(async (list: any) => {
        // Get campaign usage count
        const { count: campaignCount } = await queryClient
          .from('campaign_contact_list_assignments')
          .select('id', { count: 'exact', head: true })
          .eq('contact_list_id', list.id);

        // Get last used date
        const { data: lastUsage } = await queryClient
          .from('campaign_contact_list_assignments')
          .select('assigned_at, campaigns(name, start_datetime)')
          .eq('contact_list_id', list.id)
          .order('assigned_at', { ascending: false })
          .limit(1)
          .single();

        return {
          ...list,
          campaign_count: campaignCount || 0,
          last_used_at: lastUsage?.assigned_at || null,
          last_used_campaign: lastUsage?.campaigns || null,
        };
      })
    );

    return NextResponse.json({ success: true, lists: enrichedLists });
  } catch (error) {
    console.error('Error in contact lists GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/contact-lists - Create a new contact list
export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, isGlobalAdmin, supabase } = authResult;
    const body = await request.json();
    const { company_id, name, description, notes } = body;

    // Validate
    if (!company_id || !name) {
      return NextResponse.json(
        { error: 'company_id and name are required' },
        { status: 400 }
      );
    }

    // Check user has permission
    if (!isGlobalAdmin) {
      const { data: userCompany } = await supabase
        .from('user_companies')
        .select('role')
        .eq('user_id', user.id)
        .eq('company_id', company_id)
        .single();

      if (!userCompany || !['admin', 'manager', 'owner'].includes(userCompany.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    const queryClient = getSupabaseClient(isGlobalAdmin, supabase);

    // Create contact list
    const { data: list, error: createError } = await queryClient
      .from('contact_lists')
      .insert({
        company_id,
        name: name.trim(),
        description: description?.trim() || null,
        notes: notes?.trim() || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      if (createError.code === '23505') {
        // Unique constraint violation
        return NextResponse.json(
          { error: 'A contact list with this name already exists' },
          { status: 409 }
        );
      }
      console.error('Error creating contact list:', createError);
      return NextResponse.json({ error: 'Failed to create contact list' }, { status: 500 });
    }

    return NextResponse.json({ success: true, list }, { status: 201 });
  } catch (error) {
    console.error('Error in contact lists POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
