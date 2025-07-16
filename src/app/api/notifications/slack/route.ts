import { NextRequest, NextResponse } from 'next/server';
import { sendProjectCreatedNotification } from '@/lib/slack/project-notifications';
import { ProjectNotificationData } from '@/lib/slack/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.projectId || !body.projectName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    console.log('Slack notification endpoint called with:', body);
    
    const notificationData: ProjectNotificationData = {
      id: body.projectId,
      projectId: body.projectId,
      projectName: body.projectName,
      projectType: body.projectType,
      description: body.description,
      dueDate: body.dueDate,
      priority: body.priority,
      status: body.status,
      requesterName: body.requesterName,
      requesterEmail: body.requesterEmail,
      companyName: body.companyName,
      timestamp: body.timestamp,
      actionUrl: body.actionUrl,
      assignedToName: body.assignedToName,
      assignedToEmail: body.assignedToEmail
    };
    
    const result = await sendProjectCreatedNotification(notificationData);
    
    return NextResponse.json({ success: result.success, error: result.error });
    
  } catch (error) {
    console.error('Error in Slack notification endpoint:', error);
    return NextResponse.json({ 
      error: 'Failed to send notification', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}