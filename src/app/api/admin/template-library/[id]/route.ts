import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { isAuthorizedAdmin } from '@/lib/auth-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Use regular client for auth, admin client for data
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile || !isAuthorizedAdmin(profile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: template, error } = await adminSupabase
      .from('email_template_library')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, template });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Use regular client for auth, admin client for data
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile || !isAuthorizedAdmin(profile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      template_category,
      subject_line,
      html_content,
      text_content,
      variables,
      is_featured,
      is_active
    } = body;

    // Update the template
    const { data: template, error } = await adminSupabase
      .from('email_template_library')
      .update({
        name,
        description,
        template_category,
        subject_line,
        html_content,
        text_content,
        variables,
        is_featured,
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'Template name already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      template,
      message: 'Template updated successfully' 
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Use regular client for auth, admin client for data
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile || !isAuthorizedAdmin(profile)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if template is being used by companies
    const { data: usage, error: usageError } = await adminSupabase
      .from('template_library_usage')
      .select('id')
      .eq('library_template_id', id)
      .limit(1);

    if (usageError) {
      return NextResponse.json({ error: 'Failed to check template usage' }, { status: 500 });
    }

    if (usage && usage.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete template that is being used by companies. Deactivate instead.' 
      }, { status: 409 });
    }

    // Delete the template
    const { error } = await adminSupabase
      .from('email_template_library')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Template deleted successfully' 
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}