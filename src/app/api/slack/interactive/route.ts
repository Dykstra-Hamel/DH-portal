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
  return NextResponse.json({
    text: 'Form submission received'
  });
}