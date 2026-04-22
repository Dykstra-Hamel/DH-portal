import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface ContentPieceCalendarItem {
  id: string;
  content_type: string | null;
  title: string | null;
  publish_date: string | null;
  link: string | null;
  google_doc_link: string | null;
  topic: string | null;
  task_id: string | null;
  is_completed: boolean;
  is_planned: false;
  sort_order: number | null;
  task_is_completed: boolean | null;
  task_due_date: string | null;
  task_assignee_name: string | null;
  task_assignee_email: string | null;
  task_assignee_avatar_url: string | null;
  social_media_task_id: string | null;
  social_media_task_is_completed: boolean | null;
  social_media_task_due_date: string | null;
  social_media_task_assignee_name: string | null;
  social_media_task_assignee_email: string | null;
  social_media_task_assignee_avatar_url: string | null;
}

export interface PlannedContentItem {
  template_id: string;
  content_type: string | null;
  title: string; // from template title
  is_planned: true;
  week_of_month: number | null;
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

    if (profile?.role !== 'admin' && profile?.role !== 'project_manager') {
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
        social_media_task_id,
        content_type,
        title,
        publish_date,
        link,
        google_doc_link,
        topic,
        service_month,
        sort_order,
        project_tasks!task_id ( is_completed, due_date, assigned_to, profiles:assigned_to ( first_name, last_name, email, avatar_url, uploaded_avatar_url ) ),
        social_media_task:project_tasks!social_media_task_id ( is_completed, due_date, assigned_to, profiles:assigned_to ( first_name, last_name, email, avatar_url, uploaded_avatar_url ) )
      `)
      .in('monthly_service_id', serviceIds)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });

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

      const socialTask = (piece as any).social_media_task;
      piecesByServiceMonth[serviceId][monthKey].push({
        id: piece.id,
        content_type: piece.content_type,
        title: piece.title,
        publish_date: piece.publish_date,
        link: piece.link,
        google_doc_link: (piece as any).google_doc_link ?? null,
        topic: (piece as any).topic,
        task_id: piece.task_id,
        sort_order: (piece as any).sort_order ?? null,
        is_completed: (() => {
          const contentDone = task?.is_completed ?? false;
          const socialDone = socialTask ? (socialTask.is_completed ?? false) : true;
          return contentDone && socialDone;
        })(),
        is_planned: false,
        task_is_completed: task?.is_completed ?? null,
        task_due_date: task?.due_date ?? null,
        task_assignee_name: task?.profiles
          ? `${(task.profiles as any).first_name ?? ''} ${(task.profiles as any).last_name ?? ''}`.trim() || null
          : null,
        task_assignee_email: task?.profiles ? (task.profiles as any).email ?? null : null,
        task_assignee_avatar_url: task?.profiles ? ((task.profiles as any).uploaded_avatar_url || (task.profiles as any).avatar_url) ?? null : null,
        social_media_task_id: (piece as any).social_media_task_id ?? null,
        social_media_task_is_completed: socialTask?.is_completed ?? null,
        social_media_task_due_date: socialTask?.due_date ?? null,
        social_media_task_assignee_name: socialTask?.profiles
          ? `${(socialTask.profiles as any).first_name ?? ''} ${(socialTask.profiles as any).last_name ?? ''}`.trim() || null
          : null,
        social_media_task_assignee_email: socialTask?.profiles ? (socialTask.profiles as any).email ?? null : null,
        social_media_task_assignee_avatar_url: socialTask?.profiles ? ((socialTask.profiles as any).uploaded_avatar_url || (socialTask.profiles as any).avatar_url) ?? null : null,
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
              week_of_month: t.week_of_month ?? null,
            }));
          items.push(...planned);
        }

        // Sort all items (real + planned) by effective week, nulls last
        items.sort((a, b) => {
          const aWeek = a.is_planned
            ? ((a as PlannedContentItem).week_of_month ?? Infinity)
            : ((a as ContentPieceCalendarItem).sort_order ?? Infinity);
          const bWeek = b.is_planned
            ? ((b as PlannedContentItem).week_of_month ?? Infinity)
            : ((b as ContentPieceCalendarItem).sort_order ?? Infinity);
          return aWeek - bWeek;
        });

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
