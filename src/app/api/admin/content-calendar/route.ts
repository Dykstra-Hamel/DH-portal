import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface ContentPieceCalendarItem {
  id: string;
  content_type: string | null;
  title: string | null;
  publish_date: string | null;
  link: string | null;
  task_id: string | null;
  is_completed: boolean;
  is_planned: false;
}

export interface PlannedContentItem {
  template_id: string;
  content_type: string | null;
  title: string; // from template title
  is_planned: true;
}

export type CalendarItem = ContentPieceCalendarItem | PlannedContentItem;

export interface ServiceCalendarRow {
  id: string;
  service_name: string;
  company_id: string;
  company_name: string;
  months: Record<string, CalendarItem[]>; // key: YYYY-MM
}

// GET /api/admin/content-calendar?year=2026
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    const yearParam = request.nextUrl.searchParams.get('year');
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

    if (isNaN(year) || year < 2020 || year > 2100) {
      return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
    }

    // Get the Content department ID
    const { data: contentDept } = await supabase
      .from('monthly_services_departments')
      .select('id')
      .eq('name', 'Content')
      .single();

    if (!contentDept) {
      return NextResponse.json({ services: [] });
    }
    const contentDeptId = contentDept.id;

    // Fetch all active monthly services that have at least one Content-dept template
    const { data: services, error: servicesError } = await supabase
      .from('monthly_services')
      .select(`
        id,
        service_name,
        company_id,
        companies ( name ),
        monthly_service_task_templates!inner (
          id,
          title,
          content_type,
          department_id,
          week_of_month,
          due_day_of_week
        )
      `)
      .eq('is_active', true)
      .eq('status', 'active')
      .eq('monthly_service_task_templates.department_id', contentDeptId);

    if (servicesError) {
      console.error('Error fetching services for content calendar:', servicesError);
      return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
    }

    if (!services || services.length === 0) {
      return NextResponse.json({ services: [] });
    }

    // Fetch all content pieces for these services
    // Year filtering is applied in JS below using publish_date or task due_date
    const serviceIds = services.map((s: any) => s.id);

    const { data: contentPieces, error: piecesError } = await supabase
      .from('monthly_service_content_pieces')
      .select(`
        id,
        monthly_service_id,
        task_id,
        content_type,
        title,
        publish_date,
        link,
        service_month,
        project_tasks ( is_completed, due_date )
      `)
      .in('monthly_service_id', serviceIds);

    if (piecesError) {
      console.error('Error fetching content pieces for calendar:', piecesError);
      return NextResponse.json({ error: 'Failed to fetch content pieces' }, { status: 500 });
    }

    // Bucket real content pieces by service + month
    const piecesByServiceMonth: Record<string, Record<string, ContentPieceCalendarItem[]>> = {};

    for (const piece of contentPieces || []) {
      const task = (piece as any).project_tasks;
      // Determine month: prefer service_month, then publish_date, then task due_date
      const monthKey: string =
        (piece as any).service_month ||
        (piece.publish_date ? piece.publish_date.slice(0, 7) : null) ||
        (task?.due_date ? task.due_date.slice(0, 7) : null);

      if (!monthKey) continue;

      const pieceYear = parseInt(monthKey.slice(0, 4), 10);
      if (pieceYear !== year) continue;
      const serviceId = piece.monthly_service_id;

      if (!piecesByServiceMonth[serviceId]) piecesByServiceMonth[serviceId] = {};
      if (!piecesByServiceMonth[serviceId][monthKey]) piecesByServiceMonth[serviceId][monthKey] = [];

      piecesByServiceMonth[serviceId][monthKey].push({
        id: piece.id,
        content_type: piece.content_type,
        title: piece.title,
        publish_date: piece.publish_date,
        link: piece.link,
        task_id: piece.task_id,
        is_completed: task?.is_completed ?? false,
        is_planned: false,
      });
    }

    // Build the calendar rows, filling in planned items for months without real pieces
    const now = new Date();
    const result: ServiceCalendarRow[] = services.map((service: any) => {
      const contentTemplates = (service.monthly_service_task_templates || []).filter(
        (t: any) => t.department_id === contentDeptId
      );
      const realPiecesByMonth = piecesByServiceMonth[service.id] || {};
      const months: Record<string, CalendarItem[]> = {};

      for (let m = 1; m <= 12; m++) {
        const monthKey = `${year}-${String(m).padStart(2, '0')}`;
        const monthDate = new Date(year, m - 1, 1);
        const realPieces = realPiecesByMonth[monthKey] || [];
        const isFuture = monthDate > now;

        const items: CalendarItem[] = [...realPieces];

        if (isFuture) {
          // For future months, fill remaining slots with planned items from templates
          const remainingCount = Math.max(0, contentTemplates.length - realPieces.length);
          const planned: PlannedContentItem[] = contentTemplates
            .slice(0, remainingCount)
            .map((t: any) => ({
              template_id: t.id,
              content_type: t.content_type,
              title: t.title,
              is_planned: true as const,
            }));
          items.push(...planned);
        }

        if (items.length > 0) {
          months[monthKey] = items;
        }
        // Past month with no real pieces: omit (no entry in months)
      }

      return {
        id: service.id,
        service_name: service.service_name,
        company_id: service.company_id,
        company_name: (service.companies as any)?.name || '',
        months,
      };
    });

    return NextResponse.json({ services: result, year });
  } catch (error) {
    console.error('Error in GET /api/admin/content-calendar:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
