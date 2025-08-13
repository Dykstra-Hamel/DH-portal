import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET specific email template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; templateId: string }> }
) {
  try {
    const { id, templateId } = await params;
    const supabase = await createClient();

    // Get the current user from the session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to this company
    const { data: userCompany, error: userCompanyError } = await supabase
      .from('user_companies')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', id)
      .single();

    // Also check if user is global admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isGlobalAdmin = profile?.role === 'admin';
    const hasCompanyAccess = userCompany && !userCompanyError;

    if (!isGlobalAdmin && !hasCompanyAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch specific email template
    const { data: template, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .eq('company_id', id)
      .single();

    if (error || !template) {
      return NextResponse.json(
        { error: 'Email template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error in email template GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT update email template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; templateId: string }> }
) {
  try {
    const { id, templateId } = await params;
    const supabase = await createClient();

    // Get the current user from the session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin access to this company
    const { data: userCompany, error: userCompanyError } = await supabase
      .from('user_companies')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', id)
      .single();

    // Also check if user is global admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isGlobalAdmin = profile?.role === 'admin';
    const isCompanyAdmin =
      userCompany && ['admin', 'manager', 'owner'].includes(userCompany.role);

    if (!isGlobalAdmin && !isCompanyAdmin) {
      return NextResponse.json(
        { error: 'Access denied. Company admin privileges required.' },
        { status: 403 }
      );
    }

    const templateData = await request.json();

    // Check if template exists and belongs to this company
    const { data: existingTemplate } = await supabase
      .from('email_templates')
      .select('id')
      .eq('id', templateId)
      .eq('company_id', id)
      .single();

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Email template not found' },
        { status: 404 }
      );
    }

    // If name is being changed, check for uniqueness
    if (templateData.name) {
      const { data: nameConflict } = await supabase
        .from('email_templates')
        .select('id')
        .eq('company_id', id)
        .eq('name', templateData.name)
        .neq('id', templateId)
        .single();

      if (nameConflict) {
        return NextResponse.json(
          { error: 'Template name already exists for this company' },
          { status: 409 }
        );
      }
    }

    // Update template
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Only update provided fields
    if (templateData.name !== undefined) updateData.name = templateData.name;
    if (templateData.description !== undefined) updateData.description = templateData.description;
    if (templateData.template_type !== undefined) updateData.template_type = templateData.template_type;
    if (templateData.subject_line !== undefined) updateData.subject_line = templateData.subject_line;
    if (templateData.html_content !== undefined) {
      updateData.html_content = templateData.html_content;
      // Update variables when content changes
      updateData.variables = extractTemplateVariables(
        templateData.html_content, 
        templateData.text_content || ''
      );
    }
    if (templateData.text_content !== undefined) {
      updateData.text_content = templateData.text_content;
      // Update variables when content changes
      if (updateData.html_content === undefined) {
        // If only text content is being updated, we need the current HTML content to extract all variables
        const { data: currentTemplate } = await supabase
          .from('email_templates')
          .select('html_content')
          .eq('id', templateId)
          .single();
        
        updateData.variables = extractTemplateVariables(
          currentTemplate?.html_content || '', 
          templateData.text_content
        );
      }
    }
    if (templateData.is_active !== undefined) updateData.is_active = templateData.is_active;

    const { data: template, error } = await supabase
      .from('email_templates')
      .update(updateData)
      .eq('id', templateId)
      .eq('company_id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating email template:', error);
      return NextResponse.json(
        { error: 'Failed to update email template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      template,
      message: 'Email template updated successfully' 
    });
  } catch (error) {
    console.error('Error in email template PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE email template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; templateId: string }> }
) {
  try {
    const { id, templateId } = await params;
    const supabase = await createClient();

    // Get the current user from the session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin access to this company
    const { data: userCompany, error: userCompanyError } = await supabase
      .from('user_companies')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', id)
      .single();

    // Also check if user is global admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isGlobalAdmin = profile?.role === 'admin';
    const isCompanyAdmin =
      userCompany && ['admin', 'manager', 'owner'].includes(userCompany.role);

    if (!isGlobalAdmin && !isCompanyAdmin) {
      return NextResponse.json(
        { error: 'Access denied. Company admin privileges required.' },
        { status: 403 }
      );
    }

    // Check if template exists and belongs to this company
    const { data: existingTemplate } = await supabase
      .from('email_templates')
      .select('id, name')
      .eq('id', templateId)
      .eq('company_id', id)
      .single();

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Email template not found' },
        { status: 404 }
      );
    }

    // Check if the template is being used in any workflows
    const { data: workflowUsage } = await supabase
      .from('automation_workflows')
      .select('id, name')
      .eq('company_id', id)
      .contains('workflow_steps', [{ template_id: templateId }]);

    if (workflowUsage && workflowUsage.length > 0) {
      const workflowNames = workflowUsage.map(w => w.name).join(', ');
      return NextResponse.json(
        { 
          error: `Cannot delete template. It is being used in the following workflows: ${workflowNames}. Please remove it from these workflows first.` 
        },
        { status: 409 }
      );
    }

    // Check if the template is being used in any email logs (recent usage)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentUsage } = await supabase
      .from('email_automation_log')
      .select('id')
      .eq('template_id', templateId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .limit(1);

    if (recentUsage && recentUsage.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete template. It has been used in email campaigns within the last 30 days. For data integrity, please deactivate it instead.' 
        },
        { status: 409 }
      );
    }

    // Delete the template
    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', templateId)
      .eq('company_id', id);

    if (error) {
      console.error('Error deleting email template:', error);
      return NextResponse.json(
        { error: 'Failed to delete email template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: `Email template "${existingTemplate.name}" deleted successfully` 
    });
  } catch (error) {
    console.error('Error in email template DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to extract template variables
function extractTemplateVariables(htmlContent: string, textContent: string = ''): string[] {
  const variableRegex = /{{?\s*(\w+)\s*}}?/g;
  const variables = new Set<string>();
  
  // Extract from HTML content
  let match;
  while ((match = variableRegex.exec(htmlContent)) !== null) {
    variables.add(match[1]);
  }
  
  // Extract from text content
  if (textContent) {
    variableRegex.lastIndex = 0; // Reset regex state
    while ((match = variableRegex.exec(textContent)) !== null) {
      variables.add(match[1]);
    }
  }
  
  return Array.from(variables);
}