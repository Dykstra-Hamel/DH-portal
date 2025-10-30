import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { SupportCaseFormData } from '@/types/support-case';
import {
  getAuthenticatedUser,
  verifyCompanyAccess,
  getSupabaseClient
} from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user and admin status (like leads API)
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const { user, isGlobalAdmin, supabase } = authResult;

    const { searchParams } = new URL(request.url);

    // Get query parameters
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');
    const issueType = searchParams.get('issueType');
    const priority = searchParams.get('priority');
    const assignedTo = searchParams.get('assignedTo');
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // If companyId is provided, verify access
    if (companyId) {
      // Verify user has access to this company (admins have access to all companies)
      if (!isGlobalAdmin) {
        const { data: userCompany, error: userCompanyError } = await supabase
          .from('user_companies')
          .select('id')
          .eq('user_id', user.id)
          .eq('company_id', companyId)
          .single();

        if (userCompanyError || !userCompany) {
          return NextResponse.json(
            { error: 'Access denied to this company' },
            { status: 403 }
          );
        }
      }
    }

    // Build query with joins for related data
    let query = supabase
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
      .order('created_at', { ascending: false });

    // Apply filters
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (issueType) {
      query = query.eq('issue_type', issueType);
    }
    
    if (priority) {
      query = query.eq('priority', priority);
    }
    
    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }
    
    if (!includeArchived) {
      query = query.eq('archived', false);
    }
    
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    const { data: supportCases, error } = await query;

    if (error) {
      console.error('Error fetching support cases:', error);
      return NextResponse.json({ error: 'Failed to fetch support cases', details: error }, { status: 500 });
    }

    if (!supportCases || supportCases.length === 0) {
      return NextResponse.json([]);
    }

    // Get all unique user IDs from support cases (assigned_to field)
    const userIds = new Set<string>();
    supportCases.forEach((supportCase: { assigned_to?: string }) => {
      if (supportCase.assigned_to) {
        userIds.add(supportCase.assigned_to);
      }
    });

    // Get profiles for assigned users if there are any
    let profiles: any[] = [];
    if (userIds.size > 0) {
      // Always use admin client for profile data so all users can see avatars
      const queryClient = createAdminClient();
      const { data: profilesData, error: profilesError } = await queryClient
        .from('profiles')
        .select('id, first_name, last_name, email, avatar_url')
        .in('id', Array.from(userIds));


      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return NextResponse.json(
          { error: 'Failed to fetch user profiles' },
          { status: 500 }
        );
      }

      profiles = profilesData || [];
    }

    // Create a map of user profiles for quick lookup
    const profileMap = new Map(profiles.map(p => [p.id, p]));

    // Enhance support cases with profile data
    const enhancedSupportCases = supportCases.map((supportCase: { assigned_to?: string; [key: string]: any }) => ({
      ...supportCase,
      assigned_user: supportCase.assigned_to
        ? profileMap.get(supportCase.assigned_to) || null
        : null,
    }));

    return NextResponse.json(enhancedSupportCases);
  } catch (error) {
    console.error('Unexpected error in support cases GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supportCaseData: SupportCaseFormData = await request.json();

    // Validate required fields
    if (!supportCaseData.issue_type || !supportCaseData.summary) {
      return NextResponse.json(
        { error: 'Missing required fields: issue_type and summary are required' },
        { status: 400 }
      );
    }

    // Insert the support case
    const { data: newSupportCase, error: insertError } = await supabase
      .from('support_cases')
      .insert([{
        ...supportCaseData,
        status: supportCaseData.status || 'unassigned',
        priority: supportCaseData.priority || 'medium',
        archived: false,
      }])
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

    if (insertError) {
      console.error('Error creating support case:', insertError);
      return NextResponse.json({ error: 'Failed to create support case' }, { status: 500 });
    }

    // Generate notifications based on assignment status
    try {
      if (newSupportCase.company_id) {
        const adminSupabase = createAdminClient();

        if (newSupportCase.assigned_to) {
          // Support case is assigned - notify only the assigned user and managers/admins
          await adminSupabase.rpc('notify_assigned_and_managers', {
            p_company_id: newSupportCase.company_id,
            p_assigned_user_id: newSupportCase.assigned_to,
            p_type: 'new_support_case_assigned',
            p_title: 'New Support Case Assigned to You',
            p_message: `A new support case has been assigned to you: ${newSupportCase.summary}`,
            p_reference_id: newSupportCase.id,
            p_reference_type: 'support_case'
          });
        } else {
          // Support case is unassigned - notify all support team and managers/admins
          await adminSupabase.rpc('notify_department_and_managers', {
            p_company_id: newSupportCase.company_id,
            p_department: 'support',
            p_type: 'new_support_case_unassigned',
            p_title: 'New Unassigned Support Case',
            p_message: `A new unassigned support case has been created: ${newSupportCase.summary}`,
            p_reference_id: newSupportCase.id,
            p_reference_type: 'support_case'
          });
        }
      }
    } catch (notificationError) {
      console.error('Error creating support case notifications:', notificationError);
      // Don't fail the request if notification creation fails
    }

    return NextResponse.json(newSupportCase, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in support cases POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}