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

    // Check if user has access to this company (using secure auth method)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to this company (either global admin or company admin)
    const isGlobalAdmin = await isAuthorizedAdmin(user);
    const hasCompanyAccess = await isCompanyAdmin(user.id, companyId);

    if (!isGlobalAdmin && !hasCompanyAccess) {
      return NextResponse.json({ 
        error: 'You do not have permission to import templates for this company' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { custom_name, customizations } = body;


    // First, verify the template exists in email_template_library
    const { data: templateExists, error: templateCheckError } = await adminSupabase
      .from('email_template_library')
      .select('id, name, is_active')
      .eq('id', templateId)
      .single();


    if (templateCheckError || !templateExists) {
      return NextResponse.json({ 
        error: 'Template not found in library',
        details: templateCheckError?.message 
      }, { status: 404 });
    }

    if (!templateExists.is_active) {
      return NextResponse.json({ error: 'Template is inactive' }, { status: 404 });
    }

    // Use the database function to import the template (using admin client for RPC function)
    const { data: result, error } = await adminSupabase
      .rpc('import_template_from_library', {
        p_company_id: companyId,
        p_library_template_id: templateId,
        p_custom_name: custom_name,
        p_customizations: customizations || {}
      });


    if (error) {
      console.error('Template import database error:', {
        templateId,
        companyId,
        error: error.message,
        hint: error.hint,
        code: error.code,
        details: error.details
      });
      
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: 'Template not found or inactive' }, { status: 404 });
      }
      
      // Enhanced error response for debugging
      return NextResponse.json({ 
        error: 'Failed to import template', 
        details: error.message,
        hint: error.hint,
        code: error.code,
        templateId,
        companyId,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // Get the newly created template details (using admin client to bypass RLS)
    const { data: newTemplate, error: templateError } = await adminSupabase
      .from('email_templates')
      .select('*')
      .eq('id', result)
      .single();


    if (templateError) {
      return NextResponse.json({ 
        error: 'Template imported but failed to fetch details',
        details: templateError.message,
        templateId: result
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      template: newTemplate,
      message: 'Template imported successfully'
    });

  } catch (error) {
    console.error('Template import API error:', {
      templateId: await params.then(p => p.templateId),
      companyId: await params.then(p => p.id),
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      templateId: await params.then(p => p.templateId),
      companyId: await params.then(p => p.id),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}