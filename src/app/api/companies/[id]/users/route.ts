import { NextRequest, NextResponse } from 'next/server';
import { 
  getAuthenticatedUser, 
  verifyCompanyAccess, 
  getSupabaseClient, 
  createErrorResponse,
  createSuccessResponse 
} from '@/lib/api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user and admin status
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }
    
    const { user, isGlobalAdmin, supabase } = authResult;
    const { id: companyId } = await params;

    // Verify user has access to this company
    const accessCheck = await verifyCompanyAccess(supabase, user.id, companyId, isGlobalAdmin);
    if (accessCheck instanceof NextResponse) {
      return accessCheck; // Return error response
    }

    // Use appropriate client based on admin status
    const queryClient = getSupabaseClient(isGlobalAdmin, supabase);

    // First, get all user IDs associated with this company
    const { data: companyUsers, error: fetchError } = await queryClient
      .from('user_companies')
      .select('user_id')
      .eq('company_id', companyId);

    if (fetchError) {
      console.error('Error fetching company users:', fetchError);
      return createErrorResponse('Failed to fetch company users');
    }

    if (!companyUsers || companyUsers.length === 0) {
      return createSuccessResponse({ users: [] });
    }

    // Get user IDs to query profiles
    const userIds = companyUsers.map((cu: { user_id: string }) => cu.user_id);

    // Now fetch the profiles for those users (using admin client if admin)
    const { data: profiles, error: profilesError } = await queryClient
      .from('profiles')
      .select('id, first_name, last_name, email')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError);
      return createErrorResponse('Failed to fetch user profiles');
    }


    // Format the response data
    const users = (profiles || []).map((profile: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    }) => ({
      id: profile.id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      email: profile.email,
      display_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email
    }));


    return createSuccessResponse({ users });

  } catch (error) {
    console.error('Error in company users API:', error);
    return createErrorResponse('Internal server error');
  }
}