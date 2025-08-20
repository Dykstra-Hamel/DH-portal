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

    console.log('🔍 Template Import Debug:', {
      companyId,
      templateId,
      custom_name,
      customizations
    });

    // First, verify the template exists in email_template_library
    const { data: templateExists, error: templateCheckError } = await adminSupabase
      .from('email_template_library')
      .select('id, name, is_active')
      .eq('id', templateId)
      .single();

    console.log('🔍 Template Check Result:', { templateExists, templateCheckError });

    if (templateCheckError || !templateExists) {
      console.error('❌ Template not found in library:', templateCheckError);
      return NextResponse.json({ 
        error: 'Template not found in library',
        details: templateCheckError?.message 
      }, { status: 404 });
    }

    if (!templateExists.is_active) {
      console.error('❌ Template is inactive:', templateExists);
      return NextResponse.json({ error: 'Template is inactive' }, { status: 404 });
    }

    // Use the database function to import the template (using admin client for RPC function)
    console.log('🔄 Calling import_template_from_library function...');
    const { data: result, error } = await adminSupabase
      .rpc('import_template_from_library', {
        p_company_id: companyId,
        p_library_template_id: templateId,
        p_custom_name: custom_name,
        p_customizations: customizations || {}
      });

    console.log('🔍 RPC Result:', { result, error });

    if (error) {
      console.error('❌ RPC Function Error:', error);
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: 'Template not found or inactive' }, { status: 404 });
      }
      return NextResponse.json({ 
        error: 'Failed to import template', 
        details: error.message,
        hint: error.hint,
        code: error.code
      }, { status: 500 });
    }

    // Get the newly created template details (using admin client to bypass RLS)
    console.log('🔄 Fetching created template details for ID:', result);
    const { data: newTemplate, error: templateError } = await adminSupabase
      .from('email_templates')
      .select('*')
      .eq('id', result)
      .single();

    console.log('🔍 Template Fetch Result:', { newTemplate, templateError });

    if (templateError) {
      console.error('❌ Failed to fetch created template:', templateError);
      return NextResponse.json({ 
        error: 'Template imported but failed to fetch details',
        details: templateError.message,
        templateId: result
      }, { status: 500 });
    }

    console.log('✅ Template import successful:', newTemplate.id);
    return NextResponse.json({
      success: true,
      template: newTemplate,
      message: 'Template imported successfully'
    });

  } catch (error) {
    console.error('❌ Unexpected error in template import:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}