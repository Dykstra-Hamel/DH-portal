import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';
import {
  validateUserInput,
  sanitizeString,
  validateUUID,
} from '@/lib/validation';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const resolvedParams = await params;
    const userId = resolvedParams.id;
    if (!validateUUID(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const body = await request.json();

    // Validate and sanitize input
    const userData = {
      email: sanitizeString(body.email || ''),
      first_name: sanitizeString(body.first_name || ''),
      last_name: sanitizeString(body.last_name || ''),
    };

    const validation = validateUserInput(userData);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      );
    }

    const allowedRoles = ['admin', 'user', 'customer', 'project_manager'];
    const role = body.role && allowedRoles.includes(body.role) ? body.role : undefined;

    const updatePayload: Record<string, string | null> = {
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
    };
    if (role !== undefined) updatePayload.role = role;

    // Optional profile fields
    if ('title' in body) updatePayload.title = sanitizeString(body.title || '').slice(0, 150) || null;
    if ('phone' in body) updatePayload.phone = sanitizeString(body.phone || '').slice(0, 50) || null;
    if ('contact_email' in body) updatePayload.contact_email = sanitizeString(body.contact_email || '').slice(0, 255) || null;

    const { error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const resolvedParams = await params;
    const userId = resolvedParams.id;
    if (!validateUUID(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // First, delete user-company relationships
    await supabase.from('user_companies').delete().eq('user_id', userId);

    // NULL out RESTRICT FK columns that reference auth.users directly.
    // Log any errors so we can discover missing tables/columns without failing the deletion.
    const prereqs: Array<{ label: string; promise: PromiseLike<{ error: unknown }> }> = [
      { label: 'widget_domains.created_by',            promise: supabase.from('widget_domains').update({ created_by: null }).eq('created_by', userId) },
      { label: 'widget_domains.updated_by',            promise: supabase.from('widget_domains').update({ updated_by: null }).eq('updated_by', userId) },
      { label: 'system_settings.created_by',           promise: supabase.from('system_settings').update({ created_by: null }).eq('created_by', userId) },
      { label: 'system_settings.updated_by',           promise: supabase.from('system_settings').update({ updated_by: null }).eq('updated_by', userId) },
      { label: 'company_images.uploaded_by',           promise: supabase.from('company_images').update({ uploaded_by: null }).eq('uploaded_by', userId) },
      { label: 'company_discounts.created_by',         promise: supabase.from('company_discounts').update({ created_by: null }).eq('created_by', userId) },
      { label: 'routes.assigned_to',                   promise: supabase.from('routes').update({ assigned_to: null }).eq('assigned_to', userId) },
      { label: 'routes.created_by',                    promise: supabase.from('routes').update({ created_by: null }).eq('created_by', userId) },
      { label: 'recurring_schedules.assigned_tech_id', promise: supabase.from('recurring_schedules').update({ assigned_tech_id: null }).eq('assigned_tech_id', userId) },
      { label: 'route_optimization_jobs.triggered_by', promise: supabase.from('route_optimization_jobs').update({ triggered_by: null }).eq('triggered_by', userId) },
      // technician_schedules.user_id is NOT NULL — must delete rows
      { label: 'technician_schedules DELETE',          promise: supabase.from('technician_schedules').delete().eq('user_id', userId) },
      // profiles references
      { label: 'email_template_library.created_by',   promise: supabase.from('email_template_library').update({ created_by: null }).eq('created_by', userId) },
      // _deprecated_lead_activity_log.user_id is NOT NULL — must delete rows
      { label: '_deprecated_lead_activity_log DELETE', promise: supabase.from('_deprecated_lead_activity_log').delete().eq('user_id', userId) },
      { label: 'project_tasks.assigned_to',            promise: supabase.from('project_tasks').update({ assigned_to: null }).eq('assigned_to', userId) },
      { label: 'project_tasks.created_by',             promise: supabase.from('project_tasks').update({ created_by: null }).eq('created_by', userId) },
      { label: 'project_task_comments.user_id',        promise: supabase.from('project_task_comments').update({ user_id: null }).eq('user_id', userId) },
      { label: 'project_task_templates.created_by',    promise: supabase.from('project_task_templates').update({ created_by: null }).eq('created_by', userId) },
      { label: 'project_templates.created_by',         promise: supabase.from('project_templates').update({ created_by: null }).eq('created_by', userId) },
      { label: 'admin_template_library.created_by',    promise: supabase.from('admin_template_library').update({ created_by: null }).eq('created_by', userId) },
      { label: 'reusable_contact_lists.created_by',    promise: supabase.from('reusable_contact_lists').update({ created_by: null }).eq('created_by', userId) },
      { label: 'reusable_contact_lists.added_by',      promise: supabase.from('reusable_contact_lists').update({ added_by: null }).eq('added_by', userId) },
      { label: 'reusable_contact_lists.assigned_by',   promise: supabase.from('reusable_contact_lists').update({ assigned_by: null }).eq('assigned_by', userId) },
      { label: 'ab_test_campaigns.created_by',         promise: supabase.from('ab_test_campaigns').update({ created_by: null }).eq('created_by', userId) },
      // storage.objects.owner references auth.users — null it out so Supabase storage doesn't block deleteUser
      { label: 'storage.objects.owner',               promise: supabase.schema('storage').from('objects').update({ owner: null }).eq('owner', userId) },
    ];

    const results = await Promise.all(prereqs.map(async ({ label, promise }) => {
      const { error } = await promise;
      if (error) {
        const e = error as { message?: string; code?: string; details?: string; hint?: string };
        console.error(`Pre-delete cleanup error [${label}]:`, { message: e.message, code: e.code, details: e.details, hint: e.hint });
      }
      return { label, error };
    }));

    // Delete profile
    const { error: profileDeleteError } = await supabase.from('profiles').delete().eq('id', userId);
    if (profileDeleteError) {
      console.error('Profile delete error:', profileDeleteError);
      return NextResponse.json({ error: 'Failed to delete user profile' }, { status: 500 });
    }

    // Finally, delete user from auth
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Auth deleteUser error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete user from authentication' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
