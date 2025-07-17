import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { openProjectAssignmentModal, SlackInteractionContext } from '@/lib/slack/interactions';

// Slack interactive payload types
interface SlackInteractivePayload {
  type: 'block_actions' | 'shortcut' | 'view_submission' | 'view_closed';
  user: {
    id: string;
    name: string;
    team_id: string;
  };
  team: {
    id: string;
    domain: string;
  };
  channel?: {
    id: string;
    name: string;
  };
  message?: {
    ts: string;
    text: string;
  };
  actions?: Array<{
    action_id: string;
    block_id: string;
    text: {
      type: string;
      text: string;
    };
    value?: string;
    url?: string;
    type: string;
    action_ts: string;
  }>;
  response_url: string;
  trigger_id?: string;
}

// Verify Slack signature
function verifySlackSignature(
  body: string,
  signature: string,
  timestamp: string,
  signingSecret: string
): boolean {
  const time = Math.floor(new Date().getTime() / 1000);
  
  // Request is too old (older than 5 minutes)
  if (Math.abs(time - parseInt(timestamp)) > 300) {
    return false;
  }

  // Create expected signature
  const sigBasestring = `v0:${timestamp}:${body}`;
  const expectedSignature = `v0=${createHmac('sha256', signingSecret)
    .update(sigBasestring)
    .digest('hex')}`;

  return signature === expectedSignature;
}

export async function POST(request: NextRequest) {
  try {
    const signingSecret = process.env.SLACK_SIGNING_SECRET;
    
    if (!signingSecret) {
      console.error('SLACK_SIGNING_SECRET not configured');
      return NextResponse.json({ error: 'Slack signing secret not configured' }, { status: 500 });
    }

    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('x-slack-signature');
    const timestamp = request.headers.get('x-slack-request-timestamp');

    if (!signature || !timestamp) {
      return NextResponse.json({ error: 'Missing Slack headers' }, { status: 400 });
    }

    // Verify the request is from Slack
    if (!verifySlackSignature(body, signature, timestamp, signingSecret)) {
      console.error('Invalid Slack signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse the form data (Slack sends application/x-www-form-urlencoded)
    const formData = new URLSearchParams(body);
    const payloadString = formData.get('payload');
    
    if (!payloadString) {
      return NextResponse.json({ error: 'No payload found' }, { status: 400 });
    }

    const payload: SlackInteractivePayload = JSON.parse(payloadString);
    
    console.log('Slack interactive payload received:', {
      type: payload.type,
      user: payload.user.name,
      actions: payload.actions?.map(a => ({ action_id: a.action_id, value: a.value }))
    });

    // Handle different types of interactions
    switch (payload.type) {
      case 'block_actions':
        return await handleBlockActions(payload);
      case 'shortcut':
        return await handleShortcut(payload);
      case 'view_submission':
        return await handleViewSubmission(payload);
      default:
        console.log('Unhandled interaction type:', payload.type);
        return NextResponse.json({ text: 'Interaction received' });
    }

  } catch (error) {
    console.error('Error handling Slack interactive payload:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleBlockActions(payload: SlackInteractivePayload) {
  if (!payload.actions || payload.actions.length === 0) {
    return NextResponse.json({ text: 'No actions found' });
  }

  const action = payload.actions[0];
  
  switch (action.action_id) {
    case 'view_project_in_admin':
      // Handle "View in Admin Panel" button click
      return handleViewProjectAction(payload, action);
    case 'assign_project':
      // Handle project assignment action (future implementation)
      return handleAssignProjectAction(payload, action);
    case 'update_project_status':
      // Handle status update action (future implementation)
      return handleUpdateStatusAction(payload, action);
    default:
      console.log('Unhandled action_id:', action.action_id);
      return NextResponse.json({ text: 'Action received' });
  }
}

async function handleViewProjectAction(payload: SlackInteractivePayload, action: any) {
  // This is a URL button, so it will open the admin panel
  // We can log the interaction or update analytics
  console.log(`User ${payload.user.name} clicked "View in Admin Panel" for project`);
  
  // Return a response to acknowledge the interaction
  return NextResponse.json({
    text: `Opening admin panel for ${payload.user.name}...`
  });
}

async function handleAssignProjectAction(payload: SlackInteractivePayload, action: any) {
  // Open a modal for project assignment
  const context: SlackInteractionContext = {
    userId: payload.user.id,
    userName: payload.user.name,
    teamId: payload.team.id,
    channelId: payload.channel?.id,
    messageTs: payload.message?.ts,
    responseUrl: payload.response_url,
    triggerId: payload.trigger_id
  };

  const result = await openProjectAssignmentModal(context, action.value);
  
  if (result.success) {
    // Modal opened successfully, no need to send a response
    return new NextResponse(null, { status: 200 });
  } else {
    // Fallback response if modal fails
    return NextResponse.json({
      text: 'Unable to open assignment modal. Please try again.'
    });
  }
}

async function handleUpdateStatusAction(payload: SlackInteractivePayload, action: any) {
  // Future implementation for status updates
  return NextResponse.json({
    text: 'Status update feature coming soon!'
  });
}

async function handleShortcut(payload: SlackInteractivePayload) {
  // Handle global shortcuts or message shortcuts
  return NextResponse.json({
    text: 'Shortcut received'
  });
}

async function handleViewSubmission(payload: SlackInteractivePayload) {
  // Handle modal form submissions
  console.log('View submission payload:', JSON.stringify(payload, null, 2));
  
  // Extract callback_id to determine which modal was submitted
  const callbackId = (payload as any).view?.callback_id;
  
  if (callbackId === 'project_assignment_modal') {
    return await handleProjectAssignmentSubmission(payload);
  }
  
  return NextResponse.json({
    text: 'Form submission received'
  });
}

async function handleProjectAssignmentSubmission(payload: SlackInteractivePayload) {
  try {
    const view = (payload as any).view;
    const values = view.state.values;
    const privateMetadata = JSON.parse(view.private_metadata || '{}');
    
    // Extract form data
    const selectedUser = values.assignee_selection?.selected_assignee?.selected_user;
    const note = values.assignment_note?.note_input?.value || '';
    const projectId = privateMetadata.projectId;
    
    console.log('Assignment submission:', {
      projectId,
      selectedUser,
      note,
      submittedBy: payload.user.name
    });
    
    if (!selectedUser || !projectId) {
      return NextResponse.json({
        response_action: 'errors',
        errors: {
          assignee_selection: 'Please select a user to assign the project to'
        }
      });
    }
    
    // Update the project in the database
    const { createAdminClient } = await import('@/lib/supabase/server-admin');
    const supabase = createAdminClient();
    
    // First, get the Slack user's profile to find their corresponding database user
    const slackUserResponse = await fetch(`https://slack.com/api/users.info?user=${selectedUser}`, {
      headers: {
        'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      }
    });
    const slackUserData = await slackUserResponse.json();
    const assigneeEmail = slackUserData.user?.profile?.email;
    
    if (!assigneeEmail) {
      return NextResponse.json({
        response_action: 'errors',
        errors: {
          assignee_selection: 'Could not find email for selected user'
        }
      });
    }
    
    // Find the user in our database by email
    console.log('Looking for user with email:', assigneeEmail);
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .eq('email', assigneeEmail)
      .single();
    
    console.log('User profile query result:', { userProfile, userError });
    
    if (userError || !userProfile) {
      console.error('User not found in database:', userError);
      return NextResponse.json({
        response_action: 'errors',
        errors: {
          assignee_selection: 'Selected user not found in project database'
        }
      });
    }
    
    // Update the project assignment
    console.log('Updating project:', projectId, 'with user:', userProfile.id);
    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update({ 
        assigned_to: userProfile.id,
        status: 'in_progress' // Optionally update status when assigned
      })
      .eq('id', projectId)
      .select(`
        *,
        company:companies(name),
        assigned_to_profile:profiles!assigned_to(first_name, last_name, email)
      `)
      .single();
    
    console.log('Project update result:', { updatedProject, updateError });
    
    if (updateError) {
      console.error('Error updating project:', updateError);
      return NextResponse.json({
        response_action: 'errors',
        errors: {
          assignee_selection: `Failed to assign project in database: ${updateError.message}`
        }
      });
    }
    
    // Send response to acknowledge the assignment in the channel
    const assigneeName = `${userProfile.first_name} ${userProfile.last_name}`.trim();
    const channelMessage = {
      text: `🎯 Project "${updatedProject.name}" has been assigned to ${assigneeName}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🎯 *Project Assignment Completed*\n\n*Project:* ${updatedProject.name}\n*Assigned to:* <@${selectedUser}> (${assigneeName})\n*Assigned by:* <@${payload.user.id}>\n*Status:* ${updatedProject.status}`
          }
        }
      ]
    };
    
    if (note) {
      channelMessage.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `📝 *Note:* ${note}`
        }
      });
    }
    
    // Send message to the original channel
    const channelResponse = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: process.env.SLACK_CHANNEL_PROJECT_REQUESTS || '#project-requests',
        ...channelMessage
      })
    });
    
    // Send direct message to the assignee
    const assigneeMessage: any = {
      text: `📋 You've been assigned a new project: "${updatedProject.name}"`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `📋 *New Project Assignment*\n\nYou've been assigned to work on: *${updatedProject.name}*`
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Company:* ${updatedProject.company.name}`
            },
            {
              type: 'mrkdwn',
              text: `*Priority:* ${updatedProject.priority}`
            },
            {
              type: 'mrkdwn',
              text: `*Due Date:* ${new Date(updatedProject.due_date).toLocaleDateString()}`
            },
            {
              type: 'mrkdwn',
              text: `*Assigned by:* <@${payload.user.id}>`
            }
          ]
        }
      ]
    };
    
    if (updatedProject.description) {
      assigneeMessage.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Description:*\n${updatedProject.description}`
        }
      });
    }
    
    if (note) {
      assigneeMessage.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `📝 *Assignment Note:* ${note}`
        }
      });
    }
    
    // Add action button to view project
    assigneeMessage.blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '📋 View Project Details'
          },
          url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin`,
          style: 'primary'
        }
      ]
    });
    
    // Send DM to assignee
    const assigneeResponse = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: selectedUser, // Send as DM to the assignee
        ...assigneeMessage
      })
    });
    
    const channelResult = await channelResponse.json();
    const assigneeResult = await assigneeResponse.json();
    
    console.log('Channel message result:', channelResult);
    console.log('Assignee DM result:', assigneeResult);
    
    // Return success response to close the modal
    return NextResponse.json({
      response_action: 'clear'
    });
    
  } catch (error) {
    console.error('Error handling project assignment submission:', error);
    return NextResponse.json({
      response_action: 'errors',
      errors: {
        assignee_selection: 'Failed to assign project. Please try again.'
      }
    });
  }
}