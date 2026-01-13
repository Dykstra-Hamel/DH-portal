import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET all email templates for a company
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const templateType = searchParams.get('type');

    // Fetch email templates (ordered by most recent first)
    let query = supabase
      .from('email_templates')
      .select('*')
      .eq('company_id', id)
      .order('created_at', { ascending: false });

    if (templateType) {
      query = query.eq('template_type', templateType);
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error('Error fetching email templates:', error);
      return NextResponse.json(
        { error: 'Failed to fetch email templates' },
        { status: 500 }
      );
    }

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error in email templates GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create new email template
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Validate required fields
    if (!templateData.name || !templateData.subject_line || !templateData.html_content) {
      return NextResponse.json(
        { error: 'Missing required fields: name, subject_line, html_content' },
        { status: 400 }
      );
    }

    // Validate template name uniqueness for this company
    const { data: existingTemplate } = await supabase
      .from('email_templates')
      .select('id')
      .eq('company_id', id)
      .eq('name', templateData.name)
      .single();

    if (existingTemplate) {
      return NextResponse.json(
        { error: 'Template name already exists for this company' },
        { status: 409 }
      );
    }

    // Extract variables from template content
    const variables = extractTemplateVariables(templateData.html_content, templateData.text_content);

    // Create new template
    const { data: template, error } = await supabase
      .from('email_templates')
      .insert([
        {
          company_id: id,
          name: templateData.name,
          description: templateData.description || '',
          template_type: templateData.template_type || 'custom',
          subject_line: templateData.subject_line,
          html_content: templateData.html_content,
          text_content: templateData.text_content || '',
          variables: variables,
          is_active: templateData.is_active !== false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating email template:', error);
      return NextResponse.json(
        { error: 'Failed to create email template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      template,
      message: 'Email template created successfully' 
    });
  } catch (error) {
    console.error('Error in email templates POST:', error);
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