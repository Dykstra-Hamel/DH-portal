import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateTasksForMonth } from '@/lib/monthly-services/generate-tasks';

// POST /api/admin/monthly-services/[id]/generate-tasks
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: serviceId } = await params;

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

    if (profile?.role !== 'admin' && profile?.role !== 'project_manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { month } = body;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: 'Invalid month format. Expected YYYY-MM.' },
        { status: 400 }
      );
    }

    const taskIds = await generateTasksForMonth(supabase, serviceId, {
      month,
      createdBy: user.id,
    });

    return NextResponse.json({ tasksCreated: taskIds.length }, { status: 200 });
  } catch (error) {
    console.error('Error in POST /api/admin/monthly-services/[id]/generate-tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
