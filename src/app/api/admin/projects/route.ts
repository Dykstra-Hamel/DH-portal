import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { sendProjectCreatedNotification as sendEmail } from '@/lib/email/project-notifications';
import { EmailRecipient, ProjectNotificationData as EmailProjectData } from '@/lib/email/types';
// Removed Slack notification import - now using separate endpoint
import { ProjectNotificationData as SlackProjectData } from '@/lib/slack/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    
    // First get projects with company info
    let query = supabase
      .from('projects')
      .select(`
        *,
        company:companies(
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });
    
    // Apply filters if provided
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }
    
    const { data: projects, error } = await query;
    
    if (error) {
      console.error('Error fetching projects:', error);
      return NextResponse.json({ error: 'Failed to fetch projects', details: error.message }, { status: 500 });
    }

    if (!projects || projects.length === 0) {
      return NextResponse.json([]);
    }

    // Get all unique user IDs from projects
    const userIds = new Set<string>();
    projects.forEach(project => {
      userIds.add(project.requested_by);
      if (project.assigned_to) {
        userIds.add(project.assigned_to);
      }
    });

    // Get profiles for these users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .in('id', Array.from(userIds));

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json({ error: 'Failed to fetch user profiles', details: profilesError.message }, { status: 500 });
    }

    // Create a map of user profiles for quick lookup
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Enhance projects with profile data
    const enhancedProjects = projects.map(project => ({
      ...project,
      requested_by_profile: profileMap.get(project.requested_by) || null,
      assigned_to_profile: project.assigned_to ? profileMap.get(project.assigned_to) || null : null
    }));
    
    return NextResponse.json(enhancedProjects);
  } catch (error) {
    console.error('Error in projects API:', error);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();
    
    
    const {
      name,
      description,
      project_type,
      requested_by,
      company_id,
      assigned_to,
      status = 'pending',
      priority = 'medium',
      due_date,
      start_date,
      estimated_hours,
      budget_amount,
      tags,
      notes,
      primary_file_path
    } = body;
    
    // Validate required fields
    if (!name || !project_type || !requested_by || !company_id || !due_date) {
      console.log('Missing required fields:', { name, project_type, requested_by, company_id, due_date });
      return NextResponse.json({ 
        error: 'Missing required fields: name, project_type, requested_by, company_id, due_date',
        details: { name: !!name, project_type: !!project_type, requested_by: !!requested_by, company_id: !!company_id, due_date: !!due_date }
      }, { status: 400 });
    }
    
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        name,
        description,
        project_type,
        requested_by,
        company_id,
        assigned_to: assigned_to || null,
        status,
        priority,
        due_date,
        start_date: start_date || null,
        estimated_hours,
        budget_amount,
        tags,
        notes,
        primary_file_path: primary_file_path || null
      })
      .select(`
        *,
        company:companies(
          id,
          name
        )
      `)
      .single();
    
    if (error) {
      console.error('Error creating project:', error);
      return NextResponse.json({ error: 'Failed to create project', details: error.message }, { status: 500 });
    }

    // Get profiles for the users involved in this project
    const userIds = [project.requested_by];
    if (project.assigned_to) {
      userIds.push(project.assigned_to);
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json({ error: 'Failed to fetch user profiles' }, { status: 500 });
    }

    // Create profile map and enhance project
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    const enhancedProject = {
      ...project,
      requested_by_profile: profileMap.get(project.requested_by) || null,
      assigned_to_profile: project.assigned_to ? profileMap.get(project.assigned_to) || null : null
    };
    
    // Trigger notifications (fire-and-forget)
    const triggerNotifications = async () => {
      try {
        const requesterProfile = profileMap.get(project.requested_by);
        const requesterName = `${requesterProfile?.first_name || ''} ${requesterProfile?.last_name || ''}`.trim() || 'Unknown';
        const requesterEmail = requesterProfile?.email || 'unknown@example.com';

        // Prepare notification data
        const emailData: EmailProjectData = {
          projectId: project.id,
          projectName: project.name,
          projectType: project.project_type,
          description: project.description,
          dueDate: project.due_date,
          priority: project.priority,
          requesterName,
          requesterEmail,
          companyName: project.company.name,
        };

        const slackData: SlackProjectData = {
          id: project.id,
          projectId: project.id,
          projectName: project.name,
          projectType: project.project_type,
          description: project.description,
          dueDate: project.due_date,
          priority: project.priority as 'low' | 'medium' | 'high' | 'urgent',
          status: project.status,
          requesterName,
          requesterEmail,
          companyName: project.company.name,
          timestamp: new Date().toISOString(),
          actionUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin`
        };

        // Send notifications
        const testRecipient: EmailRecipient = {
          email: 'austin@dykstrahamel.com',
          name: 'Austin',
        };

        const emailPromise = sendEmail(testRecipient, emailData)
          .catch(error => console.error('Failed to send email notification:', error));

        const { sendProjectCreatedNotification } = await import('@/lib/slack/project-notifications');
        
        setImmediate(async () => {
          try {
            const result = await sendProjectCreatedNotification(slackData);
            if (!result.success) {
              console.error('Failed to send Slack notification:', result.error);
            }
          } catch (error) {
            console.error('Error in Slack notification:', error);
          }
        });

        await emailPromise;
      } catch (error) {
        console.error('Failed to send notifications:', error);
      }
    };

    // Call notifications asynchronously (don't await)
    triggerNotifications();
    
    return NextResponse.json(enhancedProject, { status: 201 });
  } catch (error) {
    console.error('Error in projects POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}