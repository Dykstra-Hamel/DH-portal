import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { isCompanyAdmin, isAuthorizedAdmin } from '@/lib/auth-helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; templateId: string }> }
) {
  try {
    const { id: companyId, templateId } = await params;
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Check if user has access to this company
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to this company (either global admin or company admin)
    const isGlobalAdmin = await isAuthorizedAdmin(session.user);
    const hasCompanyAccess = await isCompanyAdmin(session.user.id, companyId);

    if (!isGlobalAdmin && !hasCompanyAccess) {
      return NextResponse.json({ 
        error: 'You do not have permission to import templates for this company' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { custom_name, customizations } = body;

    // Use the database function to import the template (using admin client for RPC function)
    const { data: result, error } = await adminSupabase
      .rpc('import_template_from_library', {
        p_company_id: companyId,
        p_library_template_id: templateId,
        p_custom_name: custom_name,
        p_customizations: customizations || {}
      });

    if (error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: 'Template not found or inactive' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to import template' }, { status: 500 });
    }

    // Get the newly created template details (using admin client to bypass RLS)
    const { data: newTemplate, error: templateError } = await adminSupabase
      .from('email_templates')
      .select('*')
      .eq('id', result)
      .single();

    if (templateError) {
      return NextResponse.json({ error: 'Template imported but failed to fetch details' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      template: newTemplate,
      message: 'Template imported successfully'
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}