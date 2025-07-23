import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { sendProjectCreatedNotification } from '@/lib/email/project-notifications';
import { ProjectNotificationData, EmailRecipient } from '@/lib/email/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get the project with related data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(
        `
        *,
        company:companies(
          id,
          name
        )
      `
      )
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      console.error('Error fetching project:', projectError);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get requester profile
    const { data: requesterProfile, error: requesterError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .eq('id', project.requested_by)
      .single();

    if (requesterError || !requesterProfile) {
      console.error('Error fetching requester profile:', requesterError);
      return NextResponse.json(
        { error: 'Requester profile not found' },
        { status: 404 }
      );
    }

    // For testing: hardcode notification to austin@dykstrahamel.com
    // Later this can be replaced with proper admin user lookup

    // Prepare project data for email
    const projectData: ProjectNotificationData = {
      projectId: project.id,
      projectName: project.name,
      projectType: project.project_type,
      description: project.description,
      dueDate: project.due_date,
      priority: project.priority,
      requesterName:
        `${requesterProfile.first_name} ${requesterProfile.last_name}`.trim(),
      requesterEmail: requesterProfile.email,
      companyName: project.company.name,
    };

    // Send notification to hardcoded email for testing
    const testRecipient: EmailRecipient = {
      email: 'austin@dykstrahamel.com',
      name: 'Austin',
    };

    const emailPromises: Promise<any>[] = [
      sendProjectCreatedNotification(testRecipient, projectData).catch(
        error => {
          console.error(
            `Failed to send email to ${testRecipient.email}:`,
            error
          );
          return { error: error.message, recipient: testRecipient.email };
        }
      ),
    ];

    const results = await Promise.allSettled(emailPromises);

    const successful = results.filter(
      result => result.status === 'fulfilled'
    ).length;
    const failed = results.filter(
      result => result.status === 'rejected'
    ).length;

    console.log(
      `Email notifications sent: ${successful} successful, ${failed} failed`
    );

    return NextResponse.json({
      success: true,
      sent: successful,
      failed: failed,
      projectId: projectId,
    });
  } catch (error) {
    console.error('Error in project notification API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
