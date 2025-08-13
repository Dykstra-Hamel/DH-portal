import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    // Get full template details including HTML content for public preview
    // Only return active templates for security
    const { data: template, error } = await supabase
      .from('email_template_library')
      .select(`
        id,
        name,
        description,
        template_category,
        subject_line,
        html_content,
        text_content,
        variables,
        is_featured,
        usage_count,
        performance_score,
        created_at,
        updated_at
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error || !template) {
      return NextResponse.json({ 
        success: false,
        error: 'Template not found or inactive' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      template 
    });

  } catch (error) {
    console.error('Error fetching template details:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}