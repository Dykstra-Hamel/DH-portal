import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/monthly-services/default-templates - Fetch all default templates with tasks
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch default templates with their tasks
    const { data: templates, error: templatesError } = await supabase
      .from('monthly_service_default_templates')
      .select(
        `
        id,
        name,
        description,
        is_active,
        created_at,
        tasks:monthly_service_default_template_tasks (
          id,
          title,
          description,
          default_assigned_to,
          department_id,
          week_of_month,
          due_day_of_week,
          display_order
        )
      `
      )
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (templatesError) {
      console.error('Error fetching default templates:', templatesError);
      return NextResponse.json(
        { error: 'Failed to fetch default templates' },
        { status: 500 }
      );
    }

    // Sort tasks by display_order
    const templatesWithSortedTasks = (templates || []).map(template => ({
      ...template,
      tasks: (template.tasks || []).sort((a, b) => a.display_order - b.display_order),
    }));

    return NextResponse.json(templatesWithSortedTasks);
  } catch (error) {
    console.error('Error in GET /api/admin/monthly-services/default-templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
